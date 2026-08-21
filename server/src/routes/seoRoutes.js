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
import {
  listSeoPages,
  getSeoPageStats,
  getSeoPageAdmin,
  createSeoPage,
  updateSeoPage,
  duplicateSeoPage,
  deleteSeoPage,
  bulkSeoPages,
  getPublicSeoPage,
  listPublicSeoPages,
  listTemplates,
  saveTemplate,
  deleteTemplate,
} from '../controllers/seoPageController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

/* Public --------------------------------------------------------------- */

// The storefront resolves a renamed URL before showing a 404.
router.get('/redirect', getRedirect);
// Only live pages are served here; drafts and pending schedules 404.
router.get('/pages', listPublicSeoPages);
router.get('/pages/:slug', getPublicSeoPage);

/* Admin ---------------------------------------------------------------- */

const admin = [authenticateToken, requireAdmin];

router.get('/admin/audit', ...admin, getSeoAudit);
router.get('/admin/products', ...admin, getSeoProducts);
router.post('/admin/bulk', ...admin, bulkSeoUpdate);

router.get('/admin/redirects', ...admin, listRedirects);
router.post('/admin/redirects', ...admin, createRedirect);
router.delete('/admin/redirects/:id', ...admin, deleteRedirect);

// Static segments are declared before "/:id" so they are never swallowed.
router.get('/admin/pages/stats', ...admin, getSeoPageStats);
router.get('/admin/pages/templates', ...admin, listTemplates);
router.post('/admin/pages/templates', ...admin, saveTemplate);
router.delete('/admin/pages/templates/:id', ...admin, deleteTemplate);

router.get('/admin/pages', ...admin, listSeoPages);
router.post('/admin/pages', ...admin, createSeoPage);
router.post('/admin/pages/bulk', ...admin, bulkSeoPages);
router.get('/admin/pages/:id', ...admin, getSeoPageAdmin);
router.put('/admin/pages/:id', ...admin, updateSeoPage);
router.post('/admin/pages/:id/duplicate', ...admin, duplicateSeoPage);
router.delete('/admin/pages/:id', ...admin, deleteSeoPage);

export default router;
