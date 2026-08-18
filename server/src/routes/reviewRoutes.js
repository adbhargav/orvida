import express from 'express';
import { getProductReviews, getRecentReviews, addReview } from '../controllers/reviewController.js';
import { optionalAuth } from '../middleware/auth.js';

const router = express.Router();

// Declared before /:productId so "recent" is not read as an id.
router.get('/recent', getRecentReviews);
router.get('/:productId', getProductReviews);
router.post('/', optionalAuth, addReview);

export default router;
