import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import dotenv from 'dotenv';

import { testConnection } from './config/db.js';
import { testMailer } from './config/mailer.js';
import { errorHandler } from './middleware/errorHandler.js';

// Route imports
import authRoutes from './routes/authRoutes.js';
import productRoutes from './routes/productRoutes.js';
import categoryRoutes from './routes/categoryRoutes.js';
import cartRoutes from './routes/cartRoutes.js';
import wishlistRoutes from './routes/wishlistRoutes.js';
import orderRoutes from './routes/orderRoutes.js';
import couponRoutes from './routes/couponRoutes.js';
import bannerRoutes from './routes/bannerRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import userRoutes from './routes/userRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';

import path from 'path';
import uploadRoutes from './routes/uploadRoutes.js';
import paymentRoutes from './routes/paymentRoutes.js';
import enquiryRoutes from './routes/enquiryRoutes.js';
import newsletterRoutes from './routes/newsletterRoutes.js';
import addressRoutes from './routes/addressRoutes.js';
import shippingRoutes from './routes/shippingRoutes.js';
import contentRoutes from './routes/contentRoutes.js';
import blogRoutes from './routes/blogRoutes.js';
import { handleRazorpayWebhook } from './controllers/paymentController.js';
import { getSitemap, getRobots } from './controllers/seoController.js';
import seoRoutes from './routes/seoRoutes.js';

dotenv.config();

const app = express();

// Render (and most hosts) terminate TLS at a proxy; without this,
// req.protocol reports http and generated asset URLs become mixed content.
app.set('trust proxy', 1);
const PORT = process.env.PORT || 5000;

// Security & Utility Middleware
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));

// CORS: an explicit allowlist. Reflecting any origin while also sending
// Access-Control-Allow-Credentials lets any website call this API as the
// signed-in user, so the previous allow-everything behaviour is gone.
const isProduction = process.env.NODE_ENV === 'production';

const DEV_ORIGINS = [
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000',
  'http://127.0.0.1:3000'
];

// The deployed storefront. CLIENT_URL / ADDITIONAL_ORIGINS can extend this
// list, but the production frontend must never depend on a dashboard env var
// being remembered.
const PROD_ORIGINS = [
  'https://orivida.in',
  'https://www.orivida.in',
  'https://orvida.vercel.app',
];

const allowedOrigins = [
  ...PROD_ORIGINS,
  ...(process.env.CLIENT_URL ? process.env.CLIENT_URL.split(',').map((o) => o.trim()) : []),
  ...(process.env.ADDITIONAL_ORIGINS ? process.env.ADDITIONAL_ORIGINS.split(',').map((o) => o.trim()) : []),
  ...(isProduction ? [] : DEV_ORIGINS)
].filter(Boolean);

app.use(cors({
  origin: (origin, callback) => {
    // Same-origin and non-browser clients (curl, health checks) send no Origin.
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // In development the dev server may land on any localhost port.
    if (!isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
      return callback(null, true);
    }
    return callback(new Error(`Origin ${origin} is not permitted by CORS policy`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin']
}));

app.use(morgan(isProduction ? 'combined' : 'dev'));

// The Razorpay webhook signature is an HMAC over the exact bytes Razorpay
// sent, so this route must receive the raw body. It is registered before
// express.json() — once the JSON parser consumes the stream, the original
// bytes are gone and the signature can never be verified.
app.post(
  '/api/payments/webhook/razorpay',
  express.raw({ type: 'application/json', limit: '1mb' }),
  handleRazorpayWebhook
);

app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Brand assets are committed to the repository and shipped with the build.
// They are kept out of /uploads because that directory is frequently a mounted
// volume in production, which would shadow anything committed inside it.
app.use(
  '/assets',
  express.static(path.join(process.cwd(), 'assets'), { maxAge: '30d', immutable: false })
);

// Runtime uploads: legacy files committed to the repo serve from disk;
// everything uploaded since lives in Postgres so it survives redeploys.
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads'), { maxAge: '7d' }));
app.get('/uploads/:filename', async (req, res) => {
  const { filename } = req.params;
  if (!/^[\w][\w.-]*$/.test(filename)) {
    return res.status(400).json({ success: false, message: 'Invalid filename' });
  }
  try {
    const { query } = await import('./config/db.js');
    const result = await query('SELECT mime_type, data FROM uploads WHERE filename = $1', [filename]);
    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, message: 'File not found' });
    }
    res.set('Content-Type', result.rows[0].mime_type);
    res.set('Cache-Control', 'public, max-age=2592000, immutable');
    res.send(result.rows[0].data);
  } catch (error) {
    console.error('Upload fetch failed:', error.message);
    res.status(500).json({ success: false, message: 'Could not load the file' });
  }
});

// Crawler endpoints, generated from the live catalogue.
app.get('/sitemap.xml', getSitemap);
app.get('/robots.txt', getRobots);

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK',
    serverTime: new Date().toISOString(),
    message: 'ORVIDA Botanical Luxury Backend Server is live and healthy.',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/shipping', shippingRoutes);
app.use('/api/content', contentRoutes);
app.use('/api/seo', seoRoutes);
app.use('/api/blog', blogRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/banners', bannerRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/enquiries', enquiryRoutes);
app.use('/api/newsletter', newsletterRoutes);
app.use('/api/addresses', addressRoutes);

// Global 404 Handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route not found - ${req.originalUrl}` });
});

// Centralized Error Handler
app.use(errorHandler);

const startServer = (portToTry) => {
  const server = app.listen(portToTry, async () => {
    console.log(`==================================================`);
    console.log(`🌿 ORVIDA Backend running on port ${portToTry}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`==================================================`);
    
    await testConnection();
    await testMailer();
  });

  server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
      console.warn(`Port ${portToTry} is in use. Trying port ${portToTry + 1}...`);
      startServer(portToTry + 1);
    } else {
      console.error('Server failed to start:', err);
    }
  });
};

startServer(PORT);
