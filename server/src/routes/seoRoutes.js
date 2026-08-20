import express from 'express';
import {
  getRedirect,
  getSeoAudit,
  getSeoProducts,
  bulkSeoUpdate,
  listRedirects,
  createRedirect,
  deleteRedirect,
} from '../controllers/seoController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Public: the storefront resolves a renamed URL before showing a 404.
router.get('/redirect', getRedirect);

// Admin SEO tooling.
router.get('/admin/audit', authenticateToken, requireAdmin, getSeoAudit);
router.get('/admin/products', authenticateToken, requireAdmin, getSeoProducts);
router.post('/admin/bulk', authenticateToken, requireAdmin, bulkSeoUpdate);
router.get('/admin/redirects', authenticateToken, requireAdmin, listRedirects);
router.post('/admin/redirects', authenticateToken, requireAdmin, createRedirect);
router.delete('/admin/redirects/:id', authenticateToken, requireAdmin, deleteRedirect);

export default router;
