import express from 'express';
import {
  createRazorpayOrder,
  verifyPaymentAndCreateOrder,
  getMyOrders,
  getOrderById,
  getAllOrdersAdmin,
  updateOrderStatus,
  cancelUserOrder,
  getOrderInvoice,
  getOrderLabel
} from '../controllers/orderController.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Checkout requires a signed-in customer: every order must belong to an
// account. The controllers still price the cart server-side regardless.
router.post('/create-razorpay-order', authenticateToken, createRazorpayOrder);
router.post('/verify-payment', authenticateToken, verifyPaymentAndCreateOrder);

// Anything that reads or mutates an existing order is owner-scoped.
router.get('/my-orders', authenticateToken, getMyOrders);
router.get('/detail/:identifier', authenticateToken, getOrderById);
router.patch('/cancel/:id', authenticateToken, cancelUserOrder);

// Printable documents. Owner or admin only — enforced in the controller.
router.get('/:identifier/invoice', authenticateToken, getOrderInvoice);
router.get('/:identifier/label', authenticateToken, getOrderLabel);

// Admin ledger
router.get('/admin/all', authenticateToken, requireAdmin, getAllOrdersAdmin);
router.patch('/admin/:id/status', authenticateToken, requireAdmin, updateOrderStatus);

export default router;
