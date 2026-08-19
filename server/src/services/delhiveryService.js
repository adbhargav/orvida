import dotenv from 'dotenv';
import { COMPANY } from '../config/company.js';

dotenv.config();

/**
 * Delhivery courier integration.
 *
 * Everything Delhivery lives behind this module: serviceability, rates,
 * shipment manifest (AWB), pickup requests, tracking and cancellation.
 * The API token exists only in the backend environment — nothing here is
 * ever sent to the browser except computed charges and tracking summaries.
 *
 * Environment:
 *   DELHIVERY_API_TOKEN      required for live calls
 *   DELHIVERY_BASE_URL       default https://track.delhivery.com
 *                            (staging: https://staging-express.delhivery.com)
 *   DELHIVERY_PICKUP_NAME    registered warehouse/pickup-location name
 *   DELHIVERY_PICKUP_PINCODE origin pincode (defaults to the company address)
 *   DELHIVERY_MOCK           'true' → deterministic local test mode, no network
 */

const TOKEN = process.env.DELHIVERY_API_TOKEN || '';
const BASE_URL = (process.env.DELHIVERY_BASE_URL || 'https://track.delhivery.com').replace(/\/+$/, '');
const PICKUP_NAME = process.env.DELHIVERY_PICKUP_NAME || COMPANY.legalName || COMPANY.name || 'ORVIDA';
const ORIGIN_PIN = process.env.DELHIVERY_PICKUP_PINCODE || COMPANY.address?.pincode || '';
const MOCK = process.env.DELHIVERY_MOCK === 'true';

// Parcel fallbacks for catalogue items saved before shipping fields existed.
const DEFAULT_WEIGHT_KG = Number(process.env.DELHIVERY_DEFAULT_WEIGHT_KG || 1);
const DEFAULT_DIM_CM = 20;
const VOLUMETRIC_DIVISOR = 5000; // cm³ per kg, Delhivery surface standard

export const isDelhiveryConfigured = () => MOCK || Boolean(TOKEN && ORIGIN_PIN);

const authHeaders = () => ({
  Authorization: `Token ${TOKEN}`,
  Accept: 'application/json',
});

const apiGet = async (path, params = {}) => {
  const url = new URL(`${BASE_URL}${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const res = await fetch(url, { headers: authHeaders() });
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`Delhivery ${path} failed (${res.status}): ${body.slice(0, 300)}`);
  }
  return res.json();
};

/* ------------------------------------------------------------------ *
 * Parcel maths
 * ------------------------------------------------------------------ */

/**
 * Reduces order line items (with their product shipping columns) to one
 * parcel. Weight adds up per unit; the base footprint is the largest single
 * item and units stack in height — matching how the atelier actually packs
 * multi-plant orders. Chargeable weight is max(actual, volumetric).
 */
export const computeParcel = (items) => {
  let actualKg = 0;
  let baseLength = 0;
  let baseWidth = 0;
  let stackedHeight = 0;
  let missingData = false;

  for (const item of items) {
    const qty = Math.max(1, Number(item.quantity) || 1);
    const weight = Number(item.shipping_weight_kg);
    const l = Number(item.package_length_cm);
    const w = Number(item.package_width_cm);
    const h = Number(item.package_height_cm);

    if (!(weight > 0)) missingData = true;
    actualKg += (weight > 0 ? weight : DEFAULT_WEIGHT_KG) * qty;
    baseLength = Math.max(baseLength, l > 0 ? l : DEFAULT_DIM_CM);
    baseWidth = Math.max(baseWidth, w > 0 ? w : DEFAULT_DIM_CM);
    stackedHeight += (h > 0 ? h : DEFAULT_DIM_CM) * qty;
  }

  const volumetricKg = (baseLength * baseWidth * stackedHeight) / VOLUMETRIC_DIVISOR;
  const chargeableKg = Math.max(actualKg, volumetricKg);

  return {
    actualKg: Number(actualKg.toFixed(3)),
    volumetricKg: Number(volumetricKg.toFixed(3)),
    chargeableGrams: Math.max(50, Math.ceil(chargeableKg * 1000)),
    lengthCm: Math.ceil(baseLength),
    widthCm: Math.ceil(baseWidth),
    heightCm: Math.ceil(stackedHeight),
    missingData,
  };
};

/* ------------------------------------------------------------------ *
 * Serviceability + rates
 * ------------------------------------------------------------------ */

export const checkServiceability = async (pincode) => {
  if (MOCK) return { serviceable: !String(pincode).startsWith('999'), city: 'Mockville', state: 'TS' };

  const data = await apiGet('/c/api/pin-codes/json/', { filter_codes: pincode });
  const entry = data?.delivery_codes?.[0]?.postal_code;
  if (!entry) return { serviceable: false };
  return {
    serviceable: entry.pre_paid === 'Y' || entry.cod === 'Y',
    city: entry.city || null,
    state: entry.state_code || null,
  };
};

// A quote fetched at checkout must match the one used when the payment is
// verified minutes later, so quotes are cached briefly per (pin, weight).
const rateCache = new Map();
const RATE_TTL_MS = 30 * 60 * 1000;

export const getShippingRate = async ({ destinationPin, grams }) => {
  const key = `${destinationPin}:${grams}`;
  const hit = rateCache.get(key);
  if (hit && Date.now() - hit.at < RATE_TTL_MS) return hit.value;

  let value;
  if (MOCK) {
    value = Math.round(60 + grams * 0.04);
  } else {
    const data = await apiGet('/api/kinko/v1/invoice/charges/.json', {
      md: 'S',            // surface mode
      ss: 'Delivered',
      d_pin: destinationPin,
      o_pin: ORIGIN_PIN,
      cgm: grams,
      pt: 'Pre-paid',
      cod: 0,
    });
    const total = Array.isArray(data) ? data[0]?.total_amount : data?.total_amount;
    if (!Number.isFinite(Number(total))) {
      throw new Error(`Delhivery rate response had no total_amount: ${JSON.stringify(data).slice(0, 300)}`);
    }
    value = Math.ceil(Number(total));
  }

  rateCache.set(key, { at: Date.now(), value });
  return value;
};

/* ------------------------------------------------------------------ *
 * Shipment manifest / AWB
 * ------------------------------------------------------------------ */

export const createShipment = async ({ order, items, parcel }) => {
  const address = typeof order.shipping_address === 'string'
    ? JSON.parse(order.shipping_address)
    : order.shipping_address;

  if (MOCK) {
    return {
      awb: `MOCK${String(order.id).padStart(8, '0')}`,
      shipmentId: `mock-${order.order_number}`,
      status: 'Manifested',
    };
  }

  const payload = {
    pickup_location: { name: PICKUP_NAME },
    shipments: [
      {
        name: address.fullName,
        add: address.address,
        city: address.city,
        state: address.state,
        country: 'India',
        pin: address.pincode,
        phone: address.phone,
        order: order.order_number,
        payment_mode: 'Prepaid',
        cod_amount: '0',
        total_amount: String(order.total),
        products_desc: items.map((i) => `${i.product_name} x${i.quantity}`).join(', ').slice(0, 250),
        quantity: String(items.reduce((n, i) => n + i.quantity, 0)),
        weight: String(parcel.chargeableGrams),
        shipment_length: String(parcel.lengthCm),
        shipment_width: String(parcel.widthCm),
        shipment_height: String(parcel.heightCm),
      },
    ],
  };

  const res = await fetch(`${BASE_URL}/api/cmu/create.json`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: `format=json&data=${JSON.stringify(payload)}`,
  });
  const body = await res.json().catch(() => ({}));

  const pkg = body?.packages?.[0];
  if (!res.ok || !pkg?.waybill) {
    const remark = pkg?.remarks?.join?.('; ') || body?.rmk || JSON.stringify(body).slice(0, 300);
    throw new Error(`Delhivery manifest failed: ${remark}`);
  }

  return {
    awb: pkg.waybill,
    shipmentId: pkg.refnum || order.order_number,
    status: pkg.status || 'Manifested',
  };
};

export const requestPickup = async ({ expectedPackages = 1, pickupDate }) => {
  if (MOCK) return { status: 'Pickup Scheduled', date: pickupDate };

  // Next business morning if no date given.
  const date = pickupDate || (() => {
    const d = new Date(Date.now() + 24 * 60 * 60 * 1000);
    return d.toISOString().slice(0, 10);
  })();

  const res = await fetch(`${BASE_URL}/fm/request/new/`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      pickup_location: PICKUP_NAME,
      pickup_date: date,
      pickup_time: '11:00:00',
      expected_package_count: expectedPackages,
    }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    // An already-open pickup for the slot is fine — the parcel joins it.
    const message = JSON.stringify(body).slice(0, 300);
    if (/already/i.test(message)) return { status: 'Pickup Scheduled', date };
    throw new Error(`Delhivery pickup request failed: ${message}`);
  }
  return { status: 'Pickup Scheduled', date, response: body };
};

/* ------------------------------------------------------------------ *
 * Tracking + cancellation
 * ------------------------------------------------------------------ */

/** Maps Delhivery's shipment status to the storefront's order vocabulary. */
export const mapDeliveryStatus = (delhiveryStatus) => {
  const s = String(delhiveryStatus || '').toLowerCase();
  if (s.includes('delivered') && !s.includes('not')) return 'Delivered';
  if (s.includes('dispatched') || s.includes('out for delivery')) return 'Out for Delivery';
  if (s.includes('rto') || s.includes('returned')) return null; // keep order status, surface via delivery_status
  if (s.includes('cancel')) return null;
  if (s.includes('in transit') || s.includes('pending')) return 'Shipped';
  return null; // Manifested / Not Picked → order stays Processing
};

export const trackShipment = async (awb) => {
  if (MOCK) {
    return { awb, status: 'In Transit', statusDate: new Date().toISOString(), location: 'Mock hub', instructions: '' };
  }

  const data = await apiGet('/api/v1/packages/json/', { waybill: awb });
  const shipment = data?.ShipmentData?.[0]?.Shipment;
  if (!shipment) throw new Error('Delhivery returned no tracking data for this waybill.');
  const st = shipment.Status || {};
  return {
    awb,
    status: st.Status || 'Unknown',
    statusDate: st.StatusDateTime || null,
    location: st.StatusLocation || null,
    instructions: st.Instructions || '',
    pickupDate: shipment.PickUpDate || null,
    expectedDate: shipment.ExpectedDeliveryDate || null,
  };
};

export const cancelShipment = async (awb) => {
  if (MOCK) return { cancelled: true };

  const res = await fetch(`${BASE_URL}/api/p/edit`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ waybill: awb, cancellation: 'true' }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`Delhivery cancellation failed: ${JSON.stringify(body).slice(0, 300)}`);
  return { cancelled: true, response: body };
};

export const publicTrackingUrl = (awb) => `https://www.delhivery.com/track-v2/package/${awb}`;
