import express from 'express';
import { subscribe, unsubscribe, getSubscribersAdmin } from '../controllers/newsletterController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.post('/subscribe', subscribe);
// Reachable from the one-click link in every marketing email.
router.get('/unsubscribe', unsubscribe);
router.post('/unsubscribe', unsubscribe);

router.get('/admin', authenticateToken, requireAdmin, getSubscribersAdmin);

export default router;
