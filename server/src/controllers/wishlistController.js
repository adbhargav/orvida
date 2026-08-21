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

/**
 * POST /api/wishlist/merge — folds a guest's saved ids into their account.
 *
 * Called once at sign-in, so a wishlist built before logging in is not lost
 * the moment the visitor identifies themselves. Inserting is additive and
 * conflict-tolerant: signing in on a second device merges the two lists
 * rather than one replacing the other.
 */
export const mergeWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productIds = (Array.isArray(req.body.productIds) ? req.body.productIds : [])
      .map(Number)
      .filter(Number.isInteger)
      .slice(0, 200);

    if (productIds.length > 0) {
      await query(
        `INSERT INTO wishlist_items (user_id, product_id)
         SELECT $1, id FROM products WHERE id = ANY($2::int[])
         ON CONFLICT (user_id, product_id) DO NOTHING`,
        [userId, productIds]
      );
    }

    // Most recently saved first, so the wishlist page can keep that order.
    const merged = await query(
      'SELECT product_id FROM wishlist_items WHERE user_id = $1 ORDER BY created_at DESC, id DESC',
      [userId]
    );
    res.json({ success: true, productIds: merged.rows.map((r) => r.product_id) });
  } catch (error) {
    next(error);
  }
};

export const toggleWishlist = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const productId = Number(req.body.productId);
    if (!Number.isInteger(productId)) {
      return res.status(400).json({ success: false, message: 'A valid productId is required.' });
    }

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
