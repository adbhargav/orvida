import { query } from '../config/db.js';

export const validateCoupon = async (req, res, next) => {
  try {
    const { code, cartSubtotal = 0 } = req.body;

    if (!code) {
      return res.status(400).json({ success: false, message: 'Coupon code is required' });
    }

    const result = await query(
      `SELECT * FROM coupons
        WHERE UPPER(code) = UPPER($1)
          AND is_active = TRUE
          AND (valid_until IS NULL OR valid_until >= CURRENT_DATE)`,
      [code.trim()]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invalid or expired coupon code' });
    }

    const coupon = result.rows[0];

    if (coupon.min_spend && cartSubtotal < Number(coupon.min_spend)) {
      return res.status(400).json({
        success: false,
        message: `Minimum order amount of ₹${coupon.min_spend} required for code ${coupon.code}`
      });
    }

    let discountAmount = 0;
    if (coupon.discount_type === 'percentage') {
      discountAmount = (cartSubtotal * Number(coupon.discount_value)) / 100;
      if (coupon.max_discount && discountAmount > Number(coupon.max_discount)) {
        discountAmount = Number(coupon.max_discount);
      }
    } else {
      discountAmount = Number(coupon.discount_value);
    }

    res.json({
      success: true,
      message: 'Coupon applied successfully',
      coupon: {
        code: coupon.code,
        discountType: coupon.discount_type,
        discountValue: Number(coupon.discount_value),
        discountAmount: Math.round(discountAmount)
      }
    });
  } catch (error) {
    next(error);
  }
};

export const getCouponsAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM coupons ORDER BY created_at DESC');
    res.json({ success: true, coupons: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createCoupon = async (req, res, next) => {
  try {
    const { code, discountType, discountValue, minSpend, maxDiscount, validUntil } = req.body;

    const result = await query(
      `INSERT INTO coupons (code, discount_type, discount_value, min_spend, max_discount, valid_until)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [code.toUpperCase(), discountType || 'percentage', discountValue, minSpend || 0, maxDiscount || null, validUntil || null]
    );

    res.status(201).json({ success: true, coupon: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteCoupon = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM coupons WHERE id = $1', [id]);
    res.json({ success: true, message: 'Coupon deleted' });
  } catch (error) {
    next(error);
  }
};
