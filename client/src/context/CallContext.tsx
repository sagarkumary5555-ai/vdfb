import React, { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { useSocket } from './SocketContext.js';
import { callSound } from '../services/callSound.js';
import { soundService } from '../services/sound.js';
import { AudioDspService } from '../services/audioDsp.js';

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

export interface FloatingReaction {
  id: string;
  emoji: string;
  senderName: string;
  leftPercent: number;
}

export interface DeviceCatalog {
  audioInputs: MediaDeviceInfo[];
  videoInputs: MediaDeviceInfo[];
  audioOutputs: MediaDeviceInfo[];
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
  localAudioLevel: number;
  remoteAudioLevel: number;
  isLocalSpeaking: boolean;
  isRemoteSpeaking: boolean;
  networkQuality: 'excellent' | 'good' | 'fair';
  volumeBoost: number;
  setVolumeBoost: (val: number) => void;
  floatingReactions: FloatingReaction[];
  sendCallReaction: (emoji: string) => void;
  sendSoundboardEffect: (soundType: 'applause' | 'cheer' | 'ding' | 'trumpet') => void;
  callEndToast: { duration: number; type: CallType; partnerName: string } | null;
  clearCallEndToast: () => void;
  deviceCatalog: DeviceCatalog;
  selectedAudioInput: string;
  selectedVideoInput: string;
  selectedAudioOutput: string;
  setSelectedAudioInput: (id: string) => Promise<void>;
  setSelectedVideoInput: (id: string) => Promise<void>;
  setSelectedAudioOutput: (id: string) => Promise<void>;
  videoQuality: '1080p' | '720p' | '360p';
  setVideoQuality: (q: '1080p' | '720p' | '360p') => Promise<void>;
  isSelfMirrored: boolean;
  toggleSelfMirror: () => void;
  testSpeakerSound: () => void;
  ambientTheme: 'aurora' | 'cyber' | 'emerald' | 'sunset';
  setAmbientTheme: (theme: 'aurora' | 'cyber' | 'emerald' | 'sunset') => void;
  noiseGateThreshold: number;
  setNoiseGateThreshold: (val: number) => void;
  isRecording: boolean;
  startRecording: () => void;
  stopRecording: () => void;
  videoFilter: 'none' | 'blur' | 'cyber' | 'noir' | 'warm';
  setVideoFilter: (f: 'none' | 'blur' | 'cyber' | 'noir' | 'warm') => void;
  equalizerBass: number;
  equalizerVocal: number;
  equalizerTreble: number;
  setEqualizerBass: (v: number) => void;
  setEqualizerVocal: (v: number) => void;
  setEqualizerTreble: (v: number) => void;
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
    { urls: 'stun:stun.services.mozilla.com:3478' },
    { urls: 'stun:global.stun.twilio.com:3478' },
    // Public OpenRelay UDP/TCP TURN
    {
      urls: [
        'turn:openrelay.metered.ca:80',
        'turn:openrelay.metered.ca:443',
        'turn:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    // Secure TLS/HTTPS TURN (Essential for mobile ISPs and firewalls)
    {
      urls: [
        'turns:openrelay.metered.ca:443',
        'turns:openrelay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
    {
      urls: [
        'turn:standard.relay.metered.ca:80',
        'turn:standard.relay.metered.ca:443',
        'turn:standard.relay.metered.ca:443?transport=tcp',
        'turns:standard.relay.metered.ca:443',
        'turns:standard.relay.metered.ca:443?transport=tcp',
      ],
      username: 'openrelayproject',
      credential: 'openrelayproject',
    },
  ],
  iceCandidatePoolSize: 10,
  bundlePolicy: 'max-bundle',
  rtcpMuxPolicy: 'require',
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
  const [localAudioLevel, setLocalAudioLevel] = useState(0);
  const [remoteAudioLevel, setRemoteAudioLevel] = useState(0);
  const [networkQuality, setNetworkQuality] = useState<'excellent' | 'good' | 'fair'>('excellent');
  const [volumeBoost, setVolumeBoost] = useState(1.0);
  const [floatingReactions, setFloatingReactions] = useState<FloatingReaction[]>([]);
  const [callEndToast, setCallEndToast] = useState<{ duration: number; type: CallType; partnerName: string } | null>(null);

  const clearCallEndToast = () => setCallEndToast(null);

  // Device Management State
  const [deviceCatalog, setDeviceCatalog] = useState<DeviceCatalog>({
    audioInputs: [],
    videoInputs: [],
    audioOutputs: [],
  });
  const [selectedAudioInput, setSelectedAudioInputState] = useState('');
  const [selectedVideoInput, setSelectedVideoInputState] = useState('');
  const [selectedAudioOutput, setSelectedAudioOutputState] = useState('');
  const [videoQuality, setVideoQualityState] = useState<'1080p' | '720p' | '360p'>('1080p');
  const [isSelfMirrored, setIsSelfMirrored] = useState(true);
  const [ambientTheme, setAmbientTheme] = useState<'aurora' | 'cyber' | 'emerald' | 'sunset'>('aurora');
  const [noiseGateThreshold, setNoiseGateThreshold] = useState(18);
  const [isRecording, setIsRecording] = useState(false);
  const [videoFilter, setVideoFilter] = useState<'none' | 'blur' | 'cyber' | 'noir' | 'warm'>('none');
  const [equalizerBass, setEqualizerBass] = useState(0);
  const [equalizerVocal, setEqualizerVocal] = useState(0);
  const [equalizerTreble, setEqualizerTreble] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);

  const isLocalSpeaking = localAudioLevel > 15;
  const isRemoteSpeaking = remoteAudioLevel > 15;

  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const targetUserIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<any[]>([]);
  const rawStreamRef = useRef<MediaStream | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const statsTimerRef = useRef<NodeJS.Timeout | null>(null);
  const currentFacingModeRef = useRef<'user' | 'environment'>('user');
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const localAnalyserRef = useRef<AnalyserNode | null>(null);
  const remoteAnalyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Load hardware media devices
  const refreshDevices = async () => {
    try {
      if (!navigator.mediaDevices?.enumerateDevices) return;
      const devices = await navigator.mediaDevices.enumerateDevices();
      setDeviceCatalog({
        audioInputs: devices.filter((d) => d.kind === 'audioinput'),
        videoInputs: devices.filter((d) => d.kind === 'videoinput'),
        audioOutputs: devices.filter((d) => d.kind === 'audiooutput'),
      });
    } catch {
      // Safe ignore
    }
  };

  useEffect(() => {
    refreshDevices();
    navigator.mediaDevices?.addEventListener?.('devicechange', refreshDevices);
    return () => {
      navigator.mediaDevices?.removeEventListener?.('devicechange', refreshDevices);
    };
  }, []);

  // Dedicated remote audio player with auto-unlock listeners
  const playRemoteAudio = (stream: MediaStream) => {
    if (!stream) return;
    try {
      // Ensure all incoming audio tracks are explicitly enabled
      stream.getAudioTracks().forEach((track) => {
        track.enabled = true;
      });

      const ctx = AudioDspService.getContext();
      if (ctx && ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      if (remoteAudioRef.current) {
        const audioEl = remoteAudioRef.current;
        if (audioEl.srcObject !== stream) {
          audioEl.srcObject = stream;
        }
        audioEl.volume = Math.min(1.0, Math.max(0.1, volumeBoost));
        audioEl.muted = false;

        const playPromise = audioEl.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              console.log('🔊 WebRTC remote audio playing cleanly');
            })
            .catch((err) => {
              console.warn('Autoplay prevented remote audio, waiting for user gesture unlock:', err);
              const unlock = () => {
                audioEl.muted = false;
                audioEl.play().catch(() => {});
                if (ctx && ctx.state === 'suspended') {
                  ctx.resume().catch(() => {});
                }
                window.removeEventListener('click', unlock);
                window.removeEventListener('touchstart', unlock);
                window.removeEventListener('pointerdown', unlock);
                window.removeEventListener('keydown', unlock);
              };
              window.addEventListener('click', unlock, { once: true });
              window.addEventListener('touchstart', unlock, { once: true });
              window.addEventListener('pointerdown', unlock, { once: true });
              window.addEventListener('keydown', unlock, { once: true });
            });
        }
      }
    } catch (e) {
      console.warn('Error playing remote audio:', e);
    }
  };

  // Real-time Web Audio Analyser Loop for both local & remote volume visualizers
  useEffect(() => {
    if (callState !== 'connected' && callState !== 'calling') {
      setLocalAudioLevel(0);
      setRemoteAudioLevel(0);
      return;
    }

    try {
      const ctx = AudioDspService.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }
      audioContextRef.current = ctx;

      // Local stream analyser for visual VU meter
      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        try {
          const localSrc = ctx.createMediaStreamSource(localStreamRef.current);
          const localAnalyser = ctx.createAnalyser();
          localAnalyser.fftSize = 64;
          localAnalyser.smoothingTimeConstant = 0.5;
          localSrc.connect(localAnalyser);
          localAnalyserRef.current = localAnalyser;
        } catch {
          // Ignore
        }
      }

      // Remote stream analyser for visual speaking indicator & waveform
      if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
        try {
          const remoteSrc = ctx.createMediaStreamSource(remoteStreamRef.current);
          const remoteAnalyser = ctx.createAnalyser();
          remoteAnalyser.fftSize = 64;
          remoteAnalyser.smoothingTimeConstant = 0.5;
          remoteSrc.connect(remoteAnalyser);
          remoteAnalyserRef.current = remoteAnalyser;
        } catch {
          // Ignore
        }
      }

      const localData = new Uint8Array(32);
      const remoteData = new Uint8Array(32);

      const monitorAudioLevels = () => {
        if (localAnalyserRef.current) {
          localAnalyserRef.current.getByteFrequencyData(localData);
          let sum = 0;
          for (let i = 0; i < localData.length; i++) sum += localData[i];
          const avg = sum / localData.length;
          setLocalAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }

        if (remoteAnalyserRef.current) {
          remoteAnalyserRef.current.getByteFrequencyData(remoteData);
          let sum = 0;
          for (let i = 0; i < remoteData.length; i++) sum += remoteData[i];
          const avg = sum / remoteData.length;
          setRemoteAudioLevel(Math.min(100, Math.round((avg / 128) * 100)));
        }

        animFrameRef.current = requestAnimationFrame(monitorAudioLevels);
      };

      animFrameRef.current = requestAnimationFrame(monitorAudioLevels);
    } catch (e) {
      console.warn('Audio level monitoring fallback:', e);
    }

    return () => {
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [callState, localStream, remoteStream]);

  // Adjust volume boost in real-time
  useEffect(() => {
    if (remoteAudioRef.current) {
      remoteAudioRef.current.volume = Math.min(1.0, Math.max(0.1, volumeBoost));
    }
  }, [volumeBoost]);

  // Call duration counter & WebRTC connection stats monitor
  useEffect(() => {
    if (callState === 'connected') {
      setCallDuration(0);
      timerRef.current = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);

      // Periodically measure network quality
      statsTimerRef.current = setInterval(async () => {
        if (peerConnectionRef.current) {
          try {
            const stats = await peerConnectionRef.current.getStats();
            stats.forEach((report) => {
              if (report.type === 'candidate-pair' && report.currentRoundTripTime) {
                const rtt = report.currentRoundTripTime * 1000;
                if (rtt < 80) setNetworkQuality('excellent');
                else if (rtt < 180) setNetworkQuality('good');
                else setNetworkQuality('fair');
              }
            });
          } catch {
            // Safe ignore
          }
        }
      }, 3000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      if (statsTimerRef.current) {
        clearInterval(statsTimerRef.current);
        statsTimerRef.current = null;
      }
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (statsTimerRef.current) clearInterval(statsTimerRef.current);
    };
  }, [callState]);

  // Floating Reaction Sender
  const sendCallReaction = (emoji: string) => {
    const reactionItem: FloatingReaction = {
      id: `${Date.now()}_${Math.random()}`,
      emoji,
      senderName: 'You',
      leftPercent: 20 + Math.random() * 60,
    };
    setFloatingReactions((prev) => [...prev, reactionItem]);
    setTimeout(() => {
      setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionItem.id));
    }, 2800);

    if (socket && targetUserIdRef.current) {
      socket.emit('call:reaction', {
        targetUserId: targetUserIdRef.current,
        emoji,
      });
    }
  };

  // Soundboard Effect Sender
  const sendSoundboardEffect = (soundType: 'applause' | 'cheer' | 'ding' | 'trumpet') => {
    if (soundType === 'applause') callSound.playApplause();
    else if (soundType === 'cheer') callSound.playCheer();
    else if (soundType === 'ding') callSound.playDing();
    else if (soundType === 'trumpet') callSound.playTrumpet();

    const emojiMap: Record<string, string> = {
      applause: '👏',
      cheer: '🎉',
      ding: '🔔',
      trumpet: '🎺',
    };
    sendCallReaction(emojiMap[soundType] || '🎵');

    if (socket && targetUserIdRef.current) {
      socket.emit('call:soundboard', {
        targetUserId: targetUserIdRef.current,
        soundType,
      });
    }
  };

  // Switch Audio Input Device
  const setSelectedAudioInput = async (deviceId: string) => {
    setSelectedAudioInputState(deviceId);
    if (!peerConnectionRef.current || !localStreamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          deviceId: { exact: deviceId },
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      const newAudioTrack = newStream.getAudioTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === 'audio');
      if (sender && newAudioTrack) {
        sender.replaceTrack(newAudioTrack);
      }
      localStreamRef.current.getAudioTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getAudioTracks()[0]);
      localStreamRef.current.addTrack(newAudioTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (e) {
      console.warn('Error switching audio input:', e);
    }
  };

  // Switch Video Input Camera Device
  const setSelectedVideoInput = async (deviceId: string) => {
    setSelectedVideoInputState(deviceId);
    if (!peerConnectionRef.current || !localStreamRef.current) return;
    try {
      const newStream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: deviceId } },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');
      if (sender && newVideoTrack) {
        sender.replaceTrack(newVideoTrack);
      }
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (e) {
      console.warn('Error switching video input:', e);
    }
  };

  // Switch Audio Output Device (Speaker / Headphones)
  const setSelectedAudioOutput = async (deviceId: string) => {
    setSelectedAudioOutputState(deviceId);
    try {
      if (remoteAudioRef.current && (remoteAudioRef.current as any).setSinkId) {
        await (remoteAudioRef.current as any).setSinkId(deviceId);
      }
    } catch (e) {
      console.warn('Audio output sink switching not supported on this browser:', e);
    }
  };

  // Switch Video Quality / Resolution Preset
  const setVideoQuality = async (q: '1080p' | '720p' | '360p') => {
    setVideoQualityState(q);
    if (!peerConnectionRef.current || !localStreamRef.current || isScreenSharing) return;
    try {
      const dimensions =
        q === '1080p'
          ? { width: { ideal: 1920 }, height: { ideal: 1080 } }
          : q === '720p'
          ? { width: { ideal: 1280 }, height: { ideal: 720 } }
          : { width: { ideal: 640 }, height: { ideal: 360 } };

      const newStream = await navigator.mediaDevices.getUserMedia({
        video: {
          ...dimensions,
          facingMode: currentFacingModeRef.current,
        },
      });
      const newVideoTrack = newStream.getVideoTracks()[0];
      const sender = peerConnectionRef.current
        .getSenders()
        .find((s) => s.track && s.track.kind === 'video');
      if (sender && newVideoTrack) {
        sender.replaceTrack(newVideoTrack);
      }
      localStreamRef.current.getVideoTracks().forEach((t) => t.stop());
      localStreamRef.current.removeTrack(localStreamRef.current.getVideoTracks()[0]);
      localStreamRef.current.addTrack(newVideoTrack);
      setLocalStream(new MediaStream(localStreamRef.current.getTracks()));
    } catch (e) {
      console.warn('Error adjusting video quality:', e);
    }
  };

  // Toggle Self-View Mirroring
  const toggleSelfMirror = () => {
    setIsSelfMirrored((prev) => !prev);
  };

  // Test Speaker Sound
  const testSpeakerSound = () => {
    callSound.playDing();
  };

  // Start Mixed Audio Recording
  const startRecording = () => {
    try {
      const ctx = AudioDspService.getContext();
      const mixedDest = ctx.createMediaStreamDestination();

      if (localStreamRef.current && localStreamRef.current.getAudioTracks().length > 0) {
        try {
          const localSrc = ctx.createMediaStreamSource(localStreamRef.current);
          localSrc.connect(mixedDest);
        } catch {}
      }

      if (remoteStreamRef.current && remoteStreamRef.current.getAudioTracks().length > 0) {
        try {
          const remoteSrc = ctx.createMediaStreamSource(remoteStreamRef.current);
          remoteSrc.connect(mixedDest);
        } catch {}
      }

      const recorder = new MediaRecorder(mixedDest.stream);
      recordedChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        if (recordedChunksRef.current.length > 0) {
          const blob = new Blob(recordedChunksRef.current, { type: 'audio/webm' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `call-recording-${Date.now()}.webm`;
          a.click();
          recordedChunksRef.current = [];
        }
      };

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      setIsRecording(true);
    } catch (err) {
      console.warn('Call recording failed to start:', err);
    }
  };

  // Stop Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
  };

  // Clean local media tracks
  const cleanupMedia = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current = null;
    }
    setIsRecording(false);
    callSound.stopRingtone();
    pendingCandidatesRef.current = [];
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
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
    targetUserIdRef.current = null;
    setActivePartnerInfo(null);
    setCallerInfo(null);
    setIsMuted(false);
    setIsVideoOff(false);
    setIsScreenSharing(false);
    setIsPip(false);
    setPeerMedia({ isMuted: false, isVideoOff: false, isScreenSharing: false });
    setLocalAudioLevel(0);
    setRemoteAudioLevel(0);
    setFloatingReactions([]);
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
      if (callDuration > 0) {
        setCallEndToast({
          duration: callDuration,
          type: callType,
          partnerName: activePartnerInfo?.displayName || callerInfo?.callerName || 'Friend',
        });
        setTimeout(() => setCallEndToast(null), 6000);
      }
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

    // 7. Live In-Call Floating Reaction
    const handleCallReaction = (data: { emoji: string; senderName: string }) => {
      const reactionItem: FloatingReaction = {
        id: `${Date.now()}_${Math.random()}`,
        emoji: data.emoji,
        senderName: data.senderName || 'Friend',
        leftPercent: 20 + Math.random() * 60,
      };
      setFloatingReactions((prev) => [...prev, reactionItem]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionItem.id));
      }, 2800);
    };

    // 8. Live In-Call Soundboard Effect
    const handleSoundboard = (data: { soundType: 'applause' | 'cheer' | 'ding' | 'trumpet'; senderName: string }) => {
      if (data.soundType === 'applause') callSound.playApplause();
      else if (data.soundType === 'cheer') callSound.playCheer();
      else if (data.soundType === 'ding') callSound.playDing();
      else if (data.soundType === 'trumpet') callSound.playTrumpet();

      const emojiMap: Record<string, string> = {
        applause: '👏',
        cheer: '🎉',
        ding: '🔔',
        trumpet: '🎺',
      };
      const reactionItem: FloatingReaction = {
        id: `${Date.now()}_${Math.random()}`,
        emoji: emojiMap[data.soundType] || '🎵',
        senderName: data.senderName || 'Friend',
        leftPercent: 20 + Math.random() * 60,
      };
      setFloatingReactions((prev) => [...prev, reactionItem]);
      setTimeout(() => {
        setFloatingReactions((prev) => prev.filter((r) => r.id !== reactionItem.id));
      }, 2800);
    };

    socket.on('call:incoming', handleIncomingCall);
    socket.on('call:accepted', handleCallAccepted);
    socket.on('call:rejected', handleCallRejected);
    socket.on('call:ended', handleCallEnded);
    socket.on('call:ice-candidate', handleIceCandidate);
    socket.on('call:peer-media-toggle', handlePeerMediaToggle);
    socket.on('call:reaction', handleCallReaction);
    socket.on('call:soundboard', handleSoundboard);

    return () => {
      socket.off('call:incoming', handleIncomingCall);
      socket.off('call:accepted', handleCallAccepted);
      socket.off('call:rejected', handleCallRejected);
      socket.off('call:ended', handleCallEnded);
      socket.off('call:ice-candidate', handleIceCandidate);
      socket.off('call:peer-media-toggle', handlePeerMediaToggle);
      socket.off('call:reaction', handleCallReaction);
      socket.off('call:soundboard', handleSoundboard);
    };
  }, [socket, callState]);

  // Create RTCPeerConnection instance
  const createPeerConnection = (): RTCPeerConnection => {
    const pc = new RTCPeerConnection(ICE_SERVERS);

    pc.onicecandidate = (event) => {
      if (event.candidate && socket && targetUserIdRef.current) {
        socket.emit('call:ice-candidate', {
          targetUserId: targetUserIdRef.current,
          candidate: event.candidate,
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('📡 Received remote track:', event.track.kind, event.track.id);
      
      event.track.enabled = true;

      const stream = (event.streams && event.streams[0])
        ? event.streams[0]
        : (remoteStreamRef.current || new MediaStream());

      if (!stream.getTracks().some((t) => t.id === event.track.id)) {
        stream.addTrack(event.track);
      }

      remoteStreamRef.current = stream;
      setRemoteStream(stream);

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
        video: type === 'video' ? {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 720 },
        } : false,
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

      // Attach microphone and camera tracks directly to PeerConnection
      stream.getTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
        offerToReceiveVideo: type === 'video',
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

    if (remoteAudioRef.current) {
      remoteAudioRef.current.muted = false;
    }

    try {
      const stream = await acquireProcessedStream(callerInfo.type);
      localStreamRef.current = stream;
      setLocalStream(stream);

      const pc = createPeerConnection();

      // Attach microphone and camera tracks directly to PeerConnection
      stream.getTracks().forEach((track) => {
        track.enabled = true;
        pc.addTrack(track, stream);
      });

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
    if (callDuration > 0) {
      setCallEndToast({
        duration: callDuration,
        type: callType,
        partnerName: activePartnerInfo?.displayName || callerInfo?.callerName || 'Friend',
      });
      setTimeout(() => setCallEndToast(null), 6000);
    }
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
        localAudioLevel,
        remoteAudioLevel,
        isLocalSpeaking,
        isRemoteSpeaking,
        networkQuality,
        volumeBoost,
        setVolumeBoost,
        floatingReactions,
        sendCallReaction,
        sendSoundboardEffect,
        callEndToast,
        clearCallEndToast,
        deviceCatalog,
        selectedAudioInput,
        selectedVideoInput,
        selectedAudioOutput,
        setSelectedAudioInput,
        setSelectedVideoInput,
        setSelectedAudioOutput,
        videoQuality,
        setVideoQuality,
        isSelfMirrored,
        toggleSelfMirror,
        testSpeakerSound,
        ambientTheme,
        setAmbientTheme,
        noiseGateThreshold,
        setNoiseGateThreshold,
        isRecording,
        startRecording,
        stopRecording,
        videoFilter,
        setVideoFilter,
        equalizerBass,
        equalizerVocal,
        equalizerTreble,
        setEqualizerBass,
        setEqualizerVocal,
        setEqualizerTreble,
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
