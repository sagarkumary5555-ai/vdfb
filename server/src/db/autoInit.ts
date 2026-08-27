import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export async function ensureDatabaseReady() {
  console.log('🔄 Initializing SQLite database schema & high-throughput WAL optimizations...');

  // 1. High-Concurrency SQLite Tuning (10,000,000+ Scale Read/Write Optimizations)
  const performancePragmas = [
    `PRAGMA journal_mode = WAL;`,
    `PRAGMA synchronous = NORMAL;`,
    `PRAGMA cache_size = -64000;`,
    `PRAGMA temp_store = MEMORY;`,
    `PRAGMA mmap_size = 30000000000;`,
  ];

  for (const pragma of performancePragmas) {
    try {
      await prisma.$executeRawUnsafe(pragma);
    } catch (err) {
      // Safe fallback
    }
  }

  // 2. High-Performance Multi-User Social Schema Creation
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "avatarUrl" TEXT,
      "customStatus" TEXT,
      "bio" TEXT,
      "lastSeen" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`,
    `CREATE INDEX IF NOT EXISTS "User_displayName_idx" ON "User"("displayName");`,

    `CREATE TABLE IF NOT EXISTS "Session" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "userId" TEXT NOT NULL,
      "token" TEXT NOT NULL,
      "userAgent" TEXT,
      "ipAddress" TEXT,
      "expiresAt" DATETIME NOT NULL,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Session_token_key" ON "Session"("token");`,

    `CREATE TABLE IF NOT EXISTS "Conversation" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "name" TEXT,
      "isGroup" BOOLEAN NOT NULL DEFAULT false,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,

    `CREATE TABLE IF NOT EXISTS "ConversationParticipant" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "userId" TEXT NOT NULL,
      "role" TEXT NOT NULL DEFAULT 'member',
      "lastReadAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "ConversationParticipant_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "ConversationParticipant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "ConversationParticipant_conv_user" ON "ConversationParticipant"("conversationId", "userId");`,
    `CREATE INDEX IF NOT EXISTS "ConversationParticipant_userId_idx" ON "ConversationParticipant"("userId");`,

    `CREATE TABLE IF NOT EXISTS "Message" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "conversationId" TEXT NOT NULL,
      "senderId" TEXT NOT NULL,
      "content" TEXT NOT NULL,
      "source" TEXT NOT NULL DEFAULT 'website',
      "discordMessageId" TEXT,
      "discordChannelId" TEXT,
      "replyToId" TEXT,
      "isEdited" BOOLEAN NOT NULL DEFAULT false,
      "isDeleted" BOOLEAN NOT NULL DEFAULT false,
      "isPinned" BOOLEAN NOT NULL DEFAULT false,
      "reactions" TEXT NOT NULL DEFAULT '[]',
      "status" TEXT NOT NULL DEFAULT 'sent',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Message_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "Conversation" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Message_senderId_fkey" FOREIGN KEY ("senderId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Message_replyToId_fkey" FOREIGN KEY ("replyToId") REFERENCES "Message" ("id") ON DELETE SET NULL ON UPDATE CASCADE
    );`,
    `CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");`,
    `CREATE INDEX IF NOT EXISTS "Message_conversationId_createdAt_idx" ON "Message"("conversationId", "createdAt");`,

    `CREATE TABLE IF NOT EXISTS "Attachment" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "messageId" TEXT NOT NULL,
      "filename" TEXT NOT NULL,
      "originalName" TEXT NOT NULL,
      "mimeType" TEXT NOT NULL,
      "size" INTEGER NOT NULL,
      "storagePath" TEXT NOT NULL,
      "discordUrl" TEXT,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Attachment_messageId_fkey" FOREIGN KEY ("messageId") REFERENCES "Message" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE TABLE IF NOT EXISTS "SyncQueue" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "messageId" TEXT NOT NULL,
      "action" TEXT NOT NULL,
      "payload" TEXT NOT NULL,
      "attempts" INTEGER NOT NULL DEFAULT 0,
      "lastError" TEXT,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE TABLE IF NOT EXISTS "Friendship" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "requesterId" TEXT NOT NULL,
      "addresseeId" TEXT NOT NULL,
      "status" TEXT NOT NULL DEFAULT 'pending',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT "Friendship_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT "Friendship_addresseeId_fkey" FOREIGN KEY ("addresseeId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "Friendship_users" ON "Friendship"("requesterId", "addresseeId");`,
    `CREATE INDEX IF NOT EXISTS "Friendship_status_idx" ON "Friendship"("status");`,
    `CREATE INDEX IF NOT EXISTS "Friendship_requester_idx" ON "Friendship"("requesterId");`,
    `CREATE INDEX IF NOT EXISTS "Friendship_addressee_idx" ON "Friendship"("addresseeId");`,
  ];

  for (const sql of schemaStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      // Safe ignore
    }
  }

  // Safe progressive column migrations
  const alterStatements = [
    `ALTER TABLE "User" ADD COLUMN "bio" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN "customStatus" TEXT;`,
    `ALTER TABLE "User" ADD COLUMN "avatarUrl" TEXT;`,
    `ALTER TABLE "Message" ADD COLUMN "reactions" TEXT NOT NULL DEFAULT '[]';`,
    `ALTER TABLE "Message" ADD COLUMN "status" TEXT NOT NULL DEFAULT 'sent';`,
    `ALTER TABLE "Message" ADD COLUMN "isPinned" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "Message" ADD COLUMN "isEdited" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "Message" ADD COLUMN "isDeleted" BOOLEAN NOT NULL DEFAULT false;`,
    `ALTER TABLE "Conversation" ADD COLUMN "isGroup" BOOLEAN NOT NULL DEFAULT false;`,
  ];

  for (const alterSql of alterStatements) {
    try {
      await prisma.$executeRawUnsafe(alterSql);
    } catch {
      // Ignored if column already exists in SQLite
    }
  }

  // Guarantee that Sagar and Something accounts always exist with their exact requested passwords
  try {
    console.log('🔒 Guaranteeing Sagar & Something accounts with exact passwords...');
    const sagarPassHash = await bcrypt.hash('99313935287549051214', 10);
    const somethingPassHash = await bcrypt.hash('<yaade>', 10);

    const sagarUser = await prisma.user.upsert({
      where: { username: 'sagar' },
      update: {
        passwordHash: sagarPassHash,
        displayName: 'Sagar',
      },
      create: {
        username: 'sagar',
        passwordHash: sagarPassHash,
        displayName: 'Sagar',
        avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=18181b',
        customStatus: 'Available',
        bio: 'Software engineer & builder.',
      },
    });

    const somethingUser = await prisma.user.upsert({
      where: { username: 'something' },
      update: {
        passwordHash: somethingPassHash,
        displayName: 'Something',
      },
      create: {
        username: 'something',
        passwordHash: somethingPassHash,
        displayName: 'Something',
        avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=18181b',
        customStatus: 'Available',
        bio: 'Designer & digital creator.',
      },
    });

    // Ensure their direct conversation exists
    const existingConv = await prisma.conversation.findFirst({
      where: {
        participants: {
          some: { userId: sagarUser.id },
        },
      },
    });

    if (!existingConv) {
      const createdConv = await prisma.conversation.create({
        data: {
          name: 'Direct Message',
          isGroup: false,
        },
      });

      await prisma.conversationParticipant.createMany({
        data: [
          { conversationId: createdConv.id, userId: sagarUser.id },
          { conversationId: createdConv.id, userId: somethingUser.id },
        ],
      });
    }

    // Ensure Sagar & Something are accepted friends
    try {
      await prisma.$executeRawUnsafe(`
        INSERT OR IGNORE INTO "Friendship" ("id", "requesterId", "addresseeId", "status", "createdAt", "updatedAt")
        VALUES ('friend-sagar-something', '${sagarUser.id}', '${somethingUser.id}', 'accepted', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
      `);
    } catch {
      // Safe ignore
    }

    console.log('✅ Accounts for Sagar (pass: 99313935287549051214) & Something (pass: <yaade>) are active with accepted friendship!');
  } catch (err) {
    console.error('Seeding notice:', err);
  }
}
