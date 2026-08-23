import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding initial data for Sagar & Something...');

  // Default avatars with stylish modern SVG data URIs
  const sagarAvatar = 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=1e293b';
  const somethingAvatar = 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=31102f';

  const defaultPassword = 'password123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // 1. Create or update Sagar user
  const sagar = await prisma.user.upsert({
    where: { username: 'sagar' },
    update: {},
    create: {
      username: 'sagar',
      passwordHash,
      displayName: 'Sagar',
      avatarUrl: sagarAvatar,
      customStatus: 'Coding & Building ✨',
    },
  });

  // 2. Create or update Something user
  const something = await prisma.user.upsert({
    where: { username: 'something' },
    update: {},
    create: {
      username: 'something',
      passwordHash,
      displayName: 'Something ❤️',
      avatarUrl: somethingAvatar,
      customStatus: 'In my own little world 🌸',
    },
  });

  // 3. Ensure single conversation exists
  let conversation = await prisma.conversation.findFirst();
  if (!conversation) {
    conversation = await prisma.conversation.create({
      data: {
        name: 'Sagar & Something',
      },
    });
    console.log(`Created default conversation with ID: ${conversation.id}`);
  }

  console.log('✅ Seeding completed successfully!');
  console.log(`- User 1: Sagar (username: sagar, default password: ${defaultPassword})`);
  console.log(`- User 2: Something (username: something, default password: ${defaultPassword})`);
}

main()
  .catch((e) => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
