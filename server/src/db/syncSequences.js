import { query, pool } from '../config/db.js';

/**
 * Realigns every SERIAL sequence with the highest id currently in its table.
 *
 * The seed script inserts rows with explicit ids, which leaves the sequences
 * sitting at 1. The next INSERT that relies on the default then collides with
 * an existing primary key — which is why creating a product, category, coupon
 * or banner failed with "duplicate key value violates unique constraint".
 *
 * Safe to run repeatedly; run it after any seed or manual data import.
 */
export const syncSequences = async () => {
  const tables = [
    'users', 'categories', 'subcategories', 'products', 'product_images',
    'product_variants', 'cart_items', 'wishlist_items', 'coupons',
    'orders', 'order_items', 'banners', 'reviews',
  ];

  const results = [];

  for (const table of tables) {
    try {
      const { rows } = await query(
        `SELECT setval(
                  pg_get_serial_sequence($1, 'id'),
                  COALESCE((SELECT MAX(id) FROM ${table}), 0) + 1,
                  false
                ) AS next_value`,
        [table]
      );
      results.push({ table, nextId: Number(rows[0].next_value) });
    } catch (error) {
      results.push({ table, error: error.message });
    }
  }

  return results;
};

// Allow running directly: `node src/db/syncSequences.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  syncSequences()
    .then((results) => {
      console.log('Sequence sync complete:');
      results.forEach((r) =>
        console.log(r.error ? `  ✗ ${r.table}: ${r.error}` : `  ✓ ${r.table} → next id ${r.nextId}`)
      );
    })
    .catch((err) => {
      console.error('Sequence sync failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
