import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { UserJWTPayload, UserResponse } from '../types/index.js';

export class AuthService {
  /**
   * Register a new user account (Multi-user open registration)
   */
  static async register(
    params: {
      username: string;
      password: string;
      displayName?: string;
      avatarUrl?: string;
      bio?: string;
    },
    metadata?: { userAgent?: string; ipAddress?: string }
  ) {
    const normalizedUsername = params.username.trim().toLowerCase();

    // Validate username syntax (alphanumeric, underscores, dots)
    const usernameRegex = /^[a-z0-9_.]+$/;
    if (normalizedUsername.length < 3 || normalizedUsername.length > 30 || !usernameRegex.test(normalizedUsername)) {
      throw new Error('Username must be 3-30 characters long and contain only lowercase letters, numbers, underscores, or dots.');
    }

    if (!params.password || params.password.length < 4) {
      throw new Error('Password must be at least 4 characters long.');
    }

    const existingUser = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (existingUser) {
      throw new Error('Username is already taken. Please choose another.');
    }

    const passwordHash = await bcrypt.hash(params.password, 10);
    const displayName = params.displayName?.trim() || params.username.trim();
    const avatarUrl =
      params.avatarUrl?.trim() ||
      `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(normalizedUsername)}&backgroundColor=18181b`;

    const user = await prisma.user.create({
      data: {
        username: normalizedUsername,
        passwordHash,
        displayName,
        avatarUrl,
        customStatus: 'Available',
      },
    });

    // Create session in DB
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        expiresAt,
      },
    });

    const payload: UserJWTPayload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      sessionId: session.id,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });

    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    return {
      token,
      user: this.formatUser(user),
    };
  }

  /**
   * Authenticate any registered user
   */
  static async login(
    usernameInput: string,
    passwordInput: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ) {
    const normalizedUsername = usernameInput.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      throw new Error('User not found. Please register an account.');
    }

    const isPasswordValid = await bcrypt.compare(passwordInput, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Incorrect password.');
    }

    // Session duration: 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '',
        userAgent: metadata?.userAgent,
        ipAddress: metadata?.ipAddress,
        expiresAt,
      },
    });

    const payload: UserJWTPayload = {
      userId: user.id,
      username: user.username,
      displayName: user.displayName,
      sessionId: session.id,
    };

    const token = jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });

    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    await prisma.user.update({
      where: { id: user.id },
      data: { lastSeen: new Date() },
    });

    return {
      token,
      user: this.formatUser(user),
    };
  }

  /**
   * Validate a JWT token and verify active DB session
   */
  static async validateToken(token: string): Promise<UserResponse | null> {
    try {
      const decoded = jwt.verify(token, config.jwtSecret) as UserJWTPayload;
      const session = await prisma.session.findUnique({
        where: { id: decoded.sessionId },
        include: { user: true },
      });

      if (!session || new Date() > session.expiresAt) {
        return null;
      }

      return this.formatUser(session.user);
    } catch {
      return null;
    }
  }

  /**
   * Invalidate a session (Logout)
   */
  static async logout(token: string): Promise<void> {
    try {
      await prisma.session.deleteMany({
        where: { token },
      });
    } catch {
      // Ignore if session already deleted
    }
  }

  /**
   * Search users for Instagram-style DM discovery
   */
  static async searchUsers(query: string, currentUserId: string): Promise<UserResponse[]> {
    const q = query.trim().toLowerCase().replace(/^@/, '');
    if (!q) {
      // Return top active recent users
      const users = await prisma.user.findMany({
        where: { id: { not: currentUserId } },
        take: 20,
        orderBy: { updatedAt: 'desc' },
      });
      return users.map((u) => this.formatUser(u));
    }

    const users = await prisma.user.findMany({
      where: {
        AND: [
          { id: { not: currentUserId } },
          {
            OR: [
              { username: { contains: q } },
              { displayName: { contains: q } },
            ],
          },
        ],
      },
      take: 20,
      orderBy: { username: 'asc' },
    });

    return users.map((u) => this.formatUser(u));
  }

  /**
   * Update user profile
   */
  static async updateProfile(
    userId: string,
    updates: { displayName?: string; avatarUrl?: string; customStatus?: string }
  ): Promise<UserResponse> {
    const user = await prisma.user.update({
      where: { id: userId },
      data: {
        ...(updates.displayName && { displayName: updates.displayName.trim() }),
        ...(updates.avatarUrl !== undefined && { avatarUrl: updates.avatarUrl }),
        ...(updates.customStatus !== undefined && { customStatus: updates.customStatus.trim() }),
      },
    });

    return this.formatUser(user);
  }

  /**
   * Change user password
   */
  static async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    if (!newPassword || newPassword.length < 4) {
      throw new Error('New password must be at least 4 characters.');
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found.');

    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!isValid) throw new Error('Current password is incorrect.');

    const newHash = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });
  }

  /**
   * Get all users
   */
  static async getAllUsers(): Promise<UserResponse[]> {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: 'asc' },
    });
    return users.map((u) => this.formatUser(u));
  }

  /**
   * Format user record into public user response
   */
  static formatUser(user: any): UserResponse {
    return {
      id: user.id,
      username: user.username,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      customStatus: user.customStatus,
      lastSeen: user.lastSeen,
    };
  }
}
