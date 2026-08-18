import { COMPANY, companyAddressLines } from '../config/company.js';

/* ------------------------------------------------------------------ *
 * Shared helpers
 * ------------------------------------------------------------------ */

/** Escapes values before they are interpolated into document HTML. */
const esc = (value) => {
  if (value === null || value === undefined) return '';
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
};

const money = (value) => `INR ${Number(value || 0).toLocaleString('en-IN', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
})}`;

const formatDate = (value) =>
  new Date(value || Date.now()).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

const parseAddress = (shippingAddress) => {
  if (!shippingAddress) return {};
  if (typeof shippingAddress === 'string') {
    try {
      return JSON.parse(shippingAddress);
    } catch {
      return {};
    }
  }
  return shippingAddress;
};

const addressBlock = (addr) =>
  [
    addr.fullName,
    addr.address,
    [addr.city, addr.state].filter(Boolean).join(', '),
    addr.pincode,
  ]
    .filter(Boolean)
    .map((line) => `<div>${esc(line)}</div>`)
    .join('');

/** Shared print rules so both documents paginate cleanly. */
const BASE_STYLES = `
  *, *::before, *::after { box-sizing: border-box; }
  body {
    margin: 0;
    padding: 32px;
    background: #ffffff;
    color: #16211C;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
    font-size: 13px;
    line-height: 1.5;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
  }
  .sheet { max-width: 780px; margin: 0 auto; }
  h1, h2, h3 { margin: 0; font-weight: 600; }
  table { width: 100%; border-collapse: collapse; }
  .muted { color: #5A6A62; }
  .right { text-align: right; }
  .center { text-align: center; }
  .logo { width: 108px; height: auto; display: block; }
  .toolbar {
    max-width: 780px; margin: 0 auto 20px; display: flex; gap: 8px; justify-content: flex-end;
  }
  .toolbar button {
    font: inherit; font-size: 12px; padding: 8px 18px; cursor: pointer;
    background: #154734; color: #fff; border: 0; border-radius: 4px;
  }
  .toolbar button.secondary { background: #fff; color: #16211C; border: 1px solid #D3D8D2; }
  @media print {
    body { padding: 0; }
    .toolbar { display: none !important; }
    .page-break { page-break-after: always; }
  }
`;

const documentShell = ({ title, styles = '', body }) => `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>${esc(title)}</title>
<style>${BASE_STYLES}${styles}</style>
</head>
<body>
<div class="toolbar">
  <button onclick="window.print()">Print / Save as PDF</button>
  <button class="secondary" onclick="window.close()">Close</button>
</div>
${body}
</body>
</html>`;

/* ------------------------------------------------------------------ *
 * Invoice
 * ------------------------------------------------------------------ */

const INVOICE_STYLES = `
  .head { display: flex; justify-content: space-between; gap: 32px; align-items: flex-start; margin-bottom: 44px; }
  .head .brand { border-bottom: 1px solid #D3D8D2; padding-bottom: 10px; }
  .head .seller { text-align: left; font-size: 12.5px; }
  .head .seller strong { font-size: 14px; }
  .meta { display: flex; justify-content: space-between; gap: 32px; margin-bottom: 32px; }
  .meta .col { flex: 1; }
  .meta h3 { font-size: 15px; margin-bottom: 8px; }
  .meta .lines { color: #2b4b3d; font-size: 12.5px; }
  .invoice-no { font-size: 17px; font-weight: 700; margin-bottom: 8px; }
  .kv { display: flex; gap: 10px; font-size: 12.5px; margin-bottom: 3px; }
  .kv dt { width: 120px; color: #16211C; }
  .kv dd { margin: 0; color: #16211C; }
  table.items thead th {
    background: #8b8b8b; color: #fff; font-weight: 700; font-size: 12.5px;
    padding: 11px 14px; text-align: left;
  }
  table.items thead th.num { text-align: right; }
  table.items thead th.qty { text-align: center; }
  table.items tbody td { padding: 18px 14px; border-bottom: 1px solid #E5E7E2; vertical-align: top; }
  table.items tbody td.num { text-align: right; white-space: nowrap; }
  table.items tbody td.qty { text-align: center; white-space: nowrap; }
  .item-name { font-size: 13.5px; }
  .item-sku { font-size: 11px; color: #8A968F; margin-top: 3px; }
  .totals { margin-top: 26px; margin-left: auto; width: 320px; }
  .totals tr td { padding: 6px 0; font-weight: 700; }
  .totals tr td:first-child { text-align: right; padding-right: 24px; }
  .totals tr td:last-child { text-align: right; white-space: nowrap; }
  .totals tr.grand td { border-top: 1px solid #16211C; padding-top: 10px; font-size: 15px; }
  .totals tr.refund td { color: #b42318; }
  .foot {
    margin-top: 60px; padding-top: 16px; border-top: 1px solid #E5E7E2;
    text-align: center; font-size: 11.5px; color: #5A6A62;
  }
  .badge {
    display: inline-block; padding: 3px 10px; border-radius: 999px;
    font-size: 11px; font-weight: 700; letter-spacing: .04em;
  }
  .badge.paid { background: #EBF1ED; color: #0F3526; }
  .badge.refunded { background: #fdeceb; color: #b42318; }
`;

export const renderInvoiceHtml = (order) => {
  const addr = parseAddress(order.shipping_address);
  const items = order.items || [];

  const itemRows = items
    .map(
      (item) => `
      <tr>
        <td>
          <div class="item-name">${esc(item.product_name || item.name)}</div>
          ${item.variant_name ? `<div class="item-sku">${esc(item.variant_name)}</div>` : ''}
          ${item.sku ? `<div class="item-sku">SKU: ${esc(item.sku)}</div>` : ''}
        </td>
        <td class="num">${money(item.price)}</td>
        <td class="qty">&times; ${esc(item.quantity)}</td>
        <td class="num">${money(Number(item.price) * Number(item.quantity))}</td>
      </tr>`
    )
    .join('');

  const isRefunded = ['Refunded', 'Partially Refunded'].includes(order.payment_status);

  const body = `
  <div class="sheet">
    <div class="head">
      <div class="brand">
        <img class="logo" src="${esc(COMPANY.logoUrl)}" alt="${esc(COMPANY.name)}" />
      </div>
      <div class="seller">
        <strong>${esc(COMPANY.name)}</strong><br />
        <span class="muted">${esc(COMPANY.tagline)}</span><br />
        ${companyAddressLines().map((l) => `${esc(l)}<br />`).join('')}
        ${COMPANY.gstin ? `GSTIN : ${esc(COMPANY.gstin)}<br />` : ''}
        ${esc(COMPANY.email)}
      </div>
    </div>

    <div class="meta">
      <div class="col">
        <h3>Billing</h3>
        <div class="lines">
          ${addressBlock(addr)}
          ${addr.phone ? `<div>Phone : ${esc(addr.phone)}</div>` : ''}
          ${addr.email ? `<div>Email : ${esc(addr.email)}</div>` : ''}
        </div>
      </div>

      <div class="col">
        <h3>Shipping</h3>
        <div class="lines">${addressBlock(addr)}</div>
      </div>

      <div class="col">
        <div class="invoice-no">Invoice ${esc(order.order_number)}</div>
        <dl style="margin:0">
          <div class="kv"><dt>Order Number</dt><dd>: ${esc(order.order_number)}</dd></div>
          <div class="kv"><dt>Order Date</dt><dd>: ${formatDate(order.created_at)}</dd></div>
          <div class="kv"><dt>Payment Method</dt><dd>: Online (Razorpay)</dd></div>
          <div class="kv"><dt>Payment Status</dt><dd>: <span class="badge ${isRefunded ? 'refunded' : 'paid'}">${esc(order.payment_status)}</span></dd></div>
          ${order.razorpay_payment_id ? `<div class="kv"><dt>Payment Ref</dt><dd>: ${esc(order.razorpay_payment_id)}</dd></div>` : ''}
        </dl>
      </div>
    </div>

    <table class="items">
      <thead>
        <tr>
          <th>Item</th>
          <th class="num">Cost</th>
          <th class="qty">Qty</th>
          <th class="num">Total</th>
        </tr>
      </thead>
      <tbody>${itemRows}</tbody>
    </table>

    <table class="totals">
      <tr><td>Items Subtotal :</td><td>${money(order.subtotal)}</td></tr>
      ${Number(order.discount_amount) > 0 ? `<tr><td>Discount :</td><td>-${money(order.discount_amount)}</td></tr>` : ''}
      <tr><td>Shipping :</td><td>${Number(order.shipping_fee) === 0 ? 'FREE' : money(order.shipping_fee)}</td></tr>
      <tr class="grand"><td>Order Total :</td><td>${money(order.total)}</td></tr>
      ${Number(order.refunded_amount) > 0 ? `<tr class="refund"><td>Refunded :</td><td>-${money(order.refunded_amount)}</td></tr>` : ''}
    </table>

    <div class="foot">
      For more detailed information, please review our terms and conditions at ${esc(COMPANY.website)}.<br />
      Email: ${esc(COMPANY.email)} , Phone: ${esc(COMPANY.phone)}
    </div>
  </div>`;

  return documentShell({
    title: `Invoice ${order.order_number} — ${COMPANY.name}`,
    styles: INVOICE_STYLES,
    body,
  });
};

/* ------------------------------------------------------------------ *
 * Shipping label
 * ------------------------------------------------------------------ */

const LABEL_STYLES = `
  .label-head { font-size: 13px; margin-bottom: 48px; }
  .cols { display: flex; gap: 48px; align-items: flex-start; }
  .cols .from { flex: 1; padding-top: 96px; }
  .cols .to { flex: 1; }
  .block-title { font-size: 17px; margin-bottom: 10px; }
  .to .line { font-size: 14px; margin-bottom: 12px; color: #16211C; }
  .from .line { font-size: 12.5px; margin-bottom: 9px; color: #16211C; }
  .from .name { font-size: 13.5px; margin-bottom: 2px; }
  .cut {
    margin: 72px 0 0; border-top: 2px dashed #B7BEB8; position: relative;
  }
  .cut span {
    position: absolute; top: -8px; left: 50%; transform: translateX(-50%);
    background: #fff; padding: 0 12px; font-size: 10px; letter-spacing: .18em;
    color: #C08A6A; text-transform: uppercase;
  }
`;

export const renderLabelHtml = (order) => {
  const addr = parseAddress(order.shipping_address);

  const body = `
  <div class="sheet">
    <div class="label-head">
      Order No: ${esc(order.order_number)}<br />
      Order date: ${formatDate(order.created_at)}
    </div>

    <div class="cols">
      <div class="from">
        <div class="block-title">From:</div>
        <div class="name">${esc(COMPANY.name)}</div>
        <div class="line muted">${esc(COMPANY.tagline)}</div>
        ${companyAddressLines().map((l) => `<div class="line">${esc(l)}</div>`).join('')}
        <div class="line">${esc(COMPANY.phone)}</div>
      </div>

      <div class="to">
        <div class="block-title">To:</div>
        <div class="line">${esc(addr.fullName)}</div>
        <div class="line">${esc(addr.address)}</div>
        <div class="line">${esc(addr.city)} , ${esc(addr.state)} ${esc(addr.pincode)}</div>
        ${addr.phone ? `<div class="line">Tel: ${esc(addr.phone)}</div>` : ''}
      </div>
    </div>

    <div class="cut"><span>Cut here</span></div>
  </div>`;

  return documentShell({
    title: `Shipping label ${order.order_number} — ${COMPANY.name}`,
    styles: LABEL_STYLES,
    body,
  });
};
