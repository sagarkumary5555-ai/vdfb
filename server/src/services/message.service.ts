import { prisma } from '../db/prisma.js';
import { MessageResponse, MessageReaction } from '../types/index.js';
import { AuthService } from './auth.service.js';

export class MessageService {
  /**
   * Get all conversations for a specific user (Instagram-style DM inbox)
   */
  static async getUserConversations(userId: string) {
    const participations = await prisma.conversationParticipant.findMany({
      where: { userId },
      include: {
        conversation: {
          include: {
            messages: {
              orderBy: { createdAt: 'desc' },
              take: 1,
              include: { sender: true },
            },
          },
        },
      },
    });

    const conversationList = await Promise.all(
      participations.map(async (p: any) => {
        const conv = p.conversation;

        const otherParticipantRecord = await prisma.conversationParticipant.findFirst({
          where: {
            conversationId: conv.id,
            userId: { not: userId },
          },
          include: { user: true },
        });

        const lastMsg = conv.messages[0] || null;

        const unreadCount = await prisma.message.count({
          where: {
            conversationId: conv.id,
            senderId: { not: userId },
            createdAt: { gt: p.lastReadAt },
          },
        });

        const otherUser = otherParticipantRecord ? AuthService.formatUser(otherParticipantRecord.user) : null;

        return {
          id: conv.id,
          name: conv.name || otherUser?.displayName || 'Direct Message',
          isGroup: conv.isGroup,
          otherUser,
          lastMessage: lastMsg ? this.formatMessage(lastMsg) : null,
          unreadCount,
          updatedAt: lastMsg?.createdAt || conv.updatedAt,
        };
      })
    );

    return conversationList.sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }

  /**
   * Get or create a direct 1-on-1 conversation between two users
   */
  static async getOrCreateDirectConversation(user1Id: string, user2Id: string) {
    if (user1Id === user2Id) {
      throw new Error('Cannot create conversation with yourself');
    }

    const user1Convs = await prisma.conversationParticipant.findMany({
      where: { userId: user1Id },
      select: { conversationId: true },
    });
    const convIds = user1Convs.map((c: any) => c.conversationId);

    const existing = await prisma.conversationParticipant.findFirst({
      where: {
        userId: user2Id,
        conversationId: { in: convIds },
      },
      include: {
        conversation: true,
      },
    });

    if (existing) {
      return existing.conversation;
    }

    const user2 = await prisma.user.findUnique({ where: { id: user2Id } });
    if (!user2) throw new Error('User does not exist');

    const conversation = await prisma.conversation.create({
      data: {
        isGroup: false,
        name: user2.displayName,
      },
    });

    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conversation.id, userId: user1Id },
        { conversationId: conversation.id, userId: user2Id },
      ],
    });

    return conversation;
  }

  /**
   * Create a new message
   */
  static async createMessage(params: {
    conversationId?: string;
    senderId: string;
    recipientId?: string;
    content: string;
    source?: 'website' | 'discord';
    replyToId?: string | null;
    status?: 'sent' | 'delivered' | 'read';
    attachments?: Array<{
      filename: string;
      originalName: string;
      mimeType: string;
      size: number;
      storagePath: string;
      discordUrl?: string | null;
    }>;
  }): Promise<MessageResponse> {
    let convId: string = params.conversationId || '';

    if (!convId) {
      if (params.recipientId) {
        const conv = await this.getOrCreateDirectConversation(params.senderId, params.recipientId);
        convId = conv.id;
      } else {
        let fallback = await prisma.conversation.findFirst();
        if (!fallback) {
          fallback = await prisma.conversation.create({ data: { name: 'General', isGroup: true } });
        }
        convId = fallback.id;
      }
    }

    const isParticipant = await prisma.conversationParticipant.findUnique({
      where: {
        conversationId_userId: {
          conversationId: convId,
          userId: params.senderId,
        },
      },
    });

    if (!isParticipant) {
      await prisma.conversationParticipant.create({
        data: { conversationId: convId, userId: params.senderId },
      });
    }

    const message = await prisma.message.create({
      data: {
        conversationId: convId,
        senderId: params.senderId,
        content: params.content,
        source: params.source || 'website',
        replyToId: params.replyToId,
        status: params.status || 'sent',
        reactions: '[]',
        attachments: {
          create: (params.attachments || []).map((att) => ({
            filename: att.filename,
            originalName: att.originalName,
            mimeType: att.mimeType,
            size: att.size,
            storagePath: att.storagePath,
            discordUrl: att.discordUrl,
          })),
        },
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
      },
    });

    await prisma.conversation.update({
      where: { id: convId },
      data: { updatedAt: new Date() },
    });

    return this.formatMessage(message);
  }

  /**
   * Get paginated messages in a conversation
   */
  static async getMessages(options: {
    conversationId?: string;
    limit?: number;
    cursor?: string;
  }): Promise<{ messages: MessageResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const limit = Math.min(options.limit || 50, 100);

    const where: any = {};
    if (options.conversationId) {
      where.conversationId = options.conversationId;
    }

    const queryOptions: any = {
      where,
      take: limit + 1,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
      },
    };

    if (options.cursor) {
      queryOptions.cursor = { id: options.cursor };
      queryOptions.skip = 1;
    }

    const records = await prisma.message.findMany(queryOptions);
    const hasMore = records.length > limit;
    const resultMessages = hasMore ? records.slice(0, limit) : records;
    const nextCursor = hasMore && resultMessages.length > 0 ? resultMessages[resultMessages.length - 1].id : null;

    const formatted = resultMessages.reverse().map((m) => this.formatMessage(m));

    return {
      messages: formatted,
      nextCursor,
      hasMore,
    };
  }

  /**
   * Toggle emoji reaction on a message
   */
  static async toggleReaction(messageId: string, emoji: string, userId: string): Promise<MessageResponse | null> {
    const msg = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true, replyTo: { include: { sender: true } }, attachments: true },
    });

    if (!msg || msg.isDeleted) return null;

    let reactions: MessageReaction[] = [];
    try {
      reactions = JSON.parse(msg.reactions || '[]');
    } catch {
      reactions = [];
    }

    const existingEmojiGroup = reactions.find((r) => r.emoji === emoji);

    if (existingEmojiGroup) {
      if (existingEmojiGroup.users.includes(userId)) {
        existingEmojiGroup.users = existingEmojiGroup.users.filter((id) => id !== userId);
        if (existingEmojiGroup.users.length === 0) {
          reactions = reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        existingEmojiGroup.users.push(userId);
      }
    } else {
      reactions.push({ emoji, users: [userId] });
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { reactions: JSON.stringify(reactions) },
      include: { sender: true, replyTo: { include: { sender: true } }, attachments: true },
    });

    return this.formatMessage(updated);
  }

  /**
   * Toggle pinned status of a message
   */
  static async togglePin(messageId: string): Promise<MessageResponse | null> {
    const msg = await prisma.message.findUnique({ where: { id: messageId } });
    if (!msg || msg.isDeleted) return null;

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: { isPinned: !msg.isPinned },
      include: { sender: true, replyTo: { include: { sender: true } }, attachments: true },
    });

    return this.formatMessage(updated);
  }

  /**
   * Get all pinned messages
   */
  static async getPinnedMessages(conversationId?: string): Promise<MessageResponse[]> {
    const where: any = { isPinned: true, isDeleted: false };
    if (conversationId) where.conversationId = conversationId;

    const pinned = await prisma.message.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: { sender: true, replyTo: { include: { sender: true } }, attachments: true },
    });

    return pinned.map((m) => this.formatMessage(m));
  }

  /**
   * Get all shared media/attachments
   */
  static async getSharedMedia(conversationId?: string): Promise<any[]> {
    const where: any = {};
    if (conversationId) {
      where.message = { conversationId };
    }

    const attachments = await prisma.attachment.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 100,
      include: {
        message: {
          include: { sender: true },
        },
      },
    });

    return attachments.map((att) => ({
      id: att.id,
      filename: att.filename,
      originalName: att.originalName,
      mimeType: att.mimeType,
      size: att.size,
      url: `/api/uploads/${att.filename}`,
      createdAt: att.createdAt,
      sender: AuthService.formatUser(att.message.sender),
      messageId: att.messageId,
    }));
  }

  /**
   * Search messages with filters
   */
  static async searchMessages(params: {
    query?: string;
    conversationId?: string;
    senderId?: string;
    limit?: number;
  }): Promise<MessageResponse[]> {
    const limit = Math.min(params.limit || 50, 100);
    const where: any = {
      isDeleted: false,
    };

    if (params.conversationId) {
      where.conversationId = params.conversationId;
    }

    if (params.query && params.query.trim()) {
      where.content = {
        contains: params.query.trim(),
      };
    }

    if (params.senderId) {
      where.senderId = params.senderId;
    }

    const messages = await prisma.message.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
      },
    });

    return messages.map((m) => this.formatMessage(m));
  }

  /**
   * Edit a message
   */
  static async editMessage(messageId: string, newContent: string, userId: string): Promise<MessageResponse | null> {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existing || existing.senderId !== userId || existing.isDeleted) {
      return null;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        content: newContent,
        isEdited: true,
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
      },
    });

    return this.formatMessage(updated);
  }

  /**
   * Soft delete a message
   */
  static async deleteMessage(messageId: string, userId: string): Promise<MessageResponse | null> {
    const existing = await prisma.message.findUnique({
      where: { id: messageId },
    });

    if (!existing || existing.senderId !== userId) {
      return null;
    }

    const updated = await prisma.message.update({
      where: { id: messageId },
      data: {
        isDeleted: true,
        content: 'This message was deleted.',
      },
      include: {
        sender: true,
        replyTo: {
          include: {
            sender: true,
          },
        },
        attachments: true,
      },
    });

    return this.formatMessage(updated);
  }

  /**
   * Mark all unread messages in a conversation as read by recipient
   */
  static async markAllAsRead(userId: string, conversationId?: string): Promise<string[]> {
    const where: any = {
      senderId: { not: userId },
      status: { not: 'read' },
    };
    if (conversationId) where.conversationId = conversationId;

    const unread = await prisma.message.findMany({
      where,
      select: { id: true, conversationId: true },
    });

    const ids = unread.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: ids } },
        data: { status: 'read' },
      });
    }

    if (conversationId) {
      await prisma.conversationParticipant.updateMany({
        where: { conversationId, userId },
        data: { lastReadAt: new Date() },
      });
    }

    return ids;
  }

  /**
   * Helper to format Prisma message to clean response
   */
  static formatMessage(message: any): MessageResponse {
    let reactions: MessageReaction[] = [];
    try {
      reactions = typeof message.reactions === 'string' ? JSON.parse(message.reactions || '[]') : message.reactions || [];
    } catch {
      reactions = [];
    }

    return {
      id: message.id,
      conversationId: message.conversationId,
      senderId: message.senderId,
      sender: AuthService.formatUser(message.sender),
      content: message.content,
      source: message.source as 'website' | 'discord',
      discordMessageId: message.discordMessageId || null,
      replyToId: message.replyToId,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            sender: {
              displayName: message.replyTo.sender?.displayName || 'User',
              username: message.replyTo.sender?.username || 'user',
            },
            content: message.replyTo.content,
          }
        : null,
      isEdited: message.isEdited,
      isDeleted: message.isDeleted,
      isPinned: Boolean(message.isPinned),
      reactions,
      status: message.status as 'sent' | 'delivered' | 'read',
      createdAt: message.createdAt,
      updatedAt: message.updatedAt,
      attachments: (message.attachments || []).map((att: any) => ({
        id: att.id,
        messageId: att.messageId,
        filename: att.filename,
        originalName: att.originalName,
        mimeType: att.mimeType,
        size: att.size,
        url: `/api/uploads/${att.filename}`,
        createdAt: att.createdAt,
      })),
    };
  }
}
