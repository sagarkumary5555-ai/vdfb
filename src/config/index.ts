import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '4000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  clientUrl: process.env.CLIENT_URL || 'http://localhost:5173',
  jwtSecret: process.env.JWT_SECRET || 'fallback_secret_sagar_something_duo_private_2026',
  uploadDir: path.resolve(process.env.UPLOAD_DIR || './uploads'),
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '50', 10),
  
  // Discord Bridge Config
  discord: {
    sagarBotToken: process.env.DISCORD_BOT_SAGAR_TOKEN || '',
    somethingBotToken: process.env.DISCORD_BOT_SOMETHING_TOKEN || '',
    channelId: process.env.DISCORD_CHANNEL_ID || '',
    sagarUserId: process.env.DISCORD_SAGAR_USER_ID || '',
    somethingUserId: process.env.DISCORD_SOMETHING_USER_ID || '',
    guildId: process.env.DISCORD_GUILD_ID || '',
  },

  // Fixed usernames strictly authorized in the system
  authorizedUsers: {
    sagar: 'sagar',
    something: 'something',
  }
};
