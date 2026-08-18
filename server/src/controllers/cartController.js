import { query } from '../config/db.js';

export const getCart = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const cartRes = await query(`
      SELECT c.id, c.quantity, c.created_at,
             p.id as product_id, p.name, p.slug, p.price, p.discount_price, p.sku, p.stock,
             (SELECT img.url FROM product_images img WHERE img.product_id = p.id ORDER BY img.display_order ASC LIMIT 1) as image,
             v.id as variant_id, v.type as variant_type, v.value as variant_value, v.price_delta
      FROM cart_items c
      JOIN products p ON c.product_id = p.id
      LEFT JOIN product_variants v ON c.variant_id = v.id
      WHERE c.user_id = $1
      ORDER BY c.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      cart: cartRes.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.discount_price ? Number(item.discount_price) : Number(item.price),
        originalPrice: Number(item.price),
        image: item.image,
        quantity: item.quantity,
        variant: item.variant_id ? { id: item.variant_id, type: item.variant_type, value: item.variant_value, priceDelta: Number(item.price_delta) } : null
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const addToCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId, variantId, quantity = 1 } = req.body;

    const existing = await query(
      'SELECT * FROM cart_items WHERE user_id = $1 AND product_id = $2 AND (variant_id = $3 OR (variant_id IS NULL AND $3 IS NULL))',
      [userId, productId, variantId || null]
    );

    if (existing.rows.length > 0) {
      const updated = await query(
        'UPDATE cart_items SET quantity = quantity + $1 WHERE id = $2 RETURNING *',
        [quantity, existing.rows[0].id]
      );
      return res.json({ success: true, message: 'Cart item quantity updated', item: updated.rows[0] });
    }

    const newItem = await query(
      'INSERT INTO cart_items (user_id, product_id, variant_id, quantity) VALUES ($1, $2, $3, $4) RETURNING *',
      [userId, productId, variantId || null, quantity]
    );

    res.status(201).json({ success: true, message: 'Added to cart', item: newItem.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateCartQuantity = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { quantity } = req.body;

    if (quantity <= 0) {
      await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
      return res.json({ success: true, message: 'Item removed from cart' });
    }

    const result = await query(
      'UPDATE cart_items SET quantity = $1 WHERE id = $2 AND user_id = $3 RETURNING *',
      [quantity, id, userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Cart item not found' });
    }

    res.json({ success: true, message: 'Quantity updated', item: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const removeFromCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    await query('DELETE FROM cart_items WHERE id = $1 AND user_id = $2', [id, userId]);
    res.json({ success: true, message: 'Item removed from cart' });
  } catch (error) {
    next(error);
  }
};

export const clearCart = async (req, res, next) => {
  try {
    const userId = req.user.id;
    await query('DELETE FROM cart_items WHERE user_id = $1', [userId]);
    res.json({ success: true, message: 'Cart cleared successfully' });
  } catch (error) {
    next(error);
  }
};
