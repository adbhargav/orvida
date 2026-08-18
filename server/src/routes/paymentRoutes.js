import express from 'express';
import { createRefund, getRefundsForOrder, getWebhookEvents } from '../controllers/paymentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Refunds move real money — administrators only.
router.post('/orders/:id/refund', authenticateToken, requireAdmin, createRefund);
router.get('/orders/:id/refunds', authenticateToken, requireAdmin, getRefundsForOrder);
router.get('/webhook-events', authenticateToken, requireAdmin, getWebhookEvents);

export default router;
