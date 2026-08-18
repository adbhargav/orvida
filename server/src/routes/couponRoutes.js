import express from 'express';
import { validateCoupon, getCouponsAdmin, createCoupon, deleteCoupon } from '../controllers/couponController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/validate', validateCoupon);

router.get('/admin/all', authenticateToken, requireAdmin, getCouponsAdmin);
router.post('/admin', authenticateToken, requireAdmin, createCoupon);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteCoupon);

export default router;
