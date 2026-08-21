import { query, pool } from '../config/db.js';
import {
  uniqueSlug,
  recordSlugRedirect,
  sanitiseText,
  sanitiseCanonical,
  slugify,
} from '../services/seoService.js';

/**
 * SEO landing pages.
 *
 * A page is publicly live when it is published, or scheduled and its time has
 * passed. That comparison is done in SQL rather than by a background job, so
 * a scheduled page appears on time even though this stack has no scheduler.
 * `promoteDuePages` then tidies the stored status, which keeps the admin list
 * honest without ever being load-bearing.
 */
export const LIVE_CONDITION = `(
  status = 'published'
  OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW())
)`;

export const promoteDuePages = async () => {
  await query(
    `UPDATE seo_pages
        SET status = 'published',
            published_at = COALESCE(published_at, scheduled_at),
            updated_at = CURRENT_TIMESTAMP
      WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()`
  ).catch(() => {});
};

const STATUSES = new Set(['draft', 'published', 'scheduled']);
const CHANGEFREQS = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);
const SCHEMA_TYPES = new Set(['WebPage', 'Article', 'FAQPage', 'CollectionPage', 'LocalBusiness']);

/** Longer-form fields keep their line breaks; markup is still stripped. */
const sanitiseRich = (value, max = 20000) => {
  if (value === undefined || value === null) return null;
  const clean = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return clean ? clean.slice(0, max) : null;
};

/** Internal links and breadcrumbs must stay on this site. */
const sanitisePath = (value) => {
  const clean = sanitiseText(value, 400);
  if (!clean) return null;
  if (clean.startsWith('/') && !clean.startsWith('//')) return clean;
  return sanitiseCanonical(clean);
};

const sanitiseLinkList = (value, labelKey) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      [labelKey]: sanitiseText(item?.[labelKey] ?? item?.label ?? item?.text, 160),
      url: sanitisePath(item?.url),
    }))
    .filter((item) => item[labelKey] && item.url)
    .slice(0, 50);
};

const sanitiseFaqs = (value) => {
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => ({
      question: sanitiseText(item?.question, 300),
      answer: sanitiseRich(item?.answer, 2000),
    }))
    .filter((item) => item.question && item.answer)
    .slice(0, 30);
};

const sanitiseCta = (value) => {
  if (!value || typeof value !== 'object') return {};
  const cta = {
    heading: sanitiseText(value.heading, 200),
    text: sanitiseRich(value.text, 600),
    buttonText: sanitiseText(value.buttonText, 80),
    buttonUrl: sanitisePath(value.buttonUrl),
  };
  return Object.values(cta).some(Boolean) ? cta : {};
};

/** Everything the client may set, normalised and safe to store. */
const collectPageFields = (body) => {
  const status = STATUSES.has(body.status) ? body.status : 'draft';
  const scheduledAt = status === 'scheduled' && body.scheduledAt ? new Date(body.scheduledAt) : null;

  return {
    name: sanitiseText(body.name, 255),
    status,
    template: sanitiseText(body.template, 60),
    h1: sanitiseText(body.h1, 255),
    intro: sanitiseRich(body.intro, 2000),
    content: sanitiseRich(body.content, 40000),
    faqs: JSON.stringify(sanitiseFaqs(body.faqs)),
    cta: JSON.stringify(sanitiseCta(body.cta)),
    internalLinks: JSON.stringify(sanitiseLinkList(body.internalLinks, 'text')),
    breadcrumbs: JSON.stringify(sanitiseLinkList(body.breadcrumbs, 'label')),
    seoTitle: sanitiseText(body.seoTitle, 255),
    metaDescription: sanitiseText(body.metaDescription, 500),
    focusKeyword: sanitiseText(body.focusKeyword, 255),
    secondaryKeywords: sanitiseText(body.secondaryKeywords, 500),
    seoKeywords: sanitiseText(body.seoKeywords, 500),
    canonicalUrl: sanitiseCanonical(body.canonicalUrl),
    featuredImage: sanitiseCanonical(body.featuredImage),
    imageAltText: sanitiseText(body.imageAltText, 255),
    ogTitle: sanitiseText(body.ogTitle, 255),
    ogDescription: sanitiseText(body.ogDescription, 500),
    ogImage: sanitiseCanonical(body.ogImage),
    twitterTitle: sanitiseText(body.twitterTitle, 255),
    twitterDescription: sanitiseText(body.twitterDescription, 500),
    twitterImage: sanitiseCanonical(body.twitterImage),
    robotsIndex: body.robotsIndex !== false,
    robotsFollow: body.robotsFollow !== false,
    includeInSitemap: body.includeInSitemap !== false,
    sitemapPriority: Math.min(1, Math.max(0, Number(body.sitemapPriority) || 0.7)),
    sitemapChangefreq: CHANGEFREQS.has(body.sitemapChangefreq) ? body.sitemapChangefreq : 'monthly',
    schemaType: SCHEMA_TYPES.has(body.schemaType) ? body.schemaType : 'WebPage',
    scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.valueOf()) ? scheduledAt.toISOString() : null,
  };
};

const COLUMNS = `id, name, slug, status, template, h1, intro, content, faqs, cta,
  internal_links, breadcrumbs, seo_title, meta_description, focus_keyword,
  secondary_keywords, seo_keywords, canonical_url, featured_image, image_alt_text,
  og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
  robots_index, robots_follow, include_in_sitemap, sitemap_priority, sitemap_changefreq,
  schema_type, published_at, scheduled_at, created_by, updated_by, created_at, updated_at`;

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

/** GET /api/seo/admin/pages — paginated, searchable, sortable list. */
export const listSeoPages = async (req, res, next) => {
  try {
    await promoteDuePages();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const filters = [];
    const params = [];

    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      filters.push(`(name ILIKE $${params.length} OR slug ILIKE $${params.length} OR seo_title ILIKE $${params.length})`);
    }
    if (STATUSES.has(req.query.status)) {
      params.push(req.query.status);
      filters.push(`status = $${params.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const SORTS = {
      updated: 'updated_at DESC',
      created: 'created_at DESC',
      name: 'name ASC',
      slug: 'slug ASC',
    };
    const orderBy = SORTS[req.query.sort] || SORTS.updated;

    const [rows, total] = await Promise.all([
      query(`SELECT ${COLUMNS} FROM seo_pages ${where} ORDER BY ${orderBy} LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]),
      query(`SELECT COUNT(*)::int n FROM seo_pages ${where}`, params),
    ]);

    res.json({
      success: true,
      pages: rows.rows,
      pagination: { page, limit, total: total.rows[0].n, pages: Math.ceil(total.rows[0].n / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/seo/admin/pages/stats — dashboard counters. */
export const getSeoPageStats = async (req, res, next) => {
  try {
    await promoteDuePages();
    const stats = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE seo_title IS NULL OR seo_title = '')::int AS missing_title,
        COUNT(*) FILTER (WHERE meta_description IS NULL OR meta_description = '')::int AS missing_description,
        COUNT(*) FILTER (WHERE focus_keyword IS NULL OR focus_keyword = '')::int AS missing_keyword,
        COUNT(*) FILTER (WHERE h1 IS NULL OR h1 = '')::int AS missing_h1,
        COUNT(*) FILTER (WHERE robots_index = FALSE)::int AS noindex,
        COUNT(*) FILTER (WHERE status = 'published' AND (
          seo_title IS NULL OR seo_title = '' OR meta_description IS NULL OR meta_description = ''
        ))::int AS published_without_seo
      FROM seo_pages`);

    const recent = await query(
      `SELECT id, name, slug, status, seo_title, meta_description, focus_keyword, h1,
              content, featured_image, image_alt_text, canonical_url, internal_links,
              include_in_sitemap, robots_index, updated_at
         FROM seo_pages ORDER BY updated_at DESC LIMIT 8`
    );

    res.json({ success: true, stats: stats.rows[0], recent: recent.rows });
  } catch (error) {
    next(error);
  }
};

/** GET /api/seo/admin/pages/:id */
export const getSeoPageAdmin = async (req, res, next) => {
  try {
    const result = await query(`SELECT ${COLUMNS} FROM seo_pages WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, page: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

const INSERT_COLS = `name, slug, status, template, h1, intro, content, faqs, cta,
  internal_links, breadcrumbs, seo_title, meta_description, focus_keyword,
  secondary_keywords, seo_keywords, canonical_url, featured_image, image_alt_text,
  og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
  robots_index, robots_follow, include_in_sitemap, sitemap_priority, sitemap_changefreq,
  schema_type, published_at, scheduled_at, created_by, updated_by`;

const valuesFor = (f, slug, userId) => [
  f.name, slug, f.status, f.template, f.h1, f.intro, f.content, f.faqs, f.cta,
  f.internalLinks, f.breadcrumbs, f.seoTitle, f.metaDescription, f.focusKeyword,
  f.secondaryKeywords, f.seoKeywords, f.canonicalUrl, f.featuredImage, f.imageAltText,
  f.ogTitle, f.ogDescription, f.ogImage, f.twitterTitle, f.twitterDescription, f.twitterImage,
  f.robotsIndex, f.robotsFollow, f.includeInSitemap, f.sitemapPriority, f.sitemapChangefreq,
  f.schemaType, f.status === 'published' ? new Date().toISOString() : null, f.scheduledAt,
  userId, userId,
];

/** POST /api/seo/admin/pages */
export const createSeoPage = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const fields = collectPageFields(req.body);
    if (!fields.name) {
      return res.status(400).json({ success: false, message: 'A page name is required.' });
    }

    const slug = await uniqueSlug(client, 'seo_pages', req.body.slug || fields.name);
    const placeholders = valuesFor(fields, slug, req.user.id).map((_, i) => `$${i + 1}`).join(', ');

    const result = await client.query(
      `INSERT INTO seo_pages (${INSERT_COLS}) VALUES (${placeholders}) RETURNING ${COLUMNS}`,
      valuesFor(fields, slug, req.user.id)
    );
    res.status(201).json({ success: true, page: result.rows[0] });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/** PUT /api/seo/admin/pages/:id */
export const updateSeoPage = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const existing = await client.query('SELECT slug, status, published_at FROM seo_pages WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    const previous = existing.rows[0];

    const fields = collectPageFields(req.body);
    if (!fields.name) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'A page name is required.' });
    }

    const nextSlug = req.body.slug
      ? await uniqueSlug(client, 'seo_pages', req.body.slug, Number(id))
      : previous.slug;

    // Keep the first publication date; only set it when the page first goes live.
    const publishedAt =
      fields.status === 'published'
        ? previous.published_at || new Date().toISOString()
        : previous.published_at;

    const result = await client.query(
      `UPDATE seo_pages SET
         name = $1, slug = $2, status = $3, template = $4, h1 = $5, intro = $6, content = $7,
         faqs = $8, cta = $9, internal_links = $10, breadcrumbs = $11, seo_title = $12,
         meta_description = $13, focus_keyword = $14, secondary_keywords = $15, seo_keywords = $16,
         canonical_url = $17, featured_image = $18, image_alt_text = $19, og_title = $20,
         og_description = $21, og_image = $22, twitter_title = $23, twitter_description = $24,
         twitter_image = $25, robots_index = $26, robots_follow = $27, include_in_sitemap = $28,
         sitemap_priority = $29, sitemap_changefreq = $30, schema_type = $31, published_at = $32,
         scheduled_at = $33, updated_by = $34, updated_at = CURRENT_TIMESTAMP
       WHERE id = $35 RETURNING ${COLUMNS}`,
      [
        fields.name, nextSlug, fields.status, fields.template, fields.h1, fields.intro, fields.content,
        fields.faqs, fields.cta, fields.internalLinks, fields.breadcrumbs, fields.seoTitle,
        fields.metaDescription, fields.focusKeyword, fields.secondaryKeywords, fields.seoKeywords,
        fields.canonicalUrl, fields.featuredImage, fields.imageAltText, fields.ogTitle,
        fields.ogDescription, fields.ogImage, fields.twitterTitle, fields.twitterDescription,
        fields.twitterImage, fields.robotsIndex, fields.robotsFollow, fields.includeInSitemap,
        fields.sitemapPriority, fields.sitemapChangefreq, fields.schemaType, publishedAt,
        fields.scheduledAt, req.user.id, id,
      ]
    );

    // Renaming a live URL must not orphan inbound links.
    if (previous.status === 'published') {
      await recordSlugRedirect(client, {
        prefix: '',
        oldSlug: previous.slug,
        newSlug: nextSlug,
        entityType: 'seo_page',
        entityId: Number(id),
      });
    }

    await client.query('COMMIT');
    res.json({ success: true, page: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/** POST /api/seo/admin/pages/:id/duplicate — always lands as a draft. */
export const duplicateSeoPage = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const source = await client.query(`SELECT ${COLUMNS} FROM seo_pages WHERE id = $1`, [req.params.id]);
    if (source.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    const p = source.rows[0];
    const slug = await uniqueSlug(client, 'seo_pages', `${p.slug}-copy`);

    const result = await client.query(
      `INSERT INTO seo_pages (${INSERT_COLS}) VALUES (${Array.from({ length: 35 }, (_, i) => `$${i + 1}`).join(', ')})
       RETURNING ${COLUMNS}`,
      [
        `${p.name} (copy)`, slug, 'draft', p.template, p.h1, p.intro, p.content,
        JSON.stringify(p.faqs || []), JSON.stringify(p.cta || {}),
        JSON.stringify(p.internal_links || []), JSON.stringify(p.breadcrumbs || []),
        p.seo_title, p.meta_description, p.focus_keyword, p.secondary_keywords, p.seo_keywords,
        null, p.featured_image, p.image_alt_text, p.og_title, p.og_description, p.og_image,
        p.twitter_title, p.twitter_description, p.twitter_image, p.robots_index, p.robots_follow,
        p.include_in_sitemap, p.sitemap_priority, p.sitemap_changefreq, p.schema_type,
        null, null, req.user.id, req.user.id,
      ]
    );
    res.status(201).json({ success: true, page: result.rows[0] });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/** DELETE /api/seo/admin/pages/:id */
export const deleteSeoPage = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM seo_pages WHERE id = $1 RETURNING id, slug', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    // A deleted page must stop being advertised anywhere.
    await query('DELETE FROM redirects WHERE destination = $1', [`/${result.rows[0].slug}`]).catch(() => {});
    res.json({ success: true, message: 'Page deleted.' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/seo/admin/pages/bulk — { action, ids } */
export const bulkSeoPages = async (req, res, next) => {
  try {
    const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).map(Number).filter(Number.isInteger);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one page.' });
    }

    const { action } = req.body;
    let result;
    if (action === 'publish') {
      result = await query(
        `UPDATE seo_pages
            SET status = 'published',
                published_at = COALESCE(published_at, NOW()),
                updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) RETURNING id`,
        [ids, req.user.id]
      );
    } else if (action === 'unpublish') {
      result = await query(
        `UPDATE seo_pages SET status = 'draft', updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) RETURNING id`,
        [ids, req.user.id]
      );
    } else if (action === 'delete') {
      result = await query('DELETE FROM seo_pages WHERE id = ANY($1) RETURNING id', [ids]);
    } else {
      return res.status(400).json({ success: false, message: 'Unknown bulk action.' });
    }

    res.json({ success: true, affected: result.rowCount, message: `${result.rowCount} page(s) updated.` });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ *
 * Public
 * ------------------------------------------------------------------ */

/**
 * GET /api/seo/pages/:slug
 * Only live pages are reachable, so a draft or a not-yet-due scheduled page
 * can never be seen or indexed.
 */
export const getPublicSeoPage = async (req, res, next) => {
  try {
    const slug = slugify(req.params.slug);
    const result = await query(
      `SELECT ${COLUMNS} FROM seo_pages WHERE slug = $1 AND ${LIVE_CONDITION}`,
      [slug]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Page not found' });
    }
    res.json({ success: true, page: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/** GET /api/seo/pages — live pages, for internal linking pickers. */
export const listPublicSeoPages = async (req, res, next) => {
  try {
    const result = await query(
      `SELECT name, slug FROM seo_pages WHERE ${LIVE_CONDITION} ORDER BY name LIMIT 200`
    );
    res.json({ success: true, pages: result.rows });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ *
 * Templates
 * ------------------------------------------------------------------ */

export const listTemplates = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM seo_page_templates ORDER BY is_builtin DESC, name');
    res.json({ success: true, templates: result.rows });
  } catch (error) {
    next(error);
  }
};

export const saveTemplate = async (req, res, next) => {
  try {
    const name = sanitiseText(req.body.name, 120);
    if (!name) return res.status(400).json({ success: false, message: 'A template name is required.' });

    const defaults = collectPageFields({ ...req.body.defaults, name });
    const result = await query(
      `INSERT INTO seo_page_templates (name, description, defaults)
       VALUES ($1, $2, $3) RETURNING *`,
      [name, sanitiseText(req.body.description, 300), JSON.stringify(defaults)]
    );
    res.status(201).json({ success: true, template: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteTemplate = async (req, res, next) => {
  try {
    const result = await query(
      'DELETE FROM seo_page_templates WHERE id = $1 AND is_builtin = FALSE RETURNING id',
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Template not found, or it is built in.' });
    }
    res.json({ success: true, message: 'Template removed.' });
  } catch (error) {
    next(error);
  }
};
