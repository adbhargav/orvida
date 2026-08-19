import express from 'express';
import {
  getShippingQuote,
  adminCreateShipment,
  adminRefreshTracking,
  trackMyOrder,
} from '../controllers/shippingController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Quoting happens while the visitor types their pincode, before sign-in is
// guaranteed — it exposes only a computed charge, so it stays public.
router.post('/quote', getShippingQuote);

router.get('/track/:orderId', authenticateToken, trackMyOrder);

router.post('/admin/orders/:id/create', authenticateToken, requireAdmin, adminCreateShipment);
router.post('/admin/orders/:id/refresh', authenticateToken, requireAdmin, adminRefreshTracking);

export default router;
