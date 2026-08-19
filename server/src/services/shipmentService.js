import { query } from '../config/db.js';
import { sendShipmentCreatedEmail, sendOrderStatusEmail } from './emailService.js';
import {
  isDelhiveryConfigured,
  computeParcel,
  createShipment,
  requestPickup,
  trackShipment,
  mapDeliveryStatus,
  publicTrackingUrl,
} from './delhiveryService.js';

/**
 * Creates the Delhivery shipment for a paid order and records the result.
 *
 * Never throws into the payment flow: a courier failure must not disturb an
 * order the customer has already paid for. On failure the order keeps
 * delivery_status 'Pending' and the error is stored for the admin panel,
 * where "Retry shipment" calls this same function again.
 */
export const createShipmentForOrder = async (orderId) => {
  const orderRes = await query('SELECT * FROM orders WHERE id = $1', [orderId]);
  const order = orderRes.rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (order.delhivery_awb) {
    return { alreadyShipped: true, awb: order.delhivery_awb };
  }

  const itemsRes = await query(
    `SELECT oi.product_name, oi.quantity,
            p.shipping_weight_kg, p.package_length_cm, p.package_width_cm, p.package_height_cm
       FROM order_items oi
       LEFT JOIN products p ON p.id = oi.product_id
      WHERE oi.order_id = $1`,
    [orderId]
  );
  const items = itemsRes.rows;
  const parcel = computeParcel(items);

  if (!isDelhiveryConfigured()) {
    await query(
      `UPDATE orders SET delivery_status = 'Pending', shipment_error = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      ['Delhivery is not configured on this server.', orderId]
    );
    return { pending: true, reason: 'not-configured' };
  }

  try {
    const shipment = await createShipment({ order, items, parcel });

    let pickupStatus = 'Requested';
    try {
      await requestPickup({ expectedPackages: 1 });
      pickupStatus = 'Pickup Scheduled';
    } catch (pickupError) {
      // The manifest exists; a pickup hiccup is recoverable and non-fatal.
      console.error(`Delhivery pickup request failed for order ${order.order_number}:`, pickupError.message);
      pickupStatus = 'Pickup Failed';
    }

    await query(
      `UPDATE orders
          SET delivery_provider = 'Delhivery',
              delhivery_awb = $1,
              delhivery_shipment_id = $2,
              delivery_status = $3,
              tracking_url = $4,
              pickup_status = $5,
              shipment_created_at = CURRENT_TIMESTAMP,
              shipment_error = NULL,
              updated_at = CURRENT_TIMESTAMP
        WHERE id = $6`,
      [shipment.awb, shipment.shipmentId, shipment.status, publicTrackingUrl(shipment.awb), pickupStatus, orderId]
    );

    const address = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;
    if (address?.email) {
      sendShipmentCreatedEmail(address.email, order, shipment.awb, publicTrackingUrl(shipment.awb)).catch((err) =>
        console.error('Shipment email failed:', err.message)
      );
    }

    return { awb: shipment.awb, status: shipment.status, pickupStatus };
  } catch (error) {
    console.error(`Delhivery shipment creation failed for order ${order.order_number}:`, error.message);
    await query(
      `UPDATE orders SET delivery_status = 'Pending', shipment_error = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2`,
      [error.message.slice(0, 500), orderId]
    );
    return { pending: true, error: error.message };
  }
};

/**
 * Pulls the latest Delhivery status for one order and syncs both the
 * courier fields and — where the mapping is unambiguous — the order status.
 */
export const refreshOrderTracking = async (orderId) => {
  const orderRes = await query(
    'SELECT id, order_number, status, delhivery_awb, shipping_address FROM orders WHERE id = $1',
    [orderId]
  );
  const order = orderRes.rows[0];
  if (!order) throw new Error(`Order ${orderId} not found`);
  if (!order.delhivery_awb) throw new Error('This order has no Delhivery shipment yet.');

  const tracking = await trackShipment(order.delhivery_awb);
  const mappedStatus = mapDeliveryStatus(tracking.status);

  await query(
    `UPDATE orders
        SET delivery_status = $1,
            status = COALESCE($2, status),
            updated_at = CURRENT_TIMESTAMP
      WHERE id = $3`,
    [tracking.status, mappedStatus, orderId]
  );

  // A courier-driven status change deserves the same email an admin-driven
  // one sends (Shipped / Out for Delivery / Delivered).
  if (mappedStatus && mappedStatus !== order.status) {
    const address = typeof order.shipping_address === 'string'
      ? JSON.parse(order.shipping_address)
      : order.shipping_address;
    if (address?.email) {
      sendOrderStatusEmail(address.email, order.order_number, mappedStatus, order.delhivery_awb).catch((err) =>
        console.error('Status email failed:', err.message)
      );
    }
  }

  return { ...tracking, orderStatus: mappedStatus || order.status };
};
