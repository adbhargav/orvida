import { query } from '../config/db.js';

export const getCategories = async (req, res, next) => {
  try {
    const categoriesRes = await query(`
      SELECT c.*,
             (SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'image', sc.image, 'count', sc.count))
              FROM subcategories sc WHERE sc.category_id = c.id) as subcategories
      FROM categories c
      ORDER BY c.id ASC
    `);

    res.json({
      success: true,
      categories: categoriesRes.rows.map(cat => ({
        ...cat,
        subcategories: cat.subcategories || []
      }))
    });
  } catch (error) {
    next(error);
  }
};

export const getCategoryBySlug = async (req, res, next) => {
  try {
    const { slug } = req.params;
    const catRes = await query(`
      SELECT c.*,
             (SELECT json_agg(json_build_object('id', sc.id, 'name', sc.name, 'slug', sc.slug, 'image', sc.image, 'count', sc.count))
              FROM subcategories sc WHERE sc.category_id = c.id) as subcategories
      FROM categories c
      WHERE c.slug = $1
    `, [slug]);

    if (catRes.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const category = catRes.rows[0];
    res.json({
      success: true,
      category: {
        ...category,
        subcategories: category.subcategories || []
      }
    });
  } catch (error) {
    next(error);
  }
};

export const createCategory = async (req, res, next) => {
  try {
    const { name, slug, tagline, banner, description } = req.body;
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await query(
      `INSERT INTO categories (name, slug, tagline, banner, description)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, catSlug, tagline, banner, description]
    );

    res.status(201).json({ success: true, category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, tagline, banner, description } = req.body;
    const catSlug = slug || name.toLowerCase().replace(/[^a-z0-9]+/g, '-');

    const result = await query(
      `UPDATE categories
       SET name = $1, slug = $2, tagline = $3, banner = $4, description = $5
       WHERE id = $6
       RETURNING *`,
      [name, catSlug, tagline, banner, description, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    const inUse = await query('SELECT COUNT(*)::int AS count FROM products WHERE category_id = $1', [id]);
    if (inUse.rows[0].count > 0) {
      return res.status(409).json({
        success: false,
        message: `This category still has ${inUse.rows[0].count} product(s). Reassign or remove them first.`,
      });
    }

    const result = await query('DELETE FROM categories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    next(error);
  }
};
