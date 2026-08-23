import { Request, Response } from 'express';
import multer from 'multer';
import mime from 'mime-types';
import fs from 'fs';
import { StorageService } from '../services/storage.service.js';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { config } from '../config/index.js';

// Multer memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSizeMb * 1024 * 1024, // 50MB
  },
});

export const uploadMiddleware = upload.array('files', 10);

export class UploadController {
  /**
   * Handle multiple file upload
   */
  static async uploadFiles(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        res.status(400).json({ error: 'No files provided' });
        return;
      }

      const uploadedResults = [];

      for (const file of files) {
        const mimeType = file.mimetype || mime.lookup(file.originalname) || 'application/octet-stream';

        if (!StorageService.isAllowedMimeType(mimeType)) {
          res.status(400).json({
            error: `File type not supported: ${file.originalname} (${mimeType})`,
          });
          return;
        }

        const saved = await StorageService.saveFile(
          file.originalname,
          file.buffer,
          mimeType
        );

        uploadedResults.push({
          ...saved,
          url: `/api/uploads/${saved.filename}`,
        });
      }

      res.status(201).json({
        files: uploadedResults,
      });
    } catch (err: any) {
      console.error('File upload error:', err);
      res.status(500).json({ error: err.message || 'File upload failed' });
    }
  }

  /**
   * Protected file download / streaming
   */
  static async getFile(req: Request, res: Response): Promise<void> {
    try {
      const filename = Array.isArray(req.params.filename) ? req.params.filename[0] : req.params.filename;

      // Allow auth via Authorization header OR token query parameter (for audio/video/img tags)
      const token =
        req.headers.authorization?.replace('Bearer ', '') ||
        (req.query.token as string);

      if (!token) {
        res.status(401).json({ error: 'Authentication required to view files' });
        return;
      }

      const user = await AuthService.validateToken(token);
      if (!user) {
        res.status(401).json({ error: 'Invalid or expired session' });
        return;
      }

      const filePath = StorageService.getFilePath(filename);
      if (!filePath) {
        res.status(404).json({ error: 'File not found' });
        return;
      }

      const mimeType = mime.lookup(filePath) || 'application/octet-stream';
      const stat = await fs.promises.stat(filePath);

      res.setHeader('Content-Type', mimeType);
      res.setHeader('Content-Length', stat.size);
      res.setHeader('Cache-Control', 'private, max-age=86400'); // 1 day client cache

      // Stream file
      const stream = fs.createReadStream(filePath);
      stream.pipe(res);
    } catch (err: any) {
      console.error('File serve error:', err);
      res.status(500).json({ error: 'Error retrieving file' });
    }
  }
}
