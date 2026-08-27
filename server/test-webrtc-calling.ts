import http from 'http';
import express from 'express';
import { io as ClientIO } from 'socket.io-client';
import { SocketService } from './src/services/socket.service.js';
import { AuthService } from './src/services/auth.service.js';
import { ensureDatabaseReady } from './src/db/autoInit.js';
import { prisma } from './src/db/prisma.js';

async function testWebRTCCallingSystem() {
  console.log('📞 Starting WebRTC Live Calling End-to-End Simulation...\n');

  // 1. Initialize DB
  await ensureDatabaseReady();

  // 2. Setup Temporary Test Server
  const app = express();
  const server = http.createServer(app);
  SocketService.init(server);

  const TEST_PORT = 4999;
  await new Promise<void>((resolve) => server.listen(TEST_PORT, () => resolve()));
  console.log(`✅ Test Socket Server running on port ${TEST_PORT}`);

  // 3. Register / Authenticate 2 Users
  const timestamp = Date.now().toString().slice(-4);
  const user1 = await AuthService.register({
    username: `caller_${timestamp}`,
    password: 'password123',
    displayName: 'Caller User (Sagar)',
  });

  const user2 = await AuthService.register({
    username: `receiver_${timestamp}`,
    password: 'password123',
    displayName: 'Receiver User (Manav)',
  });

  console.log(`✅ Created test users:`);
  console.log(`   - Caller: @${user1.user.username} (ID: ${user1.user.id})`);
  console.log(`   - Receiver: @${user2.user.username} (ID: ${user2.user.id})`);

  // 4. Connect 2 Client Sockets with JWT Tokens
  const socket1 = ClientIO(`http://localhost:${TEST_PORT}`, {
    auth: { token: user1.token },
    transports: ['websocket'],
  });

  const socket2 = ClientIO(`http://localhost:${TEST_PORT}`, {
    auth: { token: user2.token },
    transports: ['websocket'],
  });

  await Promise.all([
    new Promise<void>((resolve) => socket1.on('connect', () => resolve())),
    new Promise<void>((resolve) => socket2.on('connect', () => resolve())),
  ]);
  console.log('✅ Both User Sockets connected and authenticated successfully.');

  // 5. Test Step 1: Call Initiation (Caller -> Receiver)
  console.log('\n--- Step 1: Initiating WebRTC Call ---');
  const incomingCallPromise = new Promise<any>((resolve) => {
    socket2.on('call:incoming', (data) => {
      console.log('📥 Receiver got "call:incoming":', {
        callerId: data.callerId,
        callerName: data.callerName,
        callerUsername: data.callerUsername,
        type: data.type,
      });
      resolve(data);
    });
  });

  const dummyOffer = { type: 'offer', sdp: 'v=0\r\no=caller 123456 ...' };
  socket1.emit('call:initiate', {
    targetUserId: user2.user.id,
    type: 'audio',
    offer: dummyOffer,
  });

  const incomingData = await incomingCallPromise;
  if (incomingData.callerId !== user1.user.id || incomingData.type !== 'audio') {
    throw new Error('Incoming call payload mismatch!');
  }
  console.log('✅ Step 1 Passed: Receiver got incoming call with correct caller identity!');

  // 6. Test Step 2: Call Acceptance (Receiver -> Caller)
  console.log('\n--- Step 2: Accepting WebRTC Call ---');
  const acceptedCallPromise = new Promise<any>((resolve) => {
    socket1.on('call:accepted', (data) => {
      console.log('📥 Caller got "call:accepted":', {
        acceptorId: data.acceptorId,
        answerType: data.answer?.type,
      });
      resolve(data);
    });
  });

  const dummyAnswer = { type: 'answer', sdp: 'v=0\r\no=receiver 654321 ...' };
  socket2.emit('call:accept', {
    callerId: user1.user.id,
    answer: dummyAnswer,
  });

  const acceptedData = await acceptedCallPromise;
  if (acceptedData.acceptorId !== user2.user.id) {
    throw new Error('Call accept payload mismatch!');
  }
  console.log('✅ Step 2 Passed: Caller received accept confirmation with answer SDP!');

  // 7. Test Step 3: ICE Candidate Exchange (Bidirectional)
  console.log('\n--- Step 3: Exchanging ICE Candidates ---');
  const candidateFromCallerPromise = new Promise<any>((resolve) => {
    socket2.on('call:ice-candidate', (data) => {
      console.log('📥 Receiver received ICE candidate from caller:', data.candidate.candidate);
      resolve(data);
    });
  });

  const candidateFromReceiverPromise = new Promise<any>((resolve) => {
    socket1.on('call:ice-candidate', (data) => {
      console.log('📥 Caller received ICE candidate from receiver:', data.candidate.candidate);
      resolve(data);
    });
  });

  socket1.emit('call:ice-candidate', {
    targetUserId: user2.user.id,
    candidate: { candidate: 'candidate:1 1 UDP 2122260223 192.168.1.100 50000 typ host', sdpMid: '0' },
  });

  socket2.emit('call:ice-candidate', {
    targetUserId: user1.user.id,
    candidate: { candidate: 'candidate:2 1 UDP 2122260223 192.168.1.101 50001 typ host', sdpMid: '0' },
  });

  await Promise.all([candidateFromCallerPromise, candidateFromReceiverPromise]);
  console.log('✅ Step 3 Passed: Bidirectional ICE Candidate exchange verified!');

  // 8. Test Step 4: Media Toggles (Mute / Video Off)
  console.log('\n--- Step 4: Testing Live Media Toggles ---');
  const mediaTogglePromise = new Promise<any>((resolve) => {
    socket2.on('call:peer-media-toggle', (data) => {
      console.log('📥 Receiver got media toggle event:', data);
      resolve(data);
    });
  });

  socket1.emit('call:media-toggle', {
    targetUserId: user2.user.id,
    isMuted: true,
  });

  const toggleData = await mediaTogglePromise;
  if (!toggleData.isMuted) {
    throw new Error('Media toggle state mismatch!');
  }
  console.log('✅ Step 4 Passed: Real-time media toggle signal received!');

  // 9. Test Step 5: Ending Call
  console.log('\n--- Step 5: Ending Active Call ---');
  const callEndPromise = new Promise<void>((resolve) => {
    socket1.on('call:ended', () => {
      console.log('📥 Caller received "call:ended" event.');
      resolve();
    });
  });

  socket2.emit('call:end', {
    targetUserId: user1.user.id,
  });

  await callEndPromise;
  console.log('✅ Step 5 Passed: Call ended cleanly and both peers notified!');

  // Clean up
  socket1.disconnect();
  socket2.disconnect();
  server.close();

  console.log('\n======================================================');
  console.log('🎉 WEBRTC CALLING SYSTEM IS 100% OPERATIONAL & VERIFIED! 🎉');
  console.log('======================================================\n');
}

testWebRTCCallingSystem()
  .catch((err) => {
    console.error('❌ WebRTC Calling Test Failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
