import { query, pool } from '../config/db.js';
import {
  SITE_URL,
  slugify,
  uniqueSlug,
  recordSlugRedirect,
  sanitiseText,
  sanitiseCanonical,
  normaliseRobots,
  resolveRedirect,
} from '../services/seoService.js';

const esc = (value) =>
  String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');

const urlEntry = ({ loc, lastmod, changefreq, priority }) =>
  [
    '  <url>',
    `    <loc>${esc(loc)}</loc>`,
    lastmod ? `    <lastmod>${new Date(lastmod).toISOString().slice(0, 10)}</lastmod>` : '',
    changefreq ? `    <changefreq>${changefreq}</changefreq>` : '',
    priority ? `    <priority>${priority}</priority>` : '',
    '  </url>',
  ]
    .filter(Boolean)
    .join('\n');

// Anything a page marks noindex must never be advertised in the sitemap.
const INDEXABLE = "(meta_robots IS NULL OR meta_robots NOT LIKE 'noindex%')";

const STATIC_ROUTES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/about', changefreq: 'monthly', priority: '0.6' },
  { path: '/gifting-concierge', changefreq: 'monthly', priority: '0.7' },
  { path: '/policies/privacy-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/policies/terms-and-conditions', changefreq: 'yearly', priority: '0.3' },
  { path: '/policies/shipping-policy', changefreq: 'yearly', priority: '0.3' },
  { path: '/policies/refund-policy', changefreq: 'yearly', priority: '0.3' },
];

/**
 * GET /sitemap.xml — built from the live catalogue so new products are
 * discoverable without anyone maintaining a file. Rows are streamed in
 * batches rather than loaded whole, and noindex entities are excluded.
 */
export const getSitemap = async (req, res, next) => {
  try {
    const entries = STATIC_ROUTES.map((r) =>
      urlEntry({ loc: `${SITE_URL}${r.path}`, changefreq: r.changefreq, priority: r.priority })
    );

    const categories = await query(
      `SELECT c.slug, c.updated_at,
              (SELECT json_agg(json_build_object('slug', sc.slug, 'robots', sc.meta_robots))
                 FROM subcategories sc WHERE sc.category_id = c.id) AS subs
         FROM categories c
        WHERE ${INDEXABLE}
        ORDER BY c.id`
    );

    for (const cat of categories.rows) {
      entries.push(
        urlEntry({ loc: `${SITE_URL}/category/${cat.slug}`, lastmod: cat.updated_at, changefreq: 'weekly', priority: '0.9' })
      );
      for (const sub of cat.subs || []) {
        if (sub.robots && sub.robots.startsWith('noindex')) continue;
        entries.push(
          urlEntry({ loc: `${SITE_URL}/category/${cat.slug}/${sub.slug}`, changefreq: 'weekly', priority: '0.8' })
        );
      }
    }

    // Batched so a large catalogue never sits in memory all at once.
    const BATCH = 1000;
    for (let offset = 0; ; offset += BATCH) {
      const batch = await query(
        `SELECT slug, updated_at FROM products
          WHERE ${INDEXABLE}
          ORDER BY id LIMIT $1 OFFSET $2`,
        [BATCH, offset]
      );
      if (batch.rows.length === 0) break;
      for (const product of batch.rows) {
        entries.push(
          urlEntry({ loc: `${SITE_URL}/product/${product.slug}`, lastmod: product.updated_at, changefreq: 'weekly', priority: '0.8' })
        );
      }
      if (batch.rows.length < BATCH) break;
    }

    res.set('Content-Type', 'application/xml; charset=utf-8');
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(
      `<?xml version="1.0" encoding="UTF-8"?>\n` +
        `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${entries.join('\n')}\n</urlset>\n`
    );
  } catch (error) {
    next(error);
  }
};

/** GET /robots.txt */
export const getRobots = (req, res) => {
  res.set('Content-Type', 'text/plain; charset=utf-8');
  res.set('Cache-Control', 'public, max-age=86400');
  res.send(
    [
      'User-agent: *',
      'Allow: /',
      'Allow: /product/',
      'Allow: /category/',
      'Disallow: /admin',
      'Disallow: /checkout',
      'Disallow: /cart',
      'Disallow: /account',
      'Disallow: /wishlist',
      'Disallow: /orders',
      'Disallow: /login',
      'Disallow: /signup',
      'Disallow: /forgot-password',
      'Disallow: /reset-password',
      'Disallow: /api/',
      // Sort and search permutations are duplicates of the clean collection URL.
      'Disallow: /*?search=',
      'Disallow: /*?sort=',
      '',
      `Sitemap: ${SITE_URL}/sitemap.xml`,
      '',
    ].join('\n')
  );
};

/**
 * GET /api/seo/redirect?path=/product/old-slug
 * The storefront asks this before rendering a 404, so a renamed product keeps
 * its inbound links working.
 */
export const getRedirect = async (req, res, next) => {
  try {
    const path = String(req.query.path || '').split('?')[0];
    if (!path.startsWith('/')) {
      return res.status(400).json({ success: false, message: 'A path is required.' });
    }
    const hit = await resolveRedirect(path);
    res.json({ success: true, redirect: hit });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ *
 * Admin: audit, bulk tools and redirect management
 * ------------------------------------------------------------------ */

/** GET /api/seo/admin/audit — the numbers behind the admin SEO dashboard. */
export const getSeoAudit = async (req, res, next) => {
  try {
    const [products, categories, redirects, settings] = await Promise.all([
      query(`SELECT
               COUNT(*)::int                                                          AS total,
               COUNT(*) FILTER (WHERE seo_title IS NULL OR seo_title = '')::int       AS missing_title,
               COUNT(*) FILTER (WHERE seo_description IS NULL OR seo_description = '')::int AS missing_description,
               COUNT(*) FILTER (WHERE image_alt_text IS NULL OR image_alt_text = '')::int  AS missing_alt,
               COUNT(*) FILTER (WHERE slug IS NULL OR slug = '')::int                 AS missing_slug,
               COUNT(*) FILTER (WHERE meta_robots LIKE 'noindex%')::int               AS noindex,
               COUNT(*) FILTER (WHERE NOT EXISTS (
                 SELECT 1 FROM product_images pi WHERE pi.product_id = products.id))::int AS missing_image
             FROM products`),
      query(`SELECT
               COUNT(*)::int AS total,
               COUNT(*) FILTER (WHERE seo_title IS NULL OR seo_title = '')::int AS missing_title,
               COUNT(*) FILTER (WHERE seo_description IS NULL OR seo_description = '')::int AS missing_description,
               COUNT(*) FILTER (WHERE meta_robots LIKE 'noindex%')::int AS noindex
             FROM categories`),
      query('SELECT COUNT(*)::int AS total, COALESCE(SUM(hits), 0)::int AS hits FROM redirects'),
      query("SELECT content FROM site_content WHERE key = 'seo_settings'"),
    ]);

    const p = products.rows[0];
    const c = categories.rows[0];
    const global = settings.rows[0]?.content || {};

    // Weighted so that catalogue coverage dominates the score, since that is
    // what actually moves search performance.
    const ratio = (missing, total) => (total === 0 ? 1 : 1 - missing / total);
    const checks = [
      { key: 'productTitles', label: 'Product SEO titles', weight: 3, score: ratio(p.missing_title, p.total), detail: `${p.total - p.missing_title}/${p.total}` },
      { key: 'productDescriptions', label: 'Product meta descriptions', weight: 3, score: ratio(p.missing_description, p.total), detail: `${p.total - p.missing_description}/${p.total}` },
      { key: 'imageAlt', label: 'Product image alt text', weight: 2, score: ratio(p.missing_alt, p.total), detail: `${p.total - p.missing_alt}/${p.total}` },
      { key: 'productImages', label: 'Products with imagery', weight: 2, score: ratio(p.missing_image, p.total), detail: `${p.total - p.missing_image}/${p.total}` },
      { key: 'categoryTitles', label: 'Category SEO titles', weight: 1, score: ratio(c.missing_title, c.total), detail: `${c.total - c.missing_title}/${c.total}` },
      { key: 'categoryDescriptions', label: 'Category descriptions', weight: 1, score: ratio(c.missing_description, c.total), detail: `${c.total - c.missing_description}/${c.total}` },
      { key: 'homepageMeta', label: 'Homepage title & description', weight: 2, score: global.metaTitle && global.metaDescription ? 1 : 0, detail: global.metaTitle ? 'configured' : 'not configured' },
      { key: 'organisation', label: 'Organisation details', weight: 1, score: global.organizationName ? 1 : 0, detail: global.organizationName ? 'configured' : 'not configured' },
      { key: 'searchConsole', label: 'Search Console verification', weight: 1, score: global.googleSiteVerification ? 1 : 0, detail: global.googleSiteVerification ? 'verified' : 'not set' },
    ];

    const totalWeight = checks.reduce((sum, ch) => sum + ch.weight, 0);
    const earned = checks.reduce((sum, ch) => sum + ch.weight * ch.score, 0);

    res.json({
      success: true,
      healthScore: Math.round((earned / totalWeight) * 100),
      checks: checks.map((ch) => ({ ...ch, score: Math.round(ch.score * 100) })),
      products: p,
      categories: c,
      redirects: redirects.rows[0],
      sitemapUrl: `${SITE_URL}/sitemap.xml`,
      robotsUrl: `${SITE_URL}/robots.txt`,
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/seo/admin/products?missing=title|description|alt|slug
 * Lists the catalogue rows an admin still needs to work through.
 */
export const getSeoProducts = async (req, res, next) => {
  try {
    const { missing, limit = 100 } = req.query;
    const filters = {
      title: "(seo_title IS NULL OR seo_title = '')",
      description: "(seo_description IS NULL OR seo_description = '')",
      alt: "(image_alt_text IS NULL OR image_alt_text = '')",
      slug: "(slug IS NULL OR slug = '')",
    };
    const where = filters[missing] ? `WHERE ${filters[missing]}` : '';

    const result = await query(
      `SELECT id, name, slug, seo_title, seo_description, image_alt_text, meta_robots
         FROM products ${where}
        ORDER BY id LIMIT $1`,
      [Math.min(Number(limit) || 100, 500)]
    );
    res.json({ success: true, count: result.rows.length, products: result.rows });
  } catch (error) {
    next(error);
  }
};

/**
 * POST /api/seo/admin/bulk
 * body: { action: 'alt' | 'slug' | 'title' | 'description', productIds?: [] }
 *
 * Fills only empty fields — a value an admin wrote by hand is never
 * overwritten by a bulk run.
 */
export const bulkSeoUpdate = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const { action, productIds } = req.body;
    const scope = Array.isArray(productIds) && productIds.length > 0 ? productIds : null;
    const scopeSql = scope ? 'AND id = ANY($1)' : '';
    const params = scope ? [scope] : [];

    await client.query('BEGIN');
    let updated = 0;

    if (action === 'alt') {
      const r = await client.query(
        `UPDATE products SET image_alt_text = name, updated_at = CURRENT_TIMESTAMP
          WHERE (image_alt_text IS NULL OR image_alt_text = '') ${scopeSql} RETURNING id`,
        params
      );
      updated = r.rowCount;
    } else if (action === 'title') {
      const r = await client.query(
        `UPDATE products SET seo_title = name, updated_at = CURRENT_TIMESTAMP
          WHERE (seo_title IS NULL OR seo_title = '') ${scopeSql} RETURNING id`,
        params
      );
      updated = r.rowCount;
    } else if (action === 'description') {
      const r = await client.query(
        // NULLIF on both columns, so a product with no real copy is skipped
        // rather than stored with an empty description. Those stay visible in
        // the audit as work for a human.
        `UPDATE products
            SET seo_description = LEFT(COALESCE(NULLIF(short_description, ''), NULLIF(description, '')), 158),
                updated_at = CURRENT_TIMESTAMP
          WHERE (seo_description IS NULL OR seo_description = '')
            AND COALESCE(NULLIF(short_description, ''), NULLIF(description, '')) IS NOT NULL ${scopeSql}
          RETURNING id`,
        params
      );
      updated = r.rowCount;
    } else if (action === 'slug') {
      const rows = await client.query(
        `SELECT id, name FROM products WHERE (slug IS NULL OR slug = '') ${scopeSql}`,
        params
      );
      for (const row of rows.rows) {
        const next = await uniqueSlug(client, 'products', row.name, row.id);
        await client.query('UPDATE products SET slug = $1 WHERE id = $2', [next, row.id]);
        updated += 1;
      }
    } else {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'Unknown bulk action.' });
    }

    await client.query('COMMIT');
    res.json({ success: true, updated, message: `${updated} product(s) updated.` });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/** GET /api/seo/admin/redirects */
export const listRedirects = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM redirects ORDER BY updated_at DESC LIMIT 500');
    res.json({ success: true, redirects: result.rows });
  } catch (error) {
    next(error);
  }
};

/** POST /api/seo/admin/redirects */
export const createRedirect = async (req, res, next) => {
  try {
    const source = sanitiseText(req.body.source, 500);
    const destination = sanitiseText(req.body.destination, 500);
    const statusCode = [301, 302].includes(Number(req.body.statusCode)) ? Number(req.body.statusCode) : 301;

    if (!source?.startsWith('/') || !destination?.startsWith('/')) {
      return res.status(400).json({ success: false, message: 'Both paths must start with "/" and stay on this site.' });
    }
    if (source === destination) {
      return res.status(400).json({ success: false, message: 'A redirect cannot point at itself.' });
    }
    // Following the proposed destination must not lead back to the source.
    const onward = await resolveRedirect(destination);
    if (onward?.destination === source) {
      return res.status(400).json({ success: false, message: 'That would create a redirect loop.' });
    }

    const result = await query(
      `INSERT INTO redirects (source, destination, status_code, entity_type)
       VALUES ($1, $2, $3, 'manual')
       ON CONFLICT (source) DO UPDATE
         SET destination = EXCLUDED.destination, status_code = EXCLUDED.status_code,
             updated_at = CURRENT_TIMESTAMP
       RETURNING *`,
      [source, destination, statusCode]
    );
    res.status(201).json({ success: true, redirect: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/** DELETE /api/seo/admin/redirects/:id */
export const deleteRedirect = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM redirects WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Redirect not found' });
    }
    res.json({ success: true, message: 'Redirect removed.' });
  } catch (error) {
    next(error);
  }
};
