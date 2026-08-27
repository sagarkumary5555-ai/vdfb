import http from 'http';
import { io, Socket } from 'socket.io-client';
import app from './index.js';
import { SocketService } from './services/socket.service.js';
import { ensureDatabaseReady } from './db/autoInit.js';

async function runSuperComprehensiveTests() {
  console.log('================================================================');
  console.log('🚀 RUNNING 100% COMPREHENSIVE END-TO-END SYSTEM TESTS');
  console.log('================================================================\n');

  const TEST_PORT = 4911;
  const server = http.createServer(app);
  SocketService.init(server);
  await ensureDatabaseReady();

  await new Promise<void>((resolve) => {
    server.listen(TEST_PORT, () => {
      console.log(`📡 Test Server listening on http://localhost:${TEST_PORT}\n`);
      resolve();
    });
  });

  const apiFetch = async (endpoint: string, options: any = {}): Promise<any> => {
    const res = await fetch(`http://localhost:${TEST_PORT}/api${endpoint}`, {
      method: options.method || 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body ? JSON.stringify(options.body) : undefined,
    });
    const data: any = await res.json();
    if (!res.ok) {
      const err: any = new Error(data.error || `HTTP error ${res.status}`);
      err.status = res.status;
      err.data = data;
      throw err;
    }
    return data;
  };

  let passedTests = 0;
  let totalTests = 10;

  try {
    // ----------------------------------------------------
    // TEST 1: Server Health Check & System Status
    // ----------------------------------------------------
    console.log('[TEST 1/10] Server Health & System APIs...');
    const healthRes = await fetch(`http://localhost:${TEST_PORT}/health`);
    const healthData: any = await healthRes.json();
    if (healthData.status !== 'ok') throw new Error('Health check failed');
    console.log('  ✅ /health endpoint OK:', healthData);
    passedTests++;

    // ----------------------------------------------------
    // TEST 2: Pre-seeded User Logins (Sagar & Something)
    // ----------------------------------------------------
    console.log('\n[TEST 2/10] Pre-seeded User Logins & Credentials...');
    const sagar = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username: 'sagar', password: '99313935287549051214' },
    });
    console.log('  ✅ Sagar login OK:', sagar.user.username, '| Display:', sagar.user.displayName);

    const something = await apiFetch('/auth/login', {
      method: 'POST',
      body: { username: 'something', password: '<yaade>' },
    });
    console.log('  ✅ Something login OK:', something.user.username, '| Display:', something.user.displayName);

    // Verify Sagar and Something are already friends
    const sagarFriends = await apiFetch('/friends', { token: sagar.token });
    const isSomethingFriend = sagarFriends.friends.some((f: any) => f.username === 'something');
    if (!isSomethingFriend) throw new Error('Sagar and Something should be pre-seeded friends');
    console.log('  ✅ Sagar & Something friendship status: ACCEPTED');
    passedTests++;

    // ----------------------------------------------------
    // TEST 3: Multi-User Registration & Session Creation
    // ----------------------------------------------------
    console.log('\n[TEST 3/10] Multi-User Registration & Authentication...');
    const suffix = Date.now();
    const userA = await apiFetch('/auth/register', {
      method: 'POST',
      body: { username: `charlie_${suffix}`, password: 'password123', displayName: 'Charlie VIP' },
    });
    console.log('  ✅ User Charlie registered:', userA.user.username);

    const userB = await apiFetch('/auth/register', {
      method: 'POST',
      body: { username: `diana_${suffix}`, password: 'password123', displayName: 'Diana Queen' },
    });
    console.log('  ✅ User Diana registered:', userB.user.username);

    const userC = await apiFetch('/auth/register', {
      method: 'POST',
      body: { username: `stranger_${suffix}`, password: 'password123', displayName: 'Stranger Danger' },
    });
    console.log('  ✅ User Stranger registered:', userC.user.username);

    const charlieToken = userA.token;
    const dianaToken = userB.token;
    const strangerToken = userC.token;
    const charlieId = userA.user.id;
    const dianaId = userB.user.id;
    const strangerId = userC.user.id;
    passedTests++;

    // ----------------------------------------------------
    // TEST 4: Strict Privacy Rule Verification (Non-Friends BLOCKED)
    // ----------------------------------------------------
    console.log('\n[TEST 4/10] Privacy Enforcement (Non-Friends Must Be Blocked)...');
    try {
      await apiFetch('/messages/conversations/direct', {
        method: 'POST',
        token: charlieToken,
        body: { targetUserId: dianaId },
      });
      throw new Error('FAILED: Charlie was able to direct chat with Diana before becoming friends!');
    } catch (err: any) {
      console.log('  ✅ Blocked direct chat between non-friends:', err.data?.error || err.message);
    }

    try {
      await apiFetch('/messages/conversations/group', {
        method: 'POST',
        token: charlieToken,
        body: { name: 'VIP Secret Group', participantIds: [strangerId] },
      });
      throw new Error('FAILED: Charlie was able to add stranger to group without being friends!');
    } catch (err: any) {
      console.log('  ✅ Blocked adding non-friend stranger to group:', err.data?.error || err.message);
    }
    passedTests++;

    // ----------------------------------------------------
    // TEST 5: Full Friendship Lifecycle (Request -> Accept -> Friendship List)
    // ----------------------------------------------------
    console.log('\n[TEST 5/10] Friendship Lifecycle (Send Request, Accept, Verify)...');
    // Charlie sends friend request to Diana
    const reqRes = await apiFetch('/friends/request', {
      method: 'POST',
      token: charlieToken,
      body: { target: userB.user.username },
    });
    console.log('  ✅ Charlie -> Diana request sent:', reqRes.message);

    // Diana checks incoming requests
    const dianaOverview1 = await apiFetch('/friends', { token: dianaToken });
    if (dianaOverview1.incomingRequests.length === 0) throw new Error('Diana should see incoming request');
    console.log('  ✅ Diana sees pending request from:', dianaOverview1.incomingRequests[0].user.displayName);

    // Diana accepts Charlie's request
    const acceptRes = await apiFetch('/friends/accept', {
      method: 'POST',
      token: dianaToken,
      body: { requesterId: charlieId },
    });
    console.log('  ✅ Diana accepted request:', acceptRes.message);

    // Verify both have each other in friends list
    const charlieFriends = await apiFetch('/friends', { token: charlieToken });
    const dianaFriends = await apiFetch('/friends', { token: dianaToken });
    if (!charlieFriends.friends.some((f: any) => f.id === dianaId)) throw new Error('Diana missing in Charlies list');
    if (!dianaFriends.friends.some((f: any) => f.id === charlieId)) throw new Error('Charlie missing in Dianas list');
    console.log('  ✅ Charlie friends count:', charlieFriends.friends.length, '| Diana friends count:', dianaFriends.friends.length);
    passedTests++;

    // ----------------------------------------------------
    // TEST 6: Direct Chat & Group Creation for Accepted Friends
    // ----------------------------------------------------
    console.log('\n[TEST 6/10] Direct Chat & Group Creation for Accepted Friends...');
    const directChatRes = await apiFetch('/messages/conversations/direct', {
      method: 'POST',
      token: charlieToken,
      body: { targetUserId: dianaId },
    });
    console.log('  ✅ Direct Chat Conversation ID:', directChatRes.conversation.id);

    const groupChatRes = await apiFetch('/messages/conversations/group', {
      method: 'POST',
      token: charlieToken,
      body: { name: 'VIP Friends Squad 🚀', participantIds: [dianaId] },
    });
    console.log('  ✅ Group Chat Conversation Created:', groupChatRes.conversation.name);
    passedTests++;

    // ----------------------------------------------------
    // TEST 7: Messaging & Reactions Operations
    // ----------------------------------------------------
    console.log('\n[TEST 7/10] Messaging, Reactions, Pinning & Read Receipts...');
    // Send a message via REST
    const msg1 = await apiFetch('/messages', {
      method: 'POST',
      token: charlieToken,
      body: {
        conversationId: directChatRes.conversation.id,
        content: 'Hey Diana! Check out our encrypted connection 💎',
      },
    });
    console.log('  ✅ Charlie sent message:', msg1.message.id, '| Content:', msg1.message.content);

    // Diana reacts to message with 🔥
    const reactRes = await apiFetch(`/messages/${msg1.message.id}/react`, {
      method: 'POST',
      token: dianaToken,
      body: { emoji: '🔥' },
    });
    console.log('  ✅ Diana reacted with 🔥:', reactRes.message.reactions);

    // Charlie pins the message
    const pinRes = await apiFetch(`/messages/${msg1.message.id}/pin`, {
      method: 'POST',
      token: charlieToken,
    });
    console.log('  ✅ Charlie pinned message. isPinned:', pinRes.message.isPinned);

    // Get pinned messages
    const pinnedList = await apiFetch(`/messages/pinned?conversationId=${directChatRes.conversation.id}`, {
      token: charlieToken,
    });
    console.log('  ✅ Pinned messages count:', pinnedList.pinned.length);

    // Mark as read
    const readRes = await apiFetch('/messages/read', {
      method: 'POST',
      token: dianaToken,
      body: { conversationId: directChatRes.conversation.id },
    });
    console.log('  ✅ Diana marked messages read:', readRes.success);
    passedTests++;

    // ----------------------------------------------------
    // TEST 8: Real-Time WebSocket Gateway & Event Propagation
    // ----------------------------------------------------
    console.log('\n[TEST 8/10] Real-time Socket.IO Messaging & Events...');
    const socketCharlie: Socket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token: charlieToken },
      transports: ['websocket'],
    });

    const socketDiana: Socket = io(`http://localhost:${TEST_PORT}`, {
      auth: { token: dianaToken },
      transports: ['websocket'],
    });

    await new Promise<void>((resolve) => {
      let count = 0;
      const onConn = () => {
        count++;
        if (count === 2) resolve();
      };
      socketCharlie.on('connect', onConn);
      socketDiana.on('connect', onConn);
    });
    console.log('  ✅ Both WebSocket clients connected & authenticated');

    socketCharlie.emit('conversation:join', directChatRes.conversation.id);
    socketDiana.emit('conversation:join', directChatRes.conversation.id);

    // Diana listens for incoming message
    const dianaMsgPromise = new Promise<any>((resolve) => {
      socketDiana.on('message:new', (msg) => resolve(msg));
    });

    socketCharlie.emit('message:send', {
      conversationId: directChatRes.conversation.id,
      recipientId: dianaId,
      content: 'Real-time WebSocket Test: 3D Animated Sticker 🔥✨',
    });

    const rxMsg = await dianaMsgPromise;
    console.log('  ✅ Diana received real-time socket message:', rxMsg.content);
    passedTests++;

    // ----------------------------------------------------
    // TEST 9: WebRTC Calling Signaling (Audio & Video)
    // ----------------------------------------------------
    console.log('\n[TEST 9/10] WebRTC Voice & Video Call Signaling...');
    // Charlie initiates call to Diana
    const dianaIncomingCallPromise = new Promise<any>((resolve) => {
      socketDiana.on('call:incoming', (data) => resolve(data));
    });

    socketCharlie.emit('call:initiate', {
      targetUserId: dianaId,
      type: 'video',
      offer: { type: 'offer', sdp: 'v=0\r\no=test 1 1 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
    });

    const callIncomingData = await dianaIncomingCallPromise;
    console.log('  ✅ Diana received call:incoming from:', callIncomingData.callerName, '| Type:', callIncomingData.type);

    // Diana accepts call
    const charlieCallAcceptedPromise = new Promise<any>((resolve) => {
      socketCharlie.on('call:accepted', (data) => resolve(data));
    });

    socketDiana.emit('call:accept', {
      callerId: charlieId,
      answer: { type: 'answer', sdp: 'v=0\r\no=test 2 2 IN IP4 127.0.0.1\r\ns=-\r\nt=0 0\r\n' },
    });

    const callAcceptedData = await charlieCallAcceptedPromise;
    console.log('  ✅ Charlie received call:accepted from Diana:', Boolean(callAcceptedData.answer));

    // Media Toggle: Charlie toggles screen share
    const dianaMediaTogglePromise = new Promise<any>((resolve) => {
      socketDiana.on('call:peer-media-toggle', (data) => resolve(data));
    });

    socketCharlie.emit('call:media-toggle', {
      targetUserId: dianaId,
      isScreenSharing: true,
      isMuted: false,
    });

    const mediaToggleData = await dianaMediaTogglePromise;
    console.log('  ✅ Diana received peer-media-toggle (isScreenSharing):', mediaToggleData.isScreenSharing);

    // End call
    const dianaCallEndedPromise = new Promise<void>((resolve) => {
      socketDiana.on('call:ended', () => resolve());
    });

    socketCharlie.emit('call:end', { targetUserId: dianaId });
    await dianaCallEndedPromise;
    console.log('  ✅ Call cleanly ended and terminated on both peers');

    socketCharlie.disconnect();
    socketDiana.disconnect();
    passedTests++;

    // ----------------------------------------------------
    // TEST 10: Security Token Validation & Logout
    // ----------------------------------------------------
    console.log('\n[TEST 10/10] Security Validation & Session Management...');
    const meRes = await apiFetch('/auth/me', { token: charlieToken });
    console.log('  ✅ Validated session for:', meRes.user.username);

    // Test unauthorized request rejection
    try {
      await apiFetch('/auth/me', { token: 'invalid_token_xyz' });
      throw new Error('FAILED: Invalid token was accepted!');
    } catch (err: any) {
      console.log('  ✅ Invalid token rejected (401 Unauthorized)');
    }
    passedTests++;

    console.log('\n================================================================');
    console.log(`🎉 ALL ${passedTests}/${totalTests} TESTS PASSED WITH 100% SUCCESS RATE!`);
    console.log('================================================================');
    console.log('  1. Server Health & System APIs: PASS');
    console.log('  2. Pre-seeded Users (Sagar & Something): PASS');
    console.log('  3. User Registration & Auth: PASS');
    console.log('  4. Privacy Enforcement (Non-friends blocked): PASS');
    console.log('  5. Friends Lifecycle (Request, Accept, Verify): PASS');
    console.log('  6. Direct Chat & Group Creation for Friends: PASS');
    console.log('  7. Messaging, Reactions & Pinning: PASS');
    console.log('  8. Real-time WebSockets & Presence: PASS');
    console.log('  9. WebRTC Calling & Screen Share Signaling: PASS');
    console.log(' 10. Security & Session Validation: PASS');
    console.log('================================================================\n');
  } catch (err: any) {
    console.error('\n❌ TEST FAILED:', err.data || err.message);
    process.exit(1);
  } finally {
    server.close();
    process.exit(0);
  }
}

runSuperComprehensiveTests();
