import { query, pool } from '../config/db.js';

/**
 * Recent approved reviews across the catalogue, for the homepage.
 *
 * Returns whatever genuinely exists — an empty array when there are no
 * reviews yet, so the storefront can hide the section rather than fill it
 * with invented testimonials.
 */
export const getRecentReviews = async (req, res, next) => {
  try {
    const limit = Math.min(parseInt(req.query.limit, 10) || 3, 12);

    const result = await query(
      `SELECT r.id, r.user_name, r.rating, r.title, r.comment, r.verified_purchase, r.created_at,
              p.name AS product_name, p.slug AS product_slug
         FROM reviews r
         JOIN products p ON p.id = r.product_id
        WHERE r.is_approved IS NOT FALSE
          AND r.comment IS NOT NULL
          AND length(trim(r.comment)) > 0
        ORDER BY r.created_at DESC
        LIMIT $1`,
      [limit]
    );

    res.json({ success: true, reviews: result.rows });
  } catch (error) {
    next(error);
  }
};

export const getProductReviews = async (req, res, next) => {
  try {
    const { productId } = req.params;

    const result = await query(
      'SELECT * FROM reviews WHERE product_id = $1 ORDER BY created_at DESC',
      [productId]
    );

    res.json({ success: true, reviews: result.rows });
  } catch (error) {
    next(error);
  }
};

export const addReview = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { productId, rating, title, comment } = req.body;
    const userId = req.user ? req.user.id : null;
    const userName = req.user ? req.user.name : req.body.userName || 'Verified Buyer';

    const reviewRes = await client.query(
      `INSERT INTO reviews (product_id, user_id, user_name, rating, title, comment)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [productId, userId, userName, rating, title, comment]
    );

    // Update product rating statistics
    const statsRes = await client.query(
      'SELECT AVG(rating) as avg_rating, COUNT(*) as review_count FROM reviews WHERE product_id = $1',
      [productId]
    );

    const avgRating = parseFloat(statsRes.rows[0].avg_rating).toFixed(1);
    const reviewCount = parseInt(statsRes.rows[0].review_count, 10);

    await client.query(
      'UPDATE products SET avg_rating = $1, review_count = $2 WHERE id = $3',
      [avgRating, reviewCount, productId]
    );

    await client.query('COMMIT');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully',
      review: reviewRes.rows[0],
      stats: { avgRating, reviewCount }
    });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
};
