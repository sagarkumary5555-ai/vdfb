import fs from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import mime from 'mime-types';
import { config } from '../config/index.js';

export class StorageService {
  private static allowedMimeTypes = new Set([
    // Images
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'image/svg+xml',
    'image/bmp',
    'image/heic',
    'image/heif',
    // Audio
    'audio/mpeg',
    'audio/ogg',
    'audio/wav',
    'audio/webm',
    'audio/aac',
    'audio/flac',
    'audio/m4a',
    'audio/mp4',
    // Video
    'video/mp4',
    'video/webm',
    'video/ogg',
    'video/quicktime',
    'video/x-msvideo',
    'video/x-matroska',
    // Documents
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/zip',
    'application/x-zip-compressed',
    'application/x-rar-compressed',
    'application/x-7z-compressed',
    'application/json',
    'text/plain',
    'text/markdown',
    'text/csv',
  ]);

  /**
   * Ensure upload directory exists
   */
  static init() {
    if (!fs.existsSync(config.uploadDir)) {
      fs.mkdirSync(config.uploadDir, { recursive: true });
    }
  }

  /**
   * Validate uploaded file type
   */
  static isAllowedMimeType(mimeType: string): boolean {
    return this.allowedMimeTypes.has(mimeType.toLowerCase());
  }

  /**
   * Save uploaded buffer or stream to disk
   */
  static async saveFile(
    originalName: string,
    buffer: Buffer,
    mimeType: string
  ): Promise<{ filename: string; originalName: string; mimeType: string; size: number; storagePath: string }> {
    this.init();

    // Sanitize extension
    const ext = path.extname(originalName).toLowerCase() || `.${mime.extension(mimeType) || 'bin'}`;
    const sanitizedBase = path.basename(originalName, ext).replace(/[^a-zA-Z0-9_-]/g, '_');
    const filename = `${uuidv4()}_${sanitizedBase}${ext}`;
    const storagePath = path.join(config.uploadDir, filename);

    // Write file to disk
    await fs.promises.writeFile(storagePath, buffer);
    const stats = await fs.promises.stat(storagePath);

    return {
      filename,
      originalName,
      mimeType,
      size: stats.size,
      storagePath,
    };
  }

  /**
   * Get absolute file path on disk
   */
  static getFilePath(filename: string): string | null {
    // Prevent directory traversal attacks
    const safeFilename = path.basename(filename);
    const filePath = path.join(config.uploadDir, safeFilename);

    if (fs.existsSync(filePath)) {
      return filePath;
    }
    return null;
  }

  /**
   * Delete a file
   */
  static async deleteFile(filename: string): Promise<boolean> {
    const filePath = this.getFilePath(filename);
    if (filePath) {
      try {
        await fs.promises.unlink(filePath);
        return true;
      } catch (err) {
        console.error(`Failed to delete file ${filename}:`, err);
      }
    }
    return false;
  }
}
