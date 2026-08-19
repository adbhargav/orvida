import { query } from '../config/db.js';
import {
  isDelhiveryConfigured,
  checkServiceability,
  getShippingRate,
  computeParcel,
} from '../services/delhiveryService.js';
import { createShipmentForOrder, refreshOrderTracking } from '../services/shipmentService.js';

const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 250;

/**
 * POST /api/shipping/quote  { items: [{productId, quantity}], pincode }
 *
 * Prices delivery for a cart to one pincode. Reads parcel data from the
 * database (never from the request body) and returns only the computed
 * charge — no Delhivery internals reach the browser.
 */
export const getShippingQuote = async (req, res, next) => {
  try {
    const { items, pincode } = req.body;
    const pin = String(pincode || '').trim();

    if (!/^\d{6}$/.test(pin)) {
      return res.status(400).json({ success: false, message: 'A valid 6-digit pincode is required.' });
    }
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ success: false, message: 'Cart items are required.' });
    }

    const ids = items.map((i) => parseInt(i.productId ?? i.id, 10)).filter(Number.isInteger);
    const prodRes = await query(
      `SELECT id, price, discount_price, shipping_weight_kg, package_length_cm, package_width_cm, package_height_cm
         FROM products WHERE id = ANY($1)`,
      [ids]
    );
    const byId = new Map(prodRes.rows.map((p) => [p.id, p]));

    let subtotal = 0;
    const parcelItems = [];
    for (const item of items) {
      const p = byId.get(parseInt(item.productId ?? item.id, 10));
      if (!p) continue;
      const qty = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));
      const list = Number(p.price);
      const disc = p.discount_price === null ? null : Number(p.discount_price);
      subtotal += (disc && disc < list ? disc : list) * qty;
      parcelItems.push({ ...p, quantity: qty });
    }
    if (parcelItems.length === 0) {
      return res.status(400).json({ success: false, message: 'No valid products in the cart.' });
    }

    // The storefront advertises complimentary shipping above the threshold;
    // that business promise outranks the courier rate card.
    const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

    if (!isDelhiveryConfigured()) {
      return res.json({
        success: true,
        serviceable: true,
        shippingFee: freeShipping ? 0 : STANDARD_SHIPPING_FEE,
        source: 'flat-rate',
      });
    }

    const service = await checkServiceability(pin);
    if (!service.serviceable) {
      return res.json({
        success: true,
        serviceable: false,
        message: 'Delhivery does not deliver to this pincode yet.',
      });
    }

    const parcel = computeParcel(parcelItems);
    const rate = await getShippingRate({ destinationPin: pin, grams: parcel.chargeableGrams });

    res.json({
      success: true,
      serviceable: true,
      shippingFee: freeShipping ? 0 : rate,
      courierFee: rate,
      freeShipping,
      city: service.city,
      state: service.state,
      chargeableWeightKg: parcel.chargeableGrams / 1000,
      source: 'delhivery',
    });
  } catch (error) {
    // Quoting must not block checkout: fall back to the flat rule and log.
    console.error('Delhivery quote failed:', error.message);
    res.json({ success: true, serviceable: true, shippingFee: STANDARD_SHIPPING_FEE, source: 'flat-rate-fallback' });
  }
};

/** POST /api/shipping/admin/orders/:id/create — manifest (or retry) a shipment. */
export const adminCreateShipment = async (req, res, next) => {
  try {
    const result = await createShipmentForOrder(parseInt(req.params.id, 10));
    if (result.pending) {
      return res.status(502).json({
        success: false,
        message: result.error || 'Shipment could not be created. It stays Pending for retry.',
      });
    }
    res.json({ success: true, ...result });
  } catch (error) {
    next(error);
  }
};

/** POST /api/shipping/admin/orders/:id/refresh — pull latest courier status. */
export const adminRefreshTracking = async (req, res, next) => {
  try {
    const tracking = await refreshOrderTracking(parseInt(req.params.id, 10));
    res.json({ success: true, tracking });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

/** GET /api/shipping/track/:orderId — customer-facing tracking for own order. */
export const trackMyOrder = async (req, res, next) => {
  try {
    const orderId = parseInt(req.params.orderId, 10);
    const owned = await query('SELECT id, user_id, delhivery_awb FROM orders WHERE id = $1', [orderId]);
    const order = owned.rows[0];
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
    if (order.user_id !== req.user.id && !req.user.is_admin) {
      return res.status(403).json({ success: false, message: 'Not your order.' });
    }
    if (!order.delhivery_awb) {
      return res.json({ success: true, tracking: null, message: 'Shipment is being prepared.' });
    }

    const tracking = await refreshOrderTracking(orderId);
    res.json({ success: true, tracking });
  } catch (error) {
    next(error);
  }
};
