import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database with Sagar and Something accounts...');

  const sagarPass = '99313935287549051214';
  const somethingPass = '<yaade>';

  const sagarHash = await bcrypt.hash(sagarPass, 10);
  const somethingHash = await bcrypt.hash(somethingPass, 10);

  const sagar = await prisma.user.upsert({
    where: { username: 'sagar' },
    update: {
      passwordHash: sagarHash,
      displayName: 'Sagar',
    },
    create: {
      username: 'sagar',
      passwordHash: sagarHash,
      displayName: 'Sagar',
      avatarUrl: 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=18181b',
      customStatus: 'Available',
    },
  });

  const something = await prisma.user.upsert({
    where: { username: 'something' },
    update: {
      passwordHash: somethingHash,
      displayName: 'Something',
    },
    create: {
      username: 'something',
      passwordHash: somethingHash,
      displayName: 'Something',
      avatarUrl: 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=18181b',
      customStatus: 'Available',
    },
  });

  let conv = await prisma.conversation.findFirst();
  if (!conv) {
    conv = await prisma.conversation.create({
      data: {
        name: 'Direct Message',
        isGroup: false,
      },
    });

    await prisma.conversationParticipant.createMany({
      data: [
        { conversationId: conv.id, userId: sagar.id },
        { conversationId: conv.id, userId: something.id },
      ],
    });
  }

  console.log('✅ Sagar & Something accounts ready!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
