import express from 'express';
import { getDashboardMetrics } from '../controllers/dashboardController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/metrics', authenticateToken, requireAdmin, getDashboardMetrics);

export default router;
