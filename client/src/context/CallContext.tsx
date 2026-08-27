import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext.js';
import { callSound } from '../services/callSound.js';
import { AudioDspService } from '../services/audioDsp.js';

export type CallState = 'idle' | 'calling' | 'incoming' | 'connected' | 'ended';
export type CallType = 'audio' | 'video';

interface CallerInfo {
  callerId: string;
  callerName: string;
  callerUsername: string;
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
  localStream: MediaStream | null;
  remoteStream: MediaStream | null;
  isMuted: boolean;
  isVideoOff: boolean;
  isScreenSharing: boolean;
  isPip: boolean;
  voiceIsolation: boolean;
  peerMedia: PeerMediaState;
  callDuration: number;
  startCall: (type: CallType) => Promise<void>;
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
  ],
};

const CallContext = createContext<CallContextType | undefined>(undefined);

export const CallProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { socket, isConnected } = useSocket();

  const [callState, setCallState] = useState<CallState>('idle');
  const [callType, setCallType] = useState<CallType>('audio');
  const [callerInfo, setCallerInfo] = useState<CallerInfo | null>(null);

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
  const rawStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const dspCleanupRef = useRef<(() => void) | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const currentFacingModeRef = useRef<'user' | 'environment'>('user');
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

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
    if (dspCleanupRef.current) {
      dspCleanupRef.current();
      dspCleanupRef.current = null;
    }
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
        socket.emit('call:reject', { reason: 'busy' });
        return;
      }
      setCallerInfo(data);
      setCallType(data.type);
      setCallState('incoming');
      callSound.playIncomingRing();
    };

    // 2. Call Accepted
    const handleCallAccepted = async (data: { acceptorId: string; answer: any }) => {
      if (peerConnectionRef.current) {
        try {
          await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(data.answer));
          callSound.playConnectedChime();
          setCallState('connected');
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
          await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(data.candidate));
        } catch (err) {
          console.error('Error adding received ICE candidate:', err);
        }
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

    pc.onicecandidate = (event) => {
      if (event.candidate && socket) {
        socket.emit('call:ice-candidate', { candidate: event.candidate });
      }
    };

    pc.ontrack = (event) => {
      console.log('📡 Received remote track:', event.track.kind);
      if (event.streams && event.streams[0]) {
        const stream = event.streams[0];
        remoteStreamRef.current = stream;
        setRemoteStream(stream);

        // Connect to audio element so voice ALWAYS plays
        if (remoteAudioRef.current) {
          remoteAudioRef.current.srcObject = stream;
          remoteAudioRef.current.play().catch((e) => console.log('Audio autoplay play error:', e));
        }
      }
    };

    pc.onconnectionstatechange = () => {
      console.log('📡 Peer connection state:', pc.connectionState);
      if (pc.connectionState === 'connected') {
        callSound.stopRingtone();
        setCallState('connected');
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        endCall();
      }
    };

    peerConnectionRef.current = pc;
    return pc;
  };

  // Acquire raw stream with optimal Chromium WebRTC constraints + Dynamic Noise Gate DSP
  const acquireProcessedStream = async (type: CallType): Promise<MediaStream> => {
    let raw: MediaStream;

    try {
      raw = await navigator.mediaDevices.getUserMedia({
        audio: AudioDspService.getOptimalAudioConstraints(),
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

    rawStreamRef.current = raw;

    try {
      const dsp = AudioDspService.processMicrophoneStream(raw, {
        enableIsolation: voiceIsolation,
        enableCompressor: true,
        enableVocalBoost: true,
        gateThreshold: 18,
      });
      dspCleanupRef.current = dsp.cleanup;
      return dsp.processedStream;
    } catch (dspErr) {
      console.warn('DSP processing fallback to raw stream:', dspErr);
      return raw;
    }
  };

  // Start outgoing call
  const startCall = async (type: CallType) => {
    if (!socket || !isConnected) {
      alert('Cannot start call: Not connected to chat server.');
      return;
    }

    try {
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
        offerToReceiveVideo: type === 'video',
      });
      await pc.setLocalDescription(offer);

      socket.emit('call:initiate', {
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

    callSound.stopRingtone();
    try {
      const stream = await acquireProcessedStream(callerInfo.type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();
      stream.getTracks().forEach((track) => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(callerInfo.offer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit('call:accept', { answer });
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
    if (socket) {
      socket.emit('call:reject', { reason: 'declined' });
    }
    cleanupMedia();
    setCallState('idle');
    setCallerInfo(null);
  };

  // End active call
  const endCall = () => {
    callSound.playEndCallTone();
    if (socket) {
      socket.emit('call:end');
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
      if (socket) {
        socket.emit('call:media-toggle', { isMuted: newMuted });
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
      if (socket) {
        socket.emit('call:media-toggle', { isVideoOff: newVideoOff });
      }
    }
  };

  // Toggle Voice Isolation
  const toggleVoiceIsolation = () => {
    const nextVal = !voiceIsolation;
    setVoiceIsolation(nextVal);
    localStorage.setItem('voice_isolation', nextVal.toString());
  };

  // Toggle Screen Sharing
  const toggleScreenShare = async () => {
    if (!peerConnectionRef.current) return;

    if (isScreenSharing) {
      try {
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

        setIsScreenSharing(false);
        if (socket) socket.emit('call:media-toggle', { isScreenSharing: false });
      } catch (err) {
        console.error('Error reverting screen share:', err);
      }
    } else {
      try {
        const screenStream = await (navigator.mediaDevices as any).getDisplayMedia({
          video: true,
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
        }

        if (localStreamRef.current) {
          const oldTracks = localStreamRef.current.getVideoTracks();
          oldTracks.forEach((t) => t.stop());
          localStreamRef.current.removeTrack(oldTracks[0]);
          localStreamRef.current.addTrack(screenTrack);
          setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
        }

        setIsScreenSharing(true);
        if (socket) socket.emit('call:media-toggle', { isScreenSharing: true });
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
