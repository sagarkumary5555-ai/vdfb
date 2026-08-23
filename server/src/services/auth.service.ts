import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../db/prisma.js';
import { config } from '../config/index.js';
import { UserJWTPayload, UserResponse } from '../types/index.js';

export class AuthService {
  /**
   * Authenticate a user (strictly 'sagar' or 'something')
   */
  static async login(
    usernameInput: string,
    passwordInput: string,
    metadata?: { userAgent?: string; ipAddress?: string }
  ) {
    const normalizedUsername = usernameInput.trim().toLowerCase();

    // Check if user is one of the two authorized accounts
    if (
      normalizedUsername !== config.authorizedUsers.sagar &&
      normalizedUsername !== config.authorizedUsers.something
    ) {
      throw new Error('Access denied: Unauthorized user.');
    }

    const user = await prisma.user.findUnique({
      where: { username: normalizedUsername },
    });

    if (!user) {
      throw new Error('Invalid credentials.');
    }

    const isPasswordValid = await bcrypt.compare(passwordInput, user.passwordHash);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials.');
    }

    // Session duration: 30 days
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30);

    // Create session in DB
    const session = await prisma.session.create({
      data: {
        userId: user.id,
        token: '', // Placeholder updated right after signing
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

    // Store token in session record
    await prisma.session.update({
      where: { id: session.id },
      data: { token },
    });

    // Update user lastSeen
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
    if (!newPassword || newPassword.length < 6) {
      throw new Error('New password must be at least 6 characters.');
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
   * Get all authorized users (Sagar & Something)
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
