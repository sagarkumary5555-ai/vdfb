import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { MessageResponse, UserJWTPayload } from '../types/index.js';
import { MessageService } from './message.service.js';
import { DiscordBridgeService } from './discord.service.js';

interface AuthenticatedSocket extends Socket {
  user?: {
    userId: string;
    username: string;
    displayName: string;
  };
}

export class SocketService {
  private static io: SocketIOServer | null = null;
  private static userSockets = new Map<string, Set<string>>();
  private static typingTimeouts = new Map<string, NodeJS.Timeout>();

  /**
   * Initialize Socket.IO server
   */
  static init(httpServer: HttpServer) {
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
        credentials: true,
      },
      pingTimeout: 20000,
      pingInterval: 10000,
    });

    this.io.use(async (socket: AuthenticatedSocket, next) => {
      try {
        const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.replace('Bearer ', '');
        if (!token) {
          return next(new Error('Authentication required'));
        }

        const decoded = jwt.verify(token, config.jwtSecret) as UserJWTPayload;
        const session = await prisma.session.findUnique({
          where: { id: decoded.sessionId },
          include: { user: true },
        });

        if (!session || new Date() > session.expiresAt) {
          return next(new Error('Session expired or invalid'));
        }

        socket.user = {
          userId: session.user.id,
          username: session.user.username,
          displayName: session.user.displayName,
        };

        next();
      } catch (err) {
        next(new Error('Invalid token'));
      }
    });

    this.io.on('connection', (socket: AuthenticatedSocket) => {
      if (!socket.user) return;
      const { userId, username, displayName } = socket.user;

      console.log(`🔌 Socket connected: ${displayName} (${username}) [${socket.id}]`);

      // Track user sockets
      if (!this.userSockets.has(userId)) {
        this.userSockets.set(userId, new Set());
      }
      this.userSockets.get(userId)!.add(socket.id);

      socket.join('duo_room');

      // 1. Broadcast online status
      this.broadcastPresence(userId, username, 'online');

      // 2. Send active online status of any already connected partner
      for (const [activeUserId, socketSet] of this.userSockets.entries()) {
        if (activeUserId !== userId && socketSet.size > 0) {
          socket.emit('presence:update', {
            userId: activeUserId,
            status: 'online',
          });
        }
      }

      // ==========================================
      // WebRTC Live Voice & Video Calling Relays
      // ==========================================
      socket.on('call:initiate', (data: { type: 'audio' | 'video'; offer: any }) => {
        console.log(`📞 Call initiated by ${displayName} (type: ${data.type})`);
        socket.to('duo_room').emit('call:incoming', {
          callerId: userId,
          callerName: displayName,
          callerUsername: username,
          type: data.type,
          offer: data.offer,
        });
      });

      socket.on('call:accept', (data: { answer: any }) => {
        console.log(`✅ Call accepted by ${displayName}`);
        socket.to('duo_room').emit('call:accepted', {
          acceptorId: userId,
          answer: data.answer,
        });
      });

      socket.on('call:reject', (data?: { reason?: string }) => {
        console.log(`❌ Call rejected by ${displayName}`);
        socket.to('duo_room').emit('call:rejected', {
          rejectorId: userId,
          reason: data?.reason || 'declined',
        });
      });

      socket.on('call:end', () => {
        console.log(`🔴 Call ended by ${displayName}`);
        socket.to('duo_room').emit('call:ended', {
          endedById: userId,
        });
      });

      socket.on('call:ice-candidate', (data: { candidate: any }) => {
        socket.to('duo_room').emit('call:ice-candidate', {
          senderId: userId,
          candidate: data.candidate,
        });
      });

      socket.on('call:media-toggle', (data: { isMuted?: boolean; isVideoOff?: boolean; isScreenSharing?: boolean }) => {
        socket.to('duo_room').emit('call:peer-media-toggle', {
          senderId: userId,
          ...data,
        });
      });

      // Typing
      socket.on('typing:start', () => {
        socket.to('duo_room').emit('typing:status', {
          userId,
          username,
          displayName,
          isTyping: true,
        });

        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId)!);
        }
        const timeout = setTimeout(() => {
          socket.to('duo_room').emit('typing:status', {
            userId,
            username,
            displayName,
            isTyping: false,
          });
        }, 4000);
        this.typingTimeouts.set(userId, timeout);
      });

      socket.on('typing:stop', () => {
        if (this.typingTimeouts.has(userId)) {
          clearTimeout(this.typingTimeouts.get(userId)!);
        }
        socket.to('duo_room').emit('typing:status', {
          userId,
          username,
          displayName,
          isTyping: false,
        });
      });

      // Message Send
      socket.on('message:send', async (data, callback) => {
        try {
          const { content, replyToId, attachments } = data;
          if (!content?.trim() && (!attachments || !attachments.length)) {
            if (callback) callback({ error: 'Message cannot be empty' });
            return;
          }

          const savedMessage = await MessageService.createMessage({
            senderId: userId,
            content: content?.trim() || '',
            source: 'website',
            replyToId,
            status: 'sent',
            attachments,
          });

          if (callback) callback({ success: true, message: savedMessage });
          this.broadcastNewMessage(savedMessage);

          DiscordBridgeService.sendWebMessageToDiscord(savedMessage).catch((bridgeErr) => {
            console.error('Discord bridge send error:', bridgeErr);
          });
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

          if (updated.discordMessageId) {
            DiscordBridgeService.syncEditToDiscord(
              updated.discordMessageId,
              updated.content,
              username
            );
          }
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

          if (updated.discordMessageId) {
            DiscordBridgeService.syncDeleteToDiscord(updated.discordMessageId, username);
          }
        } catch (err: any) {
          console.error('Socket message:delete error:', err);
          if (callback) callback({ error: err.message });
        }
      });

      // Read Receipts
      socket.on('messages:read', async () => {
        try {
          const readIds = await MessageService.markAllAsRead(userId);
          if (readIds.length > 0) {
            this.io?.to('duo_room').emit('messages:status_updated', {
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
    this.io.to('duo_room').emit('message:new', message);
  }

  static broadcastMessageEdit(message: MessageResponse) {
    if (!this.io) return;
    this.io.to('duo_room').emit('message:updated', message);
  }

  static broadcastMessageDelete(message: MessageResponse) {
    if (!this.io) return;
    this.io.to('duo_room').emit('message:deleted', message);
  }

  static broadcastPresence(
    userId: string,
    username: string,
    status: 'online' | 'away' | 'offline',
    lastSeen: Date | null = null
  ) {
    if (!this.io) return;
    this.io.to('duo_room').emit('presence:update', {
      userId,
      username,
      status,
      lastSeen: lastSeen ? lastSeen.toISOString() : null,
    });
  }

  static broadcastTyping(userId: string, username: string, isTyping: boolean) {
    if (!this.io) return;
    this.io.to('duo_room').emit('typing:status', {
      userId,
      username,
      isTyping,
    });
  }

  static isUserOnline(userId: string): boolean {
    const sockets = this.userSockets.get(userId);
    return Boolean(sockets && sockets.size > 0);
  }
}
