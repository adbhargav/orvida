import Razorpay from 'razorpay';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config();

const keyId = process.env.RAZORPAY_KEY_ID;
const keySecret = process.env.RAZORPAY_KEY_SECRET;

/**
 * True only when real Razorpay credentials are present. Callers must check
 * this before attempting a charge — there is deliberately no mock fallback,
 * because a stand-in order id would let an unpaid checkout look successful.
 */
export const isRazorpayConfigured = () => Boolean(keyId && keySecret);

if (!isRazorpayConfigured()) {
  console.warn(
    'Razorpay credentials are missing. Checkout will return 503 until RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are set.'
  );
}

export const razorpayInstance = isRazorpayConfigured()
  ? new Razorpay({ key_id: keyId, key_secret: keySecret })
  : null;

const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;

export const isWebhookConfigured = () => Boolean(webhookSecret);

/**
 * Verifies a Razorpay webhook delivery.
 *
 * `rawBody` must be the exact bytes Razorpay sent — the HMAC is computed over
 * the untouched payload, so any JSON re-serialisation invalidates it.
 */
export const verifyWebhookSignature = (rawBody, signature) => {
  if (!webhookSecret || !rawBody || !signature) return false;

  const expected = crypto.createHmac('sha256', webhookSecret).update(rawBody).digest('hex');
  const expectedBuf = Buffer.from(expected, 'utf8');
  const receivedBuf = Buffer.from(String(signature), 'utf8');

  if (expectedBuf.length !== receivedBuf.length) return false;
  return crypto.timingSafeEqual(expectedBuf, receivedBuf);
};

export const verifyRazorpaySignature = (orderId, paymentId, signature) => {
  if (!isRazorpayConfigured() || !orderId || !paymentId || !signature) return false;

  const generatedSignature = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  const expected = Buffer.from(generatedSignature, 'utf8');
  const received = Buffer.from(String(signature), 'utf8');

  // Constant-time compare to avoid leaking the signature byte by byte.
  if (expected.length !== received.length) return false;
  return crypto.timingSafeEqual(expected, received);
};
