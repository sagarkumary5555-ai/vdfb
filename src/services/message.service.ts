import { prisma } from '../db/prisma.js';
import { MessageResponse, MessageReaction } from '../types/index.js';
import { AuthService } from './auth.service.js';

export class MessageService {
  /**
   * Get or create the single duo conversation
   */
  static async getOrCreateConversation() {
    let conversation = await prisma.conversation.findFirst();
    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          name: 'Sagar & Something',
        },
      });
    }
    return conversation;
  }

  /**
   * Create a new message
   */
  static async createMessage(params: {
    senderId: string;
    content: string;
    source?: 'website' | 'discord';
    discordMessageId?: string | null;
    discordChannelId?: string | null;
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
    const conversation = await this.getOrCreateConversation();

    const message = await prisma.message.create({
      data: {
        conversationId: conversation.id,
        senderId: params.senderId,
        content: params.content,
        source: params.source || 'website',
        discordMessageId: params.discordMessageId,
        discordChannelId: params.discordChannelId,
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

    return this.formatMessage(message);
  }

  /**
   * Get paginated messages
   */
  static async getMessages(options: {
    limit?: number;
    cursor?: string;
  }): Promise<{ messages: MessageResponse[]; nextCursor: string | null; hasMore: boolean }> {
    const limit = Math.min(options.limit || 50, 100);

    const queryOptions: any = {
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
        // Remove reaction
        existingEmojiGroup.users = existingEmojiGroup.users.filter((id) => id !== userId);
        if (existingEmojiGroup.users.length === 0) {
          reactions = reactions.filter((r) => r.emoji !== emoji);
        }
      } else {
        // Add user to reaction
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
  static async getPinnedMessages(): Promise<MessageResponse[]> {
    const pinned = await prisma.message.findMany({
      where: { isPinned: true, isDeleted: false },
      orderBy: { createdAt: 'desc' },
      include: { sender: true, replyTo: { include: { sender: true } }, attachments: true },
    });

    return pinned.map((m) => this.formatMessage(m));
  }

  /**
   * Get all shared media/attachments
   */
  static async getSharedMedia(): Promise<any[]> {
    const attachments = await prisma.attachment.findMany({
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
      discordUrl: att.discordUrl,
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
    senderId?: string;
    startDate?: string;
    endDate?: string;
    limit?: number;
  }): Promise<MessageResponse[]> {
    const limit = Math.min(params.limit || 50, 100);
    const where: any = {
      isDeleted: false,
    };

    if (params.query && params.query.trim()) {
      where.content = {
        contains: params.query.trim(),
      };
    }

    if (params.senderId) {
      where.senderId = params.senderId;
    }

    if (params.startDate || params.endDate) {
      where.createdAt = {};
      if (params.startDate) where.createdAt.gte = new Date(params.startDate);
      if (params.endDate) where.createdAt.lte = new Date(params.endDate);
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
   * Find message by Discord message ID
   */
  static async findByDiscordId(discordMessageId: string): Promise<MessageResponse | null> {
    const message = await prisma.message.findUnique({
      where: { discordMessageId },
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

    return message ? this.formatMessage(message) : null;
  }

  /**
   * Mark all unread messages as read by recipient
   */
  static async markAllAsRead(recipientId: string): Promise<string[]> {
    const unread = await prisma.message.findMany({
      where: {
        senderId: { not: recipientId },
        status: { not: 'read' },
      },
      select: { id: true },
    });

    const ids = unread.map((u) => u.id);
    if (ids.length > 0) {
      await prisma.message.updateMany({
        where: { id: { in: ids } },
        data: { status: 'read' },
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
      discordMessageId: message.discordMessageId,
      replyToId: message.replyToId,
      replyTo: message.replyTo
        ? {
            id: message.replyTo.id,
            sender: {
              displayName: message.replyTo.sender?.displayName || 'Unknown',
              username: message.replyTo.sender?.username || 'unknown',
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
        discordUrl: att.discordUrl,
        createdAt: att.createdAt,
      })),
    };
  }
}
