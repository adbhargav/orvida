import express from 'express';
import { getWishlist, toggleWishlist, mergeWishlist } from '../controllers/wishlistController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getWishlist);
router.post('/toggle', toggleWishlist);
router.post('/merge', mergeWishlist);

export default router;
