import { prisma } from '../db/prisma.js';

export interface FriendUser {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string | null;
  customStatus: string | null;
  lastSeen: Date | null;
}

export interface FriendRequestItem {
  id: string;
  user: FriendUser;
  createdAt: Date;
}

export class FriendsService {
  /**
   * Check if two users are accepted friends
   */
  static async areFriends(userAId: string, userBId: string): Promise<boolean> {
    if (userAId === userBId) return true; // Same user

    try {
      const friendship: any[] = await prisma.$queryRawUnsafe(
        `SELECT id FROM "Friendship" 
         WHERE status = 'accepted' 
         AND (("requesterId" = ? AND "addresseeId" = ?) OR ("requesterId" = ? AND "addresseeId" = ?))
         LIMIT 1`,
        userAId,
        userBId,
        userBId,
        userAId
      );

      return friendship.length > 0;
    } catch {
      return false;
    }
  }

  /**
   * Get friendship status between two users
   */
  static async getFriendshipStatus(userAId: string, userBId: string): Promise<'none' | 'pending_sent' | 'pending_received' | 'accepted'> {
    if (userAId === userBId) return 'accepted';

    try {
      const records: any[] = await prisma.$queryRawUnsafe(
        `SELECT * FROM "Friendship"
         WHERE ("requesterId" = ? AND "addresseeId" = ?) OR ("requesterId" = ? AND "addresseeId" = ?)
         LIMIT 1`,
        userAId,
        userBId,
        userBId,
        userAId
      );

      if (records.length === 0) return 'none';
      const record = records[0];

      if (record.status === 'accepted') return 'accepted';
      if (record.status === 'pending') {
        if (record.requesterId === userAId) return 'pending_sent';
        return 'pending_received';
      }

      return 'none';
    } catch {
      return 'none';
    }
  }

  /**
   * Send a friend request
   */
  static async sendFriendRequest(requesterId: string, targetIdentifier: string): Promise<{ success: boolean; message: string; friendUser?: FriendUser }> {
    // Find target user by ID or Username
    const targetUser = await prisma.user.findFirst({
      where: {
        OR: [
          { id: targetIdentifier },
          { username: targetIdentifier.toLowerCase().replace('@', '').trim() },
        ],
      },
      select: {
        id: true,
        username: true,
        displayName: true,
        avatarUrl: true,
        customStatus: true,
        lastSeen: true,
      },
    });

    if (!targetUser) {
      throw new Error('User not found');
    }

    if (targetUser.id === requesterId) {
      throw new Error('You cannot send a friend request to yourself');
    }

    // Check existing relationship
    const existing: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM "Friendship"
       WHERE ("requesterId" = ? AND "addresseeId" = ?) OR ("requesterId" = ? AND "addresseeId" = ?)
       LIMIT 1`,
      requesterId,
      targetUser.id,
      targetUser.id,
      requesterId
    );

    if (existing.length > 0) {
      const rel = existing[0];
      if (rel.status === 'accepted') {
        return { success: true, message: 'You are already friends!', friendUser: targetUser };
      }
      if (rel.status === 'pending') {
        if (rel.requesterId === requesterId) {
          return { success: true, message: 'Friend request already sent and pending', friendUser: targetUser };
        }
        // If they already sent us a request, auto-accept it!
        await prisma.$executeRawUnsafe(
          `UPDATE "Friendship" SET status = 'accepted', "updatedAt" = CURRENT_TIMESTAMP WHERE id = ?`,
          rel.id
        );
        return { success: true, message: 'Friend request accepted!', friendUser: targetUser };
      }
    }

    // Create new friend request
    const requestId = `fr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await prisma.$executeRawUnsafe(
      `INSERT INTO "Friendship" ("id", "requesterId", "addresseeId", "status", "createdAt", "updatedAt")
       VALUES (?, ?, ?, 'pending', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      requestId,
      requesterId,
      targetUser.id
    );

    return {
      success: true,
      message: 'Friend request sent successfully',
      friendUser: targetUser,
    };
  }

  /**
   * Accept an incoming friend request
   */
  static async acceptFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    const res = await prisma.$executeRawUnsafe(
      `UPDATE "Friendship" 
       SET status = 'accepted', "updatedAt" = CURRENT_TIMESTAMP
       WHERE "requesterId" = ? AND "addresseeId" = ? AND status = 'pending'`,
      requesterId,
      userId
    );
    return res > 0;
  }

  /**
   * Decline an incoming friend request
   */
  static async declineFriendRequest(userId: string, requesterId: string): Promise<boolean> {
    const res = await prisma.$executeRawUnsafe(
      `DELETE FROM "Friendship"
       WHERE "requesterId" = ? AND "addresseeId" = ? AND status = 'pending'`,
      requesterId,
      userId
    );
    return res > 0;
  }

  /**
   * Remove friend / Unfriend
   */
  static async removeFriend(userId: string, friendId: string): Promise<boolean> {
    const res = await prisma.$executeRawUnsafe(
      `DELETE FROM "Friendship"
       WHERE ("requesterId" = ? AND "addresseeId" = ?) OR ("requesterId" = ? AND "addresseeId" = ?)`,
      userId,
      friendId,
      friendId,
      userId
    );
    return res > 0;
  }

  /**
   * Get all friends and pending requests for a user
   */
  static async getFriendsOverview(userId: string) {
    // 1. Accepted Friends
    const acceptedRecords: any[] = await prisma.$queryRawUnsafe(
      `SELECT 
        CASE WHEN "requesterId" = ? THEN "addresseeId" ELSE "requesterId" END AS friend_id,
        "createdAt" as friendship_date
       FROM "Friendship"
       WHERE status = 'accepted' AND ("requesterId" = ? OR "addresseeId" = ?)`,
      userId,
      userId,
      userId
    );

    const friendIds = acceptedRecords.map((r) => r.friend_id);
    let friends: FriendUser[] = [];
    if (friendIds.length > 0) {
      friends = await prisma.user.findMany({
        where: { id: { in: friendIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          customStatus: true,
          lastSeen: true,
        },
        orderBy: { displayName: 'asc' },
      });
    }

    // 2. Incoming Requests (Sent to this user)
    const incomingRecords: any[] = await prisma.$queryRawUnsafe(
      `SELECT "requesterId" as requester_id, "createdAt" as req_date
       FROM "Friendship"
       WHERE status = 'pending' AND "addresseeId" = ?`,
      userId
    );

    const incomingIds = incomingRecords.map((r) => r.requester_id);
    let incomingRequests: FriendRequestItem[] = [];
    if (incomingIds.length > 0) {
      const incomingUsers = await prisma.user.findMany({
        where: { id: { in: incomingIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          customStatus: true,
          lastSeen: true,
        },
      });

      incomingRequests = incomingUsers.map((u) => {
        const row = incomingRecords.find((r) => r.requester_id === u.id);
        return {
          id: u.id,
          user: u,
          createdAt: row ? new Date(row.req_date) : new Date(),
        };
      });
    }

    // 3. Outgoing Requests (Sent by this user)
    const outgoingRecords: any[] = await prisma.$queryRawUnsafe(
      `SELECT "addresseeId" as addressee_id, "createdAt" as req_date
       FROM "Friendship"
       WHERE status = 'pending' AND "requesterId" = ?`,
      userId
    );

    const outgoingIds = outgoingRecords.map((r) => r.addressee_id);
    let outgoingRequests: FriendRequestItem[] = [];
    if (outgoingIds.length > 0) {
      const outgoingUsers = await prisma.user.findMany({
        where: { id: { in: outgoingIds } },
        select: {
          id: true,
          username: true,
          displayName: true,
          avatarUrl: true,
          customStatus: true,
          lastSeen: true,
        },
      });

      outgoingRequests = outgoingUsers.map((u) => {
        const row = outgoingRecords.find((r) => r.addressee_id === u.id);
        return {
          id: u.id,
          user: u,
          createdAt: row ? new Date(row.req_date) : new Date(),
        };
      });
    }

    return {
      friends,
      incomingRequests,
      outgoingRequests,
      pendingCount: incomingRequests.length,
    };
  }
}
