import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many authentication attempts. Please try again later.' },
});

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Too many login attempts. Please try again later.' },
});

export const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Upload rate limit exceeded. Please wait.' },
});

export const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000,
  standardHeaders: true,
  legacyHeaders: false,
  validate: false,
  message: { error: 'Rate limit exceeded. Please slow down.' },
});
