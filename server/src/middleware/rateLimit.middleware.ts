import rateLimit from 'express-rate-limit';

/**
 * Rate limiter for login endpoints to protect against brute force
 */
export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 10, // Limit each IP to 10 login requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many login attempts. Please try again after 15 minutes.',
  },
});

/**
 * General API rate limiter
 */
export const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 120, // 120 requests per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Too many requests. Please slow down.',
  },
});

/**
 * Upload rate limiter
 */
export const uploadLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 30, // 30 uploads per 5 minutes
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: 'Upload limit reached. Please wait a few minutes.',
  },
});
