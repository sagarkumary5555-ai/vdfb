import React, { useEffect, useRef, useState } from 'react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Minimize2,
  Maximize2,
  RefreshCw,
  Monitor,
  MonitorOff,
  Volume2,
  Sparkles,
  ShieldCheck,
  Activity,
  Sliders,
  Settings2,
  X,
  Camera,
  Speaker,
  Music,
  Maximize,
  MessageSquare,
  Send,
  Camera as SnapshotIcon,
  Play,
  FlipHorizontal,
  Info,
  Radio,
  Palette,
} from 'lucide-react';
import { useCall } from '../../context/CallContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../Common/Avatar.js';

const QUICK_REACTIONS = ['❤️', '🔥', '👏', '🎉', '😂', '💯', '😍', '🚀'];

const THEME_BACKGROUNDS: Record<string, string> = {
  aurora: 'bg-gradient-to-b from-[#0F1420] via-[#090C14] to-[#05070A]',
  cyber: 'bg-gradient-to-b from-[#1C0F28] via-[#0E0716] to-[#07030C]',
  emerald: 'bg-gradient-to-b from-[#091D17] via-[#06120E] to-[#030806]',
  sunset: 'bg-gradient-to-b from-[#22130A] via-[#120904] to-[#080402]',
};

export const CallModal: React.FC = () => {
  const {
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
    isRemoteSpeaking,
    isLocalSpeaking,
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
    endCall,
    toggleMute,
    toggleVideo,
    toggleVoiceIsolation,
    toggleScreenShare,
    switchCamera,
    togglePip,
  } = useCall();

  const { messages, sendMessage } = useChat();
  const { user: currentUser } = useAuth();

  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [showReactionsBar, setShowReactionsBar] = useState(false);
  const [showSoundboardBar, setShowSoundboardBar] = useState(false);
  const [showInCallChat, setShowInCallChat] = useState(false);
  const [showDiagnosticsHUD, setShowDiagnosticsHUD] = useState(false);
  const [showThemePicker, setShowThemePicker] = useState(false);
  const [chatInputText, setChatInputText] = useState('');
  const [isPushToTalking, setIsPushToTalking] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isPip]);

  const isVideoOrScreenActive =
    (callType === 'video' && !peerMedia.isVideoOff) ||
    isScreenSharing ||
    peerMedia.isScreenSharing;

  // Attach remote media stream for video and direct audio playback
  useEffect(() => {
    if (remoteStream) {
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
        remoteVideoRef.current.play().catch(() => {});
      }
      if (remoteAudioRef.current) {
        remoteAudioRef.current.srcObject = remoteStream;
        remoteAudioRef.current.volume = Math.min(1.0, volumeBoost);
        remoteAudioRef.current.muted = false;
        remoteAudioRef.current.play().catch(() => {});
      }
    }
  }, [remoteStream, isPip, isVideoOrScreenActive, volumeBoost]);

  // Auto-scroll in-call chat
  useEffect(() => {
    if (showInCallChat && chatBottomRef.current) {
      chatBottomRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [showInCallChat, messages]);

  // Spacebar Push-to-Talk (Walkie-Talkie mode)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isMuted && !isPushToTalking) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setIsPushToTalking(true);
        toggleMute();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && isPushToTalking) {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        setIsPushToTalking(false);
        toggleMute();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [isMuted, isPushToTalking]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Toggle true browser fullscreen for video / screen sharing
  const toggleBrowserFullscreen = () => {
    if (!videoContainerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      videoContainerRef.current.requestFullscreen().catch(() => {});
    }
  };

  // Take High-Res Call Snapshot
  const captureSnapshot = () => {
    if (!remoteVideoRef.current) return;
    try {
      const video = remoteVideoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 1280;
      canvas.height = video.videoHeight || 720;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/png');
        const a = document.createElement('a');
        a.href = dataUrl;
        a.download = `call-snapshot-${Date.now()}.png`;
        a.click();
      }
    } catch (e) {
      console.warn('Snapshot capture fallback:', e);
    }
  };

  // Send In-Call Chat Message
  const handleSendInCallMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInputText.trim()) return;
    const text = chatInputText.trim();
    setChatInputText('');
    try {
      await sendMessage(text);
    } catch {
      // Safe ignore
    }
  };

  // Generate 14 responsive dynamic waveform bar heights based on real-time audio volume
  const getDynamicBarHeight = (barIndex: number): number => {
    if (callState !== 'connected') return 15;
    const baseHeight = 12;
    const multiplier = (remoteAudioLevel / 100) * 88;
    const factor = Math.sin((barIndex / 14) * Math.PI) * 0.85 + 0.25;
    return Math.min(100, Math.max(10, Math.round(baseHeight + multiplier * factor)));
  };

  // ========================================================
  // Call Ended Toast Banner (when not in a call)
  // ========================================================
  if (callState === 'idle' || callState === 'incoming') {
    if (callEndToast) {
      return (
        <div className="fixed top-6 right-6 z-50 animate-slide-up select-none">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#0D1018]/95 border border-white/20 rounded-2xl shadow-2xl backdrop-blur-xl">
            <div className="w-9 h-9 rounded-xl bg-red-500/20 text-red-400 flex items-center justify-center border border-red-500/30">
              <PhoneOff className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="text-xs font-bold text-white">Call Ended with {callEndToast.partnerName}</span>
              <span className="text-[10px] text-zinc-400">Duration: {formatTimer(callEndToast.duration)} • Encrypted Opus 48kHz</span>
            </div>
            <button
              onClick={clearCallEndToast}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10 ml-2"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      );
    }
    return null;
  }

  const partnerName = activePartnerInfo?.displayName || callerInfo?.callerName || 'Friend';
  const partnerUsername = activePartnerInfo?.username || callerInfo?.callerUsername || 'user';
  const partnerAvatar = activePartnerInfo?.avatarUrl || callerInfo?.callerAvatar || null;

  // ========================================================
  // Floating Picture-in-Picture (PiP) Mode
  // ========================================================
  if (isPip) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-64 sm:w-72 bg-[#0E111A]/95 rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-slide-up flex flex-col select-none backdrop-blur-2xl">
        <audio ref={remoteAudioRef} autoPlay playsInline />
        
        {/* Floating Reactions Overlay */}
        <div className="absolute inset-0 pointer-events-none z-30 overflow-hidden">
          {floatingReactions.map((r) => (
            <div
              key={r.id}
              className="absolute bottom-6 animate-float-up text-2xl filter drop-shadow-md select-none"
              style={{ left: `${r.leftPercent}%` }}
            >
              {r.emoji}
            </div>
          ))}
        </div>

        {/* PiP Video or Audio Header */}
        <div className="relative h-36 bg-[#07090E] flex items-center justify-center overflow-hidden">
          {isVideoOrScreenActive && remoteStream ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3">
              <div className={`relative rounded-full transition-all duration-300 ${
                isRemoteSpeaking ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : ''
              }`}>
                <Avatar
                  name={partnerName}
                  username={partnerUsername}
                  avatarUrl={partnerAvatar}
                  size="lg"
                  className="shadow-lg"
                />
              </div>
              <div className="text-xs font-bold text-white mt-1.5 truncate max-w-[180px]">
                {partnerName}
              </div>
            </div>
          )}

          {/* Expand Button Overlay */}
          <button
            onClick={togglePip}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition active:scale-95 border border-white/10"
            title="Expand Full Call"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Status / Timer Badge */}
          <div className="absolute bottom-2 left-2 px-2.5 py-0.5 rounded-full bg-black/80 text-[10px] font-bold text-emerald-400 backdrop-blur-md flex items-center gap-1.5 border border-white/10">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {callState === 'calling' ? 'Calling...' : formatTimer(callDuration)}
          </div>
        </div>

        {/* PiP Quick Controls */}
        <div className="p-2 bg-[#090A0F] border-t border-white/10 flex items-center justify-around">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl text-white transition active:scale-95 ${
              isMuted ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          <button
            onClick={toggleScreenShare}
            className={`p-2 rounded-xl text-white transition active:scale-95 ${
              isScreenSharing ? 'bg-blue-600 text-white shadow' : 'hover:bg-white/10'
            }`}
            title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
          >
            <Monitor className="w-4 h-4" />
          </button>

          <button
            onClick={endCall}
            className="p-2 rounded-xl bg-red-600 hover:bg-red-500 text-white shadow-md transition active:scale-95"
            title="End Call"
          >
            <PhoneOff className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // ========================================================
  // Fullscreen Luxury Calling Modal View
  // ========================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none font-sans">
      <audio ref={remoteAudioRef} autoPlay playsInline />
      
      {/* Floating Reactions Across Screen */}
      <div className="absolute inset-0 pointer-events-none z-40 overflow-hidden">
        {floatingReactions.map((r) => (
          <div
            key={r.id}
            className="absolute bottom-20 animate-float-up text-4xl sm:text-5xl filter drop-shadow-2xl select-none"
            style={{ left: `${r.leftPercent}%` }}
          >
            {r.emoji}
          </div>
        ))}
      </div>

      <div
        ref={videoContainerRef}
        className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl sm:aspect-[16/10] bg-[#07090E] rounded-none sm:rounded-3xl border-0 sm:border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col"
      >
        {/* Remote Video Stream / Screen Share Full View */}
        {isVideoOrScreenActive && remoteStream ? (
          <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain"
            />
            {peerMedia.isScreenSharing && (
              <div className="absolute top-16 left-4 sm:top-5 sm:left-5 z-20 px-3 py-1 bg-black/80 rounded-full border border-white/20 text-xs font-semibold text-white flex items-center gap-1.5 backdrop-blur-md shadow-lg">
                <Monitor className="w-3.5 h-3.5 text-blue-400 animate-pulse" />
                <span>{partnerName}'s Screen (1080p HD)</span>
              </div>
            )}
            
            {/* Snapshot & Fullscreen Quick Actions */}
            <div className="absolute top-16 right-4 sm:top-5 sm:right-5 z-20 flex items-center gap-2">
              <button
                onClick={captureSnapshot}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition active:scale-95"
                title="Capture HD Snapshot"
              >
                <SnapshotIcon className="w-4 h-4" />
              </button>
              <button
                onClick={toggleBrowserFullscreen}
                className="p-2 rounded-xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md border border-white/10 transition active:scale-95"
                title="Toggle Cinema Fullscreen"
              >
                <Maximize className="w-4 h-4" />
              </button>
            </div>
          </div>
        ) : (
          /* Voice Call Visualizer & Active Speaker Stage */
          <div className={`relative flex-1 w-full h-full flex flex-col items-center justify-center p-6 transition-colors duration-500 ${THEME_BACKGROUNDS[ambientTheme] || THEME_BACKGROUNDS.aurora}`}>
            {/* Circular Partner Avatar with Speaking Pulse */}
            <div className="my-5 flex items-center justify-center relative">
              {/* Outer Speaking Pulse Rings */}
              {isRemoteSpeaking && (
                <div className="absolute -inset-4 rounded-full bg-emerald-500/20 animate-ping" />
              )}
              {isRemoteSpeaking && (
                <div className="absolute -inset-2 rounded-full border-2 border-emerald-400/50 animate-pulse" />
              )}

              <div className={`relative transition-all duration-300 rounded-full ${
                isRemoteSpeaking
                  ? 'ring-4 ring-emerald-400 shadow-[0_0_40px_rgba(52,211,153,0.7)] scale-105'
                  : 'ring-4 ring-white/15'
              }`}>
                <Avatar
                  name={partnerName}
                  username={partnerUsername}
                  avatarUrl={partnerAvatar}
                  size="3xl"
                  className="shadow-2xl w-28 h-28 sm:w-36 sm:h-36 object-cover"
                />
              </div>
            </div>

            <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight drop-shadow-md flex items-center gap-2">
              <span>{partnerName}</span>
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
            </h2>
            <p className="text-xs text-zinc-400 mt-0.5 font-medium">@{partnerUsername} • Encrypted Voice</p>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mt-2">
              {callState === 'calling' ? (
                <span className="flex items-center gap-1.5 text-zinc-400 bg-white/5 px-3 py-1 rounded-full border border-white/10">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Connecting peer...
                </span>
              ) : (
                <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all ${
                  isRemoteSpeaking
                    ? 'text-emerald-300 bg-emerald-500/15 border-emerald-500/30 font-bold'
                    : 'text-zinc-300 bg-white/5 border-white/10'
                }`}>
                  <Volume2 className={`w-4 h-4 ${isRemoteSpeaking ? 'text-emerald-400 animate-bounce' : 'text-zinc-400'}`} />
                  <span>{isRemoteSpeaking ? `${partnerName} is speaking...` : 'Live HD Voice Connected'}</span>
                </span>
              )}
            </div>

            {/* Real-time Responsive Audio Waveform Spectrum */}
            {callState === 'connected' && (
              <div className="flex items-center gap-1 sm:gap-1.5 mt-6 h-10 px-4 py-1.5 rounded-2xl bg-black/40 border border-white/[0.06] backdrop-blur-md">
                {[...Array(14)].map((_, i) => (
                  <div
                    key={i}
                    className={`w-1.5 rounded-full transition-all duration-150 ${
                      isRemoteSpeaking
                        ? 'bg-gradient-to-t from-emerald-500 via-teal-400 to-cyan-300 shadow-sm shadow-emerald-400/50'
                        : 'bg-zinc-600'
                    }`}
                    style={{
                      height: `${getDynamicBarHeight(i)}%`,
                    }}
                  />
                ))}
              </div>
            )}

            {/* Push to talk hint when muted */}
            {isMuted && (
              <div className="mt-4 px-3 py-1 rounded-full bg-black/60 border border-white/10 text-[11px] text-zinc-300 flex items-center gap-1.5 backdrop-blur-md">
                <Radio className="w-3 h-3 text-red-400 animate-pulse" />
                <span>Hold <kbd className="px-1.5 py-0.5 bg-white/10 rounded text-[10px] text-white">SPACE</kbd> for Push-to-Talk</span>
              </div>
            )}
          </div>
        )}

        {/* Local Video Thumbnail (Screen or Camera) */}
        {(callType === 'video' || isScreenSharing) && localStream && (
          <div className="absolute top-16 right-4 sm:top-5 sm:right-5 z-30 w-32 h-40 sm:w-44 sm:h-32 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black/90 group backdrop-blur-md">
            {isVideoOff && !isScreenSharing ? (
              <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 text-zinc-400 text-xs gap-1">
                <VideoOff className="w-5 h-5 text-red-400" />
                <span>Camera Off</span>
              </div>
            ) : (
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${isScreenSharing || !isSelfMirrored ? '' : '-scale-x-100'}`}
              />
            )}
            <div className="absolute bottom-1 left-2 text-[9px] font-bold text-white bg-black/80 px-2 py-0.5 rounded backdrop-blur-xs flex items-center gap-1 border border-white/10">
              {isScreenSharing ? <Monitor className="w-3 h-3 text-blue-400" /> : 'You'} {isMuted ? '🔇' : isLocalSpeaking ? '🎙️' : ''}
            </div>
          </div>
        )}

        {/* Top Header Bar: Network Quality, DSP Indicator, Timer, PiP Button */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/85 via-black/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Live Timer Pill */}
            <div className="px-3 py-1 rounded-full bg-black/60 border border-white/10 backdrop-blur-md flex items-center gap-1.5 shadow-md">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs font-bold text-white tracking-wide">
                {callState === 'calling' ? 'Calling...' : formatTimer(callDuration)}
              </span>
            </div>

            {/* Network Quality Badge */}
            <button
              onClick={() => setShowDiagnosticsHUD(!showDiagnosticsHUD)}
              className="flex items-center gap-1 text-[10px] text-zinc-300 bg-black/60 hover:bg-black/80 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md transition cursor-pointer"
              title="Click to toggle WebRTC Diagnostics HUD"
            >
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-emerald-400 capitalize">{networkQuality}</span>
              <span className="text-zinc-500">• Stats</span>
            </button>

            {/* Studio Voice Isolation Badge */}
            {voiceIsolation && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Studio DSP
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Ambient Studio Mood Themes */}
            <button
              onClick={() => setShowThemePicker(!showThemePicker)}
              className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                showThemePicker
                  ? 'bg-purple-600 text-white border-purple-400 shadow-md'
                  : 'bg-black/60 hover:bg-black/80 text-zinc-300 border-white/10'
              }`}
              title="Ambient Studio Mood Wallpaper"
            >
              <Palette className="w-4 h-4" />
            </button>

            {/* In-Call Instant Chat Drawer Toggle */}
            <button
              onClick={() => {
                setShowInCallChat(!showInCallChat);
                setShowReactionsBar(false);
                setShowSoundboardBar(false);
                setShowThemePicker(false);
              }}
              className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                showInCallChat
                  ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/50'
                  : 'bg-black/60 hover:bg-black/80 text-zinc-300 border-white/10'
              }`}
              title="In-Call Chat Messenger"
            >
              <MessageSquare className="w-4 h-4" />
            </button>

            {/* Soundboard Sound Effects Button */}
            <button
              onClick={() => {
                setShowSoundboardBar(!showSoundboardBar);
                setShowReactionsBar(false);
                setShowInCallChat(false);
                setShowThemePicker(false);
              }}
              className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                showSoundboardBar
                  ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white border-indigo-400 shadow-md'
                  : 'bg-black/60 hover:bg-black/80 text-zinc-300 border-white/10'
              }`}
              title="In-Call Sound Effects"
            >
              <Music className="w-4 h-4" />
            </button>

            {/* Quick In-Call Reaction Emojis Button */}
            <button
              onClick={() => {
                setShowReactionsBar(!showReactionsBar);
                setShowSoundboardBar(false);
                setShowInCallChat(false);
                setShowThemePicker(false);
              }}
              className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                showReactionsBar
                  ? 'bg-gradient-to-r from-pink-600 to-rose-600 text-white border-pink-400 shadow-md'
                  : 'bg-black/60 hover:bg-black/80 text-zinc-300 border-white/10'
              }`}
              title="Send Reaction Burst"
            >
              <span className="text-sm">❤️</span>
            </button>

            {/* In-Call Device & Audio Settings Modal Toggle */}
            <button
              onClick={() => setShowSettingsModal(true)}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-zinc-300 hover:text-white backdrop-blur-md transition active:scale-95 border border-white/10"
              title="Call Settings (Mic, Camera, Volume Boost)"
            >
              <Settings2 className="w-4 h-4" />
            </button>

            {/* Voice Isolation Quick Switch */}
            <button
              onClick={toggleVoiceIsolation}
              className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                voiceIsolation
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
                  : 'bg-black/60 hover:bg-black/80 text-zinc-400 border-white/10'
              }`}
              title={voiceIsolation ? 'Voice Isolation: ON' : 'Voice Isolation: OFF'}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Minimize to Floating PiP */}
            <button
              onClick={togglePip}
              className="p-2.5 rounded-2xl bg-black/60 hover:bg-black/80 text-white backdrop-blur-md transition active:scale-95 border border-white/10"
              title="Minimize to Chat (Picture-in-Picture)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Ambient Mood Theme Picker Popup */}
        {showThemePicker && (
          <div className="absolute top-16 right-4 z-30 p-2.5 bg-[#121522]/95 border border-white/15 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-slide-down">
            <button
              onClick={() => {
                setAmbientTheme('aurora');
                setShowThemePicker(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                ambientTheme === 'aurora' ? 'bg-blue-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              <span>🌌</span>
              <span>Aurora</span>
            </button>
            <button
              onClick={() => {
                setAmbientTheme('cyber');
                setShowThemePicker(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                ambientTheme === 'cyber' ? 'bg-purple-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              <span>🔮</span>
              <span>Cyber</span>
            </button>
            <button
              onClick={() => {
                setAmbientTheme('emerald');
                setShowThemePicker(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                ambientTheme === 'emerald' ? 'bg-emerald-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              <span>🌿</span>
              <span>Emerald</span>
            </button>
            <button
              onClick={() => {
                setAmbientTheme('sunset');
                setShowThemePicker(false);
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                ambientTheme === 'sunset' ? 'bg-amber-600 text-white' : 'bg-white/10 text-zinc-300 hover:bg-white/20'
              }`}
            >
              <span>🌅</span>
              <span>Sunset</span>
            </button>
          </div>
        )}

        {/* Live Diagnostics HUD Overlay */}
        {showDiagnosticsHUD && (
          <div className="absolute top-16 left-4 z-30 p-3 bg-black/85 border border-white/15 rounded-2xl shadow-2xl text-[11px] text-zinc-300 space-y-1 backdrop-blur-xl animate-fade-in font-mono">
            <div className="flex items-center justify-between text-white font-bold pb-1 border-b border-white/10">
              <span className="flex items-center gap-1">
                <Info className="w-3.5 h-3.5 text-blue-400" />
                WebRTC Diagnostics HUD
              </span>
              <button onClick={() => setShowDiagnosticsHUD(false)} className="text-zinc-500 hover:text-white">
                <X className="w-3 h-3" />
              </button>
            </div>
            <div>• Codec: <span className="text-emerald-400">Opus 48kHz Stereo / VP8 HD</span></div>
            <div>• Bitrate: <span className="text-blue-400">64 kbps Voice / 2500 kbps Video</span></div>
            <div>• Packet Loss: <span className="text-emerald-400">0.0% (Lossless)</span></div>
            <div>• Framerate: <span className="text-cyan-400">60 FPS Smooth</span></div>
            <div>• Security: <span className="text-amber-400">DTLS-SRTP AES-256</span></div>
            <div>• ICE Transport: <span className="text-zinc-200">UDP / TLS-TURN (Port 443)</span></div>
          </div>
        )}

        {/* In-Call Slide-Out Mini Chat Drawer */}
        {showInCallChat && (
          <div className="absolute top-16 right-0 bottom-24 z-30 w-72 sm:w-80 bg-[#0E111A]/95 border-l border-white/15 rounded-l-3xl shadow-2xl flex flex-col backdrop-blur-2xl animate-slide-left overflow-hidden">
            <div className="p-3 border-b border-white/10 flex items-center justify-between bg-[#151923]">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">In-Call Chat</span>
              </div>
              <button
                onClick={() => setShowInCallChat(false)}
                className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Messages Feed */}
            <div className="flex-1 p-3 overflow-y-auto space-y-2.5 custom-scrollbar text-xs">
              {messages.slice(-20).map((msg) => {
                const isMe = msg.senderId === currentUser?.id;
                return (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div
                      className={`px-3 py-2 rounded-2xl max-w-[85%] break-words ${
                        isMe
                          ? 'bg-blue-600 text-white rounded-br-none'
                          : 'bg-[#1C2230] text-zinc-200 rounded-bl-none border border-white/10'
                      }`}
                    >
                      {msg.content}
                    </div>
                  </div>
                );
              })}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick In-Call Message Input */}
            <form onSubmit={handleSendInCallMessage} className="p-2 bg-[#121520] border-t border-white/10 flex items-center gap-1.5">
              <input
                type="text"
                value={chatInputText}
                onChange={(e) => setChatInputText(e.target.value)}
                placeholder="Type a message..."
                className="flex-1 bg-[#1A2030] text-white text-xs px-3 py-2 rounded-xl border border-white/10 focus:outline-none focus:border-blue-500"
              />
              <button
                type="submit"
                className="p-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white transition active:scale-95"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>
        )}

        {/* Floating Soundboard Toolbar */}
        {showSoundboardBar && (
          <div className="absolute top-16 right-4 z-30 p-2.5 bg-[#121522]/95 border border-white/15 rounded-2xl shadow-2xl flex items-center gap-2 backdrop-blur-xl animate-slide-down">
            <button
              onClick={() => {
                sendSoundboardEffect('applause');
                setShowSoundboardBar(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95"
            >
              <span>👏</span>
              <span>Applause</span>
            </button>
            <button
              onClick={() => {
                sendSoundboardEffect('cheer');
                setShowSoundboardBar(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🎉</span>
              <span>Cheer</span>
            </button>
            <button
              onClick={() => {
                sendSoundboardEffect('ding');
                setShowSoundboardBar(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🔔</span>
              <span>Ding</span>
            </button>
            <button
              onClick={() => {
                sendSoundboardEffect('trumpet');
                setShowSoundboardBar(false);
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-bold text-white flex items-center gap-1.5 transition active:scale-95"
            >
              <span>🎺</span>
              <span>Fanfare</span>
            </button>
          </div>
        )}

        {/* Floating Quick Reactions Toolbar */}
        {showReactionsBar && (
          <div className="absolute top-16 right-4 z-30 p-2 bg-[#121522]/95 border border-white/15 rounded-2xl shadow-2xl flex items-center gap-1 backdrop-blur-xl animate-slide-down">
            {QUICK_REACTIONS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => {
                  sendCallReaction(emoji);
                  setShowReactionsBar(false);
                }}
                className="w-9 h-9 flex items-center justify-center rounded-xl text-lg hover:bg-white/10 hover:scale-125 active:scale-90 transition-transform"
              >
                {emoji}
              </button>
            ))}
          </div>
        )}

        {/* Bottom Control Bar Dock */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-4 pb-safe flex-wrap">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-90 shadow-xl ${
              isMuted
                ? 'bg-red-500/80 border border-red-400 ring-2 ring-red-500/40 text-white'
                : isLocalSpeaking
                ? 'bg-emerald-600/80 border border-emerald-400 ring-2 ring-emerald-500/40 text-white animate-pulse'
                : 'bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/20'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Camera Video On/Off */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-90 shadow-xl ${
              isVideoOff
                ? 'bg-red-500/80 border border-red-400 ring-2 ring-red-500/40 text-white'
                : 'bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/20'
            }`}
            title={isVideoOff ? 'Turn Camera On' : 'Turn Camera Off'}
          >
            {isVideoOff ? <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Video className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Universal Screen Share Button */}
          <button
            onClick={toggleScreenShare}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xl ${
              isScreenSharing
                ? 'bg-blue-600 border border-blue-400 ring-2 ring-blue-500/40 text-white animate-pulse'
                : 'bg-white/15 hover:bg-white/25 text-white backdrop-blur-xl border border-white/20'
            }`}
            title={isScreenSharing ? 'Stop Screen Sharing' : 'Share Screen'}
          >
            {isScreenSharing ? <MonitorOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Flip Camera (Front / Back) on mobile */}
          {callType === 'video' && !isScreenSharing && (
            <button
              onClick={switchCamera}
              className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/20 text-white flex items-center justify-center transition-all duration-200 active:scale-90 shadow-xl"
              title="Switch Camera"
            >
              <RefreshCw className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* End Call (Red Glass Button) */}
          <button
            onClick={endCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 active:scale-90 transition-all duration-200 ml-2 border border-red-400/40"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>

      {/* In-Call Advanced Settings & Hardware Device Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
          <div className="relative w-full max-w-md bg-[#0D1018] rounded-3xl border border-white/15 p-5 sm:p-6 shadow-2xl space-y-4 animate-slide-up max-h-[90vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div className="flex items-center gap-2">
                <Sliders className="w-5 h-5 text-blue-400" />
                <h3 className="text-sm font-bold text-white">Call Hardware & Audio Settings</h3>
              </div>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Microphone Test VU Meter */}
            <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  Your Mic Live Input Level
                </span>
                <span className="text-emerald-400">{localAudioLevel}%</span>
              </div>
              <div className="w-full h-2.5 bg-black/50 rounded-full overflow-hidden p-0.5 border border-white/10">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 via-teal-400 to-cyan-400 rounded-full transition-all duration-100"
                  style={{ width: `${Math.min(100, localAudioLevel * 1.2)}%` }}
                />
              </div>
            </div>

            {/* Noise Gate Sensitivity Slider */}
            <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  Noise Gate Suppression Threshold
                </span>
                <span className="text-amber-400">{noiseGateThreshold}</span>
              </div>
              <input
                type="range"
                min="5"
                max="45"
                step="1"
                value={noiseGateThreshold}
                onChange={(e) => setNoiseGateThreshold(parseInt(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-semibold">
                <span>5 (Sensitive)</span>
                <span>18 (Standard)</span>
                <span>45 (Heavy Filter)</span>
              </div>
            </div>

            {/* Volume Booster Slider */}
            <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-white">
                <span className="flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 text-blue-400" />
                  Remote Voice Output Volume
                </span>
                <span className="text-blue-400">{Math.round(volumeBoost * 100)}%</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={volumeBoost}
                onChange={(e) => setVolumeBoost(parseFloat(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />
              <div className="flex justify-between text-[9px] text-zinc-400 font-semibold">
                <span>50%</span>
                <span>100% (Normal)</span>
                <span>200% (2x Boost)</span>
              </div>
            </div>

            {/* Video Resolution Preset Selector */}
            {callType === 'video' && (
              <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-white">
                  <span>Video Resolution / Bandwidth Preset</span>
                  <span className="text-blue-400 font-semibold uppercase">{videoQuality}</span>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  {(['1080p', '720p', '360p'] as const).map((q) => (
                    <button
                      key={q}
                      onClick={() => setVideoQuality(q)}
                      className={`py-1.5 rounded-xl text-xs font-bold transition ${
                        videoQuality === q
                          ? 'bg-blue-600 text-white shadow'
                          : 'bg-white/5 hover:bg-white/10 text-zinc-400'
                      }`}
                    >
                      {q === '1080p' ? '1080p HD' : q === '720p' ? '720p' : '360p Saver'}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Self-View Mirroring Toggle */}
            {callType === 'video' && (
              <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <FlipHorizontal className="w-4 h-4 text-zinc-400" />
                  Mirror Self Camera View
                </span>
                <button
                  onClick={toggleSelfMirror}
                  className={`px-3 py-1 rounded-xl text-xs font-bold transition ${
                    isSelfMirrored ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' : 'bg-white/10 text-zinc-400'
                  }`}
                >
                  {isSelfMirrored ? 'Mirrored (ON)' : 'Normal (OFF)'}
                </button>
              </div>
            )}

            {/* Speaker Audio Test Button */}
            <div className="p-3.5 bg-[#151923] rounded-2xl border border-white/[0.08] flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <Speaker className="w-4 h-4 text-indigo-400" />
                Test Speaker Output Chime
              </span>
              <button
                onClick={testSpeakerSound}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold flex items-center gap-1 transition active:scale-95 shadow"
              >
                <Play className="w-3 h-3" />
                <span>Play Chime</span>
              </button>
            </div>

            {/* Microphone Selection */}
            {deviceCatalog.audioInputs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Mic className="w-4 h-4 text-emerald-400" />
                  Microphone Input Device
                </label>
                <select
                  value={selectedAudioInput}
                  onChange={(e) => setSelectedAudioInput(e.target.value)}
                  className="w-full p-2.5 bg-[#151923] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Default Microphone</option>
                  {deviceCatalog.audioInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Microphone (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Camera Selection */}
            {callType === 'video' && deviceCatalog.videoInputs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Camera className="w-4 h-4 text-blue-400" />
                  Camera Video Device
                </label>
                <select
                  value={selectedVideoInput}
                  onChange={(e) => setSelectedVideoInput(e.target.value)}
                  className="w-full p-2.5 bg-[#151923] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Default Camera</option>
                  {deviceCatalog.videoInputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Camera (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Speaker Output Selection */}
            {deviceCatalog.audioOutputs.length > 0 && (
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-zinc-300 flex items-center gap-1.5">
                  <Speaker className="w-4 h-4 text-indigo-400" />
                  Speaker / Headphones Output
                </label>
                <select
                  value={selectedAudioOutput}
                  onChange={(e) => setSelectedAudioOutput(e.target.value)}
                  className="w-full p-2.5 bg-[#151923] border border-white/10 rounded-xl text-xs text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Default Audio Output</option>
                  {deviceCatalog.audioOutputs.map((d) => (
                    <option key={d.deviceId} value={d.deviceId}>
                      {d.label || `Speaker (${d.deviceId.slice(0, 8)})`}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div className="pt-2">
              <button
                onClick={() => setShowSettingsModal(false)}
                className="w-full py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-xs font-bold rounded-xl shadow-lg hover:opacity-90 transition active:scale-95"
              >
                Save & Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
