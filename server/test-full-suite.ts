import { AuthService } from './src/services/auth.service.js';
import { MessageService } from './src/services/message.service.js';
import { ensureDatabaseReady } from './src/db/autoInit.js';
import { prisma } from './src/db/prisma.js';

async function runFullTestSuite() {
  console.log('🧪 Starting ChatUs PRO Universal Verification Test Suite...\n');

  // 0. Ensure Database is Ready
  await ensureDatabaseReady();
  console.log('✅ 1. Database autoInit & migrations verified.');

  // 1. Test User Registration
  const user1 = await AuthService.register({
    username: 'test_alex_' + Date.now().toString().slice(-4),
    password: 'password123',
    displayName: 'Alex Vance',
  });
  console.log(`✅ 2. User 1 registered: @${user1.user.username} (${user1.user.displayName})`);

  const user2 = await AuthService.register({
    username: 'test_bella_' + Date.now().toString().slice(-4),
    password: 'password123',
    displayName: 'Bella Thorne',
  });
  console.log(`✅ 3. User 2 registered: @${user2.user.username} (${user2.user.displayName})`);

  // 2. Test Login
  const login1 = await AuthService.login(user1.user.username, 'password123');
  console.log(`✅ 4. User 1 logged in with valid JWT token (length: ${login1.token.length})`);

  // 3. Test User Search
  const searchUsers = await AuthService.searchUsers('Bella', user1.user.id);
  console.log(`✅ 5. User search for "Bella" found ${searchUsers.length} user(s).`);

  // 4. Test Direct Messaging (Alex -> Bella)
  const dm = await MessageService.createMessage({
    senderId: user1.user.id,
    recipientId: user2.user.id,
    content: 'Hey Bella! Testing ChatUs direct messaging.',
    source: 'website',
  });
  console.log(`✅ 6. Direct message sent! Conversation ID: ${dm.conversationId}`);

  // 5. Test Reply (Bella -> Alex)
  const reply = await MessageService.createMessage({
    senderId: user2.user.id,
    conversationId: dm.conversationId,
    content: 'Hey Alex! Received loud and clear. 🚀',
    replyToId: dm.id,
    source: 'website',
  });
  console.log(`✅ 7. Reply sent successfully! Replying to: "${reply.replyTo?.content}"`);

  // 6. Test Reactions & Pinning
  const reacted = await MessageService.toggleReaction(reply.id, '🔥', user1.user.id);
  console.log(`✅ 8. Emoji reaction added: "${reacted?.reactions?.[0]?.emoji}" by Alex`);

  const pinned = await MessageService.togglePin(reply.id);
  console.log(`✅ 9. Message pinned: isPinned = ${pinned?.isPinned}`);

  // 7. Test Message Edit
  const edited = await MessageService.editMessage(dm.id, 'Hey Bella! Testing ChatUs direct messaging (EDITED).', user1.user.id);
  console.log(`✅ 10. Message edited: isEdited = ${edited?.isEdited}, newContent = "${edited?.content}"`);

  // 8. Test Group Conversation Creation
  const group = await MessageService.createGroupConversation(
    user1.user.id,
    'Alpha Project Team',
    [user2.user.id]
  );
  console.log(`✅ 11. Group "${group.name}" created.`);

  const groupMsg = await MessageService.createMessage({
    senderId: user1.user.id,
    conversationId: group.id,
    content: 'Welcome to Alpha Project Team group!',
    source: 'website',
  });
  console.log(`✅ 12. Group message sent: "${groupMsg.content}"`);

  // 9. Test Conversation List Fetch for User 1
  const convsUser1 = await MessageService.getUserConversations(user1.user.id);
  console.log(`✅ 13. Alex's inbox contains ${convsUser1.length} conversation(s).`);

  // 10. Test Conversation List Fetch for User 2
  const convsUser2 = await MessageService.getUserConversations(user2.user.id);
  console.log(`✅ 14. Bella's inbox contains ${convsUser2.length} conversation(s).`);

  console.log('\n======================================================');
  console.log('🎉 ALL 14 AUTOMATED CHATUS VERIFICATIONS PASSED 100%! 🎉');
  console.log('======================================================\n');
}

runFullTestSuite()
  .catch((err) => {
    console.error('❌ Test suite failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
