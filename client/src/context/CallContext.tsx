import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext.js';
import { callSound } from '../services/callSound.js';
import { soundService } from '../services/sound.js';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

export interface ActivePartnerInfo {
  id: string;
  displayName: string;
  username: string;
  avatarUrl?: string | null;
}

interface CallerInfo {
  callerId: string;
  callerName: string;
  callerUsername: string;
  callerAvatar?: string | null;
  type: CallType;
  offer: any;
}

interface PeerMediaState {
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
}

interface CallContextType {
  callState: CallState;
  callType: CallType;
  callerInfo: CallerInfo | null;
  activePartnerInfo: ActivePartnerInfo | null;
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isPip: boolean;
  voiceIsolation: boolean;
  peerMedia: PeerMediaState;
  callDuration: number;
  startCall: (type: CallType, targetUser: ActivePartnerInfo) => Promise<void>;
  acceptCall: () => Promise<void>;
  rejectCall: () => void;
  endCall: () => void;
  toggleMute: () => void;
  toggleVideo: () => void;
  toggleVoiceIsolation: () => void;
  toggleScreenShare: () => Promise<void>;
  switchCamera: () => Promise<void>;
  togglePip: () => void;
  setIsPip: (val: boolean) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    { urls: 'stun:stun.cloudflare.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp'
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject'
    }
  ],
  iceCandidatePoolSize: 10,
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useSocket();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);
  const [activePartnerInfo, setActivePartnerInfo] = useState<ActivePartnerInfo | null>(null);

  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);

  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isPip, setIsPip] = useState(false);
  const [voiceIsolation, setVoiceIsolation] = useState(() => localStorage.getItem('voice_isolation') !== 'false');

  const [peerMedia, setPeerMedia] = useState<PeerMediaState>({
    isMuted: false,
    isVideoOff: false,
    isScreenSharing: false,
  });

  const [callDuration, setCallDuration] = useState(0);

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentFacingModeRef = useRef<'user' | 'environment'>('user');
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

  // Dedicated remote audio player with autoplay unlock
  const playRemoteAudio = (stream: MediaStream) => {
    try {
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = stream;
        remoteAudioRef.current.volume = 1.0;
        remoteAudioRef.current.muted = false;
        const p = remoteAudioRef.current.play();
        if (p !== undefined) {
          p.catch((err) => {
            console.warn('Autoplay prevented remote audio, attaching gesture listener:', err);
            const unlock = () => {
              remoteAudioRef.current?.play().catch(() => {});
              window.removeEventListener('click', unlock);
              window.removeEventListener('touchstart', unlock);
            };
            window.addEventListener('click', unlock, { once: true });
            window.addEventListener('touchstart', unlock, { once: true });
          });
        }
      }
    } catch (e) {
      console.warn('Error playing remote audio:', e);
    }
  };

  // Call duration counter
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [callState]);

  // Clean local media tracks
  const cleanupMedia = () => {
    callSound.stopRingtone();
    pendingCandidatesRef.current = [];
    if (rawStreamRef.current) {
      rawStreamRef.current.getTracks().forEach((t) => t.stop());
      rawStreamRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
      setLocalStream(null);
    }
    if (remoteStreamRef.current) {
      remoteStreamRef.current = null;
      setRemoteStream(null);
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (remoteAudioRef.current) {
      remoteAudioRef.current.srcObject = null;
    }
    targetUserIdRef.current = null;
    setActivePartnerInfo(null);
    setCallerInfo(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsPip(false);
    setPeerMedia({ isMuted: false, isVideoOff: false, isScreenSharing: false });
  };

  // Socket WebRTC signaling listeners
  useEffect(() => {
    if (!socket) return;

    // 1. Incoming Call
    const handleIncomingCall = (data: CallerInfo) => {
      if (callState !== 'idle') {
        socket.emit('call:reject', { callerId: data.callerId, reason: 'busy' });
        return;
      }
      targetUserIdRef.current = data.callerId;
      pendingCandidatesRef.current = [];
      setCallerInfo(data);
      setActivePartnerInfo({
        id: data.callerId,
        displayName: data.callerName,
        username: data.callerUsername,
        avatarUrl: data.callerAvatar,
      });
      setCallType(data.type);
      setCallState('incoming');
      callSound.playIncomingRing();
    };

    // 2. Call Accepted
    const handleCallAccepted = async (data: { acceptorId: string; answer: any }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          
          // Drain buffered ICE candidates
          while (pendingCandidatesRef.current.length > 0) {
            const cand = pendingCandidatesRef.current.shift();
            try {
              await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(cand));
            } catch (candErr) {
              console.warn('ICE drain error:', candErr);
            }
          }

          callSound.playConnectedChime();
          setCallState('connected');
          if (remoteStreamRef.current) {
            playRemoteAudio(remoteStreamRef.current);
          }
        } catch (err) {
          console.error('Failed to set remote description on accept:', err);
        }
      }
    };

    // 3. Call Rejected / Busy
    const handleCallRejected = () => {
      callSound.playEndCallTone();
      setCallState('ended');
      setTimeout(() => {
        cleanupMedia();
        setCallState('idle');
      }, 1500);
    };

    // 4. Call Ended by Partner
    const handleCallEnded = () => {
      callSound.playEndCallTone();
      setCallState('ended');
      setTimeout(() => {
        cleanupMedia();
        setCallState('idle');
      }, 1500);
    };

    // 5. ICE Candidate
    const handleIceCandidate = async (data: { candidate: any }) => {
      if (peerConnectionRef.current && data.candidate) {
        try {
          if (peerConnectionRef.current.remoteDescription) {
            await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
          } else {
            pendingCandidatesRef.current.push(data.candidate);
          }
        } catch (err) {
          console.error('Error adding received ICE candidate:', err);
        }
      } else if (data.candidate) {
        pendingCandidatesRef.current.push(data.candidate);
      }
    };

    // 6. Peer Media Toggle
    const handlePeerMediaToggle = (data: PeerMediaState) => {
      setPeerMedia((prev) => ({
        ...prev,
        ...data,
      }));
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:peer-media-toggle', handlePeerMediaToggle);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:peer-media-toggle', handlePeerMediaToggle);
    };
  }, [socket, callState]);

  // Create RTCPeerConnection instance
  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    try {
      pc.addTransceiver('audio', { direction: 'sendrecv' });
      pc.addTransceiver('video', { direction: 'sendrecv' });
    } catch {
      // Browser handles automatically
    }

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserIdRef.current) {
        socket.emit('call:ice-candidate', {
          targetUserId: targetUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📡 Received remote track:', event.track.kind);
      const stream = (event.streams && event.streams[0]) ? event.streams[0] : new MediaStream([event.track]);
      remoteStreamRef.current = stream;
      setRemoteStream(stream);

      if (event.track.kind === 'audio') {
        event.track.enabled = true;
      }

      playRemoteAudio(stream);

      event.track.onunmute = () => {
        console.log('📡 Remote track unmuted, playing audio...');
        playRemoteAudio(stream);
      };
    };

    pc.onconnectionstatechange = () => {
      console.log('📡 Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        callSound.stopRingtone();
        setCallState('connected');
        if (remoteStreamRef.current) {
          playRemoteAudio(remoteStreamRef.current);
        }
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Acquire raw stream with optimal audio constraints
  const acquireProcessedStream = async (type: CallType): Promise<MediaStream> => {
    let raw: MediaStream;

    try {
      raw = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
        video: type === 'video' ? { facingMode: 'user' } : false,
      });
    } catch (firstErr: any) {
      console.warn('Initial getUserMedia attempt failed, trying basic fallback:', firstErr);
      try {
        raw = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: type === 'video' ? true : false,
        });
      } catch (secondErr: any) {
        if (type === 'video') {
          console.warn('Video camera completely unavailable, falling back to voice call...');
          raw = await navigator.mediaDevices.getUserMedia({ audio: true });
          setCallType('audio');
        } else {
          throw secondErr;
        }
      }
    }

    raw.getAudioTracks().forEach((t) => {
      t.enabled = true;
    });

    rawStreamRef.current = raw;
    return raw;
  };

  // Start outgoing call
  const startCall = async (type: CallType, targetUser: ActivePartnerInfo) => {
    if (!socket || !isConnected) {
      alert('Cannot start call: Not connected to chat server.');
      return;
    }
    if (!targetUser || !targetUser.id) {
      alert('Cannot start call: No recipient selected.');
      return;
    }

    soundService.unlockAudio();

    try {
      targetUserIdRef.current = targetUser.id;
      setActivePartnerInfo(targetUser);
      pendingCandidatesRef.current = [];
      setCallType(type);
      setCallState('calling');
      callSound.playOutgoingRing();

      const stream = await acquireProcessedStream(type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: true,
      });
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
        targetUserId: targetUser.id,
        type,
        offer,
      });
    } catch (err: any) {
      console.error('Error starting call:', err);
      cleanupMedia();
      setCallState('idle');
      alert(`Could not start ${type} call: ${err.message || 'Microphone/Camera permission denied'}`);
    }
  };

  // Accept incoming call
  const acceptCall = async () => {
    if (!socket || !callerInfo) return;

    soundService.unlockAudio();
    callSound.stopRingtone();
    try {
      const stream = await acquireProcessedStream(callerInfo.type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callerInfo.offer));

      // Drain buffered ICE candidates
      while (pendingCandidatesRef.current.length > 0) {
        const cand = pendingCandidatesRef.current.shift();
        try {
          await pc.addIceCandidate(new RTCIceCandidate(cand));
        } catch (candErr) {
          console.warn('ICE drain error:', candErr);
        }
      }

      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:accept', {
        callerId: callerInfo.callerId,
        answer,
      });
      callSound.playConnectedChime();
      setCallState('connected');
    } catch (err: any) {
      console.error('Error accepting call:', err);
      rejectCall();
      alert(`Could not accept call: ${err.message || 'Microphone/Camera permission denied'}`);
    }
  };

  // Reject incoming call
  const rejectCall = () => {
    callSound.stopRingtone();
    if (socket && callerInfo) {
      socket.emit('call:reject', {
        callerId: callerInfo.callerId,
        reason: 'declined',
      });
    }
    cleanupMedia();
    setCallState('idle');
    setCallerInfo(null);
  };

  // End active call
  const endCall = () => {
    callSound.playEndCallTone();
    if (socket && targetUserIdRef.current) {
      socket.emit('call:end', {
        targetUserId: targetUserIdRef.current,
      });
    }
    setCallState('ended');
    setTimeout(() => {
      cleanupMedia();
      setCallState('idle');
      setCallerInfo(null);
    }, 1000);
  };

  // Toggle Mute Mic
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTracks = localStreamRef.current.getAudioTracks();
      const newMuted = !isMuted;
      audioTracks.forEach((t) => (t.enabled = !newMuted));
      setIsMuted(newMuted);
      if (socket && targetUserIdRef.current) {
        socket.emit('call:media-toggle', {
          targetUserId: targetUserIdRef.current,
          isMuted: newMuted,
        });
      }
    }
  };

  // Toggle Video Camera
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTracks = localStreamRef.current.getVideoTracks();
      const newVideoOff = !isVideoOff;
      videoTracks.forEach((t) => (t.enabled = !newVideoOff));
      setIsVideoOff(newVideoOff);
      if (socket && targetUserIdRef.current) {
        socket.emit('call:media-toggle', {
          targetUserId: targetUserIdRef.current,
          isVideoOff: newVideoOff,
        });
      }
    }
  };

  // Toggle Voice Isolation
  const toggleVoiceIsolation = () => {
    const nextVal = !voiceIsolation;
    setVoiceIsolation(nextVal);
    localStorage.setItem('voice_isolation', nextVal.toString());
  };

  // Toggle Screen Sharing (Universal across Voice and Video calls)
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) {
      alert('Cannot share screen: No active call.');
      return;
    }

    if (isScreenSharing) {
      try {
        if (callType === 'video') {
          const camStream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: currentFacingModeRef.current },
          });
          const newVideoTrack = camStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');

          if (sender && newVideoTrack) {
            sender.replaceTrack(newVideoTrack);
          }

          if (localStreamRef.current) {
            const oldTracks = localStreamRef.current.getVideoTracks();
            oldTracks.forEach((t) => t.stop());
            localStreamRef.current.removeTrack(oldTracks[0]);
            localStreamRef.current.addTrack(newVideoTrack);
            setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
          }
        } else {
          // In audio call, stop the video track
          const sender = peerConnectionRef.current
            .getSenders()
            .find((s) => s.track && s.track.kind === 'video');
          if (sender) {
            sender.replaceTrack(null as any);
          }
          if (localStreamRef.current) {
            const oldTracks = localStreamRef.current.getVideoTracks();
            oldTracks.forEach((t) => t.stop());
          }
        }

        setIsScreenSharing(false);
        if (socket && targetUserIdRef.current) {
          socket.emit('call:media-toggle', {
            targetUserId: targetUserIdRef.current,
            isScreenSharing: false,
          });
        }
      } catch (err) {
        console.error('Error reverting screen share:', err);
      }
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: {
            cursor: 'always',
            displaySurface: 'monitor',
          },
          audio: true,
        });
        const screenTrack = screenStream.getVideoTracks()[0];

        screenTrack.onended = () => {
          toggleScreenShare();
        };

        const sender = peerConnectionRef.current
          .getSenders()
          .find((s) => s.track && s.track.kind === 'video');

        if (sender) {
          sender.replaceTrack(screenTrack);
        } else {
          peerConnectionRef.current.addTrack(screenTrack, screenStream);
        }

        if (localStreamRef.current) {
          localStreamRef.current.addTrack(screenTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        } else {
          setLocalStream(screenStream);
        }

        setIsScreenSharing(true);
        if (socket && targetUserIdRef.current) {
          socket.emit('call:media-toggle', {
            targetUserId: targetUserIdRef.current,
            isScreenSharing: true,
          });
        }
      } catch (err) {
        console.error('Screen sharing canceled or failed:', err);
      }
    }
  };

  // Switch Front/Back Camera on mobile
  const switchCamera = async () => {
    if (!peerConnectionRef.current || isScreenSharing) return;

    try {
      const nextFacing = currentFacingModeRef.current === 'user' ? 'environment' : 'user';
      currentFacingModeRef.current = nextFacing;

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: nextFacing },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];

      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');

      if (sender && newVideoTrack) {
        sender.replaceTrack(newVideoTrack);
      }

      if (localStreamRef.current) {
        const oldTracks = localStreamRef.current.getVideoTracks();
        oldTracks.forEach((t) => t.stop());
        localStreamRef.current.removeTrack(oldTracks[0]);
        localStreamRef.current.addTrack(newVideoTrack);
        setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
      }
    } catch (err) {
      console.error('Error switching camera:', err);
    }
  };

  const togglePip = () => {
    setIsPip(!isPip);
  };

  return (
    <CallContext.Provider
      value={{
        callState,
        callType,
        callerInfo,
        activePartnerInfo,
        localStream,
        remoteStream,
        isMuted,
        isVideoOff,
        isScreenSharing,
        isPip,
        voiceIsolation,
        peerMedia,
        callDuration,
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleVideo,
        toggleVoiceIsolation,
        toggleScreenShare,
        switchCamera,
        togglePip,
        setIsPip,
      }}
    >
      {/* Permanent Audio Element for incoming remote audio across all calling modes */}
      <audio ref={remoteAudioRef} autoPlay playsInline />
      {children}
    </CallContext.Provider>
  );
};

export const useCall = (): CallContextType => {
  const context = useContext(CallContext);
  if (!context) {
    throw new Error('useCall must be used within a CallProvider');
  }
  return context;
};
