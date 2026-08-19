import express from 'express';
import { getContent, upsertContent } from '../controllers/contentController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getContent);
router.put('/:key', authenticateToken, requireAdmin, upsertContent);

export default router;
