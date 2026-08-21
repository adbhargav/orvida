import dotenv from 'dotenv';
import { query, pool } from '../config/db.js';
import { SITE_URL } from '../services/seoService.js';

dotenv.config();

/**
 * Consolidate duplicate product listings — `npm run seo:canonicalise`.
 *
 * The catalogue import created one row per price variant, so a single item
 * can occupy two dozen URLs carrying an identical name and description.
 * Search engines treat those as competing duplicates and pick one
 * arbitrarily, so the ranking signals earned by the group are scattered.
 *
 * This points every duplicate's canonical at the lowest-priced member of its
 * group, which is the one a shopper is most likely to want. Nothing is
 * deleted and no URL stops working: every variant still resolves, still
 * shows its own price and is still purchasable. Only the instruction to
 * search engines changes, and it is reversible with --undo.
 */

const isUndo = process.argv.includes('--undo');
const isDryRun = process.argv.includes('--dry-run');

const run = async () => {
  if (isUndo) {
    const undone = await query(
      `UPDATE products SET canonical_url = NULL, updated_at = CURRENT_TIMESTAMP
        WHERE canonical_url IS NOT NULL
          AND canonical_url <> $1 || '/product/' || slug
        RETURNING id`,
      [SITE_URL]
    );
    console.log(`Cleared ${undone.rowCount} canonical override(s).`);
    await pool.end();
    return;
  }

  // Lowest price wins the group; id breaks ties so repeat runs agree.
  const groups = await query(`
    SELECT name,
           COUNT(*)::int AS members,
           (ARRAY_AGG(slug ORDER BY price ASC, id ASC))[1] AS keeper,
           ARRAY_AGG(id ORDER BY price ASC, id ASC) AS ids
      FROM products
     GROUP BY name
    HAVING COUNT(*) > 1
     ORDER BY COUNT(*) DESC`);

  const duplicates = groups.rows.reduce((sum, g) => sum + g.members - 1, 0);
  console.log(`\n${groups.rowCount} duplicate group(s), ${duplicates} URL(s) to consolidate.\n`);
  groups.rows.slice(0, 5).forEach((g) =>
    console.log(`  ${String(g.members).padStart(3)}x  ${g.name.slice(0, 62)}\n       → /product/${g.keeper}`)
  );
  if (groups.rowCount > 5) console.log(`  … and ${groups.rowCount - 5} more group(s)`);

  if (isDryRun) {
    console.log('\nDry run — nothing written.\n');
    await pool.end();
    return;
  }

  let updated = 0;
  for (const group of groups.rows) {
    // Everything except the keeper points at the keeper.
    const followers = group.ids.slice(1);
    const res = await query(
      `UPDATE products SET canonical_url = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = ANY($2::int[]) RETURNING id`,
      [`${SITE_URL}/product/${group.keeper}`, followers]
    );
    updated += res.rowCount;
    // The keeper must never carry an override, or the group would point away.
    await query('UPDATE products SET canonical_url = NULL WHERE id = $1', [group.ids[0]]);
  }

  console.log(`\n${updated} product(s) now canonicalise to their group's keeper.`);
  console.log('Reverse with: npm run seo:canonicalise -- --undo\n');
  await pool.end();
};

run().catch(async (error) => {
  console.error('Failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
