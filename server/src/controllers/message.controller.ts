import { Request, Response } from 'express';
import { z } from 'zod';
import { MessageService } from '../services/message.service.js';
import { SocketService } from '../services/socket.service.js';
import { AuthRequest } from '../middleware/auth.middleware.js';

const sendMessageSchema = z.object({
  conversationId: z.string().optional(),
  recipientId: z.string().optional(),
  content: z.string().max(4000).default(''),
  replyToId: z.string().optional().nullable(),
  attachments: z
    .array(
      z.object({
        filename: z.string(),
        originalName: z.string(),
        mimeType: z.string(),
        size: z.number(),
        storagePath: z.string(),
      })
    )
    .optional(),
});

export class MessageController {
  /**
   * Get user's conversation list (Instagram-style inbox)
   */
  static async getConversations(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const conversations = await MessageService.getUserConversations(req.user.id);
      res.json({ conversations });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch conversations' });
    }
  }

  /**
   * Start or get direct conversation with a specific user
   */
  static async getOrCreateDirect(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { targetUserId } = req.body;
      if (!targetUserId) {
        res.status(400).json({ error: 'targetUserId is required' });
        return;
      }

      const conversation = await MessageService.getOrCreateDirectConversation(req.user.id, targetUserId);
      res.json({ conversation });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to start conversation' });
    }
  }

  /**
   * Create a new group conversation
   */
  static async createGroup(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }
      const { name, participantIds } = req.body;
      if (!name || !name.trim()) {
        res.status(400).json({ error: 'Group name is required' });
        return;
      }
      if (!Array.isArray(participantIds) || participantIds.length === 0) {
        res.status(400).json({ error: 'At least one participant is required' });
        return;
      }

      const conversation = await MessageService.createGroupConversation(req.user.id, name.trim(), participantIds);
      res.status(201).json({ conversation });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to create group' });
    }
  }

  /**
   * Get participants for a conversation
   */
  static async getParticipants(req: AuthRequest, res: Response): Promise<void> {
    try {
      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const participants = await MessageService.getConversationParticipants(id);
      res.json({ participants });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch participants' });
    }
  }

  /**
   * Get messages in a conversation
   */
  static async getMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const conversationId = req.query.conversationId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const cursor = req.query.cursor as string | undefined;

      const result = await MessageService.getMessages({ conversationId, limit, cursor });
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
      const conversationId = req.query.conversationId as string | undefined;
      const pinned = await MessageService.getPinnedMessages(conversationId);
      res.json({ pinned });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch pinned messages' });
    }
  }

  /**
   * Get shared media
   */
  static async getSharedMedia(req: AuthRequest, res: Response): Promise<void> {
    try {
      const conversationId = req.query.conversationId as string | undefined;
      const media = await MessageService.getSharedMedia(conversationId);
      res.json({ media });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to fetch media' });
    }
  }

  /**
   * Search messages
   */
  static async searchMessages(req: AuthRequest, res: Response): Promise<void> {
    try {
      const query = req.query.q as string | undefined;
      const conversationId = req.query.conversationId as string | undefined;
      const senderId = req.query.senderId as string | undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;

      const messages = await MessageService.searchMessages({
        query,
        conversationId,
        senderId,
        limit,
      });

      res.json({ messages });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to search messages' });
    }
  }

  /**
   * Send a new message
   */
  static async createMessage(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const parsed = sendMessageSchema.safeParse(req.body);
      if (!parsed.success) {
        res.status(400).json({ error: parsed.error.errors[0].message });
        return;
      }

      const { content, conversationId, recipientId, replyToId, attachments } = parsed.data;

      if (!content.trim() && (!attachments || attachments.length === 0)) {
        res.status(400).json({ error: 'Message content or attachment is required' });
        return;
      }

      const message = await MessageService.createMessage({
        conversationId,
        senderId: req.user.id,
        recipientId,
        content: content.trim(),
        source: 'website',
        replyToId,
        status: 'sent',
        attachments,
      });

      SocketService.broadcastNewMessage(message);

      res.status(201).json({ message });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to send message' });
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
      res.status(500).json({ error: err.message || 'Failed to toggle reaction' });
    }
  }

  /**
   * Toggle Pin
   */
  static async togglePin(req: AuthRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
      }

      const id = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
      const updated = await MessageService.togglePin(id);
      if (!updated) {
        res.status(404).json({ error: 'Message not found' });
        return;
      }

      SocketService.broadcastMessageEdit(updated);
      res.json({ message: updated });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to toggle pin' });
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

      const conversationId = req.body.conversationId as string | undefined;
      const readIds = await MessageService.markAllAsRead(req.user.id, conversationId);
      res.json({ success: true, count: readIds.length });
    } catch (err: any) {
      res.status(500).json({ error: err.message || 'Failed to mark read' });
    }
  }
}
