import { Request, Response } from 'express';
import { DiscordBridgeService } from '../services/discord.service.js';
import { prisma } from '../db/prisma.js';

export class SystemController {
  static async getStatus(req: Request, res: Response): Promise<void> {
    try {
      const bridgeStatus = DiscordBridgeService.getStatus();
      const messageCount = await prisma.message.count();
      const userCount = await prisma.user.count();

      res.json({
        status: 'online',
        uptime: process.uptime(),
        database: 'connected',
        totalMessages: messageCount,
        totalUsers: userCount,
        bridge: bridgeStatus,
      });
    } catch (err: any) {
      res.status(500).json({ status: 'degraded', error: err.message });
    }
  }
}
