import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from '../config/db.js';
import { syncSequences } from './syncSequences.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/**
 * Applies src/db/migrations.sql. Every statement in that file is guarded with
 * IF NOT EXISTS, so this is safe to run on every deploy.
 */
export const runMigrations = async () => {
  const sql = fs.readFileSync(path.join(__dirname, 'migrations.sql'), 'utf-8');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(sql);
    await client.query('COMMIT');
    return true;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(async () => {
      console.log('Migrations applied.');
      const seq = await syncSequences();
      seq.filter((r) => r.error).forEach((r) => console.warn(`  ! ${r.table}: ${r.error}`));
      console.log('Sequences realigned.');
    })
    .catch((err) => {
      console.error('Migration failed:', err.message);
      process.exitCode = 1;
    })
    .finally(() => pool.end());
}
