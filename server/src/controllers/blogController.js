import { query, pool } from '../config/db.js';
import {
  uniqueSlug,
  recordSlugRedirect,
  sanitiseText,
  sanitiseCanonical,
  slugify,
} from '../services/seoService.js';

/**
 * Blog posts.
 *
 * Same publishing model as SEO landing pages — a post is live when published,
 * or scheduled with its time passed — so scheduling works without a job
 * runner. Slugs, redirects and sanitisation come from the shared SEO service
 * rather than being reimplemented here.
 */
export const LIVE_CONDITION = `(
  status = 'published'
  OR (status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW())
)`;

export const promoteDuePosts = async () => {
  await query(
    `UPDATE blog_posts
        SET status = 'published',
            published_at = COALESCE(published_at, scheduled_at),
            updated_at = CURRENT_TIMESTAMP
      WHERE status = 'scheduled' AND scheduled_at IS NOT NULL AND scheduled_at <= NOW()`
  ).catch(() => {});
};

const STATUSES = new Set(['draft', 'published', 'scheduled']);
const CHANGEFREQS = new Set(['always', 'hourly', 'daily', 'weekly', 'monthly', 'yearly', 'never']);

/** Long-form fields keep their paragraphs; markup and control chars are stripped. */
const sanitiseRich = (value, max = 60000) => {
  if (value === undefined || value === null) return null;
  const clean = String(value)
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, '')
    .replace(/<\s*(script|style|iframe|object|embed)[^>]*>[\s\S]*?<\s*\/\s*\1\s*>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim();
  return clean ? clean.slice(0, max) : null;
};

/** Roughly 200 words a minute, which is the usual reading estimate. */
const readingMinutes = (content) => {
  const words = String(content || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
};

const sanitiseTags = (value) => {
  const list = Array.isArray(value)
    ? value
    : String(value || '').split(',');
  return [...new Set(list.map((t) => sanitiseText(t, 40)).filter(Boolean))].slice(0, 12);
};

const collectPostFields = (body) => {
  const status = STATUSES.has(body.status) ? body.status : 'draft';
  const scheduledAt = status === 'scheduled' && body.scheduledAt ? new Date(body.scheduledAt) : null;
  const content = sanitiseRich(body.content);

  return {
    title: sanitiseText(body.title, 255),
    status,
    excerpt: sanitiseRich(body.excerpt, 600),
    content,
    featuredImage: sanitiseCanonical(body.featuredImage),
    imageAltText: sanitiseText(body.imageAltText, 255),
    authorName: sanitiseText(body.authorName, 160),
    category: sanitiseText(body.category, 120),
    tags: sanitiseTags(body.tags),
    readingMinutes: readingMinutes(content),
    isFeatured: body.isFeatured === true,
    seoTitle: sanitiseText(body.seoTitle, 255),
    metaDescription: sanitiseText(body.metaDescription, 500),
    focusKeyword: sanitiseText(body.focusKeyword, 255),
    seoKeywords: sanitiseText(body.seoKeywords, 500),
    canonicalUrl: sanitiseCanonical(body.canonicalUrl),
    ogTitle: sanitiseText(body.ogTitle, 255),
    ogDescription: sanitiseText(body.ogDescription, 500),
    ogImage: sanitiseCanonical(body.ogImage),
    twitterTitle: sanitiseText(body.twitterTitle, 255),
    twitterDescription: sanitiseText(body.twitterDescription, 500),
    twitterImage: sanitiseCanonical(body.twitterImage),
    robotsIndex: body.robotsIndex !== false,
    robotsFollow: body.robotsFollow !== false,
    includeInSitemap: body.includeInSitemap !== false,
    sitemapPriority: Math.min(1, Math.max(0, Number(body.sitemapPriority) || 0.6)),
    sitemapChangefreq: CHANGEFREQS.has(body.sitemapChangefreq) ? body.sitemapChangefreq : 'monthly',
    scheduledAt: scheduledAt && !Number.isNaN(scheduledAt.valueOf()) ? scheduledAt.toISOString() : null,
  };
};

const COLUMNS = `id, title, slug, status, excerpt, content, featured_image, image_alt_text,
  author_name, category, tags, reading_minutes, is_featured,
  seo_title, meta_description, focus_keyword, seo_keywords, canonical_url,
  og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
  robots_index, robots_follow, include_in_sitemap, sitemap_priority, sitemap_changefreq,
  published_at, scheduled_at, created_by, updated_by, created_at, updated_at`;

const INSERT_COLS = `title, slug, status, excerpt, content, featured_image, image_alt_text,
  author_name, category, tags, reading_minutes, is_featured,
  seo_title, meta_description, focus_keyword, seo_keywords, canonical_url,
  og_title, og_description, og_image, twitter_title, twitter_description, twitter_image,
  robots_index, robots_follow, include_in_sitemap, sitemap_priority, sitemap_changefreq,
  published_at, scheduled_at, created_by, updated_by`;

const insertValues = (f, slug, userId) => [
  f.title, slug, f.status, f.excerpt, f.content, f.featuredImage, f.imageAltText,
  f.authorName, f.category, f.tags, f.readingMinutes, f.isFeatured,
  f.seoTitle, f.metaDescription, f.focusKeyword, f.seoKeywords, f.canonicalUrl,
  f.ogTitle, f.ogDescription, f.ogImage, f.twitterTitle, f.twitterDescription, f.twitterImage,
  f.robotsIndex, f.robotsFollow, f.includeInSitemap, f.sitemapPriority, f.sitemapChangefreq,
  f.status === 'published' ? new Date().toISOString() : null, f.scheduledAt, userId, userId,
];

/* ------------------------------------------------------------------ *
 * Public
 * ------------------------------------------------------------------ */

/** GET /api/blog — the published index, paginated and filterable. */
export const listPublicPosts = async (req, res, next) => {
  try {
    await promoteDuePosts();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || 12));
    const offset = (page - 1) * limit;

    const filters = [LIVE_CONDITION, 'robots_index = TRUE'];
    const params = [];

    if (req.query.tag) {
      params.push(req.query.tag);
      filters.push(`$${params.length} = ANY(tags)`);
    }
    if (req.query.category) {
      params.push(req.query.category);
      filters.push(`category = $${params.length}`);
    }
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      filters.push(`(title ILIKE $${params.length} OR excerpt ILIKE $${params.length})`);
    }
    const where = `WHERE ${filters.join(' AND ')}`;

    const [rows, total, facets] = await Promise.all([
      // The list never ships full article bodies — only what a card renders.
      query(
        `SELECT id, title, slug, excerpt, featured_image, image_alt_text, author_name,
                category, tags, reading_minutes, is_featured, published_at
           FROM blog_posts ${where}
          ORDER BY is_featured DESC, published_at DESC NULLS LAST
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int n FROM blog_posts ${where}`, params),
      query(
        `SELECT DISTINCT category FROM blog_posts
          WHERE ${LIVE_CONDITION} AND robots_index = TRUE AND category IS NOT NULL AND category <> ''
          ORDER BY category`
      ),
    ]);

    res.json({
      success: true,
      posts: rows.rows,
      categories: facets.rows.map((r) => r.category),
      pagination: { page, limit, total: total.rows[0].n, pages: Math.ceil(total.rows[0].n / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/blog/:slug — one live post plus a few related reads. */
export const getPublicPost = async (req, res, next) => {
  try {
    await promoteDuePosts();
    const slug = slugify(req.params.slug);

    const result = await query(`SELECT ${COLUMNS} FROM blog_posts WHERE slug = $1 AND ${LIVE_CONDITION}`, [slug]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const post = result.rows[0];

    // Same category first, then anything else recent — never the post itself.
    const related = await query(
      `SELECT title, slug, excerpt, featured_image, image_alt_text, reading_minutes, published_at
         FROM blog_posts
        WHERE ${LIVE_CONDITION} AND robots_index = TRUE AND id <> $1
        ORDER BY (category IS NOT DISTINCT FROM $2) DESC, published_at DESC NULLS LAST
        LIMIT 3`,
      [post.id, post.category]
    );

    res.json({ success: true, post, related: related.rows });
  } catch (error) {
    next(error);
  }
};

/* ------------------------------------------------------------------ *
 * Admin
 * ------------------------------------------------------------------ */

/** GET /api/blog/admin/posts */
export const listPosts = async (req, res, next) => {
  try {
    await promoteDuePosts();

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const filters = [];
    const params = [];
    if (req.query.search) {
      params.push(`%${req.query.search}%`);
      filters.push(`(title ILIKE $${params.length} OR slug ILIKE $${params.length})`);
    }
    if (STATUSES.has(req.query.status)) {
      params.push(req.query.status);
      filters.push(`status = $${params.length}`);
    }
    if (req.query.category) {
      params.push(req.query.category);
      filters.push(`category = $${params.length}`);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const SORTS = {
      updated: 'updated_at DESC',
      published: 'published_at DESC NULLS LAST',
      title: 'title ASC',
    };
    const orderBy = SORTS[req.query.sort] || SORTS.updated;

    const [rows, total] = await Promise.all([
      query(
        `SELECT ${COLUMNS} FROM blog_posts ${where} ORDER BY ${orderBy}
          LIMIT $${params.length + 1} OFFSET $${params.length + 2}`,
        [...params, limit, offset]
      ),
      query(`SELECT COUNT(*)::int n FROM blog_posts ${where}`, params),
    ]);

    res.json({
      success: true,
      posts: rows.rows,
      pagination: { page, limit, total: total.rows[0].n, pages: Math.ceil(total.rows[0].n / limit) },
    });
  } catch (error) {
    next(error);
  }
};

/** GET /api/blog/admin/stats */
export const getBlogStats = async (req, res, next) => {
  try {
    await promoteDuePosts();
    const stats = await query(`
      SELECT
        COUNT(*)::int AS total,
        COUNT(*) FILTER (WHERE status = 'published')::int AS published,
        COUNT(*) FILTER (WHERE status = 'draft')::int AS draft,
        COUNT(*) FILTER (WHERE status = 'scheduled')::int AS scheduled,
        COUNT(*) FILTER (WHERE seo_title IS NULL OR seo_title = '')::int AS missing_title,
        COUNT(*) FILTER (WHERE meta_description IS NULL OR meta_description = '')::int AS missing_description,
        COUNT(*) FILTER (WHERE featured_image IS NULL OR featured_image = '')::int AS missing_image
      FROM blog_posts`);
    const categories = await query(
      `SELECT category, COUNT(*)::int n FROM blog_posts
        WHERE category IS NOT NULL AND category <> '' GROUP BY category ORDER BY n DESC`
    );
    res.json({ success: true, stats: stats.rows[0], categories: categories.rows });
  } catch (error) {
    next(error);
  }
};

/** GET /api/blog/admin/posts/:id */
export const getPostAdmin = async (req, res, next) => {
  try {
    const result = await query(`SELECT ${COLUMNS} FROM blog_posts WHERE id = $1`, [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

/** POST /api/blog/admin/posts */
export const createPost = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const fields = collectPostFields(req.body);
    if (!fields.title) {
      return res.status(400).json({ success: false, message: 'A post title is required.' });
    }

    const slug = await uniqueSlug(client, 'blog_posts', req.body.slug || fields.title);
    // The signed-in admin is the default byline.
    if (!fields.authorName) fields.authorName = req.user.name || null;

    const values = insertValues(fields, slug, req.user.id);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const result = await client.query(
      `INSERT INTO blog_posts (${INSERT_COLS}) VALUES (${placeholders}) RETURNING ${COLUMNS}`,
      values
    );
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/** PUT /api/blog/admin/posts/:id */
export const updatePost = async (req, res, next) => {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const { id } = req.params;

    const existing = await client.query('SELECT slug, status, published_at FROM blog_posts WHERE id = $1', [id]);
    if (existing.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const previous = existing.rows[0];

    const fields = collectPostFields(req.body);
    if (!fields.title) {
      await client.query('ROLLBACK');
      return res.status(400).json({ success: false, message: 'A post title is required.' });
    }

    const nextSlug = req.body.slug
      ? await uniqueSlug(client, 'blog_posts', req.body.slug, Number(id))
      : previous.slug;

    const publishedAt =
      fields.status === 'published'
        ? previous.published_at || new Date().toISOString()
        : previous.published_at;

    const result = await client.query(
      `UPDATE blog_posts SET
         title = $1, slug = $2, status = $3, excerpt = $4, content = $5, featured_image = $6,
         image_alt_text = $7, author_name = $8, category = $9, tags = $10, reading_minutes = $11,
         is_featured = $12, seo_title = $13, meta_description = $14, focus_keyword = $15,
         seo_keywords = $16, canonical_url = $17, og_title = $18, og_description = $19, og_image = $20,
         twitter_title = $21, twitter_description = $22, twitter_image = $23, robots_index = $24,
         robots_follow = $25, include_in_sitemap = $26, sitemap_priority = $27,
         sitemap_changefreq = $28, published_at = $29, scheduled_at = $30,
         updated_by = $31, updated_at = CURRENT_TIMESTAMP
       WHERE id = $32 RETURNING ${COLUMNS}`,
      [
        fields.title, nextSlug, fields.status, fields.excerpt, fields.content, fields.featuredImage,
        fields.imageAltText, fields.authorName, fields.category, fields.tags, fields.readingMinutes,
        fields.isFeatured, fields.seoTitle, fields.metaDescription, fields.focusKeyword,
        fields.seoKeywords, fields.canonicalUrl, fields.ogTitle, fields.ogDescription, fields.ogImage,
        fields.twitterTitle, fields.twitterDescription, fields.twitterImage, fields.robotsIndex,
        fields.robotsFollow, fields.includeInSitemap, fields.sitemapPriority,
        fields.sitemapChangefreq, publishedAt, fields.scheduledAt, req.user.id, id,
      ]
    );

    // Renaming a live post must not orphan links people already shared.
    if (previous.status === 'published') {
      await recordSlugRedirect(client, {
        prefix: '/blog',
        oldSlug: previous.slug,
        newSlug: nextSlug,
        entityType: 'blog_post',
        entityId: Number(id),
      });
    }

    await client.query('COMMIT');
    res.json({ success: true, post: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

/** POST /api/blog/admin/posts/:id/duplicate — always a draft. */
export const duplicatePost = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const source = await client.query(`SELECT ${COLUMNS} FROM blog_posts WHERE id = $1`, [req.params.id]);
    if (source.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    const p = source.rows[0];
    const slug = await uniqueSlug(client, 'blog_posts', `${p.slug}-copy`);

    const values = [
      `${p.title} (copy)`, slug, 'draft', p.excerpt, p.content, p.featured_image, p.image_alt_text,
      p.author_name, p.category, p.tags || [], p.reading_minutes, false,
      p.seo_title, p.meta_description, p.focus_keyword, p.seo_keywords, null,
      p.og_title, p.og_description, p.og_image, p.twitter_title, p.twitter_description, p.twitter_image,
      p.robots_index, p.robots_follow, p.include_in_sitemap, p.sitemap_priority, p.sitemap_changefreq,
      null, null, req.user.id, req.user.id,
    ];
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    const result = await client.query(
      `INSERT INTO blog_posts (${INSERT_COLS}) VALUES (${placeholders}) RETURNING ${COLUMNS}`,
      values
    );
    res.status(201).json({ success: true, post: result.rows[0] });
  } catch (error) {
    next(error);
  } finally {
    client.release();
  }
};

/** DELETE /api/blog/admin/posts/:id */
export const deletePost = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM blog_posts WHERE id = $1 RETURNING id, slug', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Post not found' });
    }
    await query('DELETE FROM redirects WHERE destination = $1', [`/blog/${result.rows[0].slug}`]).catch(() => {});
    res.json({ success: true, message: 'Post deleted.' });
  } catch (error) {
    next(error);
  }
};

/** POST /api/blog/admin/posts/bulk */
export const bulkPosts = async (req, res, next) => {
  try {
    const ids = (Array.isArray(req.body.ids) ? req.body.ids : []).map(Number).filter(Number.isInteger);
    if (ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Select at least one post.' });
    }

    const { action } = req.body;
    let result;
    if (action === 'publish') {
      result = await query(
        `UPDATE blog_posts SET status = 'published', published_at = COALESCE(published_at, NOW()),
                updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) RETURNING id`,
        [ids, req.user.id]
      );
    } else if (action === 'unpublish') {
      result = await query(
        `UPDATE blog_posts SET status = 'draft', updated_by = $2, updated_at = CURRENT_TIMESTAMP
          WHERE id = ANY($1) RETURNING id`,
        [ids, req.user.id]
      );
    } else if (action === 'delete') {
      result = await query('DELETE FROM blog_posts WHERE id = ANY($1) RETURNING id', [ids]);
    } else {
      return res.status(400).json({ success: false, message: 'Unknown bulk action.' });
    }

    res.json({ success: true, affected: result.rowCount, message: `${result.rowCount} post(s) updated.` });
  } catch (error) {
    next(error);
  }
};
