import { Router } from 'express';
import { UploadController, uploadMiddleware } from '../controllers/upload.controller.js';
import { requireAuth } from '../middleware/auth.middleware.js';
import { uploadLimiter } from '../middleware/rateLimit.middleware.js';

const router = Router();

// Upload requires authentication and rate limiting
router.post('/', requireAuth, uploadLimiter, uploadMiddleware, UploadController.uploadFiles);

// Protected download/streaming
router.get('/:filename', UploadController.getFile);

export default router;
