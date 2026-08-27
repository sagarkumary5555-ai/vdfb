import { Response } from 'express';
import { z } from 'zod';
import { AuthService } from '../services/auth.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

const registerSchema = z.object({
  username: z.string().min(3).max(30),
  password: z.string().min(4),
  displayName: z.string().max(50).optional(),
  avatarUrl: z.string().optional(),
  bio: z.string().max(160).optional(),
});

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

const profileSchema = z.object({
  displayName: z.string().min(1).max(50).optional(),
  avatarUrl: z.string().optional(),
  customStatus: z.string().max(100).optional(),
});

const passwordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(4, 'New password must be at least 4 characters'),
});

export class AuthController {
  static async register(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = registerSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.register(parsed.data, metadata);
      res.status(201).json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Registration failed' });
    }
  }

  static async login(req: AuthRequest, res: Response): Promise<void> {
    try {
      const parsed = loginSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { username, password } = parsed.data;
      const metadata = {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip || req.socket.remoteAddress,
      };

      const result = await AuthService.login(username, password, metadata);
      res.json(result);
    } catch (err: any) {
      res.status(401).json({ error: err.message || 'Authentication failed' });
    }
  }

  static async me(req: AuthRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }
    res.json({ user: req.user });
  }

  static async logout(req: AuthRequest, res: Response): Promise<void> {
    const authHeader = req.headers.authorization;
    const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : '';
    if (token) {
      await AuthService.logout(token);
    }
    res.json({ success: true, message: 'Logged out successfully' });
  }

  static async searchUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const q = (req.query.q as string) || '';
      const users = await AuthService.searchUsers(q, req.user.id);
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to search users' });
    }
  }

  static async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = profileSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const updated = await AuthService.updateProfile(req.user.id, parsed.data);
      res.json({ user: updated });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to update profile' });
    }
  }

  static async changePassword(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = passwordSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      await AuthService.changePassword(
        req.user.id,
        parsed.data.currentPassword,
        parsed.data.newPassword
      );

      res.json({ success: true, message: 'Password updated successfully' });
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to change password' });
    }
  }

  static async getUsers(req: AuthRequest, res: Response): Promise<void> {
    try {
      const users = await AuthService.getAllUsers();
      res.json({ users });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  }
}
