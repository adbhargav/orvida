import { query } from '../config/db.js';

export const getWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const wishlistRes = await query(`
      SELECT w.id, w.created_at,
             p.id as product_id, p.name, p.slug, p.price, p.discount_price, p.stock, p.avg_rating,
             (SELECT img.url FROM product_images img WHERE img.product_id = p.id ORDER BY img.display_order ASC LIMIT 1) as image
      FROM wishlist_items w
      JOIN products p ON w.product_id = p.id
      WHERE w.user_id = $1
      ORDER BY w.created_at DESC
    `, [userId]);

    res.json({
      success: true,
      wishlist: wishlistRes.rows.map(item => ({
        id: item.id,
        productId: item.product_id,
        name: item.name,
        slug: item.slug,
        price: item.discount_price ? Number(item.discount_price) : Number(item.price),
        originalPrice: Number(item.price),
        image: item.image,
        stock: item.stock,
        rating: item.avg_rating
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { productId } = req.body;

    const existing = await query('SELECT * FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);

    if (existing.rows.length > 0) {
      await query('DELETE FROM wishlist_items WHERE user_id = $1 AND product_id = $2', [userId, productId]);
      return res.json({ success: true, isWishlisted: false, message: 'Removed from wishlist' });
    }

    await query('INSERT INTO wishlist_items (user_id, product_id) VALUES ($1, $2)', [userId, productId]);
    res.status(201).json({ success: true, isWishlisted: true, message: 'Added to wishlist' });
  } catch (error) {
    next(error);
  }
};
