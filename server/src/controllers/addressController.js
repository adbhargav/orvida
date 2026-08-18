import { query, pool } from '../config/db.js';

const validate = ({ fullName, phone, address, city, state, pincode }) => {
  if (!fullName?.trim()) return 'Full name is required.';
  if (String(phone || '').replace(/\D/g, '').length < 10) return 'A valid 10-digit phone number is required.';
  if (!address?.trim() || address.trim().length < 5) return 'A complete street address is required.';
  if (!city?.trim()) return 'City is required.';
  if (!state?.trim()) return 'State is required.';
  if (String(pincode || '').replace(/\D/g, '').length !== 6) return 'A valid 6-digit pincode is required.';
  return null;
};

export const getMyAddresses = async (req, res, next) => {
  try {
    const result = await query(
      'SELECT * FROM addresses WHERE user_id = $1 ORDER BY is_primary DESC, created_at DESC',
      [req.user.id]
    );
    res.json({ success: true, addresses: result.rows });
  } catch (error) {
    next(error);
  }
};

export const createAddress = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const problem = validate(req.body);
    if (problem) return res.status(400).json({ success: false, message: problem });

    const { label, fullName, phone, address, city, state, pincode, isPrimary } = req.body;

    await client.query('BEGIN');

    const existing = await client.query('SELECT COUNT(*)::int AS count FROM addresses WHERE user_id = $1', [
      req.user.id,
    ]);
    // The first address a customer saves is their default.
    const makePrimary = isPrimary === true || existing.rows[0].count === 0;

    if (makePrimary) {
      await client.query('UPDATE addresses SET is_primary = FALSE WHERE user_id = $1', [req.user.id]);
    }

    const result = await client.query(
      `INSERT INTO addresses (user_id, label, full_name, phone, address, city, state, pincode, is_primary)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        req.user.id,
        label?.trim() || null,
        fullName.trim(),
        phone.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        String(pincode).trim(),
        makePrimary,
      ]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, address: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

export const updateAddress = async (req, res, next) => {
  const client = await pool.connect();
  try {
    const problem = validate(req.body);
    if (problem) return res.status(400).json({ success: false, message: problem });

    const { label, fullName, phone, address, city, state, pincode, isPrimary } = req.body;

    await client.query('BEGIN');

    if (isPrimary === true) {
      await client.query('UPDATE addresses SET is_primary = FALSE WHERE user_id = $1', [req.user.id]);
    }

    // Scoped by user_id so one customer cannot edit another's address.
    const result = await client.query(
      `UPDATE addresses
          SET label = $1, full_name = $2, phone = $3, address = $4, city = $5,
              state = $6, pincode = $7, is_primary = COALESCE($8, is_primary), updated_at = NOW()
        WHERE id = $9 AND user_id = $10
        RETURNING *`,
      [
        label?.trim() || null,
        fullName.trim(),
        phone.trim(),
        address.trim(),
        city.trim(),
        state.trim(),
        String(pincode).trim(),
        isPrimary ?? null,
        req.params.id,
        req.user.id,
      ]
    );

    if (result.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    await client.query('COMMIT');
    res.json({ success: true, address: result.rows[0] });
  } catch (error) {
    await client.query('ROLLBACK').catch(() => {});
    next(error);
  } finally {
    client.release();
  }
};

export const deleteAddress = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM addresses WHERE id = $1 AND user_id = $2 RETURNING id, is_primary', [
      req.params.id,
      req.user.id,
    ]);

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Address not found' });
    }

    // Promote another address so the customer always has a default.
    if (result.rows[0].is_primary) {
      await query(
        `UPDATE addresses SET is_primary = TRUE
          WHERE id = (SELECT id FROM addresses WHERE user_id = $1 ORDER BY created_at DESC LIMIT 1)`,
        [req.user.id]
      );
    }

    res.json({ success: true, message: 'Address removed' });
  } catch (error) {
    next(error);
  }
};
