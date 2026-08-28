import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { MessageService } from './message.service.js';
import { UserJWTPayload, MessageResponse } from '../types/index.js';

export class SocketService {
  private static io: Server | null = null;
  private static userSockets: Map<string, Set<string>> = new Map();

  static init(httpServer: HttpServer) {
    this.io = new Server(httpServer, {
      cors: {
        origin: config.clientUrl || true,
        credentials: true,
      },
      pingTimeout: 30000,
      pingInterval: 10000,
    });

    // JWT Authentication Middleware for Socket.IO
    this.io.use(async (socket: Socket, next) => {
      try {
        const token =
          socket.handshake.auth.token ||
          socket.handshake.headers.authorization?.replace('Bearer ', '') ||
          socket.handshake.query.token;

        if (!token || typeof token !== 'string') {
          return next(new Error('Authentication token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as UserJWTPayload;
        const user = await prisma.user.findUnique({
          where: { id: decoded.userId },
        });

        if (!user) {
          return next(new Error('User not found'));
        }

        socket.data.user = user;
        next();
      } catch (err: any) {
        next(new Error(`Authentication failed: ${err.message}`));
      }
    });

    this.setupEventHandlers();
    console.log('⚡ Socket.IO real-time social gateway initialized');
  }

  private static setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', async (socket: Socket) => {
      const user = socket.data.user;
      if (!user) return;

      const userId = user.id;
      const username = user.username;
      const displayName = user.displayName;

      console.log(`⚡ Socket connected: ${displayName} (@${username}) [${socket.id}]`);

      const isFirstSocket = !this.userSockets.has(userId) || this.userSockets.get(userId)!.size === 0;

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's personal notification room
      socket.join(`user_${userId}`);

      // Update database status
      try {
        await prisma.user.update({
          where: { id: userId },
          data: { lastSeen: new Date() },
        });
      } catch (err) {
        // Safe ignore
      }

      // Send initial presence map of all currently active users to this client
      socket.emit('presence:init', {
        onlineUserIds: Array.from(this.userSockets.keys()),
      });

      // If user just came online, broadcast to all other connected clients
      if (isFirstSocket) {
        this.broadcastPresence(userId, username, 'online');
      }

      // Handle client requesting online user list
      socket.on('presence:get_online', (callback) => {
        if (typeof callback === 'function') {
          callback({ onlineUserIds: Array.from(this.userSockets.keys()) });
        }
      });

      // Join a conversation room
      socket.on('conversation:join', (conversationId: string) => {
        if (conversationId) {
          socket.join(`conv_${conversationId}`);
        }
      });

      // Leave a conversation room
      socket.on('conversation:leave', (conversationId: string) => {
        if (conversationId) {
          socket.leave(`conv_${conversationId}`);
        }
      });

      // ==========================================
      // WebRTC Direct Calling Signaling Events
      // ==========================================
      socket.on('call:initiate', (data) => {
        try {
          const { targetUserId, type, offer } = data || {};
          if (targetUserId) {
            this.io?.to(`user_${targetUserId}`).emit('call:incoming', {
              callerId: userId,
              callerName: displayName,
              callerUsername: username,
              callerAvatar: user.avatarUrl,
              type, // 'audio' | 'video'
              offer,
            });
          }
        } catch (err) {
          console.error('call:initiate error:', err);
        }
      });

      socket.on('call:accept', (data) => {
        try {
          const { callerId, answer } = data || {};
          if (callerId) {
            this.io?.to(`user_${callerId}`).emit('call:accepted', {
              acceptorId: userId,
              answer,
            });
          }
        } catch (err) {
          console.error('call:accept error:', err);
        }
      });

      socket.on('call:reject', (data) => {
        try {
          const { callerId, reason } = data || {};
          if (callerId) {
            this.io?.to(`user_${callerId}`).emit('call:rejected', {
              rejectorId: userId,
              reason: reason || 'declined',
            });
          }
        } catch (err) {
          console.error('call:reject error:', err);
        }
      });

      socket.on('call:end', (data) => {
        try {
          const { targetUserId } = data || {};
          if (targetUserId) {
            this.io?.to(`user_${targetUserId}`).emit('call:ended', { endedBy: userId });
          }
        } catch (err) {
          console.error('call:end error:', err);
        }
      });

      socket.on('call:ice-candidate', (data) => {
        try {
          const { targetUserId, candidate } = data || {};
          if (targetUserId && candidate) {
            this.io?.to(`user_${targetUserId}`).emit('call:ice-candidate', {
              senderId: userId,
              candidate,
            });
          }
        } catch (err) {
          console.error('call:ice-candidate error:', err);
        }
      });

      socket.on('call:media-toggle', (data) => {
        try {
          const { targetUserId } = data || {};
          if (targetUserId) {
            this.io?.to(`user_${targetUserId}`).emit('call:peer-media-toggle', data);
          }
        } catch (err) {
          console.error('call:media-toggle error:', err);
        }
      });

      // Typing indicators for a conversation (Protected with null check!)
      socket.on('typing:start', (data?: { conversationId?: string }) => {
        try {
          if (data?.conversationId) {
            socket.to(`conv_${data.conversationId}`).emit('typing:status', {
              conversationId: data.conversationId,
              userId,
              username,
              displayName,
              isTyping: true,
            });
          } else {
            socket.broadcast.emit('typing:status', {
              userId,
              username,
              displayName,
              isTyping: true,
            });
          }
        } catch (err) {
          console.error('typing:start error:', err);
        }
      });

      socket.on('typing:stop', (data?: { conversationId?: string }) => {
        try {
          if (data?.conversationId) {
            socket.to(`conv_${data.conversationId}`).emit('typing:status', {
              conversationId: data.conversationId,
              userId,
              username,
              displayName,
              isTyping: false,
            });
          } else {
            socket.broadcast.emit('typing:status', {
              userId,
              username,
              displayName,
              isTyping: false,
            });
          }
        } catch (err) {
          console.error('typing:stop error:', err);
        }
      });

      // Send Message via Socket
      socket.on('message:send', async (data, callback) => {
        try {
          const { content, conversationId, recipientId, replyToId, attachments } = data || {};

          if (!content?.trim() && (!attachments || attachments.length === 0)) {
            if (callback) callback({ error: 'Message content or attachment is required' });
            return;
          }

          const savedMessage = await MessageService.createMessage({
            conversationId,
            senderId: userId,
            recipientId,
            content: content?.trim() || '',
            source: 'website',
            replyToId,
            status: 'sent',
            attachments,
          });

          if (callback) callback({ success: true, message: savedMessage });
          this.broadcastNewMessage(savedMessage);
        } catch (err: any) {
          console.error('Socket message:send error:', err);
          if (callback) callback({ error: err.message || 'Failed to send message' });
        }
      });

      // Message Reaction
      socket.on('message:react', async (data, callback) => {
        try {
          const { messageId, emoji } = data || {};
          if (messageId && emoji) {
            const updated = await MessageService.toggleReaction(messageId, emoji, userId);
            if (updated) {
              if (callback) callback({ success: true, message: updated });
              this.broadcastMessageEdit(updated);
            }
          }
        } catch (err: any) {
          if (callback) callback({ error: err.message });
        }
      });

      // Message Pin Toggle
      socket.on('message:pin', async (data, callback) => {
        try {
          const { messageId } = data || {};
          if (messageId) {
            const updated = await MessageService.togglePin(messageId);
            if (updated) {
              if (callback) callback({ success: true, message: updated });
              this.broadcastMessageEdit(updated);
            }
          }
        } catch (err: any) {
          if (callback) callback({ error: err.message });
        }
      });

      // Message Edit
      socket.on('message:edit', async (data, callback) => {
        try {
          const { messageId, newContent } = data || {};
          if (!newContent || !newContent.trim()) {
            if (callback) callback({ error: 'Content cannot be empty' });
            return;
          }

          const updated = await MessageService.editMessage(messageId, newContent.trim(), userId);
          if (!updated) {
            if (callback) callback({ error: 'Cannot edit message' });
            return;
          }

          if (callback) callback({ success: true, message: updated });
          this.broadcastMessageEdit(updated);
        } catch (err: any) {
          console.error('Socket message:edit error:', err);
          if (callback) callback({ error: err.message });
        }
      });

      // Message Delete
      socket.on('message:delete', async (data, callback) => {
        try {
          const { messageId } = data || {};
          if (messageId) {
            const updated = await MessageService.deleteMessage(messageId, userId);
            if (!updated) {
              if (callback) callback({ error: 'Cannot delete message' });
              return;
            }

            if (callback) callback({ success: true, message: updated });
            this.broadcastMessageDelete(updated);
          }
        } catch (err: any) {
          console.error('Socket message:delete error:', err);
          if (callback) callback({ error: err.message });
        }
      });

      // Read Receipts
      socket.on('messages:read', async (data?: { conversationId?: string }) => {
        try {
          const readIds = await MessageService.markAllAsRead(userId, data?.conversationId);
          if (readIds.length > 0 && data?.conversationId) {
            this.io?.to(`conv_${data.conversationId}`).emit('messages:status_updated', {
              conversationId: data.conversationId,
              messageIds: readIds,
              status: 'read',
              readByUserId: userId,
            });
          }
        } catch (err) {
          console.error('Error marking messages as read:', err);
        }
      });

      // Disconnect
      socket.on('disconnect', async () => {
        try {
          const userSocketSet = this.userSockets.get(userId);
          if (userSocketSet) {
            userSocketSet.delete(socket.id);
            if (userSocketSet.size === 0) {
              this.userSockets.delete(userId);
              const now = new Date();
              await prisma.user.update({
                where: { id: userId },
                data: { lastSeen: now },
              });
              this.broadcastPresence(userId, username, 'offline', now);
            }
          }
          console.log(`🔌 Socket disconnected: ${displayName} [${socket.id}]`);
        } catch (err) {
          // Ignore
        }
      });
    });
  }

  static broadcastNewMessage(message: MessageResponse) {
    if (!this.io) return;
    try {
      // Broadcast to the conversation room
      this.io.to(`conv_${message.conversationId}`).emit('message:new', message);
      // Also emit globally for conversation list inbox update
      this.io.emit('conversation:activity', {
        conversationId: message.conversationId,
        message,
      });
    } catch (err) {
      console.error('broadcastNewMessage error:', err);
    }
  }

  static broadcastMessageEdit(message: MessageResponse) {
    if (!this.io) return;
    try {
      this.io.to(`conv_${message.conversationId}`).emit('message:updated', message);
    } catch (err) {
      console.error('broadcastMessageEdit error:', err);
    }
  }

  static broadcastMessageDelete(message: MessageResponse) {
    if (!this.io) return;
    try {
      this.io.to(`conv_${message.conversationId}`).emit('message:deleted', message);
    } catch (err) {
      console.error('broadcastMessageDelete error:', err);
    }
  }

  static broadcastPresence(
    userId: string,
    username: string,
    status: 'online' | 'away' | 'offline',
    lastSeen: Date | null = null
  ) {
    if (!this.io) return;
    try {
      this.io.emit('presence:update', {
        userId,
        username,
        status,
        lastSeen: lastSeen ? lastSeen.toISOString() : null,
      });
    } catch (err) {
      console.error('broadcastPresence error:', err);
    }
  }

  static broadcastFriendRequestReceived(recipientUserId: string, requesterUser: any) {
    if (!this.io) return;
    try {
      this.io.to(`user_${recipientUserId}`).emit('friend:request_received', { requester: requesterUser });
    } catch (err) {
      console.error('broadcastFriendRequestReceived error:', err);
    }
  }

  static broadcastFriendRequestAccepted(userAId: string, userBId: string) {
    if (!this.io) return;
    try {
      this.io.to(`user_${userAId}`).emit('friend:request_accepted', { friendId: userBId });
      this.io.to(`user_${userBId}`).emit('friend:request_accepted', { friendId: userAId });
    } catch (err) {
      console.error('broadcastFriendRequestAccepted error:', err);
    }
  }

  static broadcastFriendRemoved(userAId: string, userBId: string) {
    if (!this.io) return;
    try {
      this.io.to(`user_${userAId}`).emit('friend:removed', { friendId: userBId });
      this.io.to(`user_${userBId}`).emit('friend:removed', { friendId: userAId });
    } catch (err) {
      console.error('broadcastFriendRemoved error:', err);
    }
  }

  static isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }
}
