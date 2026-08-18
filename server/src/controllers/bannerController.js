import { query } from '../config/db.js';

export const getBanners = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM banners WHERE is_active = TRUE ORDER BY display_order ASC');
    res.json({ success: true, banners: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createBanner = async (req, res, next) => {
  try {
    const { title, subtitle, image, link, buttonText, displayOrder } = req.body;

    const result = await query(
      `INSERT INTO banners (title, subtitle, image, link, button_text, display_order)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [title, subtitle, image, link, buttonText || 'DISCOVER COLLECTION', displayOrder || 1]
    );

    res.status(201).json({ success: true, banner: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    await query('DELETE FROM banners WHERE id = $1', [id]);
    res.json({ success: true, message: 'Banner deleted successfully' });
  } catch (error) {
    next(error);
  }
};
