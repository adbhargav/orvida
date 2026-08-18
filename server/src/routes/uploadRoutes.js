import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// Uploads write to disk — restrict to authenticated administrators.
router.use(authenticateToken, requireAdmin);

// Ensure uploads directory exists
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  }
});

// File Filter for Images
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, AVIF or GIF images are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

// POST /api/upload - Single image upload
router.post('/', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }
    // Behind a proxy the request host is not the public one, so prefer an
    // explicitly configured asset base URL when it is available.
    const base = process.env.PUBLIC_ASSET_URL?.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;
    const imageUrl = `${base}/uploads/${req.file.filename}`;

    res.json({
      success: true,
      message: 'Image uploaded successfully to server uploads directory',
      url: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/upload/multiple - Multiple images upload
router.post('/multiple', upload.array('images', 10), (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }
    // Behind a proxy the request host is not the public one, so prefer an
    // explicitly configured asset base URL when it is available.
    const base = process.env.PUBLIC_ASSET_URL?.replace(/\/+$/, '') || `${req.protocol}://${req.get('host')}`;

    const urls = req.files.map(file => `${base}/uploads/${file.filename}`);

    res.json({
      success: true,
      message: 'Images uploaded successfully to server uploads directory',
      urls: urls
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
