import express from 'express';
import {
  getMyAddresses, createAddress, updateAddress, deleteAddress,
} from '../controllers/addressController.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// Addresses are always owner-scoped.
router.use(authenticateToken);

router.get('/', getMyAddresses);
router.post('/', createAddress);
router.put('/:id', updateAddress);
router.delete('/:id', deleteAddress);

export default router;
