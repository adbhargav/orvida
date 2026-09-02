import dotenv from 'dotenv';
import { query, pool } from '../config/db.js';

dotenv.config();

/**
 * Removes development leftovers before the store goes live —
 * `npm run db:clean-demo` (add --dry-run to see what would go).
 *
 * Deliberately narrow. The catalogue, categories, banners, uploaded images,
 * site content and SEO page templates are real work and are never touched;
 * only the rows created while testing are.
 */

const isDryRun = process.argv.includes('--dry-run');

// Accounts that only ever existed to click through the checkout. Deleting a
// user cascades to their orders, addresses, cart and wishlist.
const TEST_USER_EMAILS = [
  'radhika@orvida-luxury.com',
  'andhebhargav57@gmail.com',
  'vajrasolsofficial@gmail.com',
  'bhargavandhe202@gmail.com',
];

// Sample promotions that shipped with the seed, not real campaigns.
const SAMPLE_COUPONS = ['ORVIDA10', 'WELCOME15', 'LUXURY500'];

// Landing pages created while trying the editor.
const TEST_PAGE_SLUGS = ['abc'];

const steps = [
  {
    label: 'Orders (and their line items, refunds, webhook events)',
    count: 'SELECT COUNT(*)::int n FROM orders',
    run: async () => {
      // Explicit rather than relying on cascade order, so the counts reported
      // are the counts actually deleted.
      await query('DELETE FROM refunds');
      await query('DELETE FROM webhook_events');
      await query('DELETE FROM order_items');
      return (await query('DELETE FROM orders RETURNING id')).rowCount;
    },
  },
  {
    label: 'Test landing pages',
    count: 'SELECT COUNT(*)::int n FROM seo_pages WHERE slug = ANY($1)',
    params: [TEST_PAGE_SLUGS],
    run: async () =>
      (await query('DELETE FROM seo_pages WHERE slug = ANY($1) RETURNING id', [TEST_PAGE_SLUGS])).rowCount,
  },
  {
    label: 'Gifting enquiries',
    count: 'SELECT COUNT(*)::int n FROM enquiries',
    run: async () => (await query('DELETE FROM enquiries RETURNING id')).rowCount,
  },
  {
    label: 'Newsletter subscribers',
    count: 'SELECT COUNT(*)::int n FROM newsletter_subscribers',
    run: async () => (await query('DELETE FROM newsletter_subscribers RETURNING id')).rowCount,
  },
  {
    label: 'Test accounts',
    count: 'SELECT COUNT(*)::int n FROM users WHERE email = ANY($1)',
    params: [TEST_USER_EMAILS],
    run: async () =>
      (await query('DELETE FROM users WHERE email = ANY($1) RETURNING id', [TEST_USER_EMAILS])).rowCount,
  },
  {
    label: 'Sample coupons',
    count: 'SELECT COUNT(*)::int n FROM coupons WHERE code = ANY($1)',
    params: [SAMPLE_COUPONS],
    run: async () =>
      (await query('DELETE FROM coupons WHERE code = ANY($1) RETURNING id', [SAMPLE_COUPONS])).rowCount,
  },
  {
    label: 'Carts and wishlists left behind',
    count: 'SELECT (SELECT COUNT(*) FROM cart_items) + (SELECT COUNT(*) FROM wishlist_items) AS n',
    run: async () => {
      const cart = await query('DELETE FROM cart_items RETURNING id');
      const wish = await query('DELETE FROM wishlist_items RETURNING id');
      return cart.rowCount + wish.rowCount;
    },
  },
];

const run = async () => {
  console.log(`\nORVIDA demo-data cleanup${isDryRun ? ' (dry run)' : ''}\n`);

  // Refuse to leave the store without a way in.
  const survivors = await query(
    'SELECT COUNT(*)::int n FROM users WHERE is_admin = TRUE AND NOT (email = ANY($1))',
    [TEST_USER_EMAILS]
  );
  if (survivors.rows[0].n === 0) {
    console.error('Refusing to run: no admin account would remain.');
    console.error('Create one first, or take an email out of TEST_USER_EMAILS.\n');
    await pool.end();
    process.exit(1);
  }

  let total = 0;
  for (const step of steps) {
    const found = (await query(step.count, step.params)).rows[0].n;
    if (isDryRun) {
      console.log(`  ${String(found).padStart(4)}  ${step.label}`);
      continue;
    }
    const removed = found > 0 ? await step.run() : 0;
    total += removed;
    console.log(`  ${String(removed).padStart(4)}  ${step.label}`);
  }

  if (isDryRun) {
    console.log('\nDry run — nothing deleted.\n');
  } else {
    console.log(`\n${total} row(s) removed. Catalogue, banners, uploads and site content untouched.`);
    console.log(`Admin accounts remaining: ${survivors.rows[0].n}\n`);
  }
  await pool.end();
};

run().catch(async (error) => {
  console.error('Cleanup failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
