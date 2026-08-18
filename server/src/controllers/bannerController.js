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

export const updateBanner = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, subtitle, image, link, buttonText, displayOrder } = req.body;

    const result = await query(
      `UPDATE banners
       SET title = $1, subtitle = $2, image = $3, link = $4, button_text = $5, display_order = $6
       WHERE id = $7
       RETURNING *`,
      [title, subtitle, image, link, buttonText || 'DISCOVER COLLECTION', displayOrder || 1, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Banner not found' });
    }

    res.json({ success: true, banner: result.rows[0] });
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
