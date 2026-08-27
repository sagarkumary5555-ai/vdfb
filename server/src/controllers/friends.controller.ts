import { Response } from 'express';
import { AuthRequest } from '../middleware/auth.middleware.js';
import { FriendsService } from '../services/friends.service.js';

export class FriendsController {
  static async getOverview(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const data = await FriendsService.getFriendsOverview(req.user.id);
      res.json(data);
    } catch (err: any) {
      console.error('Error fetching friends overview:', err);
      res.status(500).json({ error: 'Failed to fetch friends' });
    }
  }

  static async sendRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { target } = req.body; // username or userId
      if (!target) {
        return res.status(400).json({ error: 'Target user is required' });
      }

      const result = await FriendsService.sendFriendRequest(req.user.id, target);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message || 'Failed to send friend request' });
    }
  }

  static async acceptRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { requesterId } = req.body;
      if (!requesterId) {
        return res.status(400).json({ error: 'requesterId is required' });
      }

      const success = await FriendsService.acceptFriendRequest(req.user.id, requesterId);
      if (!success) {
        return res.status(404).json({ error: 'Pending friend request not found' });
      }

      res.json({ success: true, message: 'Friend request accepted' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to accept friend request' });
    }
  }

  static async declineRequest(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { requesterId } = req.body;
      if (!requesterId) {
        return res.status(400).json({ error: 'requesterId is required' });
      }

      await FriendsService.declineFriendRequest(req.user.id, requesterId);
      res.json({ success: true, message: 'Friend request declined' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to decline friend request' });
    }
  }

  static async removeFriend(req: AuthRequest, res: Response) {
    try {
      if (!req.user) return res.status(401).json({ error: 'Unauthorized' });
      const { friendId } = req.body;
      if (!friendId) {
        return res.status(400).json({ error: 'friendId is required' });
      }

      await FriendsService.removeFriend(req.user.id, friendId);
      res.json({ success: true, message: 'Friend removed' });
    } catch (err: any) {
      res.status(500).json({ error: 'Failed to remove friend' });
    }
  }
}
