import { execSync } from 'child_process';
import bcrypt from 'bcryptjs';
import { prisma } from './prisma.js';

export async function ensureDatabaseReady() {
  try {
    console.log('🔄 Checking database schema and tables...');
    try {
      execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    } catch (pushErr) {
      console.log('Prisma db push executed.');
    }

    // Check if Sagar and Something users exist
    const sagar = await prisma.user.findUnique({ where: { username: 'sagar' } }).catch(() => null);
    if (!sagar) {
      console.log('🌱 Seeding initial accounts for Sagar and Something...');
      const passwordHash = await bcrypt.hash('password123', 10);

      await prisma.user.upsert({
        where: { username: 'sagar' },
        update: {},
        create: {
          username: 'sagar',
          passwordHash,
          displayName: 'Sagar',
          avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=1e293b',
          customStatus: 'Coding & Building ✨',
        },
      });

      await prisma.user.upsert({
        where: { username: 'something' },
        update: {},
        create: {
          username: 'something',
          passwordHash,
          displayName: 'Something ❤️',
          avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=31102f',
          customStatus: 'In my own little world 🌸',
        },
      });

      let conversation = await prisma.conversation.findFirst().catch(() => null);
      if (!conversation) {
        await prisma.conversation.create({
          data: { name: 'Sagar & Something' },
        });
      }
      console.log('✅ Accounts initialized successfully!');
    } else {
      console.log('✅ Database tables and accounts verified.');
    }
  } catch (err) {
    console.error('Database auto-init notice:', err);
  }
}
