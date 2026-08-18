/**
 * Local webhook harness.
 *
 * Posts signed and deliberately-forged Razorpay webhook deliveries at the
 * running server, the same way Razorpay's servers would (no browser, so no
 * CORS involved). Use it to confirm signature enforcement and idempotency
 * after changing the payment code.
 *
 *   node src/db/testWebhook.js
 */
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const SECRET = process.env.RAZORPAY_WEBHOOK_SECRET;
const BASE = `http://localhost:${process.env.PORT || 5001}`;
const ENDPOINT = `${BASE}/api/payments/webhook/razorpay`;

if (!SECRET) {
  console.error('RAZORPAY_WEBHOOK_SECRET is not set.');
  process.exit(1);
}

const post = async (label, payload, { signature, eventId } = {}) => {
  const raw = JSON.stringify(payload);
  const sig = signature ?? crypto.createHmac('sha256', SECRET).update(raw).digest('hex');

  const res = await fetch(ENDPOINT, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-razorpay-signature': sig,
      'x-razorpay-event-id': eventId || `evt_test_${payload.event}_${payload.created_at}`,
    },
    body: raw,
  });

  let body;
  try { body = await res.json(); } catch { body = await res.text(); }
  console.log(`${label.padEnd(38)} → ${res.status} ${JSON.stringify(body)}`);
  return res.status;
};

const run = async () => {
  const orderRes = await fetch(`${BASE}/api/health`);
  if (!orderRes.ok) {
    console.error('Server is not responding on', BASE);
    process.exit(1);
  }

  const { pool, query } = await import('../config/db.js');
  const existing = await query(
    'SELECT razorpay_order_id, razorpay_payment_id FROM orders WHERE razorpay_payment_id IS NOT NULL LIMIT 1'
  );

  if (existing.rows.length === 0) {
    console.log('No paid order found to exercise webhooks against.');
    await pool.end();
    return;
  }

  const { razorpay_order_id, razorpay_payment_id } = existing.rows[0];
  const stamp = Math.floor(Date.now() / 1000);

  const capturedPayload = {
    event: 'payment.captured',
    created_at: stamp,
    payload: { payment: { entity: { id: razorpay_payment_id, order_id: razorpay_order_id, amount: 100 } } },
  };

  console.log('\nRazorpay webhook checks\n' + '-'.repeat(64));

  await post('forged signature (must be 400)', capturedPayload, { signature: 'deadbeef'.repeat(8) });
  await post('valid payment.captured', capturedPayload, { eventId: `evt_cap_${stamp}` });
  await post('replay of same event (idempotent)', capturedPayload, { eventId: `evt_cap_${stamp}` });

  await post(
    'valid order.paid',
    { event: 'order.paid', created_at: stamp, payload: { order: { entity: { id: razorpay_order_id } } } },
    { eventId: `evt_paid_${stamp}` }
  );

  await post(
    'unhandled event (must be ignored)',
    { event: 'subscription.charged', created_at: stamp, payload: {} },
    { eventId: `evt_sub_${stamp}` }
  );

  const events = await query(
    'SELECT event_type, status FROM webhook_events ORDER BY created_at DESC LIMIT 6'
  );
  console.log('\nRecorded events:');
  console.table(events.rows);

  await pool.end();
};

run().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
