import { query, pool } from '../config/db.js';
import { razorpayInstance, verifyRazorpaySignature, isRazorpayConfigured } from '../config/razorpay.js';
import { sendOrderConfirmationEmail, sendOrderStatusEmail } from '../services/emailService.js';
import { renderInvoiceHtml, renderLabelHtml } from '../services/documentService.js';
import { isDelhiveryConfigured, computeParcel, getShippingRate } from '../services/delhiveryService.js';
import { createShipmentForOrder } from '../services/shipmentService.js';

const FREE_SHIPPING_THRESHOLD = 1999;
const STANDARD_SHIPPING_FEE = 250;

/**
 * Re-prices a cart from the database.
 *
 * The client sends only product/variant ids and quantities. Every rupee is
 * derived here from the products, product_variants and coupons tables, so a
 * tampered request body cannot change what the customer is charged.
 */
const priceCartServerSide = async (client, rawItems, couponCode, destinationPin = null) => {
  const items = Array.isArray(rawItems) ? rawItems : [];
  if (items.length === 0) {
    const error = new Error('Your cart is empty.');
    error.statusCode = 400;
    throw error;
  }

  const lineItems = [];
  let subtotal = 0;

  for (const item of items) {
    const productId = item.productId ?? item.id;
    const quantity = Math.max(1, Math.min(99, parseInt(item.quantity, 10) || 1));

    const productRes = await client.query(
      `SELECT p.id, p.name, p.price, p.discount_price, p.stock,
              p.shipping_weight_kg, p.package_length_cm, p.package_width_cm, p.package_height_cm,
              (SELECT img.url FROM product_images img
                WHERE img.product_id = p.id
                ORDER BY img.display_order ASC LIMIT 1) AS image
         FROM products p WHERE p.id = $1`,
      [productId]
    );

    if (productRes.rows.length === 0) {
      const error = new Error(`A product in your cart is no longer available.`);
      error.statusCode = 400;
      throw error;
    }

    const product = productRes.rows[0];

    let variantName = null;
    let priceDelta = 0;
    const variantId = item.variantId ?? item.variant?.id ?? null;

    if (variantId) {
      const variantRes = await client.query(
        'SELECT id, value, price_delta, stock FROM product_variants WHERE id = $1 AND product_id = $2',
        [variantId, product.id]
      );
      if (variantRes.rows.length > 0) {
        variantName = variantRes.rows[0].value;
        priceDelta = Number(variantRes.rows[0].price_delta) || 0;
      }
    }

    if (product.stock !== null && product.stock < quantity) {
      const error = new Error(`Only ${product.stock} left in stock for ${product.name}.`);
      error.statusCode = 409;
      throw error;
    }

    const listPrice = Number(product.price);
    const discountPrice = product.discount_price === null ? null : Number(product.discount_price);
    const unitPrice = (discountPrice && discountPrice < listPrice ? discountPrice : listPrice) + priceDelta;
    const lineTotal = unitPrice * quantity;

    subtotal += lineTotal;
    lineItems.push({
      productId: product.id,
      name: product.name,
      variantName,
      price: unitPrice,
      quantity,
      image: product.image || null,
      // Parcel data rides along so shipping can be priced from the same rows.
      shipping_weight_kg: product.shipping_weight_kg,
      package_length_cm: product.package_length_cm,
      package_width_cm: product.package_width_cm,
      package_height_cm: product.package_height_cm,
    });
  }

  // Coupon, validated against the database rather than the request body.
  let discountAmount = 0;
  let appliedCoupon = null;

  if (couponCode) {
    const couponRes = await client.query(
      `SELECT * FROM coupons
        WHERE UPPER(code) = UPPER($1)
          AND is_active = TRUE
          AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)`,
      [String(couponCode).trim()]
    );

    if (couponRes.rows.length > 0) {
      const coupon = couponRes.rows[0];
      if (subtotal >= Number(coupon.min_spend || 0)) {
        if (coupon.discount_type === 'percentage') {
          discountAmount = (subtotal * Number(coupon.discount_value)) / 100;
          if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
            discountAmount = Number(coupon.max_discount);
          }
        } else {
          discountAmount = Number(coupon.discount_value);
        }
        discountAmount = Math.min(Math.round(discountAmount), subtotal);
        appliedCoupon = coupon;
      }
    }
  }

  // Shipping: complimentary above the advertised threshold; otherwise the
  // live Delhivery rate for this parcel and pincode (the rate is cached for
  // 30 minutes, so the quote at checkout and the re-price at payment
  // verification agree). Flat fee only when Delhivery is unavailable.
  let shippingFee;
  if (subtotal >= FREE_SHIPPING_THRESHOLD) {
    shippingFee = 0;
  } else if (destinationPin && /^\d{6}$/.test(String(destinationPin)) && isDelhiveryConfigured()) {
    try {
      const parcel = computeParcel(lineItems);
      shippingFee = await getShippingRate({
        destinationPin: String(destinationPin),
        grams: parcel.chargeableGrams,
      });
    } catch (rateError) {
      console.error('Delhivery rate lookup failed during pricing, using flat fee:', rateError.message);
      shippingFee = STANDARD_SHIPPING_FEE;
    }
  } else {
    shippingFee = STANDARD_SHIPPING_FEE;
  }
  const total = Math.max(0, Math.round(subtotal - discountAmount + shippingFee));

  return {
    lineItems,
    subtotal: Math.round(subtotal),
    shippingFee,
    discountAmount,
    total,
    appliedCoupon,
  };
};

export const createRazorpayOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { items, couponCode, currency = 'INR', notes, pincode } = req.body;

    const pricing = await priceCartServerSide(client, items, couponCode, pincode);

    if (pricing.total <= 0) {
      return res.status(400).json({ success: false, message: 'Order total must be greater than zero.' });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: 'Payments are not configured on this server. Please contact support.',
      });
    }

    const razorpayOrder = await razorpayInstance.orders.create({
      amount: pricing.total * 100, // paise
      currency,
      receipt: `ori_rcpt_${Date.now()}`,
      notes: notes || {},
    });

    res.json({
      success: true,
      order: razorpayOrder,
      key: process.env.RAZORPAY_KEY_ID,
      // Echo the authoritative pricing so the client can show the real figures.
      pricing: {
        subtotal: pricing.subtotal,
        shippingFee: pricing.shippingFee,
        discountAmount: pricing.discountAmount,
        total: pricing.total,
        couponApplied: pricing.appliedCoupon ? pricing.appliedCoupon.code : null,
      },
    });
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  } finally {
    client.release();
  }
};

export const verifyPaymentAndCreateOrder = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
      items,
      couponCode,
      shippingAddress,
      deliverySlot,
    } = req.body;

    const isSignatureValid = verifyRazorpaySignature(razorpayOrderId, razorpayPaymentId, razorpaySignature);
    if (!isSignatureValid) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Invalid Razorpay payment signature' });
    }

    // A payment id may only ever produce one order.
    const duplicate = await client.query('SELECT id, order_number FROM orders WHERE razorpay_payment_id = $1', [
      razorpayPaymentId,
    ]);
    if (duplicate.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(200).json({
        success: true,
        message: 'Order already recorded for this payment',
        order: duplicate.rows[0],
      });
    }

    const requiredAddressFields = ['fullName', 'email', 'phone', 'address', 'city', 'state', 'pincode'];
    const missingField = requiredAddressFields.find((f) => !String(shippingAddress?.[f] || '').trim());
    if (missingField) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'A complete shipping address is required.' });
    }

    const userId = req.user ? req.user.id : null;
    const userEmail = req.user ? req.user.email : shippingAddress.email;

    // Re-price from the database. Never trust totals sent by the browser.
    const pricing = await priceCartServerSide(client, items, couponCode, shippingAddress.pincode);

    // Confirm the customer actually paid the amount we calculated.
    const paidOrder = await razorpayInstance.orders.fetch(razorpayOrderId);
    if (Number(paidOrder.amount) !== pricing.total * 100) {
      await client.query('ROLLBACK');
      return res.status(400).json({
        success: false,
        message: 'Payment amount does not match the order total. No order was created.',
      });
    }

    // Derive the order number from the sequence so concurrent checkouts
    // cannot collide the way COUNT(*) + 1 did.
    const seqRes = await client.query("SELECT nextval(pg_get_serial_sequence('orders','id')) AS next_id");
    const orderId = Number(seqRes.rows[0].next_id);
    const orderNumber = `ORV-${new Date().getFullYear()}-${String(orderId).padStart(5, '0')}`;

    const orderRes = await client.query(
      `INSERT INTO orders (id, order_number, user_id, status, subtotal, shipping_fee, discount_amount, total, payment_method, payment_status, razorpay_order_id, razorpay_payment_id, shipping_address, delivery_slot)
       VALUES ($1, $2, $3, 'Processing', $4, $5, $6, $7, 'razorpay', 'Paid', $8, $9, $10, $11)
       RETURNING *`,
      [
        orderId,
        orderNumber,
        userId,
        pricing.subtotal,
        pricing.shippingFee,
        pricing.discountAmount,
        pricing.total,
        razorpayOrderId,
        razorpayPaymentId,
        JSON.stringify(shippingAddress),
        deliverySlot,
      ]
    );

    const createdOrder = orderRes.rows[0];
    const insertedItems = [];

    for (const item of pricing.lineItems) {
      const itemRes = await client.query(
        `INSERT INTO order_items (order_id, product_id, product_name, variant_name, price, quantity, image_url)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [createdOrder.id, item.productId, item.name, item.variantName, item.price, item.quantity, item.image]
      );
      insertedItems.push(itemRes.rows[0]);

      // Draw down inventory for the purchased quantity.
      await client.query('UPDATE products SET stock = GREATEST(stock - $1, 0) WHERE id = $2', [
        item.quantity,
        item.productId,
      ]);
    }

    if (pricing.appliedCoupon) {
      await client.query('UPDATE coupons SET usage_count = usage_count + 1 WHERE id = $1', [
        pricing.appliedCoupon.id,
      ]);
    }

    if (userId) {
      await client.query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    }

    await client.query('COMMIT');

    if (userEmail) {
      sendOrderConfirmationEmail(userEmail, createdOrder, insertedItems).catch((err) =>
        console.error('Order confirmation email failed:', err.message)
      );
    }

    // Manifest the Delhivery shipment in the background. A courier failure
    // never disturbs the paid order — it stays Pending with the error stored
    // for the admin panel's retry button.
    createShipmentForOrder(createdOrder.id).catch((err) =>
      console.error('Automatic shipment creation failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Order placed successfully and payment verified',
      order: { ...createdOrder, items: insertedItems },
    });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  } finally {
    client.release();
  }
};

export const getMyOrders = async (req, res, next) => {
  try {
    const ordersRes = await query(
      `SELECT o.*,
              (SELECT json_agg(json_build_object('id', oi.id, 'productId', oi.product_id, 'name', oi.product_name, 'variantName', oi.variant_name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image_url))
                 FROM order_items oi WHERE oi.order_id = o.id) AS items
         FROM orders o
        WHERE o.user_id = $1
        ORDER BY o.created_at DESC`,
      [req.user.id]
    );

    res.json({
      success: true,
      orders: ordersRes.rows.map((o) => ({ ...o, items: o.items || [] })),
    });
  } catch (error) {
    next(error);
  }
};

export const getOrderById = async (req, res, next) => {
  try {
    const { identifier } = req.params;
    const isNumeric = !isNaN(identifier);
    const whereClause = isNumeric ? 'o.id = $1' : 'o.order_number = $1';

    const orderRes = await query(
      `SELECT o.*,
              (SELECT json_agg(json_build_object('id', oi.id, 'productId', oi.product_id, 'name', oi.product_name, 'variantName', oi.variant_name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image_url))
                 FROM order_items oi WHERE oi.order_id = o.id) AS items
         FROM orders o
        WHERE ${whereClause}`,
      [identifier]
    );

    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    // Customers may only read their own orders; admins may read any.
    if (!req.user.is_admin && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have access to this order' });
    }

    res.json({ success: true, order: { ...order, items: order.items || [] } });
  } catch (error) {
    next(error);
  }
};

/**
 * Loads a full order for document rendering, enforcing that the caller either
 * owns it or is an administrator.
 */
const loadOrderForDocument = async (identifier, user) => {
  const isNumeric = !isNaN(identifier);
  const whereClause = isNumeric ? 'o.id = $1' : 'o.order_number = $1';

  const result = await query(
    `SELECT o.*,
            (SELECT json_agg(json_build_object(
                'id', oi.id, 'product_name', oi.product_name, 'variant_name', oi.variant_name,
                'price', oi.price, 'quantity', oi.quantity, 'image_url', oi.image_url, 'sku', oi.sku)
              ORDER BY oi.id)
               FROM order_items oi WHERE oi.order_id = o.id) AS items
       FROM orders o
      WHERE ${whereClause}`,
    [identifier]
  );

  if (result.rows.length === 0) {
    const error = new Error('Order not found');
    error.statusCode = 404;
    throw error;
  }

  const order = result.rows[0];
  if (!user.is_admin && order.user_id !== user.id) {
    const error = new Error('You do not have access to this order');
    error.statusCode = 403;
    throw error;
  }

  return { ...order, items: order.items || [] };
};

export const getOrderInvoice = async (req, res, next) => {
  try {
    const order = await loadOrderForDocument(req.params.identifier, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderInvoiceHtml(order));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getOrderLabel = async (req, res, next) => {
  try {
    const order = await loadOrderForDocument(req.params.identifier, req.user);
    res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.send(renderLabelHtml(order));
  } catch (error) {
    if (error.statusCode) {
      return res.status(error.statusCode).json({ success: false, message: error.message });
    }
    next(error);
  }
};

export const getAllOrdersAdmin = async (req, res, next) => {
  try {
    const ordersRes = await query(`
      SELECT o.*, u.name AS customer_name, u.email AS customer_email,
             (SELECT json_agg(json_build_object('id', oi.id, 'name', oi.product_name, 'price', oi.price, 'quantity', oi.quantity))
                FROM order_items oi WHERE oi.order_id = o.id) AS items
        FROM orders o
        LEFT JOIN users u ON o.user_id = u.id
       ORDER BY o.created_at DESC
    `);

    res.json({
      success: true,
      orders: ordersRes.rows.map((o) => ({ ...o, items: o.items || [] })),
    });
  } catch (error) {
    next(error);
  }
};

const ALLOWED_STATUSES = ['Processing', 'Packed', 'Shipped', 'Out for Delivery', 'Delivered', 'Cancelled'];

const extractEmail = (shippingAddress) => {
  if (!shippingAddress) return null;
  if (typeof shippingAddress === 'string') {
    try {
      return JSON.parse(shippingAddress).email || null;
    } catch {
      return null;
    }
  }
  return shippingAddress.email || null;
};

export const updateOrderStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const result = await query(
      'UPDATE orders SET status = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
      [status, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = result.rows[0];
    const email = extractEmail(order.shipping_address);
    if (email) {
      sendOrderStatusEmail(email, order.order_number, status).catch((err) =>
        console.error('Order status email failed:', err.message)
      );
    }

    res.json({ success: true, message: 'Order status updated', order });
  } catch (error) {
    next(error);
  }
};

export const updateOrderTracking = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { trackingNumber, courierName = 'India Post' } = req.body;

    const result = await query(
      'UPDATE orders SET tracking_number = $1, courier_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3 RETURNING *',
      [trackingNumber, courierName, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    res.json({ success: true, message: 'Tracking number updated successfully', order: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const cancelUserOrder = async (req, res, next) => {
  try {
    const { id } = req.params;

    const orderRes = await query(
      'SELECT * FROM orders WHERE id::text = $1 OR order_number = $1',
      [String(id)]
    );
    if (orderRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const order = orderRes.rows[0];

    if (!req.user.is_admin && order.user_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'You do not have access to this order' });
    }

    const currentStatus = (order.status || '').toLowerCase();
    if (['packed', 'shipped', 'out for delivery', 'delivered', 'cancelled'].includes(currentStatus)) {
      return res.status(400).json({
        success: false,
        message: `Order cannot be cancelled as it is already ${order.status}.`,
      });
    }

    const updateRes = await query(
      "UPDATE orders SET status = 'Cancelled', updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *",
      [order.id]
    );
    const updatedOrder = updateRes.rows[0];

    // Return the reserved stock to the catalogue.
    await query(
      `UPDATE products p SET stock = p.stock + oi.quantity
         FROM order_items oi
        WHERE oi.order_id = $1 AND oi.product_id = p.id`,
      [order.id]
    );

    const email = extractEmail(updatedOrder.shipping_address);
    if (email) {
      sendOrderStatusEmail(email, updatedOrder.order_number, 'Cancelled').catch((err) =>
        console.error('Cancellation email failed:', err.message)
      );
    }

    res.json({ success: true, message: 'Order cancelled successfully.', order: updatedOrder });
  } catch (error) {
    next(error);
  }
};
