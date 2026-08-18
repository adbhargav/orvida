import express from 'express';
import { getCart, addToCart, updateCartQuantity, removeFromCart, clearCart } from '../controllers/cartController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:id', updateCartQuantity);
router.delete('/:id', removeFromCart);
router.delete('/', clearCart);

export default router;
