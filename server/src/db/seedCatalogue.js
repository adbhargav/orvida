import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Brings a fresh database up to the live store — `npm run db:seed-catalogue`.
 *
 * Applies schema.sql, then migrations.sql, then the committed catalogue
 * snapshot in catalogue.sql. Every part is idempotent, so running it twice
 * leaves the same result as running it once.
 *
 * This is what to use on a new server. `npm run db:init` is the old
 * prototype seed — 24 placeholder products with stock photography — and is
 * not the real catalogue.
 */

const run = async () => {
  const catalogue = path.join(__dirname, 'catalogue.sql');
  if (!fs.existsSync(catalogue)) {
    console.error('\nsrc/db/catalogue.sql is missing.');
    console.error('Generate it from a database that has the store: npm run db:export\n');
    process.exit(1);
  }

  const client = await pool.connect();
  try {
    const target = await client.query('SELECT current_database() db');
    console.log(`\nSeeding "${target.rows[0].db}"\n`);

    // Refuse to overwrite a store that already has customers behind it. The
    // catalogue tables get replaced wholesale, which is fine on a new server
    // and destructive on a live one.
    const orders = await client
      .query('SELECT COUNT(*)::int n FROM orders')
      .catch(() => ({ rows: [{ n: 0 }] }));
    if (orders.rows[0].n > 0 && !process.argv.includes('--force')) {
      console.error(`Refusing to run: this database already has ${orders.rows[0].n} order(s).`);
      console.error('Seeding replaces the catalogue wholesale. Pass --force if that is intended.\n');
      process.exit(1);
    }

    for (const [label, file] of [
      ['schema', 'schema.sql'],
      ['migrations', 'migrations.sql'],
      ['catalogue', 'catalogue.sql'],
    ]) {
      const sql = fs.readFileSync(path.join(__dirname, file), 'utf-8');
      process.stdout.write(`  ${label.padEnd(11)}`);
      await client.query(sql);
      console.log('applied');
    }

    const counts = await client.query(`
      SELECT (SELECT COUNT(*) FROM products)::int products,
             (SELECT COUNT(*) FROM product_images)::int images,
             (SELECT COUNT(*) FROM categories)::int categories,
             (SELECT COUNT(*) FROM subcategories)::int subcategories,
             (SELECT COUNT(*) FROM uploads)::int uploads,
             (SELECT COUNT(*) FROM banners)::int banners`);
    const c = counts.rows[0];
    console.log(
      `\n  ${c.products} products · ${c.images} images · ${c.categories} categories · ` +
        `${c.subcategories} subcategories · ${c.banners} banners · ${c.uploads} uploaded files`
    );
    console.log('\n  No admin account is created — run: npm run admin:password -- you@example.com\n');
  } finally {
    client.release();
    await pool.end();
  }
};

run().catch(async (error) => {
  console.error('\nSeed failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
