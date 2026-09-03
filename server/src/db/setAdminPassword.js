import dotenv from 'dotenv';
import readline from 'readline';
import bcrypt from 'bcryptjs';
import { query, pool } from '../config/db.js';

dotenv.config();

/**
 * Creates or resets an admin account — `npm run admin:password`.
 *
 * Exists so a deployment can never end with nobody able to sign in. On a
 * freshly seeded database there are no users at all, so an unknown email
 * creates the account rather than refusing; an existing one just has its
 * password replaced and is promoted to admin.
 *
 * The email is an argument; the password is prompted for rather than read
 * from argv, which would leave it in the shell history:
 *
 *   npm run admin:password -- admin@orivida.in
 */

/**
 * Reads answers one line at a time.
 *
 * `rl.question` only captures the line that arrives while it is waiting, so
 * piped input — where every line lands at once — loses all but the first.
 * The async iterator queues them instead, which makes this work the same way
 * whether a person is typing or a script is feeding it.
 */
let lines = null;
let rl = null;
const ask = async (prompt) => {
  if (!rl) {
    rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    lines = rl[Symbol.asyncIterator]();
  }
  process.stdout.write(prompt);
  const { value, done } = await lines.next();
  if (done) throw new Error('no more input');
  return value;
};
const closeInput = () => { if (rl) rl.close(); };

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

  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
    console.error('\nThat does not look like an email address.\n');
    await pool.end();
    process.exit(1);
  }

  const found = await query('SELECT id, name, is_admin FROM users WHERE LOWER(email) = $1', [email]);
  const isNew = found.rows.length === 0;

  let name = found.rows[0]?.name;
  if (isNew) {
    console.log(`\nNo account with that email — creating one.`);
    name = (await ask('Display name: ')).trim() || 'Administrator';
  }

  const password = await ask(`${isNew ? 'Password' : 'New password'} for ${email}: `);
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

  if (isNew) {
    await query(
      'INSERT INTO users (name, email, password_hash, is_admin) VALUES ($1, $2, $3, TRUE)',
      [name, email, hash]
    );
    console.log(`\nAdmin account created for ${email}.`);
  } else {
    await query('UPDATE users SET password_hash = $1, is_admin = TRUE WHERE id = $2', [
      hash,
      found.rows[0].id,
    ]);
    console.log(
      `\nPassword updated for ${email}${found.rows[0].is_admin ? '' : ' (and promoted to admin)'}.`
    );
  }
  console.log('Sign in at /admin on the storefront.\n');
  closeInput();
  await pool.end();
};

run().catch(async (error) => {
  console.error('Failed:', error.message);
  closeInput();
  await pool.end().catch(() => {});
  process.exit(1);
});
