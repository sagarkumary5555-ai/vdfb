import { Response } from 'express';
import { z } from 'zod';
import { MessageService } from '../services/message.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { SocketService } from '../services/socket.service.js';
import { DiscordBridgeService } from '../services/discord.service.js';

const createMessageSchema = z.object({
  content: z.string().optional().default(''),
  replyToId: z.string().uuid().optional().nullable(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number(),
        storagePath: z.string(),
        discordUrl: z.string().optional(),
      })
    )
    .optional(),
});

export class MessageController {
  /**
   * Get message history (paginated)
   */
  static async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const cursor = req.query.cursor as string | undefined;

      const result = await MessageService.getMessages({ limit, cursor });
      res.json(result);
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch messages' });
    }
  }

  /**
   * Get pinned messages
   */
  static async getPinned(req: AuthRequest, res: Response): Promise<void> {
    try {
      const pinned = await MessageService.getPinnedMessages();
      res.json({ pinned });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch pinned messages' });
    }
  }

  /**
   * Get shared media gallery
   */
  static async getSharedMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const media = await MessageService.getSharedMedia();
      res.json({ media });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to fetch shared media' });
    }
  }

  /**
   * Toggle reaction
   */
  static async toggleReaction(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { emoji } = req.body;
      if (!emoji) {
        res.status(400).json({ error: 'Emoji is required' });
        return;
      }

      const updated = await MessageService.toggleReaction(id, emoji, req.user.id);
      if (!updated) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      SocketService.broadcastMessageEdit(updated);
      res.json({ message: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to toggle reaction' });
    }
  }

  /**
   * Toggle pin
   */
  static async togglePin(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await MessageService.togglePin(id);
      if (!updated) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      SocketService.broadcastMessageEdit(updated);
      res.json({ message: updated });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to toggle pin' });
    }
  }

  /**
   * Search messages
   */
  static async searchMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string | undefined;
      const senderId = req.query.senderId as string | undefined;
      const startDate = req.query.startDate as string | undefined;
      const endDate = req.query.endDate as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const messages = await MessageService.searchMessages({
        query,
        senderId,
        startDate,
        endDate,
        limit,
      });

      res.json({ messages });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Search failed' });
    }
  }

  /**
   * Create message via REST API
   */
  static async createMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = createMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { content, replyToId, attachments } = parsed.data;

      if (!content.trim() && (!attachments || attachments.length === 0)) {
        res.status(400).json({ error: 'Message content or attachment is required' });
        return;
      }

      const message = await MessageService.createMessage({
        senderId: req.user.id,
        content: content.trim(),
        source: 'website',
        replyToId,
        status: 'sent',
        attachments,
      });

      SocketService.broadcastNewMessage(message);

      DiscordBridgeService.sendWebMessageToDiscord(message).catch((err) => {
        console.error('Discord sync error:', err);
      });

      res.status(201).json({ message });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send message' });
    }
  }

  /**
   * Edit message
   */
  static async editMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const { content } = req.body;

      if (!content || !content.trim()) {
        res.status(400).json({ error: 'Content cannot be empty' });
        return;
      }

      const updated = await MessageService.editMessage(id, content.trim(), req.user.id);
      if (!updated) {
        res.status(403).json({ error: 'Cannot edit this message' });
        return;
      }

      SocketService.broadcastMessageEdit(updated);

      if (updated.discordMessageId) {
        DiscordBridgeService.syncEditToDiscord(
          updated.discordMessageId,
          updated.content,
          req.user.username
        );
      }

      res.json({ message: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to edit message' });
    }
  }

  /**
   * Delete message
   */
  static async deleteMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await MessageService.deleteMessage(id, req.user.id);

      if (!updated) {
        res.status(403).json({ error: 'Cannot delete this message' });
        return;
      }

      SocketService.broadcastMessageDelete(updated);

      if (updated.discordMessageId) {
        DiscordBridgeService.syncDeleteToDiscord(updated.discordMessageId, req.user.username);
      }

      res.json({ message: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to delete message' });
    }
  }

  /**
   * Mark all as read
   */
  static async markAllAsRead(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const readIds = await MessageService.markAllAsRead(req.user.id);
      res.json({ success: true, count: readIds.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mark read' });
    }
  }
}
