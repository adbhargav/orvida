import { transporter } from '../config/mailer.js';
import { COMPANY, companyAddressLines } from '../config/company.js';
import dotenv from 'dotenv';

dotenv.config();

const EMAIL_FROM = process.env.EMAIL_FROM || `${COMPANY.name} <${COMPANY.email}>`;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER || process.env.SMTP_USER;
const CLIENT_URL = (process.env.CLIENT_URL || 'http://localhost:5173').split(',')[0].trim();

const isMailerReady = () => Boolean(process.env.SMTP_USER || process.env.EMAIL_USER);

/* ------------------------------------------------------------------ *
 * Helpers
 * ------------------------------------------------------------------ */

const esc = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN')}`;

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const parseAddress = (addr) => {
  if (!addr) return {};
  if (typeof addr === 'string') {
    try { return JSON.parse(addr); } catch { return {}; }
  }
  return addr;
};

/* ------------------------------------------------------------------ *
 * Layout
 *
 * Table-based and inline-styled, because Gmail, Outlook and Yahoo strip
 * <style> blocks, flexbox and grid. Max width 600px with width="100%" so it
 * reflows on phones without a horizontal scrollbar.
 * ------------------------------------------------------------------ */

const BRAND = {
  green: '#154734',
  greenDeep: '#0F3526',
  gold: '#A8823C',
  ink: '#16211C',
  inkSoft: '#5A6A62',
  line: '#E5E7E2',
  canvas: '#FBFAF7',
};

/**
 * The wordmark is drawn with text rather than an <img>, so it renders even
 * when a client blocks remote images — the most common cause of a "broken"
 * looking email.
 */
const header = () => `
  <tr>
    <td align="center" style="padding:32px 24px 24px;background-color:${BRAND.green};">
      <div style="font-family:Georgia,'Times New Roman',serif;font-size:30px;letter-spacing:6px;color:#ffffff;font-weight:normal;line-height:1.1;">
        ${esc(COMPANY.name)}
      </div>
      <div style="font-family:Arial,Helvetica,sans-serif;font-size:10px;letter-spacing:3px;color:#E8D5A6;text-transform:uppercase;padding-top:8px;">
        ${esc(COMPANY.tagline)}
      </div>
    </td>
  </tr>`;

const footer = (unsubscribeEmail) => `
  <tr>
    <td style="padding:28px 24px 32px;background-color:${BRAND.canvas};border-top:1px solid ${BRAND.line};">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td align="center" style="font-family:Arial,Helvetica,sans-serif;font-size:12px;line-height:1.7;color:${BRAND.inkSoft};">
            <strong style="color:${BRAND.ink};">${esc(COMPANY.name)}</strong><br />
            ${companyAddressLines().map((l) => esc(l)).join('<br />')}<br />
            <a href="tel:${esc(COMPANY.phone.replace(/\s/g, ''))}" style="color:${BRAND.green};text-decoration:none;">${esc(COMPANY.phone)}</a>
            &nbsp;·&nbsp;
            <a href="mailto:${esc(COMPANY.email)}" style="color:${BRAND.green};text-decoration:none;">${esc(COMPANY.email)}</a>
          </td>
        </tr>
        <tr>
          <td align="center" style="padding-top:16px;font-family:Arial,Helvetica,sans-serif;font-size:11px;color:#8A968F;">
            © ${new Date().getFullYear()} ${esc(COMPANY.name)}. All rights reserved.
            ${
              unsubscribeEmail
                ? `<br /><a href="${CLIENT_URL}/unsubscribe?email=${encodeURIComponent(unsubscribeEmail)}" style="color:#8A968F;text-decoration:underline;">Unsubscribe</a>`
                : ''
            }
          </td>
        </tr>
      </table>
    </td>
  </tr>`;

const button = (href, label) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
    <tr>
      <td align="center" bgcolor="${BRAND.green}" style="border-radius:2px;">
        <a href="${href}" style="display:inline-block;padding:14px 32px;font-family:Arial,Helvetica,sans-serif;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#ffffff;text-decoration:none;">${esc(label)}</a>
      </td>
    </tr>
  </table>`;

/** Wraps body rows in the responsive shell. */
const layout = ({ preheader = '', bodyRows, unsubscribeEmail = null }) => `<!doctype html>
<html lang="en" xmlns="http://www.w3.org/1999/xhtml">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<meta name="x-apple-disable-message-reformatting" />
<meta name="color-scheme" content="light" />
<title>${esc(COMPANY.name)}</title>
<!--[if mso]>
<style>table,td,div,p,a{font-family:Arial,Helvetica,sans-serif !important;}</style>
<![endif]-->
<style>
  /* Progressive enhancement only — the inline styles carry the design. */
  @media screen and (max-width:600px){
    .container{width:100% !important;}
    .px{padding-left:20px !important;padding-right:20px !important;}
    .stack{display:block !important;width:100% !important;text-align:left !important;padding-left:0 !important;}
    .stack-right{text-align:left !important;padding-top:4px !important;}
    .h1{font-size:24px !important;}
  }
</style>
</head>
<body style="margin:0;padding:0;background-color:#EFEDE8;">
  <div style="display:none;font-size:1px;color:#EFEDE8;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">
    ${esc(preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;
  </div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#EFEDE8;">
    <tr>
      <td align="center" style="padding:24px 12px;">
        <table role="presentation" class="container" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:600px;background-color:#ffffff;">
          ${header()}
          ${bodyRows}
          ${footer(unsubscribeEmail)}
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

/** A two-column key/value row that stacks on narrow screens. */
const kvRow = (label, value, bold = false) => `
  <tr>
    <td class="stack" style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.inkSoft};">${esc(label)}</td>
    <td class="stack stack-right" align="right" style="padding:6px 0;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};${bold ? 'font-weight:bold;' : ''}">${value}</td>
  </tr>`;

/**
 * Renders order lines. Product images use a fixed width/height with a
 * background colour behind them, so a blocked or slow image leaves a tidy
 * placeholder rather than a collapsed row.
 */
const itemRows = (items = []) =>
  items
    .map((item) => {
      const name = esc(item.product_name || item.name);
      const image = item.image_url || item.image;
      return `
      <tr>
        <td style="padding:14px 0;border-bottom:1px solid ${BRAND.line};">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="64" valign="top" style="width:64px;padding-right:14px;">
                <table role="presentation" cellpadding="0" cellspacing="0" border="0" width="64" style="width:64px;">
                  <tr>
                    <td bgcolor="#F4F7F5" height="72" style="width:64px;height:72px;text-align:center;">
                      ${
                        image
                          ? `<img src="${esc(image)}" width="64" height="72" alt="" style="display:block;width:64px;height:72px;object-fit:cover;border:0;outline:none;text-decoration:none;" />`
                          : '&nbsp;'
                      }
                    </td>
                  </tr>
                </table>
              </td>
              <td valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};line-height:1.5;">
                ${name}
                ${item.variant_name ? `<div style="font-size:12px;color:${BRAND.inkSoft};padding-top:2px;">${esc(item.variant_name)}</div>` : ''}
                <div style="font-size:12px;color:#8A968F;padding-top:2px;">Qty ${esc(item.quantity)} × ${money(item.price)}</div>
              </td>
              <td valign="top" align="right" style="font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};white-space:nowrap;padding-left:10px;">
                ${money(Number(item.price) * Number(item.quantity))}
              </td>
            </tr>
          </table>
        </td>
      </tr>`;
    })
    .join('');

const send = async ({ to, subject, html, text }) => {
  if (!isMailerReady()) {
    console.log(`[DRY-RUN EMAIL] ${subject} → ${to}`);
    return true;
  }
  try {
    await transporter.sendMail({ from: EMAIL_FROM, to, subject, html, text });
    return true;
  } catch (error) {
    console.error(`Email failed (${subject} → ${to}):`, error.message);
    return false;
  }
};

/* ------------------------------------------------------------------ *
 * Customer emails
 * ------------------------------------------------------------------ */

export const sendWelcomeEmail = async (userEmail, userName) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 8px;">
        <h1 class="h1" style="margin:0 0 14px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;color:${BRAND.ink};line-height:1.2;">
          Welcome, ${esc(userName)}
        </h1>
        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          You have joined a house built on slow craft — rare botanicals raised over eighteen months, and bell metal cast by families who have done it for four thousand years.
        </p>
      </td>
    </tr>
    <tr><td class="px" style="padding:12px 40px 36px;">${button(`${CLIENT_URL}/category/plants`, 'Explore the collection')}</td></tr>`;

  const ok = await send({
    to: userEmail,
    subject: `Welcome to ${COMPANY.name}`,
    html: layout({ preheader: 'Your account is ready.', bodyRows }),
    text: `Welcome to ${COMPANY.name}, ${userName}. Explore the collection at ${CLIENT_URL}`,
  });

  sendAdminUserRegisteredAlert({ name: userName, email: userEmail }).catch(() => {});
  return ok;
};

export const sendOrderConfirmationEmail = async (userEmail, order, items) => {
  const addr = parseAddress(order.shipping_address);

  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 0;">
        <h1 class="h1" style="margin:0 0 10px;font-family:Georgia,'Times New Roman',serif;font-size:28px;font-weight:normal;color:${BRAND.ink};line-height:1.2;">
          Thank you for your order
        </h1>
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          Your pieces are being prepared. We will email you again the moment they ship.
        </p>
        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};">
          Order <strong>${esc(order.order_number)}</strong> · ${formatDate(order.created_at)}
        </p>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:0 40px;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${itemRows(items)}
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:18px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${kvRow('Subtotal', money(order.subtotal))}
          ${Number(order.discount_amount) > 0 ? kvRow('Discount', `−${money(order.discount_amount)}`) : ''}
          ${kvRow('Shipping', Number(order.shipping_fee) === 0 ? 'Complimentary' : money(order.shipping_fee))}
          <tr><td colspan="2" style="padding-top:8px;border-top:1px solid ${BRAND.line};"></td></tr>
          ${kvRow('Total paid', money(order.total), true)}
        </table>
      </td>
    </tr>

    <tr>
      <td class="px" style="padding:28px 40px 0;">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          <tr>
            <td class="stack" width="50%" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${BRAND.inkSoft};padding-bottom:12px;">
              <strong style="color:${BRAND.ink};display:block;padding-bottom:4px;">Delivering to</strong>
              ${esc(addr.fullName)}<br />
              ${esc(addr.address)}<br />
              ${esc(addr.city)}, ${esc(addr.state)} ${esc(addr.pincode)}
            </td>
            <td class="stack" width="50%" valign="top" style="font-family:Arial,Helvetica,sans-serif;font-size:13px;line-height:1.7;color:${BRAND.inkSoft};padding-left:16px;">
              <strong style="color:${BRAND.ink};display:block;padding-bottom:4px;">Payment</strong>
              Razorpay · ${esc(order.payment_status)}<br />
              ${order.razorpay_payment_id ? `Ref ${esc(order.razorpay_payment_id)}<br />` : ''}
              ${order.delivery_slot ? esc(order.delivery_slot) : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>

    <tr><td class="px" style="padding:28px 40px 36px;">${button(`${CLIENT_URL}/orders/${encodeURIComponent(order.order_number)}`, 'View your order')}</td></tr>`;

  return send({
    to: userEmail,
    subject: `Order ${order.order_number} confirmed — ${COMPANY.name}`,
    html: layout({ preheader: `Order ${order.order_number} · ${money(order.total)}`, bodyRows }),
    text: `Thank you for your order ${order.order_number}. Total ${money(order.total)}. View it at ${CLIENT_URL}/orders/${order.order_number}`,
  });
};

const STATUS_COPY = {
  Processing: 'We have received your order and are preparing it.',
  Packed: 'Your order has been packed and is awaiting dispatch.',
  Shipped: 'Your order is on its way.',
  'Out for Delivery': 'Your order is out for delivery today.',
  Delivered: 'Your order has been delivered. We hope it settles in beautifully.',
  Cancelled: 'Your order has been cancelled. Any payment will be refunded within 5–7 business days.',
};

export const sendOrderStatusEmail = async (userEmail, orderNumber, status, trackingNumber = null) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          ${esc(status)}
        </h1>
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          ${esc(STATUS_COPY[status] || `Your order status is now ${status}.`)}
        </p>
        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};">
          Order <strong>${esc(orderNumber)}</strong>
          ${trackingNumber ? `<br />Tracking · ${esc(trackingNumber)}` : ''}
        </p>
        ${button(`${CLIENT_URL}/orders/${encodeURIComponent(orderNumber)}`, 'Track your order')}
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `Order ${orderNumber} — ${status}`,
    html: layout({ preheader: STATUS_COPY[status] || status, bodyRows }),
    text: `Order ${orderNumber} is now ${status}. ${CLIENT_URL}/orders/${orderNumber}`,
  });
};

export const sendShipmentCreatedEmail = async (userEmail, order, awb, trackingUrl) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          Your order is on its way to the courier
        </h1>
        <p style="margin:0 0 8px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          Your parcel has been booked with Delhivery and a pickup is scheduled from our atelier.
          You can follow every step with the tracking number below.
        </p>
        <p style="margin:0 0 24px;font-family:Arial,Helvetica,sans-serif;font-size:14px;color:${BRAND.ink};">
          Order <strong>${esc(order.order_number)}</strong>
          <br />Delhivery AWB · <strong>${esc(awb)}</strong>
        </p>
        ${button(trackingUrl, 'Track your parcel')}
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `Order ${order.order_number} — shipment booked (AWB ${awb})`,
    html: layout({ preheader: 'Your parcel is booked with Delhivery.', bodyRows }),
    text: `Order ${order.order_number} is booked with Delhivery. AWB ${awb}. Track: ${trackingUrl}`,
  });
};

export const sendRefundEmail = async (userEmail, order, refundAmount) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          Your refund is on its way
        </h1>
        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          We have issued a refund of <strong style="color:${BRAND.ink};">${money(refundAmount)}</strong> for order
          <strong style="color:${BRAND.ink};">${esc(order.order_number)}</strong>. It returns to your original payment
          method, typically within 5–7 business days depending on your bank.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${kvRow('Order total', money(order.total))}
          ${kvRow('Refunded', money(order.refunded_amount || refundAmount), true)}
        </table>
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `Refund issued for order ${order.order_number}`,
    html: layout({ preheader: `${money(refundAmount)} refunded`, bodyRows }),
    text: `A refund of ${money(refundAmount)} has been issued for order ${order.order_number}.`,
  });
};

export const sendPaymentFailedEmail = async (userEmail, order, reason) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          Your payment did not go through
        </h1>
        <p style="margin:0 0 16px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          We could not complete the payment for order <strong style="color:${BRAND.ink};">${esc(order.order_number)}</strong>.
          Nothing has been charged, and your selection is still saved.
        </p>
        ${reason ? `<p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:13px;color:#8A968F;">Reason: ${esc(reason)}</p>` : ''}
        ${button(`${CLIENT_URL}/checkout`, 'Try again')}
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `Payment unsuccessful — order ${order.order_number}`,
    html: layout({ preheader: 'No charge was made. Your cart is saved.', bodyRows }),
    text: `Payment for order ${order.order_number} failed. ${reason || ''} Retry at ${CLIENT_URL}/checkout`,
  });
};

export const sendEnquiryReceivedEmail = async (userEmail, enquiry) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          Your enquiry is with us
        </h1>
        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          Thank you, ${esc(enquiry.name)}. A concierge will be in touch within one business day with a tailored proposal.
        </p>
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
          ${enquiry.occasion ? kvRow('Occasion', esc(enquiry.occasion)) : ''}
          ${enquiry.quantity ? kvRow('Quantity', esc(enquiry.quantity)) : ''}
          ${enquiry.budget_per_hamper ? kvRow('Budget per hamper', esc(enquiry.budget_per_hamper)) : ''}
        </table>
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `We received your gifting enquiry — ${COMPANY.name}`,
    html: layout({ preheader: 'A concierge will reply within one business day.', bodyRows }),
    text: `Thank you ${enquiry.name}. A concierge will be in touch within one business day.`,
  });
};

export const sendNewsletterWelcomeEmail = async (userEmail) => {
  const bodyRows = `
    <tr>
      <td class="px" style="padding:36px 40px 36px;">
        <h1 class="h1" style="margin:0 0 12px;font-family:Georgia,'Times New Roman',serif;font-size:26px;font-weight:normal;color:${BRAND.ink};line-height:1.25;">
          You are on the list
        </h1>
        <p style="margin:0 0 20px;font-family:Arial,Helvetica,sans-serif;font-size:15px;line-height:1.7;color:${BRAND.inkSoft};">
          Expect rare specimen drops and private previews — never more than a few times a month.
        </p>
        ${button(`${CLIENT_URL}/category/plants`, 'Browse the collection')}
      </td>
    </tr>`;

  return send({
    to: userEmail,
    subject: `Welcome to the ${COMPANY.name} list`,
    html: layout({ preheader: 'Rare specimen drops and private previews.', bodyRows, unsubscribeEmail: userEmail }),
    text: `You are subscribed to ${COMPANY.name}. Unsubscribe: ${CLIENT_URL}/unsubscribe?email=${encodeURIComponent(userEmail)}`,
  });
};

/* ------------------------------------------------------------------ *
 * Internal alerts
 * ------------------------------------------------------------------ */

export const sendAdminUserRegisteredAlert = async (user) => {
  if (!ADMIN_EMAIL) return false;
  const bodyRows = `
    <tr>
      <td class="px" style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.7;color:${BRAND.ink};">
        <strong style="font-size:16px;">New customer registered</strong><br /><br />
        ${esc(user.name)}<br />
        <a href="mailto:${esc(user.email)}" style="color:${BRAND.green};">${esc(user.email)}</a>
      </td>
    </tr>`;
  return send({ to: ADMIN_EMAIL, subject: `New customer: ${user.email}`, html: layout({ bodyRows }) });
};

export const sendAdminEnquiryAlert = async (enquiry) => {
  if (!ADMIN_EMAIL) return false;
  const bodyRows = `
    <tr>
      <td class="px" style="padding:32px 40px;font-family:Arial,Helvetica,sans-serif;font-size:14px;line-height:1.8;color:${BRAND.ink};">
        <strong style="font-size:16px;">New gifting enquiry</strong><br /><br />
        <strong>${esc(enquiry.name)}</strong>${enquiry.company ? ` · ${esc(enquiry.company)}` : ''}<br />
        <a href="mailto:${esc(enquiry.email)}" style="color:${BRAND.green};">${esc(enquiry.email)}</a>
        ${enquiry.phone ? ` · ${esc(enquiry.phone)}` : ''}<br /><br />
        Occasion: ${esc(enquiry.occasion || '—')}<br />
        Quantity: ${esc(enquiry.quantity || '—')}<br />
        Budget: ${esc(enquiry.budget_per_hamper || '—')}<br />
        ${enquiry.notes ? `<br />${esc(enquiry.notes)}` : ''}
      </td>
    </tr>`;
  return send({ to: ADMIN_EMAIL, subject: `Gifting enquiry from ${enquiry.name}`, html: layout({ bodyRows }) });
};
