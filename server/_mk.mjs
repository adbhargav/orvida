import 'dotenv/config';
import pg from 'pg';
const a = new pg.Client({ connectionString: process.env.DATABASE_URL });
await a.connect();
await a.query('DROP DATABASE IF EXISTS admintest');
await a.query('CREATE DATABASE admintest');
await a.end();
const u = process.env.DATABASE_URL.replace('/neondb?', '/admintest?');
const c = new pg.Client({ connectionString: u, ssl: true });
await c.connect();
await c.query(`CREATE TABLE users (id SERIAL PRIMARY KEY, firebase_uid VARCHAR(128) UNIQUE,
  name VARCHAR(255) NOT NULL, email VARCHAR(255) UNIQUE NOT NULL, password_hash VARCHAR(255),
  phone VARCHAR(50), photo_url TEXT, is_admin BOOLEAN DEFAULT FALSE,
  member_since VARCHAR(50) DEFAULT 'August 2026', created_at TIMESTAMPTZ DEFAULT NOW(), updated_at TIMESTAMPTZ DEFAULT NOW())`);
console.log('  empty users table ready');
await c.end();
