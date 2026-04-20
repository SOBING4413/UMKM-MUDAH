/**
 * Example Express.js security middleware untuk backend API (opsional).
 *
 * Pakai saat kamu menambahkan backend Node.js sendiri.
 */

import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import csrf from 'csurf';

const app = express();

app.set('trust proxy', 1);
app.use(helmet());
app.use(express.json({ limit: '100kb' }));
app.use(cookieParser());

app.use(cors({
  origin: ['https://your-domain.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE']
}));

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many auth attempts from this IP. Please try again later.'
  }
});

const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false
});

app.use('/auth', authLimiter);
app.use('/api', apiLimiter);

const csrfProtection = csrf({ cookie: { httpOnly: true, sameSite: 'lax', secure: true } });
app.use(csrfProtection);

app.get('/csrf-token', (req, res) => {
  res.json({ csrfToken: req.csrfToken() });
});

app.post('/auth/login', (req, res) => {
  // Validate & sanitize input first (zod/joi/validator)
  // Compare hashed password using argon2/bcrypt
  res.json({ ok: true });
});

app.use((err, req, res, next) => {
  if (err.code === 'EBADCSRFTOKEN') {
    return res.status(403).json({ error: 'Invalid CSRF token' });
  }
  return res.status(500).json({ error: 'Internal server error' });
});

export default app;
