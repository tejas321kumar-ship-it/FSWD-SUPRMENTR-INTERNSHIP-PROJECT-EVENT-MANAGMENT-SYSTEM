require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const rateLimit = require('express-rate-limit');
const multer = require('multer');
const connectDB = require('./config/db');
const errorHandler = require('./middleware/errorHandler');

// Fail fast on weak/missing JWT secret in production
if (process.env.NODE_ENV === 'production') {
  const secret = process.env.JWT_SECRET || '';
  if (secret.length < 32 || /change_in_prod|secret_here|default/i.test(secret)) {
    console.error('FATAL: JWT_SECRET is missing, too short, or contains placeholder text. Set a strong (32+ char) random value before starting in production.');
    process.exit(1);
  }
}

const app = express();
app.disable('x-powered-by');

// Trust the first proxy (Heroku, Render, Vercel, nginx) so rate-limit and req.ip
// reflect the real client IP rather than the proxy's IP.
if (process.env.NODE_ENV === 'production') {
  app.set('trust proxy', 1);
}

// Security headers
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));

// CORS — whitelist allowed origins (falls back to permissive in dev)
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];
app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

// Request logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
}

app.use(express.json({ limit: '5mb' }));

// Images are served via Cloudinary CDN — no local static uploads needed

// Rate limiting — only for login/register/password endpoints, not /me or /profile
// (authenticated users hit /me on every page load, so global limit would lock them out).
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 30, // 30 attempts per window per IP — enough for retries, blocks brute force
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests: true, // only count failed attempts
  message: { success: false, message: 'Too many attempts, please try again later' },
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Apply rate limit only to login + register paths
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/register', authLimiter);

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/events', require('./routes/events'));
app.use('/api/registrations', require('./routes/registrations'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/upload', require('./routes/upload'));

// Multer error handler (file too large, wrong type, etc.)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    const messages = { LIMIT_FILE_SIZE: 'File too large (max 5 MB)', LIMIT_UNEXPECTED_FILE: 'Unexpected file field' };
    return res.status(400).json({ success: false, message: messages[err.code] || err.message });
  }
  if (err.message && err.message.includes('Only image files')) {
    return res.status(400).json({ success: false, message: err.message });
  }
  next(err);
});

// Error handler (must be last)
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Global unhandled error handlers — prevent silent crashes in production
process.on('unhandledRejection', (reason) => {
  console.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  process.exit(1);
});

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`EventHub API running on port ${PORT}`);
  });
}).catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
