import dotenv from 'dotenv';
import { query, pool } from '../config/db.js';

dotenv.config();

/**
 * Repoints stored asset URLs at a new API host —
 * `npm run db:rewrite-urls -- https://orvida.onrender.com https://api.orivida.in`
 *
 * Uploaded images are stored in Postgres but referenced by absolute URL, so
 * moving the API leaves those references pointing at the old host. Anything
 * that host stops serving becomes a broken image on the storefront.
 *
 * Add --dry-run to see the matches without writing.
 */

const isDryRun = process.argv.includes('--dry-run');
const args = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const [from, to] = args;

// Columns that can hold a URL to something this API serves.
const COLUMNS = [
  ['banners', 'image'],
  ['banners', 'mobile_image'],
  ['categories', 'image'],
  ['categories', 'og_image'],
  ['subcategories', 'image'],
  ['subcategories', 'og_image'],
  ['products', 'og_image'],
  ['products', 'twitter_image'],
  ['product_images', 'url'],
  ['seo_pages', 'featured_image'],
  ['seo_pages', 'og_image'],
  ['seo_pages', 'twitter_image'],
  ['blog_posts', 'featured_image'],
  ['blog_posts', 'og_image'],
  ['blog_posts', 'twitter_image'],
];

const run = async () => {
  if (!from || !to) {
    console.error('\nUsage: npm run db:rewrite-urls -- <old-origin> <new-origin> [--dry-run]');
    console.error('  e.g. npm run db:rewrite-urls -- https://orvida.onrender.com https://api.orivida.in\n');
    await pool.end();
    process.exit(1);
  }

  const oldOrigin = from.replace(/\/+$/, '');
  const newOrigin = to.replace(/\/+$/, '');
  console.log(`\n${oldOrigin}  →  ${newOrigin}${isDryRun ? '  (dry run)' : ''}\n`);

  let total = 0;

  for (const [table, column] of COLUMNS) {
    try {
      const found = await query(
        `SELECT COUNT(*)::int n FROM "${table}" WHERE ${column} LIKE $1 || '%'`,
        [oldOrigin]
      );
      if (found.rows[0].n === 0) continue;

      if (!isDryRun) {
        await query(
          `UPDATE "${table}" SET ${column} = $2 || SUBSTRING(${column} FROM LENGTH($1) + 1)
            WHERE ${column} LIKE $1 || '%'`,
          [oldOrigin, newOrigin]
        );
      }
      total += found.rows[0].n;
      console.log(`  ${String(found.rows[0].n).padStart(4)}  ${table}.${column}`);
    } catch (error) {
      // A column that does not exist in this schema version is not a failure.
      if (error.code !== '42703' && error.code !== '42P01') throw error;
    }
  }

  // site_content holds JSON documents (homepage story, about page, SEO
  // settings) whose bodies embed image URLs, so those are rewritten as text.
  const docs = await query('SELECT key, content::text AS text FROM site_content');
  for (const doc of docs.rows) {
    if (!doc.text.includes(oldOrigin)) continue;
    const occurrences = doc.text.split(oldOrigin).length - 1;
    if (!isDryRun) {
      await query('UPDATE site_content SET content = $2::jsonb WHERE key = $1', [
        doc.key,
        doc.text.split(oldOrigin).join(newOrigin),
      ]);
    }
    total += occurrences;
    console.log(`  ${String(occurrences).padStart(4)}  site_content[${doc.key}]`);
  }

  if (total === 0) {
    console.log('  nothing referenced that origin.\n');
  } else if (isDryRun) {
    console.log(`\n${total} reference(s) would be rewritten. Nothing written.\n`);
  } else {
    console.log(`\n${total} reference(s) rewritten.\n`);
  }

  await pool.end();
};

run().catch(async (error) => {
  console.error('Failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
