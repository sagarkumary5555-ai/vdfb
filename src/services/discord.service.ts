import {
  Client,
  GatewayIntentBits,
  TextChannel,
  AttachmentBuilder,
  Message as DiscordMessage,
  Events,
  Partials,
} from 'discord.js';
import path from 'path';
import fs from 'fs';
import { config } from '../config/index.js';
import { prisma } from '../db/prisma.js';
import { MessageService } from './message.service.js';
import { StorageService } from './storage.service.js';
import { SocketService } from './socket.service.js';
import { BridgeStatus } from '../types/index.js';

export class DiscordBridgeService {
  private static sagarBot: Client | null = null;
  private static somethingBot: Client | null = null;
  private static sagarBotReady = false;
  private static somethingBotReady = false;
  private static isInitialized = false;

  // Deduplication set to prevent echo loops
  private static recentlySentDiscordMessageIds = new Set<string>();

  /**
   * Initialize both Discord bots
   */
  static async init() {
    if (this.isInitialized) return;
    this.isInitialized = true;

    console.log('🤖 Initializing Discord Bridge...');

    // 1. Initialize Sagar Bot
    if (config.discord.sagarBotToken && config.discord.sagarBotToken.trim()) {
      try {
        this.sagarBot = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.DirectMessages,
          ],
          partials: [Partials.Channel, Partials.Message],
        });

        this.setupBotEvents(this.sagarBot, 'SagarBot');
        await this.sagarBot.login(config.discord.sagarBotToken);
      } catch (err: any) {
        console.warn('⚠️ Sagar Discord Bot login failed:', err.message);
      }
    } else {
      console.log('ℹ️ Sagar Discord Bot token not provided. Bridge will run in degraded mode.');
    }

    // 2. Initialize Something Bot
    if (config.discord.somethingBotToken && config.discord.somethingBotToken.trim()) {
      try {
        this.somethingBot = new Client({
          intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
            GatewayIntentBits.GuildMessageTyping,
            GatewayIntentBits.DirectMessages,
          ],
          partials: [Partials.Channel, Partials.Message],
        });

        this.setupBotEvents(this.somethingBot, 'SomethingBot');
        await this.somethingBot.login(config.discord.somethingBotToken);
      } catch (err: any) {
        console.warn('⚠️ Something Discord Bot login failed:', err.message);
      }
    } else {
      console.log('ℹ️ Something Discord Bot token not provided. Bridge will run in degraded mode.');
    }
  }

  /**
   * Setup event handlers on a bot client
   */
  private static setupBotEvents(bot: Client, botLabel: string) {
    bot.on(Events.ClientReady, () => {
      console.log(`✅ [${botLabel}] Logged in as ${bot.user?.tag}`);
      if (botLabel === 'SagarBot') this.sagarBotReady = true;
      if (botLabel === 'SomethingBot') this.somethingBotReady = true;
    });

    bot.on(Events.Error, (err) => {
      console.error(`❌ [${botLabel}] Discord error:`, err);
    });

    // We only need one active bot to listen to incoming events to avoid duplicate processing
    if (botLabel === 'SagarBot' || (botLabel === 'SomethingBot' && !this.sagarBot)) {
      bot.on(Events.MessageCreate, async (message) => {
        await this.handleDiscordMessageCreate(message);
      });

      bot.on(Events.MessageUpdate, async (oldMessage, newMessage) => {
        await this.handleDiscordMessageUpdate(newMessage as DiscordMessage);
      });

      bot.on(Events.MessageDelete, async (message) => {
        await this.handleDiscordMessageDelete(message as DiscordMessage);
      });

      bot.on(Events.TypingStart, async (typing) => {
        await this.handleDiscordTyping(typing);
      });
    }
  }

  /**
   * Handle incoming message from Discord channel -> Web
   */
  private static async handleDiscordMessageCreate(message: DiscordMessage) {
    try {
      // 1. Channel Filter
      if (config.discord.channelId && message.channelId !== config.discord.channelId) {
        return;
      }

      // 2. Ignore bot messages (including our own bots) to prevent infinite loops
      if (message.author.bot) {
        return;
      }

      // 3. Deduplication check
      if (this.recentlySentDiscordMessageIds.has(message.id)) {
        return;
      }

      // Check if message already exists in DB
      const existingInDb = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });
      if (existingInDb) return;

      // 4. Identify sender (Sagar vs Something)
      let senderUsername = 'sagar';
      if (config.discord.somethingUserId && message.author.id === config.discord.somethingUserId) {
        senderUsername = 'something';
      } else if (config.discord.sagarUserId && message.author.id === config.discord.sagarUserId) {
        senderUsername = 'sagar';
      } else {
        // Fallback: match by tag or default
        if (message.author.username.toLowerCase().includes('something')) {
          senderUsername = 'something';
        } else {
          senderUsername = 'sagar';
        }
      }

      const sender = await prisma.user.findUnique({
        where: { username: senderUsername },
      });

      if (!sender) {
        console.error(`Sender user not found for username: ${senderUsername}`);
        return;
      }

      // 5. Handle reply mapping
      let replyToId: string | null = null;
      if (message.reference?.messageId) {
        const parentMsg = await prisma.message.findUnique({
          where: { discordMessageId: message.reference.messageId },
        });
        if (parentMsg) {
          replyToId = parentMsg.id;
        }
      }

      // 6. Handle Discord attachments
      const attachmentsData: Array<{
        filename: string;
        originalName: string;
        mimeType: string;
        size: number;
        storagePath: string;
        discordUrl?: string;
      }> = [];

      if (message.attachments.size > 0) {
        for (const [_, att] of message.attachments) {
          try {
            // Download attachment to local protected storage
            const res = await fetch(att.url);
            if (res.ok) {
              const arrayBuffer = await res.arrayBuffer();
              const buffer = Buffer.from(arrayBuffer);
              const saved = await StorageService.saveFile(
                att.name || 'discord_file',
                buffer,
                att.contentType || 'application/octet-stream'
              );
              attachmentsData.push({
                ...saved,
                discordUrl: att.url,
              });
            }
          } catch (downloadErr) {
            console.error('Failed to download Discord attachment:', downloadErr);
          }
        }
      }

      // 7. Save message to database
      const content = message.content || (attachmentsData.length ? 'Sent an attachment' : '');
      const savedMessage = await MessageService.createMessage({
        senderId: sender.id,
        content,
        source: 'discord',
        discordMessageId: message.id,
        discordChannelId: message.channelId,
        replyToId,
        status: 'delivered',
        attachments: attachmentsData,
      });

      // 8. Broadcast over WebSocket to website in real-time
      SocketService.broadcastNewMessage(savedMessage);
      console.log(`📥 Bridged Discord -> Web: [${sender.displayName}] ${content}`);
    } catch (err) {
      console.error('Error handling Discord messageCreate:', err);
    }
  }

  /**
   * Handle incoming message edit from Discord -> Web
   */
  private static async handleDiscordMessageUpdate(message: DiscordMessage) {
    try {
      if (message.author?.bot) return;

      const existing = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });

      if (!existing || existing.isDeleted) return;

      const updated = await prisma.message.update({
        where: { id: existing.id },
        data: {
          content: message.content || existing.content,
          isEdited: true,
        },
        include: {
          sender: true,
          replyTo: {
            include: { sender: true },
          },
          attachments: true,
        },
      });

      const formatted = MessageService.formatMessage(updated);
      SocketService.broadcastMessageEdit(formatted);
      console.log(`✏️ Bridged Discord edit -> Web: ${message.id}`);
    } catch (err) {
      console.error('Error handling Discord messageUpdate:', err);
    }
  }

  /**
   * Handle message deletion from Discord -> Web
   */
  private static async handleDiscordMessageDelete(message: DiscordMessage) {
    try {
      const existing = await prisma.message.findUnique({
        where: { discordMessageId: message.id },
      });

      if (!existing || existing.isDeleted) return;

      const updated = await prisma.message.update({
        where: { id: existing.id },
        data: {
          isDeleted: true,
          content: 'This message was deleted.',
        },
        include: {
          sender: true,
          replyTo: {
            include: { sender: true },
          },
          attachments: true,
        },
      });

      const formatted = MessageService.formatMessage(updated);
      SocketService.broadcastMessageDelete(formatted);
      console.log(`🗑️ Bridged Discord delete -> Web: ${message.id}`);
    } catch (err) {
      console.error('Error handling Discord messageDelete:', err);
    }
  }

  /**
   * Handle Discord typing indicator -> Web
   */
  private static async handleDiscordTyping(typing: any) {
    try {
      if (typing.user?.bot) return;

      let senderUsername = 'sagar';
      if (config.discord.somethingUserId && typing.user.id === config.discord.somethingUserId) {
        senderUsername = 'something';
      }

      const user = await prisma.user.findUnique({
        where: { username: senderUsername },
      });

      if (user) {
        SocketService.broadcastTyping(user.id, user.username, true);
      }
    } catch (err) {
      // Ignore typing errors
    }
  }

  /**
   * Send a Web message to Discord (Web -> Discord Flow)
   */
  static async sendWebMessageToDiscord(message: {
    id: string;
    sender: { username: string; displayName: string };
    content: string;
    replyTo?: { discordMessageId?: string | null; content?: string; sender?: { displayName: string } } | null;
    attachments: Array<{ filename: string; originalName: string; mimeType: string; storagePath?: string }>;
  }): Promise<string | null> {
    try {
      const isSagar = message.sender.username === 'sagar';
      // Pick the correct bot: Sagar's bot for Sagar, Something's bot for Something
      const botClient = isSagar ? (this.sagarBot || this.somethingBot) : (this.somethingBot || this.sagarBot);

      if (!botClient || !botClient.isReady()) {
        console.warn(`Discord bot for ${message.sender.displayName} is not connected. Queuing.`);
        return null;
      }

      const channelId = config.discord.channelId;
      if (!channelId) return null;

      const channel = await botClient.channels.fetch(channelId);
      if (!channel || !(channel instanceof TextChannel)) {
        console.warn(`Discord channel ${channelId} not found or not a TextChannel.`);
        return null;
      }

      // Prepare Discord files
      const files: AttachmentBuilder[] = [];
      for (const att of message.attachments) {
        const filePath = StorageService.getFilePath(att.filename);
        if (filePath && fs.existsSync(filePath)) {
          files.push(new AttachmentBuilder(filePath, { name: att.originalName }));
        }
      }

      // Prepare Discord payload
      const payload: any = {
        content: message.content || undefined,
        files: files.length ? files : undefined,
      };

      // Handle reply reference if Discord message ID exists
      if (message.replyTo?.discordMessageId) {
        payload.reply = {
          messageReference: message.replyTo.discordMessageId,
          failIfNotExists: false,
        };
      }

      // Send to Discord channel
      const sentMessage = await channel.send(payload);

      // Register sent ID to prevent duplicate echo loop
      this.recentlySentDiscordMessageIds.add(sentMessage.id);
      setTimeout(() => {
        this.recentlySentDiscordMessageIds.delete(sentMessage.id);
      }, 60000); // 1 min TTL

      // Update message record in DB with Discord message ID
      await prisma.message.update({
        where: { id: message.id },
        data: {
          discordMessageId: sentMessage.id,
          discordChannelId: channelId,
        },
      });

      console.log(`📤 Bridged Web -> Discord: [${message.sender.displayName}] "${message.content}"`);
      return sentMessage.id;
    } catch (err: any) {
      console.error('Error sending web message to Discord:', err.message);
      return null;
    }
  }

  /**
   * Sync a Web message edit to Discord
   */
  static async syncEditToDiscord(discordMessageId: string, newContent: string, senderUsername: string) {
    try {
      const isSagar = senderUsername === 'sagar';
      const botClient = isSagar ? (this.sagarBot || this.somethingBot) : (this.somethingBot || this.sagarBot);

      if (!botClient || !botClient.isReady() || !config.discord.channelId) return;

      const channel = (await botClient.channels.fetch(config.discord.channelId)) as TextChannel;
      if (!channel) return;

      const msg = await channel.messages.fetch(discordMessageId);
      if (msg) {
        await msg.edit(newContent);
        console.log(`✏️ Synced Web edit to Discord: ${discordMessageId}`);
      }
    } catch (err: any) {
      console.error('Error syncing edit to Discord:', err.message);
    }
  }

  /**
   * Sync a Web message delete to Discord
   */
  static async syncDeleteToDiscord(discordMessageId: string, senderUsername: string) {
    try {
      const isSagar = senderUsername === 'sagar';
      const botClient = isSagar ? (this.sagarBot || this.somethingBot) : (this.somethingBot || this.sagarBot);

      if (!botClient || !botClient.isReady() || !config.discord.channelId) return;

      const channel = (await botClient.channels.fetch(config.discord.channelId)) as TextChannel;
      if (!channel) return;

      const msg = await channel.messages.fetch(discordMessageId);
      if (msg) {
        await msg.delete();
        console.log(`🗑️ Synced Web delete to Discord: ${discordMessageId}`);
      }
    } catch (err: any) {
      console.error('Error syncing delete to Discord:', err.message);
    }
  }

  /**
   * Get real-time status of Discord bridge
   */
  static getStatus(): BridgeStatus {
    const discordEnabled = Boolean(config.discord.sagarBotToken || config.discord.somethingBotToken);
    return {
      discordEnabled,
      sagarBotReady: this.sagarBotReady,
      somethingBotReady: this.somethingBotReady,
      channelAccessible: Boolean(config.discord.channelId && (this.sagarBotReady || this.somethingBotReady)),
      channelId: config.discord.channelId || null,
      pendingSyncCount: 0,
    };
  }
}
