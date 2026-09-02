import dotenv from 'dotenv';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

dotenv.config();

/**
 * Sets (or resets) an admin password — `npm run admin:password`.
 *
 * Exists so a deployment can never end with nobody able to sign in. The email
 * is an argument; the password is prompted for rather than read from argv,
 * which would leave it in the shell history:
 *
 *   npm run admin:password -- admin@orvida.com
 */

const ask = (prompt) =>
  new Promise((resolve) => {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    rl.question(prompt, (answer) => {
      rl.close();
      resolve(answer);
    });
  });

const run = async () => {
  const email = (process.argv[2] || '').trim().toLowerCase();
  if (!email) {
    const admins = await query('SELECT email FROM users WHERE is_admin = TRUE ORDER BY id');
    console.error('\nUsage: npm run admin:password -- <email>\n');
    console.error('Admin accounts:');
    admins.rows.forEach((a) => console.error(`  ${a.email}`));
    console.error('');
    await pool.end();
    process.exit(1);
  }

  const found = await query('SELECT id, is_admin FROM users WHERE LOWER(email) = $1', [email]);
  if (found.rows.length === 0) {
    console.error('\nNo account with that email.\n');
    await pool.end();
    process.exit(1);
  }

  const password = await ask(`New password for ${email}: `);
  if (password.length < 8) {
    console.error('\nToo short — use at least 8 characters.\n');
    await pool.end();
    process.exit(1);
  }
  const confirm = await ask('Confirm: ');
  if (password !== confirm) {
    console.error('\nThey do not match.\n');
    await pool.end();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  await query('UPDATE users SET password_hash = $1, is_admin = TRUE WHERE id = $2', [
    hash,
    found.rows[0].id,
  ]);

  console.log(`\nPassword updated for ${email}${found.rows[0].is_admin ? '' : ' (and promoted to admin)'}.`);
  console.log('Clear it from your shell history if you typed it anywhere else.\n');
  await pool.end();
};

run().catch(async (error) => {
  console.error('Failed:', error.message);
  await pool.end().catch(() => {});
  process.exit(1);
});
