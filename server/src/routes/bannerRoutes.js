import express from 'express';
import { getBanners, createBanner, updateBanner, deleteBanner } from '../controllers/bannerController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getBanners);
router.post('/admin', authenticateToken, requireAdmin, createBanner);
router.put('/admin/:id', authenticateToken, requireAdmin, updateBanner);
router.delete('/admin/:id', authenticateToken, requireAdmin, deleteBanner);

export default router;
