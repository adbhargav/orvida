import { query } from '../config/db.js';
import { collectSeoFields, recordSlugRedirect, slugify as seoSlugify } from '../services/seoService.js';

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

    const seo = collectSeoFields(req.body);
    const result = await query(
      `INSERT INTO categories (name, slug, tagline, banner, description,
                               seo_title, seo_description, seo_keywords, canonical_url, meta_robots,
                               og_title, og_description, og_image, image_alt_text)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
       RETURNING *`,
      [name, catSlug, tagline, banner, description,
       seo.seoTitle, seo.seoDescription, seo.seoKeywords, seo.canonicalUrl, seo.metaRobots,
       seo.ogTitle, seo.ogDescription, seo.ogImage, seo.imageAltText]
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

    const existing = await query('SELECT slug FROM categories WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    const previousSlug = existing.rows[0].slug;
    const catSlug = seoSlugify(slug || name) || previousSlug;
    const seo = collectSeoFields(req.body);

    const result = await query(
      `UPDATE categories
       SET name = $1, slug = $2, tagline = $3, banner = $4, description = $5,
           seo_title = $6, seo_description = $7, seo_keywords = $8, canonical_url = $9,
           meta_robots = $10, og_title = $11, og_description = $12, og_image = $13,
           image_alt_text = $14, updated_at = CURRENT_TIMESTAMP
       WHERE id = $15
       RETURNING *`,
      [name, catSlug, tagline, banner, description,
       seo.seoTitle, seo.seoDescription, seo.seoKeywords, seo.canonicalUrl, seo.metaRobots,
       seo.ogTitle, seo.ogDescription, seo.ogImage, seo.imageAltText, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    // Category URLs are linked from the navigation and indexed, so a renamed
    // slug leaves a 301 behind.
    await recordSlugRedirect({ query: (text, params) => query(text, params) }, {
      prefix: '/category',
      oldSlug: previousSlug,
      newSlug: catSlug,
      entityType: 'category',
      entityId: Number(id),
    });

    res.json({ success: true, category: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const slugify = (value) =>
  String(value || '').toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

export const createSubcategory = async (req, res, next) => {
  try {
    const { categoryId } = req.params;
    const { name, slug, image } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Subcategory name is required.' });
    }

    const parent = await query('SELECT id FROM categories WHERE id = $1', [categoryId]);
    if (parent.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const result = await query(
      `INSERT INTO subcategories (category_id, name, slug, image)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [categoryId, name.trim(), slugify(slug || name), image || null]
    );

    res.status(201).json({ success: true, subcategory: result.rows[0] });
  } catch (error) {
    // UNIQUE(category_id, slug)
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A subcategory with this slug already exists in the category.' });
    }
    next(error);
  }
};

export const updateSubcategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, slug, image } = req.body;
    if (!name?.trim()) {
      return res.status(400).json({ success: false, message: 'Subcategory name is required.' });
    }

    const result = await query(
      `UPDATE subcategories SET name = $1, slug = $2, image = $3 WHERE id = $4 RETURNING *`,
      [name.trim(), slugify(slug || name), image || null, id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    res.json({ success: true, subcategory: result.rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      return res.status(409).json({ success: false, message: 'A subcategory with this slug already exists in the category.' });
    }
    next(error);
  }
};

export const deleteSubcategory = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Products are detached, not deleted — they stay in the parent category.
    const detached = await query(
      'UPDATE products SET subcategory_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE subcategory_id = $1 RETURNING id',
      [id]
    );

    const result = await query('DELETE FROM subcategories WHERE id = $1 RETURNING id', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Subcategory not found' });
    }

    res.json({
      success: true,
      message: detached.rowCount > 0
        ? `Subcategory deleted. ${detached.rowCount} product(s) remain in the parent category.`
        : 'Subcategory deleted successfully',
    });
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
