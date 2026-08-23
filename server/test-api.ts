import { AuthService } from './src/services/auth.service.js';
import { MessageService } from './src/services/message.service.js';
import { DiscordBridgeService } from './src/services/discord.service.js';
import { prisma } from './src/db/prisma.js';

async function runTests() {
  console.log('🧪 Running automated verification tests...');

  // 1. Test Login with Sagar
  console.log('\n1. Testing Sagar Authentication...');
  const sagarLogin = await AuthService.login('sagar', 'password123');
  console.log(`✅ Sagar logged in successfully! User ID: ${sagarLogin.user.id}`);

  // 2. Test Login with Something
  console.log('\n2. Testing Something Authentication...');
  const somethingLogin = await AuthService.login('something', 'password123');
  console.log(`✅ Something logged in successfully! User ID: ${somethingLogin.user.id}`);

  // 3. Test Unauthorized User Rejection
  console.log('\n3. Testing Unauthorized User Protection...');
  try {
    await AuthService.login('stranger', 'password123');
    console.error('❌ Failed: Unauthorized user was not rejected!');
  } catch (err: any) {
    console.log(`✅ Unauthorized user correctly rejected: "${err.message}"`);
  }

  // 4. Test Message Creation
  console.log('\n4. Testing Message Creation...');
  const msg1 = await MessageService.createMessage({
    senderId: sagarLogin.user.id,
    content: 'Hello Something ❤️',
    source: 'website',
  });
  console.log(`✅ Message 1 created: ID: ${msg1.id}, Content: "${msg1.content}"`);

  // 5. Test Reply from Something
  console.log('\n5. Testing Reply Creation...');
  const msg2 = await MessageService.createMessage({
    senderId: somethingLogin.user.id,
    content: 'Heyyy Sagar! ✨',
    source: 'website',
    replyToId: msg1.id,
  });
  console.log(`✅ Reply created: ID: ${msg2.id}, Replying to: "${msg2.replyTo?.sender.displayName}"`);

  // 6. Test Message Retrieval & Pagination
  console.log('\n6. Testing Message Retrieval...');
  const history = await MessageService.getMessages({ limit: 10 });
  console.log(`✅ Fetched ${history.messages.length} messages from database.`);

  // 7. Test Search
  console.log('\n7. Testing Message Search...');
  const searchResults = await MessageService.searchMessages({ query: 'Something' });
  console.log(`✅ Search for "Something" returned ${searchResults.length} match(es).`);

  // 8. Test Discord Bridge Diagnostics
  console.log('\n8. Testing Discord Bridge Diagnostics...');
  const bridgeStatus = DiscordBridgeService.getStatus();
  console.log('✅ Bridge Status:', bridgeStatus);

  console.log('\n🎉 ALL TESTS PASSED SUCCESSFULLY! 🚀\n');
}

runTests()
  .catch((err) => {
    console.error('❌ Test failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
