import { query } from '../config/db.js';
import { sendNewsletterWelcomeEmail } from '../services/emailService.js';

export const subscribe = async (req, res, next) => {
  try {
    const { email, source = 'footer' } = req.body;
    const clean = String(email || '').trim().toLowerCase();

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
      return res.status(400).json({ success: false, message: 'Please enter a valid email address.' });
    }

    // Re-subscribing an address that previously opted out reactivates it
    // rather than failing on the unique index.
    const result = await query(
      `INSERT INTO newsletter_subscribers (email, source)
       VALUES ($1, $2)
       ON CONFLICT (email)
       DO UPDATE SET is_active = TRUE, unsubscribed_at = NULL
       RETURNING *, (xmax = 0) AS is_new`,
      [clean, source]
    );

    const subscriber = result.rows[0];

    if (subscriber.is_new) {
      sendNewsletterWelcomeEmail(clean).catch((err) =>
        console.error('Newsletter welcome email failed:', err.message)
      );
    }

    res.status(201).json({ success: true, message: 'You are on the list.' });
  } catch (error) {
    next(error);
  }
};

export const unsubscribe = async (req, res, next) => {
  try {
    const clean = String(req.query.email || req.body.email || '').trim().toLowerCase();
    if (!clean) return res.status(400).json({ success: false, message: 'Email is required.' });

    await query(
      'UPDATE newsletter_subscribers SET is_active = FALSE, unsubscribed_at = NOW() WHERE email = $1',
      [clean]
    );

    res.json({ success: true, message: 'You have been unsubscribed.' });
  } catch (error) {
    next(error);
  }
};

export const getSubscribersAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM newsletter_subscribers ORDER BY created_at DESC');
    res.json({ success: true, subscribers: result.rows });
  } catch (error) {
    next(error);
  }
};
