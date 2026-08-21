import dotenv from 'dotenv';
import { query, pool } from '../config/db.js';
import { SITE_URL } from '../services/seoService.js';

dotenv.config();

/**
 * SEO audit — run with `npm run seo:audit` from server/.
 *
 * Checks the invariants that are expensive to notice by eye: that no
 * canonical points at localhost, that noindex pages stay out of the sitemap,
 * that slugs are unique, and that redirects neither loop nor chain. Exits
 * non-zero when something is actually broken, so it can gate a deploy.
 */

const results = [];
const record = (ok, label, detail = '') => {
  results.push({ ok, label, detail });
  const mark = ok === true ? '✓' : ok === 'warn' ? '⚠' : '✗';
  console.log(`  ${mark} ${label}${detail ? ` — ${detail}` : ''}`);
};

const API = process.env.AUDIT_API_URL || 'http://localhost:5001';

const run = async () => {
  console.log('\nORVIDA SEO audit');
  console.log(`  site: ${SITE_URL}\n`);

  /* --- Catalogue integrity --- */
  const dupSlugs = await query(
    'SELECT slug, COUNT(*)::int n FROM products GROUP BY slug HAVING COUNT(*) > 1'
  );
  record(dupSlugs.rowCount === 0, 'Product slugs are unique',
    dupSlugs.rowCount ? `${dupSlugs.rowCount} duplicated` : `${(await query('SELECT COUNT(*)::int n FROM products')).rows[0].n} products`);

  const emptySlugs = await query("SELECT COUNT(*)::int n FROM products WHERE slug IS NULL OR slug = ''");
  record(emptySlugs.rows[0].n === 0, 'Every product has a slug',
    emptySlugs.rows[0].n ? `${emptySlugs.rows[0].n} missing` : '');

  const dupCatSlugs = await query(
    'SELECT slug, COUNT(*)::int n FROM categories GROUP BY slug HAVING COUNT(*) > 1'
  );
  record(dupCatSlugs.rowCount === 0, 'Category slugs are unique');

  const badCanonical = await query(
    "SELECT COUNT(*)::int n FROM products WHERE canonical_url ILIKE '%localhost%' OR canonical_url ILIKE '%127.0.0.1%'"
  );
  record(badCanonical.rows[0].n === 0, 'No canonical points at localhost');

  const emptyStrings = await query(
    "SELECT COUNT(*)::int n FROM products WHERE seo_title = '' OR seo_description = '' OR image_alt_text = ''"
  );
  record(emptyStrings.rows[0].n === 0, 'No empty-string SEO values (NULL means fall back)',
    emptyStrings.rows[0].n ? `${emptyStrings.rows[0].n} rows store '' instead of NULL` : '');

  // Consolidated duplicates must point at a page that exists and is itself
  // canonical, or the group leads nowhere.
  const danglingCanonical = await query(
    `SELECT COUNT(*)::int n FROM products p
      WHERE p.canonical_url IS NOT NULL
        AND p.canonical_url <> $1 || '/product/' || p.slug
        AND NOT EXISTS (SELECT 1 FROM products t WHERE $1 || '/product/' || t.slug = p.canonical_url)`,
    [SITE_URL]
  );
  record(danglingCanonical.rows[0].n === 0, 'Canonical overrides point at a real product',
    danglingCanonical.rows[0].n ? `${danglingCanonical.rows[0].n} dangling` : '');

  const canonicalChains = await query(
    `SELECT COUNT(*)::int n FROM products p
       JOIN products t ON $1 || '/product/' || t.slug = p.canonical_url
      WHERE p.canonical_url IS NOT NULL
        AND t.canonical_url IS NOT NULL
        AND t.canonical_url <> $1 || '/product/' || t.slug`,
    [SITE_URL]
  );
  record(canonicalChains.rows[0].n === 0, 'No canonical chains (target is itself canonical)',
    canonicalChains.rows[0].n ? `${canonicalChains.rows[0].n} chained` : '');

  const consolidated = await query(
    `SELECT COUNT(*)::int n FROM products WHERE canonical_url IS NOT NULL
       AND canonical_url <> $1 || '/product/' || slug`,
    [SITE_URL]
  );
  record(true, 'Duplicate listings consolidated', `${consolidated.rows[0].n} URL(s) canonicalised`);

  /* --- Redirects --- */
  const selfRefs = await query('SELECT COUNT(*)::int n FROM redirects WHERE source = destination');
  record(selfRefs.rows[0].n === 0, 'No redirect points at itself');

  const chains = await query(
    'SELECT COUNT(*)::int n FROM redirects a JOIN redirects b ON a.destination = b.source'
  );
  record(chains.rows[0].n === 0, 'No redirect chains',
    chains.rows[0].n ? `${chains.rows[0].n} chained` : '');

  const loops = await query(
    'SELECT COUNT(*)::int n FROM redirects a JOIN redirects b ON a.destination = b.source AND b.destination = a.source'
  );
  record(loops.rows[0].n === 0, 'No redirect loops');

  const liveTargets = await query(
    `SELECT COUNT(*)::int n FROM redirects r
      WHERE r.entity_type = 'product'
        AND NOT EXISTS (SELECT 1 FROM products p WHERE '/product/' || p.slug = r.destination)`
  );
  record(liveTargets.rows[0].n === 0, 'Product redirects point at live URLs',
    liveTargets.rows[0].n ? `${liveTargets.rows[0].n} dangling` : '');

  /* --- Blog --- */
  const dupBlogSlugs = await query(
    'SELECT slug, COUNT(*)::int n FROM blog_posts GROUP BY slug HAVING COUNT(*) > 1'
  );
  record(dupBlogSlugs.rowCount === 0, 'Blog slugs are unique',
    `${(await query('SELECT COUNT(*)::int n FROM blog_posts')).rows[0].n} posts`);

  const blogEmptyStrings = await query(
    "SELECT COUNT(*)::int n FROM blog_posts WHERE seo_title = '' OR meta_description = '' OR image_alt_text = ''"
  );
  record(blogEmptyStrings.rows[0].n === 0, 'No empty-string SEO values on posts (NULL means fall back)',
    blogEmptyStrings.rows[0].n ? `${blogEmptyStrings.rows[0].n} rows store '' instead of NULL` : '');

  // A scheduled post with no date would never go live and never be noticed.
  const orphanSchedules = await query(
    "SELECT COUNT(*)::int n FROM blog_posts WHERE status = 'scheduled' AND scheduled_at IS NULL"
  );
  record(orphanSchedules.rows[0].n === 0, 'Every scheduled post has a date',
    orphanSchedules.rows[0].n ? `${orphanSchedules.rows[0].n} would never publish` : '');

  const blogCanonical = await query(
    "SELECT COUNT(*)::int n FROM blog_posts WHERE canonical_url ILIKE '%localhost%' OR canonical_url ILIKE '%127.0.0.1%'"
  );
  record(blogCanonical.rows[0].n === 0, 'No post canonical points at localhost');

  /* --- Crawler endpoints --- */
  try {
    const sitemapRes = await fetch(`${API}/sitemap.xml`);
    const sitemap = await sitemapRes.text();
    const urls = (sitemap.match(/<loc>/g) || []).length;
    record(sitemapRes.ok && urls > 0, 'Sitemap responds with URLs', `${urls} URLs`);
    record(!sitemap.includes('localhost'), 'Sitemap contains no localhost URLs');

    const noindexProducts = await query(
      "SELECT slug FROM products WHERE meta_robots LIKE 'noindex%'"
    );
    const leaked = noindexProducts.rows.filter((p) => sitemap.includes(`/product/${p.slug}<`));
    record(leaked.length === 0, 'Noindex products excluded from sitemap',
      `${noindexProducts.rowCount} noindex product(s)`);

    const consolidatedSlugs = await query(
      `SELECT slug FROM products WHERE canonical_url IS NOT NULL
         AND canonical_url <> $1 || '/product/' || slug LIMIT 50`,
      [SITE_URL]
    );
    const leakedDupes = consolidatedSlugs.rows.filter((p) => sitemap.includes(`/product/${p.slug}<`));
    record(leakedDupes.length === 0, 'Canonicalised duplicates excluded from sitemap',
      leakedDupes.length ? `${leakedDupes.length} still listed` : '');

    const draftPosts = await query("SELECT slug FROM blog_posts WHERE status = 'draft'");
    const leakedPosts = draftPosts.rows.filter((p) => sitemap.includes(`/blog/${p.slug}<`));
    record(leakedPosts.length === 0, 'Draft posts excluded from sitemap',
      `${draftPosts.rowCount} draft(s)`);

    const robotsRes = await fetch(`${API}/robots.txt`);
    const robots = await robotsRes.text();
    record(robotsRes.ok && robots.includes('Sitemap:'), 'robots.txt advertises the sitemap');
    record(robots.includes('Disallow: /admin'), 'robots.txt blocks the admin area');
  } catch (error) {
    record(false, 'Crawler endpoints reachable', error.message);
  }

  /* --- Live page behaviour --- */
  try {
    const sample = await query("SELECT slug FROM products WHERE slug <> '' ORDER BY id LIMIT 1");
    const slug = sample.rows[0]?.slug;
    if (slug) {
      const ok = await fetch(`${API}/api/products/${slug}`);
      record(ok.status === 200, 'A real product URL resolves', `/product/${slug}`);
    }
    const missing = await fetch(`${API}/api/products/definitely-not-a-real-product-xyz`);
    record(missing.status === 404, 'An unknown product returns 404');
  } catch (error) {
    record(false, 'Product endpoints reachable', error.message);
  }

  const failures = results.filter((r) => r.ok !== true && r.ok !== 'warn');
  console.log(
    `\n${results.length - failures.length}/${results.length} checks passed` +
      (failures.length ? ` — ${failures.length} need attention\n` : '\n')
  );

  await pool.end();
  process.exit(failures.length > 0 ? 1 : 0);
};

run().catch(async (error) => {
  console.error('Audit failed to run:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
