import bcrypt from 'bcryptjs';
import { query } from '../config/db.js';

export const getUsersAdmin = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT id, firebase_uid, name, email, phone, photo_url, is_admin, member_since, created_at FROM users ORDER BY created_at DESC'
    );
    res.json({ success: true, users: result.rows });
  } catch (error) {
    next(error);
  }
};

export const toggleAdminRole = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { isAdmin } = req.body;

    const result = await query(
      'UPDATE users SET is_admin = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING id, name, email, is_admin',
      [isAdmin, id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    res.json({ success: true, message: 'User role updated', user: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const createAdminAccount = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    if (String(password).length < 8) {
      return res.status(400).json({
        success: false,
        message: 'Administrator passwords must be at least 8 characters.',
      });
    }

    const cleanEmail = String(email).toLowerCase().trim();
    const hashedPassword = await bcrypt.hash(password, 10);
    const existing = await query('SELECT * FROM users WHERE email = $1', [cleanEmail]);

    let user;
    if (existing.rows.length > 0) {
      const updateRes = await query(
        'UPDATE users SET is_admin = true, password_hash = $1, name = COALESCE($2, name), phone = COALESCE($3, phone), updated_at = CURRENT_TIMESTAMP WHERE id = $4 RETURNING id, name, email, phone, is_admin',
        [hashedPassword, name, phone, existing.rows[0].id]
      );
      user = updateRes.rows[0];
    } else {
      const insertRes = await query(
        'INSERT INTO users (name, email, password_hash, phone, is_admin) VALUES ($1, $2, $3, $4, true) RETURNING id, name, email, phone, is_admin',
        [name || 'Admin User', cleanEmail, hashedPassword, phone || null]
      );
      user = insertRes.rows[0];
    }

    res.json({
      success: true,
      message: `Admin account created successfully for ${email}`,
      user
    });
  } catch (error) {
    next(error);
  }
};
