import { Server as SocketIOServer, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { MessageService } from './message.service.js';
import { MessageResponse } from '../types/index.js';

export class SocketService {
  private static io: SocketIOServer | null = null;
  private static userSockets: Map<string, Set<string>> = new Map();

  static init(server: HttpServer): SocketIOServer {
    this.io = new SocketIOServer(server, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 60000,
      pingInterval: 25000,
    });

    // Authenticate socket connections
    this.io.use(async (socket: Socket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(' ')[1];
        if (!token) {
          return next(new Error('Authentication error: Token required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as { userId: string; username: string };
        const user = await prisma.user.findUnique({ where: { id: decoded.userId } });

        if (!user) {
          return next(new Error('Authentication error: User not found'));
        }

        socket.data.user = user;
        next();
      } catch (err: any) {
        next(new Error(`Authentication error: ${err.message}`));
      }
    });

    this.setupEventHandlers();
    return this.io;
  }

  private static setupEventHandlers() {
    if (!this.io) return;

    this.io.on('connection', async (socket: Socket) => {
      const user = socket.data.user;
      const userId = user.id;
      const username = user.username;
      const displayName = user.displayName;

      console.log(`⚡ Socket connected: ${displayName} (@${username}) [${socket.id}]`);

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      // Join user's personal notification room
      socket.join(`user_${userId}`);

      // Update database status
      await prisma.user.update({
        where: { id: userId },
        data: { lastSeen: new Date() },
      });

      // Broadcast online presence
      this.broadcastPresence(userId, username, 'online');

      // Join a conversation room
      socket.on('conversation:join', (conversationId: string) => {
        socket.join(`conv_${conversationId}`);
      });

      // Leave a conversation room
      socket.on('conversation:leave', (conversationId: string) => {
        socket.leave(`conv_${conversationId}`);
      });

      // ==========================================
      // WebRTC Direct Calling Signaling Events
      // ==========================================
      socket.on('call:initiate', (data) => {
        const { targetUserId, type, offer } = data;
        this.io?.to(`user_${targetUserId}`).emit('call:incoming', {
          callerId: userId,
          callerName: displayName,
          callerUsername: username,
          callerAvatar: user.avatarUrl,
          type, // 'audio' | 'video'
          offer,
        });
      });

      socket.on('call:accept', (data) => {
        const { callerId, answer } = data;
        this.io?.to(`user_${callerId}`).emit('call:accepted', {
          acceptorId: userId,
          answer,
        });
      });

      socket.on('call:reject', (data) => {
        const { callerId, reason } = data;
        this.io?.to(`user_${callerId}`).emit('call:rejected', {
          rejectorId: userId,
          reason: reason || 'declined',
        });
      });

      socket.on('call:end', (data) => {
        const { targetUserId } = data || {};
        if (targetUserId) {
          this.io?.to(`user_${targetUserId}`).emit('call:ended', { endedBy: userId });
        }
      });

      socket.on('call:ice-candidate', (data) => {
        const { targetUserId, candidate } = data;
        this.io?.to(`user_${targetUserId}`).emit('call:ice-candidate', {
          senderId: userId,
          candidate,
        });
      });

      socket.on('call:media-toggle', (data) => {
        const { targetUserId } = data;
        this.io?.to(`user_${targetUserId}`).emit('call:peer-media-toggle', data);
      });

      // Typing indicators for a conversation
      socket.on('typing:start', (data: { conversationId: string }) => {
        socket.to(`conv_${data.conversationId}`).emit('typing:status', {
          conversationId: data.conversationId,
          userId,
          username,
          displayName,
          isTyping: true,
        });
      });

      socket.on('typing:stop', (data: { conversationId: string }) => {
        socket.to(`conv_${data.conversationId}`).emit('typing:status', {
          conversationId: data.conversationId,
          userId,
          username,
          displayName,
          isTyping: false,
        });
      });

      // Send Message via Socket
      socket.on('message:send', async (data, callback) => {
        try {
          const { content, conversationId, recipientId, replyToId, attachments } = data;

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
          const { messageId, emoji } = data;
          const updated = await MessageService.toggleReaction(messageId, emoji, userId);
          if (updated) {
            if (callback) callback({ success: true, message: updated });
            this.broadcastMessageEdit(updated);
          }
        } catch (err: any) {
          if (callback) callback({ error: err.message });
        }
      });

      // Message Pin Toggle
      socket.on('message:pin', async (data, callback) => {
        try {
          const { messageId } = data;
          const updated = await MessageService.togglePin(messageId);
          if (updated) {
            if (callback) callback({ success: true, message: updated });
            this.broadcastMessageEdit(updated);
          }
        } catch (err: any) {
          if (callback) callback({ error: err.message });
        }
      });

      // Message Edit
      socket.on('message:edit', async (data, callback) => {
        try {
          const { messageId, newContent } = data;
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
          const { messageId } = data;
          const updated = await MessageService.deleteMessage(messageId, userId);
          if (!updated) {
            if (callback) callback({ error: 'Cannot delete message' });
            return;
          }

          if (callback) callback({ success: true, message: updated });
          this.broadcastMessageDelete(updated);
        } catch (err: any) {
          console.error('Socket message:delete error:', err);
          if (callback) callback({ error: err.message });
        }
      });

      // Read Receipts
      socket.on('messages:read', async (data: { conversationId?: string }) => {
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
      });
    });
  }

  static broadcastNewMessage(message: MessageResponse) {
    if (!this.io) return;
    // Broadcast to the conversation room
    this.io.to(`conv_${message.conversationId}`).emit('message:new', message);
    // Also emit globally for conversation list inbox update
    this.io.emit('conversation:activity', {
      conversationId: message.conversationId,
      message,
    });
  }

  static broadcastMessageEdit(message: MessageResponse) {
    if (!this.io) return;
    this.io.to(`conv_${message.conversationId}`).emit('message:updated', message);
  }

  static broadcastMessageDelete(message: MessageResponse) {
    if (!this.io) return;
    this.io.to(`conv_${message.conversationId}`).emit('message:deleted', message);
  }

  static broadcastPresence(
    userId: string,
    username: string,
    status: 'online' | 'away' | 'offline',
    lastSeen: Date | null = null
  ) {
    if (!this.io) return;
    this.io.emit('presence:update', {
      userId,
      username,
      status,
      lastSeen: lastSeen ? lastSeen.toISOString() : null,
    });
  }

  static isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }
}
