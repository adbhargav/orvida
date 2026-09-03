import { query } from '../config/db.js';

/**
 * Shared SEO helpers.
 *
 * Everything URL-shaped funnels through here so the production domain lives
 * in exactly one place (SITE_URL), and so slug/redirect rules cannot drift
 * between the product and category controllers.
 */

export const SITE_URL = (process.env.SITE_URL || 'https://orivida.in').replace(/\/+$/, '');

/** Canonical URL for a path. Strips query strings and duplicate slashes. */
export const getCanonicalUrl = (path = '/') => {
  const clean = String(path).split('?')[0].split('#')[0].replace(/\/{2,}/g, '/');
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  return `${SITE_URL}${withSlash}`.replace(/\/$/, '') || SITE_URL;
};

export const slugify = (value) =>
  String(value || '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 190);

/**
 * A slug unique within its table. Appends -2, -3 … only when needed, so an
 * unchanged name never churns its URL.
 */
export const uniqueSlug = async (client, table, desired, excludeId = null) => {
  const base = slugify(desired) || 'item';
  let candidate = base;
  let n = 1;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const res = await client.query(
      `SELECT id FROM ${table} WHERE slug = $1 ${excludeId ? 'AND id <> $2' : ''} LIMIT 1`,
      excludeId ? [candidate, excludeId] : [candidate]
    );
    if (res.rows.length === 0) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
};

const ALLOWED_ROBOTS = new Set([
  'index, follow',
  'noindex, follow',
  'index, nofollow',
  'noindex, nofollow',
]);

/** Normalises admin input; anything unrecognised falls back to the default. */
export const normaliseRobots = (value) => {
  if (!value) return null;
  const clean = String(value).toLowerCase().replace(/\s*,\s*/g, ', ').trim();
  return ALLOWED_ROBOTS.has(clean) ? clean : null;
};

/**
 * Canonical URLs are admin-supplied, so they are validated rather than
 * trusted: only absolute http(s) URLs, and never localhost or a staging host.
 */
export const sanitiseCanonical = (value) => {
  if (!value) return null;
  try {
    const url = new URL(String(value).trim());
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    if (/localhost|127\.0\.0\.1|\.local$/i.test(url.hostname)) return null;
    return url.toString().replace(/\/$/, '');
  } catch {
    return null;
  }
};

/** Strips markup and control characters so a value can never execute. */
export const sanitiseText = (value, max = 500) => {
  if (value === undefined || value === null) return null;
  const clean = String(value)
    .replace(/<[^>]*>/g, '')
    // eslint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return clean ? clean.slice(0, max) : null;
};

/**
 * Records a 301 for a changed slug and repoints any redirect that pointed at
 * the old path, which is what prevents chains and loops from forming.
 */
export const recordSlugRedirect = async (client, { prefix, oldSlug, newSlug, entityType, entityId }) => {
  if (!oldSlug || !newSlug || oldSlug === newSlug) return;
  const source = `${prefix}/${oldSlug}`;
  const destination = `${prefix}/${newSlug}`;
  if (source === destination) return;

  // Old chains now point straight at the new location.
  await client.query(
    'UPDATE redirects SET destination = $1, updated_at = CURRENT_TIMESTAMP WHERE destination = $2',
    [destination, source]
  );
  // A redirect must never target itself.
  await client.query('DELETE FROM redirects WHERE source = $1', [destination]);

  await client.query(
    `INSERT INTO redirects (source, destination, status_code, entity_type, entity_id)
     VALUES ($1, $2, 301, $3, $4)
     ON CONFLICT (source) DO UPDATE
       SET destination = EXCLUDED.destination, updated_at = CURRENT_TIMESTAMP`,
    [source, destination, entityType, entityId]
  );
};

/** Collects the SEO columns from a request body, sanitised and nullable. */
export const collectSeoFields = (body = {}) => ({
  seoTitle: sanitiseText(body.seoTitle, 255),
  seoDescription: sanitiseText(body.seoDescription, 500),
  seoKeywords: sanitiseText(body.seoKeywords, 500),
  canonicalUrl: sanitiseCanonical(body.canonicalUrl),
  metaRobots: normaliseRobots(body.metaRobots),
  ogTitle: sanitiseText(body.ogTitle, 255),
  ogDescription: sanitiseText(body.ogDescription, 500),
  ogImage: sanitiseCanonical(body.ogImage),
  twitterTitle: sanitiseText(body.twitterTitle, 255),
  twitterDescription: sanitiseText(body.twitterDescription, 500),
  twitterImage: sanitiseCanonical(body.twitterImage),
  imageAltText: sanitiseText(body.imageAltText, 255),
});

/** Resolves a path through the redirect table, guarding against loops. */
export const resolveRedirect = async (path) => {
  let current = path;
  const seen = new Set([current]);
  let final = null;

  for (let hop = 0; hop < 5; hop += 1) {
    const res = await query('SELECT destination, status_code FROM redirects WHERE source = $1', [current]);
    if (res.rows.length === 0) break;
    const next = res.rows[0].destination;
    if (seen.has(next)) break; // loop — stop at the last safe hop
    seen.add(next);
    final = { destination: next, statusCode: res.rows[0].status_code || 301 };
    current = next;
  }

  if (final) {
    await query('UPDATE redirects SET hits = hits + 1 WHERE source = $1', [path]).catch(() => {});
  }
  return final;
};
