import express from 'express';
import {
  getCategories, getCategoryBySlug, createCategory, updateCategory, deleteCategory,
  createSubcategory, updateSubcategory, deleteSubcategory,
} from '../controllers/categoryController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

router.get('/', getCategories);

// Subcategory routes sit above the parameterised category routes so
// "subcategories" is never swallowed by /:slug or /:id.
router.post('/:categoryId/subcategories', authenticateToken, requireAdmin, createSubcategory);
router.put('/subcategories/:id', authenticateToken, requireAdmin, updateSubcategory);
router.delete('/subcategories/:id', authenticateToken, requireAdmin, deleteSubcategory);

router.get('/:slug', getCategoryBySlug);
router.post('/', authenticateToken, requireAdmin, createCategory);
router.put('/:id', authenticateToken, requireAdmin, updateCategory);
router.delete('/:id', authenticateToken, requireAdmin, deleteCategory);

export default router;
