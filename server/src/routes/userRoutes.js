import express from 'express';
import { getUsersAdmin, toggleAdminRole, createAdminAccount } from '../controllers/userController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Every route here exposes or mutates customer records — admin only.
router.use(authenticateToken, requireAdmin);

router.get('/admin/all', getUsersAdmin);
router.patch('/admin/:id/role', toggleAdminRole);
router.post('/admin/create-admin', createAdminAccount);

export default router;
