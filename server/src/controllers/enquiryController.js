import { query } from '../config/db.js';
import { sendEnquiryReceivedEmail, sendAdminEnquiryAlert } from '../services/emailService.js';

const ALLOWED_STATUSES = ['New', 'Contacted', 'Quoted', 'Won', 'Closed'];

export const createEnquiry = async (req, res, next) => {
  try {
    const { name, company, email, phone, occasion, quantity, budgetPerHamper, notes } = req.body;

    if (!name?.trim()) return res.status(400).json({ success: false, message: 'Your name is required.' });
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email || '').trim())) {
      return res.status(400).json({ success: false, message: 'A valid email address is required.' });
    }

    const result = await query(
      `INSERT INTO enquiries (name, company, email, phone, occasion, quantity, budget_per_hamper, notes, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING *`,
      [
        name.trim(),
        company?.trim() || null,
        email.trim().toLowerCase(),
        phone?.trim() || null,
        occasion || null,
        quantity || null,
        budgetPerHamper || null,
        notes?.trim() || null,
        req.user?.id || null,
      ]
    );

    const enquiry = result.rows[0];

    // Acknowledge the customer and alert the concierge team, without holding
    // up the response if SMTP is slow.
    sendEnquiryReceivedEmail(enquiry.email, enquiry).catch((err) =>
      console.error('Enquiry acknowledgement email failed:', err.message)
    );
    sendAdminEnquiryAlert(enquiry).catch((err) =>
      console.error('Enquiry admin alert failed:', err.message)
    );

    res.status(201).json({
      success: true,
      message: 'Your enquiry has been received.',
      enquiry: { id: enquiry.id, email: enquiry.email },
    });
  } catch (error) {
    next(error);
  }
};

export const getEnquiriesAdmin = async (req, res, next) => {
  try {
    const result = await query('SELECT * FROM enquiries ORDER BY created_at DESC');
    res.json({ success: true, enquiries: result.rows });
  } catch (error) {
    next(error);
  }
};

export const updateEnquiryStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    if (!ALLOWED_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Status must be one of: ${ALLOWED_STATUSES.join(', ')}`,
      });
    }

    const result = await query(
      'UPDATE enquiries SET status = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [status, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }

    res.json({ success: true, enquiry: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

export const deleteEnquiry = async (req, res, next) => {
  try {
    const result = await query('DELETE FROM enquiries WHERE id = $1 RETURNING id', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Enquiry not found' });
    }
    res.json({ success: true, message: 'Enquiry deleted' });
  } catch (error) {
    next(error);
  }
};
