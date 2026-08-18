import express from 'express';
import {
  createEnquiry, getEnquiriesAdmin, updateEnquiryStatus, deleteEnquiry,
} from '../controllers/enquiryController.js';
import { authenticateToken, requireAdmin, optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Public: the concierge form is open to signed-out visitors, but links the
// enquiry to an account when one is present.
router.post('/', optionalAuth, createEnquiry);

router.get('/admin', authenticateToken, requireAdmin, getEnquiriesAdmin);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateEnquiryStatus);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteEnquiry);

export default router;
