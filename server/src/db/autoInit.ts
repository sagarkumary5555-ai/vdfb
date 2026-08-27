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

  // 2. High-Performance Relational Schema Creation
  const schemaStatements = [
    `CREATE TABLE IF NOT EXISTS "User" (
      "id" TEXT NOT NULL PRIMARY KEY,
      "username" TEXT NOT NULL,
      "passwordHash" TEXT NOT NULL,
      "displayName" TEXT NOT NULL,
      "avatarUrl" TEXT,
      "customStatus" TEXT,
      "lastSeen" DATETIME,
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
    `CREATE UNIQUE INDEX IF NOT EXISTS "User_username_key" ON "User"("username");`,
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
      "name" TEXT NOT NULL DEFAULT 'Sagar & Something',
      "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );`,
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
    `CREATE UNIQUE INDEX IF NOT EXISTS "Message_discordMessageId_key" ON "Message"("discordMessageId");`,
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
  ];

  for (const sql of schemaStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.error('Schema SQL error:', err);
    }
  }

  // Seed default Sagar and Something accounts if not present
  try {
    const sagar = await prisma.user.findUnique({ where: { username: 'sagar' } });
    if (!sagar) {
      console.log('🌱 Seeding default Sagar and Something accounts...');
      const passwordHash = await bcrypt.hash('password123', 10);

      await prisma.user.create({
        data: {
          username: 'sagar',
          passwordHash,
          displayName: 'Sagar',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=1e293b',
          customStatus: 'Coding & Building ✨',
        },
      });

      await prisma.user.create({
        data: {
          username: 'something',
          passwordHash,
          displayName: 'Something ❤️',
          avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=31102f',
          customStatus: 'In my own little world 🌸',
        },
      });

      await prisma.conversation.create({
        data: { name: 'Sagar & Something' },
      });
      console.log('✅ Sagar and Something accounts seeded successfully!');
    } else {
      console.log('✅ High-performance database verified: Sagar & Something ready.');
    }
  } catch (err) {
    console.error('Seeding notice:', err);
  }
}
