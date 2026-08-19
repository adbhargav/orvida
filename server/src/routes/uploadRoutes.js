import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';
import { query } from '../config/db.js';

const router = express.Router();

// Only authenticated administrators may upload.
router.use(authenticateToken, requireAdmin);

// Images are stored in Postgres, not on disk: the production filesystem is
// ephemeral (wiped on every deploy), which kept breaking uploaded imagery.
// URLs keep the same /uploads/<filename> shape they always had.
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif', 'image/gif'];

const fileFilter = (req, file, cb) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, WebP, AVIF or GIF images are allowed'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
});

const makeFilename = (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
  const ext = path.extname(file.originalname) || '';
  return `${file.fieldname}-${uniqueSuffix}${ext}`;
};

const saveToDatabase = async (file) => {
  const filename = makeFilename(file);
  await query(
    'INSERT INTO uploads (filename, mime_type, data, size_bytes) VALUES ($1, $2, $3, $4)',
    [filename, file.mimetype, file.buffer, file.size]
  );
  return filename;
};

// Behind a proxy the request host is not the public one, so prefer an
// explicitly configured asset base URL — unless that URL points at localhost
// while the request came from a real domain (a dev value copied into a
// production env), in which case the request origin is the truthful base.
const resolveAssetBase = (req) => {
  const configured = process.env.PUBLIC_ASSET_URL?.replace(/\/+$/, '');
  const requestHost = req.get('host') || '';
  const configuredIsLocal = configured && /localhost|127\.0\.0\.1/.test(configured);
  const requestIsLocal = /localhost|127\.0\.0\.1/.test(requestHost);
  if (configured && !(configuredIsLocal && !requestIsLocal)) return configured;
  return `${req.protocol}://${requestHost}`;
};

// POST /api/upload - Single image upload
router.post('/', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload an image file' });
    }
    const filename = await saveToDatabase(req.file);
    const base = resolveAssetBase(req);

    res.json({
      success: true,
      message: 'Image uploaded successfully',
      url: `${base}/uploads/${filename}`,
      filename,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// POST /api/upload/multiple - Multiple images upload
router.post('/multiple', upload.array('images', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: 'Please upload at least one image file' });
    }
    const base = resolveAssetBase(req);
    const urls = [];
    for (const file of req.files) {
      const filename = await saveToDatabase(file);
      urls.push(`${base}/uploads/${filename}`);
    }

    res.json({
      success: true,
      message: 'Images uploaded successfully',
      urls,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
