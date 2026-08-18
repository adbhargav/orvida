import { query, pool } from '../config/db.js';
import {
  razorpayInstance,
  isRazorpayConfigured,
  verifyWebhookSignature,
  isWebhookConfigured,
} from '../config/razorpay.js';
import { sendRefundEmail, sendPaymentFailedEmail } from '../services/emailService.js';

/* ------------------------------------------------------------------ *
 * Webhooks
 * ------------------------------------------------------------------ */

const HANDLED_EVENTS = ['payment.captured', 'payment.failed', 'order.paid', 'refund.processed', 'refund.failed'];

/** Finds the order a webhook payload refers to, by Razorpay order or payment id. */
const findOrderForEvent = async (client, { razorpayOrderId, razorpayPaymentId }) => {
  if (razorpayOrderId) {
    const byOrder = await client.query('SELECT * FROM orders WHERE razorpay_order_id = $1', [razorpayOrderId]);
    if (byOrder.rows.length > 0) return byOrder.rows[0];
  }
  if (razorpayPaymentId) {
    const byPayment = await client.query('SELECT * FROM orders WHERE razorpay_payment_id = $1', [razorpayPaymentId]);
    if (byPayment.rows.length > 0) return byPayment.rows[0];
  }
  return null;
};

/**
 * Razorpay webhook receiver.
 *
 * Mounted with express.raw() so the HMAC can be checked against the exact
 * bytes Razorpay signed. Always answers 200 once the signature is valid —
 * Razorpay retries non-2xx responses, and a processing bug should not cause
 * an infinite redelivery loop. Failures are recorded on webhook_events.
 */
export const handleRazorpayWebhook = async (req, res) => {
  if (!isWebhookConfigured()) {
    return res.status(503).json({ success: false, message: 'Webhooks are not configured on this server.' });
  }

  const signature = req.headers['x-razorpay-signature'];
  const rawBody = req.body; // Buffer, thanks to express.raw()

  if (!verifyWebhookSignature(rawBody, signature)) {
    console.warn('Rejected Razorpay webhook: invalid signature');
    return res.status(400).json({ success: false, message: 'Invalid webhook signature' });
  }

  let event;
  try {
    event = JSON.parse(rawBody.toString('utf8'));
  } catch {
    return res.status(400).json({ success: false, message: 'Malformed webhook payload' });
  }

  const eventType = event.event;
  // Razorpay sends x-razorpay-event-id; fall back to a deterministic key so
  // replays are still deduplicated if the header is absent.
  const eventId =
    req.headers['x-razorpay-event-id'] ||
    `${eventType}:${event.payload?.payment?.entity?.id || event.payload?.order?.entity?.id || event.created_at}`;

  const client = await pool.connect();
  try {
    // Claim the event. A duplicate delivery collides on the unique index and
    // is acknowledged without reprocessing.
    const claim = await client.query(
      `INSERT INTO webhook_events (event_id, event_type, payload, status)
       VALUES ($1, $2, $3, 'received')
       ON CONFLICT (event_id) DO NOTHING
       RETURNING id`,
      [eventId, eventType, JSON.stringify(event)]
    );

    if (claim.rows.length === 0) {
      return res.json({ success: true, message: 'Event already processed' });
    }

    const webhookRowId = claim.rows[0].id;

    if (!HANDLED_EVENTS.includes(eventType)) {
      await client.query("UPDATE webhook_events SET status = 'ignored', processed_at = NOW() WHERE id = $1", [
        webhookRowId,
      ]);
      return res.json({ success: true, message: 'Event ignored' });
    }

    const payment = event.payload?.payment?.entity;
    const refund = event.payload?.refund?.entity;
    const orderEntity = event.payload?.order?.entity;

    await client.query('BEGIN');

    const order = await findOrderForEvent(client, {
      razorpayOrderId: payment?.order_id || orderEntity?.id || refund?.notes?.razorpay_order_id,
      razorpayPaymentId: payment?.id || refund?.payment_id,
    });

    if (!order) {
      // The order row may not exist yet if the browser has not finished the
      // verify step. Recorded rather than dropped so it can be reconciled.
      await client.query(
        "UPDATE webhook_events SET status = 'failed', error = $2, processed_at = NOW() WHERE id = $1",
        [webhookRowId, 'No matching order found']
      );
      await client.query('COMMIT');
      return res.json({ success: true, message: 'No matching order; recorded for reconciliation' });
    }

    switch (eventType) {
      case 'payment.captured':
      case 'order.paid': {
        await client.query(
          `UPDATE orders
              SET payment_status = 'Paid',
                  razorpay_payment_id = COALESCE(razorpay_payment_id, $2),
                  paid_at = COALESCE(paid_at, NOW()),
                  updated_at = NOW()
            WHERE id = $1`,
          [order.id, payment?.id || null]
        );
        break;
      }

      case 'payment.failed': {
        const reason = payment?.error_description || payment?.error_reason || 'Payment failed';
        await client.query(
          `UPDATE orders
              SET payment_status = 'Failed',
                  payment_failed_reason = $2,
                  updated_at = NOW()
            WHERE id = $1 AND payment_status <> 'Paid'`,
          [order.id, reason]
        );

        const email = order.shipping_address?.email;
        if (email) {
          sendPaymentFailedEmail(email, order, reason).catch((err) =>
            console.error('Payment failure email error:', err.message)
          );
        }
        break;
      }

      case 'refund.processed': {
        const amount = Number(refund.amount) / 100;
        await client.query(
          `INSERT INTO refunds (order_id, razorpay_refund_id, razorpay_payment_id, amount, status)
           VALUES ($1, $2, $3, $4, 'processed')
           ON CONFLICT (razorpay_refund_id)
           DO UPDATE SET status = 'processed', updated_at = NOW()`,
          [order.id, refund.id, refund.payment_id, amount]
        );
        await syncOrderRefundTotals(client, order.id);
        break;
      }

      case 'refund.failed': {
        await client.query(
          "UPDATE refunds SET status = 'failed', updated_at = NOW() WHERE razorpay_refund_id = $1",
          [refund.id]
        );
        break;
      }
    }

    await client.query("UPDATE webhook_events SET status = 'processed', processed_at = NOW() WHERE id = $1", [
      webhookRowId,
    ]);
    await client.query('COMMIT');

    res.json({ success: true, message: `Processed ${eventType}` });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('Webhook processing error:', error);
    await query("UPDATE webhook_events SET status = 'failed', error = $2 WHERE event_id = $1", [
      eventId,
      error.message,
    ]).catch(() => {});
    // 200 so Razorpay stops retrying; the row above records what to fix.
    res.json({ success: true, message: 'Recorded with errors' });
  } finally {
    client.release();
  }
};

/** Recomputes an order's refunded total and payment status from the ledger. */
const syncOrderRefundTotals = async (client, orderId) => {
  const { rows } = await client.query(
    "SELECT COALESCE(SUM(amount), 0) AS refunded FROM refunds WHERE order_id = $1 AND status = 'processed'",
    [orderId]
  );
  const refunded = Number(rows[0].refunded);

  const orderRes = await client.query('SELECT total FROM orders WHERE id = $1', [orderId]);
  const total = Number(orderRes.rows[0].total);

  const status = refunded <= 0 ? 'Paid' : refunded >= total ? 'Refunded' : 'Partially Refunded';

  await client.query('UPDATE orders SET refunded_amount = $2, payment_status = $3, updated_at = NOW() WHERE id = $1', [
    orderId,
    refunded,
    status,
  ]);
};

/* ------------------------------------------------------------------ *
 * Refunds (admin)
 * ------------------------------------------------------------------ */

export const createRefund = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { id } = req.params;
    const { amount, reason = '', speed = 'normal' } = req.body;

    if (!isRazorpayConfigured()) {
      return res.status(503).json({ success: false, message: 'Payments are not configured on this server.' });
    }

    await client.query('BEGIN');

    // Lock the row so two concurrent refunds cannot both pass the cap check.
    const orderRes = await client.query('SELECT * FROM orders WHERE id = $1 FOR UPDATE', [id]);
    if (orderRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (!order.razorpay_payment_id) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This order has no captured payment to refund.' });
    }

    const alreadyRefunded = Number(order.refunded_amount || 0);
    const refundable = Number(order.total) - alreadyRefunded;

    if (refundable <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'This order has already been fully refunded.' });
    }

    const refundAmount = amount === undefined || amount === null ? refundable : Number(amount);

    if (!Number.isFinite(refundAmount) || refundAmount <= 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Enter a valid refund amount.' });
    }

    if (refundAmount > refundable) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: `Refund exceeds the refundable balance of ₹${refundable.toLocaleString('en-IN')}.`,
      });
    }

    const razorpayRefund = await razorpayInstance.payments.refund(order.razorpay_payment_id, {
      amount: Math.round(refundAmount * 100),
      speed,
      notes: {
        order_number: order.order_number,
        razorpay_order_id: order.razorpay_order_id || '',
        reason: reason.slice(0, 250),
      },
    });

    await client.query(
      `INSERT INTO refunds (order_id, razorpay_refund_id, razorpay_payment_id, amount, status, speed, reason, initiated_by)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       ON CONFLICT (razorpay_refund_id) DO NOTHING`,
      [
        order.id,
        razorpayRefund.id,
        order.razorpay_payment_id,
        refundAmount,
        razorpayRefund.status === 'processed' ? 'processed' : 'pending',
        speed,
        reason,
        req.user.id,
      ]
    );

    // Razorpay may settle instantly or asynchronously; the refund.processed
    // webhook reconciles the total either way.
    if (razorpayRefund.status === 'processed') {
      await syncOrderRefundTotals(client, order.id);
    }

    await client.query('COMMIT');

    const updated = await query('SELECT * FROM orders WHERE id = $1', [order.id]);
    const email = order.shipping_address?.email;
    if (email) {
      sendRefundEmail(email, updated.rows[0], refundAmount).catch((err) =>
        console.error('Refund email error:', err.message)
      );
    }

    res.status(201).json({
      success: true,
      message: `Refund of ₹${refundAmount.toLocaleString('en-IN')} initiated.`,
      refund: { id: razorpayRefund.id, amount: refundAmount, status: razorpayRefund.status },
      order: updated.rows[0],
    });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    if (error?.error?.description) {
      return res.status(400).json({ success: false, message: `Razorpay: ${error.error.description}` });
    }
    next(error);
  } finally {
    client.release();
  }
};

export const getRefundsForOrder = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM refunds WHERE order_id = $1 ORDER BY created_at DESC', [req.params.id]);
    res.json({ success: true, refunds: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getWebhookEvents = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, event_id, event_type, status, error, processed_at, created_at FROM webhook_events ORDER BY created_at DESC LIMIT 100'
    );
    res.json({ success: true, events: result.rows });
  } catch (error) {
    next(error);
  }
};
