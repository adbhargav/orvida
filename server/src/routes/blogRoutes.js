import express from 'express';
import {
  listPublicPosts,
  getPublicPost,
  listPosts,
  getBlogStats,
  getPostAdmin,
  createPost,
  updatePost,
  duplicatePost,
  deletePost,
  bulkPosts,
} from '../controllers/blogController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();
const admin = [authenticateToken, requireAdmin];

/* Admin routes are declared before "/:slug" so that path never swallows them. */
router.get('/admin/stats', ...admin, getBlogStats);
router.get('/admin/posts', ...admin, listPosts);
router.post('/admin/posts', ...admin, createPost);
router.post('/admin/posts/bulk', ...admin, bulkPosts);
router.get('/admin/posts/:id', ...admin, getPostAdmin);
router.put('/admin/posts/:id', ...admin, updatePost);
router.post('/admin/posts/:id/duplicate', ...admin, duplicatePost);
router.delete('/admin/posts/:id', ...admin, deletePost);

// Public: only live posts are ever served.
router.get('/', listPublicPosts);
router.get('/:slug', getPublicPost);

export default router;
