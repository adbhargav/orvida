import express from 'express';
import { body } from 'express-validator';
import { registerUser, loginUser, googleAuth, forgotPassword, resetPassword, getMe, updateProfile } from '../controllers/authController.js';
import { authenticateToken } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';

const router = express.Router();

router.post(
  '/signup',
  [
    body('name').trim().notEmpty().withMessage('Name is required')
      .isLength({ max: 100 }).withMessage('Name must be under 100 characters'),
    body('email').isEmail().withMessage('Valid email is required')
      .isLength({ max: 254 }).withMessage('Email is too long'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .isLength({ max: 128 }).withMessage('Password must be under 128 characters'),
    body('phone').optional({ values: 'falsy' }).isLength({ max: 20 }).withMessage('Phone number is too long'),
    validate,
  ],
  registerUser
);

router.post(
  '/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
      .isLength({ max: 128 }).withMessage('Password is too long'),
    validate,
  ],
  loginUser
);

router.post('/google', googleAuth);

router.post(
  '/forgot-password',
  [body('email').isEmail().withMessage('Valid email is required'), validate],
  forgotPassword
);

router.post(
  '/reset-password',
  [
    body('idToken').notEmpty().withMessage('Reset token is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
      .isLength({ max: 128 }).withMessage('Password must be under 128 characters'),
    validate,
  ],
  resetPassword
);

router.get('/me', authenticateToken, getMe);
router.put('/profile', authenticateToken, updateProfile);

export default router;
