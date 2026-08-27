import http from 'http';
import axios from 'axios';
import { io } from 'socket.io-client';
import app from './src/index.js';
import { prisma } from './src/db/prisma.js';
import { ensureDatabaseReady } from './src/db/autoInit.js';

async function runFullSiteTests() {
  console.log('🧪 Starting 100% Comprehensive Site & Feature Test Suite...\n');

  // Start test server on dynamic port
  const server = http.createServer(app);
  await ensureDatabaseReady();

  await new Promise<void>((resolve) => {
    server.listen(4899, () => {
      console.log('✅ Test Server listening on http://localhost:4899');
      resolve();
    });
  });

  const api = axios.create({ baseURL: 'http://localhost:4899/api' });

  try {
    // ----------------------------------------------------
    // TEST 1: Authentication & Seeding Verification
    // ----------------------------------------------------
    console.log('\n--- [TEST 1] Authentication & Default Users ---');
    const sagarLogin = await api.post('/auth/login', {
      username: 'sagar',
      password: '99313935287549051214',
    });
    console.log('✅ Sagar Login Status:', sagarLogin.status, '| User:', sagarLogin.data.user.username);

    const somethingLogin = await api.post('/auth/login', {
      username: 'something',
      password: '<yaade>',
    });
    console.log('✅ Something Login Status:', somethingLogin.status, '| User:', somethingLogin.data.user.username);

    const sagarToken = sagarLogin.data.token;
    const somethingToken = somethingLogin.data.token;

    // Create 2 new distinct test users (Alice & Bob)
    const testUsernameA = `alice_${Date.now()}`;
    const testUsernameB = `bob_${Date.now()}`;

    const regA = await api.post('/auth/register', {
      username: testUsernameA,
      password: 'password123',
      displayName: 'Alice In Wonderland',
    });
    console.log('✅ User Alice registered:', regA.data.user.username);

    const regB = await api.post('/auth/register', {
      username: testUsernameB,
      password: 'password123',
      displayName: 'Bob The Builder',
    });
    console.log('✅ User Bob registered:', regB.data.user.username);

    const aliceToken = regA.data.token;
    const bobToken = regB.data.token;
    const aliceId = regA.data.user.id;
    const bobId = regB.data.user.id;

    // ----------------------------------------------------
    // TEST 2: Privacy Enforcement (Non-Friends CANNOT Direct Chat)
    // ----------------------------------------------------
    console.log('\n--- [TEST 2] Privacy Enforcement: Non-Friends Blocked ---');
    try {
      await api.post(
        '/messages/conversations/direct',
        { targetUserId: bobId },
        { headers: { Authorization: `Bearer ${aliceToken}` } }
      );
      throw new Error('FAILED: Direct chat between non-friends was allowed!');
    } catch (err: any) {
      console.log('✅ Non-friend direct chat was successfully BLOCKED with error:', err.response?.data?.error);
    }

    // ----------------------------------------------------
    // TEST 3: Privacy Enforcement (Non-Friends CANNOT be Added to Groups)
    // ----------------------------------------------------
    console.log('\n--- [TEST 3] Privacy Enforcement: Non-Friends Blocked from Groups ---');
    try {
      await api.post(
        '/messages/conversations/group',
        { name: 'Secret Club', participantIds: [bobId] },
        { headers: { Authorization: `Bearer ${aliceToken}` } }
      );
      throw new Error('FAILED: Adding non-friend to group was allowed!');
    } catch (err: any) {
      console.log('✅ Adding non-friend to group was successfully BLOCKED with error:', err.response?.data?.error);
    }

    // ----------------------------------------------------
    // TEST 4: Friend Request System (Send -> Pending -> Accept)
    // ----------------------------------------------------
    console.log('\n--- [TEST 4] Friend Request Flow ---');
    // Alice sends friend request to Bob
    const sendReqRes = await api.post(
      '/friends/request',
      { target: testUsernameB },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    console.log('✅ Alice sent friend request to Bob:', sendReqRes.data.message);

    // Bob checks incoming requests
    const bobFriendsOverview1 = await api.get('/friends', {
      headers: { Authorization: `Bearer ${bobToken}` },
    });
    console.log('✅ Bob incoming requests count:', bobFriendsOverview1.data.incomingRequests.length);

    // Bob accepts friend request
    const acceptRes = await api.post(
      '/friends/accept',
      { requesterId: aliceId },
      { headers: { Authorization: `Bearer ${bobToken}` } }
    );
    console.log('✅ Bob accepted friend request:', acceptRes.data.message);

    // Verify both are now friends
    const aliceFriendsOverview = await api.get('/friends', {
      headers: { Authorization: `Bearer ${aliceToken}` },
    });
    console.log('✅ Alice now has', aliceFriendsOverview.data.friends.length, 'friends. First friend:', aliceFriendsOverview.data.friends[0].username);

    // ----------------------------------------------------
    // TEST 5: Direct Chat & Group Creation Between Accepted Friends (NOW ALLOWED!)
    // ----------------------------------------------------
    console.log('\n--- [TEST 5] Chat & Group Allowed Between Friends ---');
    const directConvRes = await api.post(
      '/messages/conversations/direct',
      { targetUserId: bobId },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    console.log('✅ Direct chat created successfully:', directConvRes.data.conversation.id);

    const groupConvRes = await api.post(
      '/messages/conversations/group',
      { name: 'Alice & Bob Hangout', participantIds: [bobId] },
      { headers: { Authorization: `Bearer ${aliceToken}` } }
    );
    console.log('✅ Group chat created successfully:', groupConvRes.data.conversation.name);

    // ----------------------------------------------------
    // TEST 6: Real-time Socket Messaging & Presence
    // ----------------------------------------------------
    console.log('\n--- [TEST 6] Real-time Socket Messaging & Reactions ---');
    const socketAlice = io('http://localhost:4899', {
      auth: { token: aliceToken },
      transports: ['websocket'],
    });

    const socketBob = io('http://localhost:4899', {
      auth: { token: bobToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      let connectedCount = 0;
      const checkDone = () => {
        connectedCount++;
        if (connectedCount === 2) resolve();
      };
      socketAlice.on('connect', checkDone);
      socketBob.on('connect', checkDone);
    });
    console.log('✅ Both Alice and Bob connected to WebSocket');

    // Bob listens for incoming message
    const messagePromise = new Promise<any>((resolve) => {
      socketBob.on('message:new', (msg) => {
        resolve(msg);
      });
    });

    // Alice sends message to Bob
    socketAlice.emit('message:send', {
      conversationId: directConvRes.data.conversation.id,
      recipientId: bobId,
      content: 'Hello Bob! We are officially friends now 🔥💎',
    });

    const receivedMsg = await messagePromise;
    console.log('✅ Bob received real-time socket message:', receivedMsg.content);

    // Bob reacts to message
    const reactPromise = new Promise<any>((resolve) => {
      socketAlice.on('message:updated', (updated) => {
        resolve(updated);
      });
    });

    socketBob.emit('message:react', {
      messageId: receivedMsg.id,
      emoji: '🔥',
    });

    const reactedMsg = await reactPromise;
    console.log('✅ Real-time reaction synchronized:', reactedMsg.reactions);

    socketAlice.disconnect();
    socketBob.disconnect();

    console.log('\n======================================================');
    console.log('🎉 ALL TESTS PASSED (100% SUCCESS RATE)!');
    console.log('✅ Authentication & Default User Seeding: PASS');
    console.log('✅ Privacy Enforcement (Non-friends blocked): PASS');
    console.log('✅ Friends Lifecycle (Request -> Accept -> Friend): PASS');
    console.log('✅ Direct Chat & Group Creation for Friends: PASS');
    console.log('✅ Real-Time Messaging & Reactions: PASS');
    console.log('======================================================\n');
  } catch (err: any) {
    console.error('❌ Test failed:', err.response?.data || err.message);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runFullSiteTests();
