import React, { useEffect, useRef } from 'react';
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
  Volume2,
  Sparkles,
} from 'lucide-react';
import { useCall } from '../../context/CallContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { Avatar } from '../Common/Avatar.js';

export const CallModal: React.FC = () => {
  const { user } = useAuth();
  const {
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
    endCall,
    toggleMute,
    toggleVideo,
    toggleVoiceIsolation,
    toggleScreenShare,
    switchCamera,
    togglePip,
  } = useCall();

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioFallbackRef = useRef<HTMLAudioElement | null>(null);

  // Attach local media stream
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isPip]);

  // Attach remote media stream to both video (if video call) and audio fallback
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch(() => {});
    }
    if (remoteAudioFallbackRef.current && remoteStream) {
      remoteAudioFallbackRef.current.srcObject = remoteStream;
      remoteAudioFallbackRef.current.volume = 1.0;
      remoteAudioFallbackRef.current.play().catch(() => {});
    }
  }, [remoteStream, isPip]);

  if (callState === 'idle' || callState === 'incoming') return null;

  const partnerName = callerInfo?.callerName || (user?.username === 'sagar' ? 'Something' : 'Sagar');
  const partnerUsername = callerInfo?.callerUsername || (user?.username === 'sagar' ? 'something' : 'sagar');
  const partnerAvatar = callerInfo?.callerAvatar || null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // ========================================================
  // Floating Picture-in-Picture (PiP) Mode
  // ========================================================
  if (isPip) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-64 sm:w-72 bg-[#121215] rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-slide-up flex flex-col select-none">
        {/* Hidden Guaranteed Audio Receiver */}
        <audio ref={remoteAudioFallbackRef} autoPlay playsInline />

        {/* PiP Video or Audio Header */}
        <div className="relative h-36 bg-[#09090b] flex items-center justify-center overflow-hidden">
          {callType === 'video' && remoteStream && !peerMedia.isVideoOff ? (
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center p-3">
              <div className="relative">
                <Avatar
                  name={partnerName}
                  username={partnerUsername}
                  avatarUrl={partnerAvatar}
                  size="md"
                  className="ring-2 ring-white/30 animate-pulse"
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
            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/70 hover:bg-black text-white backdrop-blur-md transition active:scale-95"
            title="Expand Call"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>

          {/* Status / Timer Badge */}
          <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-full bg-black/70 text-[10px] font-semibold text-emerald-400 backdrop-blur-md flex items-center gap-1 border border-white/10">
            {voiceIsolation && <Sparkles className="w-2.5 h-2.5 text-white" />}
            {callState === 'calling' ? 'Calling...' : formatTimer(callDuration)}
          </div>
        </div>

        {/* PiP Quick Controls */}
        <div className="p-2 bg-[#0c0c0e] border-t border-white/10 flex items-center justify-around">
          <button
            onClick={toggleMute}
            className={`p-2 rounded-xl text-white transition active:scale-95 ${
              isMuted ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'hover:bg-white/10'
            }`}
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>

          {callType === 'video' && (
            <button
              onClick={toggleVideo}
              className={`p-2 rounded-xl text-white transition active:scale-95 ${
                isVideoOff ? 'bg-red-500/30 text-red-400 border border-red-500/40' : 'hover:bg-white/10'
              }`}
              title={isVideoOff ? 'Turn Video On' : 'Turn Video Off'}
            >
              {isVideoOff ? <VideoOff className="w-4 h-4" /> : <Video className="w-4 h-4" />}
            </button>
          )}

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
  // Fullscreen / Modal Calling View
  // ========================================================
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 sm:p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none">
      {/* Hidden Guaranteed Audio Receiver */}
      <audio ref={remoteAudioFallbackRef} autoPlay playsInline />

      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-3xl sm:aspect-[16/10] bg-[#09090b] rounded-none sm:rounded-3xl border-0 sm:border border-white/15 shadow-2xl overflow-hidden flex flex-col">
        {/* Remote Video Stream / Full Background */}
        {callType === 'video' && remoteStream && !peerMedia.isVideoOff ? (
          <div className="relative flex-1 w-full h-full bg-black overflow-hidden flex items-center justify-center">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="w-full h-full object-contain sm:object-cover"
            />
          </div>
        ) : (
          /* Voice Call Visualizer */
          <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#121215] via-[#09090b] to-black">
            {/* Glowing Partner Avatar */}
            <div className="relative my-4">
              <Avatar
                name={partnerName}
                username={partnerUsername}
                avatarUrl={partnerAvatar}
                size="lg"
                className="relative z-10 w-28 h-28 ring-4 ring-white/20 shadow-2xl"
              />
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight drop-shadow-md">
              {partnerName}
            </h2>

            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300 mt-1">
              {callState === 'calling' ? (
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                  Calling...
                </span>
              ) : (
                <span className="text-emerald-400 flex items-center gap-1.5">
                  <Volume2 className="w-4 h-4 animate-pulse" />
                  Live HD Voice Connected
                </span>
              )}
            </div>

            {/* Audio Waveform Bars */}
            {callState === 'connected' && (
              <div className="flex items-center gap-1.5 mt-6 h-8">
                {[40, 70, 90, 60, 100, 50, 80, 45, 95, 65, 85, 40].map((h, i) => (
                  <div
                    key={i}
                    className="w-1.5 bg-white rounded-full transition-all duration-300 animate-pulse"
                    style={{
                      height: `${h}%`,
                      animationDelay: `${i * 0.1}s`,
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* Local Video Thumbnail */}
        {callType === 'video' && localStream && (
          <div className="absolute top-16 right-4 sm:top-5 sm:right-5 z-30 w-28 h-36 sm:w-36 sm:h-48 rounded-2xl overflow-hidden border-2 border-white/30 shadow-2xl bg-black/90 group">
            {isVideoOff ? (
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
                className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
              />
            )}
            <div className="absolute bottom-1 left-2 text-[9px] font-semibold text-white/80 bg-black/70 px-1.5 py-0.2 rounded backdrop-blur-xs">
              You {isMuted && '🔇'}
            </div>
          </div>
        )}

        {/* Top Header Bar */}
        <div className="absolute top-0 inset-x-0 z-20 p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-xs font-bold text-white drop-shadow">
              {callState === 'calling' ? 'Calling...' : formatTimer(callDuration)}
            </span>
            {voiceIsolation && (
              <span className="hidden sm:inline-flex items-center gap-1 text-[10px] text-zinc-200 bg-white/10 px-2 py-0.5 rounded-full border border-white/20 font-medium">
                <Sparkles className="w-2.5 h-2.5 text-white" />
                Studio Isolation Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Voice Isolation Quick Switch */}
            <button
              onClick={toggleVoiceIsolation}
              className={`p-2 rounded-xl transition active:scale-95 ${
                voiceIsolation
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/10 hover:bg-white/20 text-zinc-400'
              }`}
              title={voiceIsolation ? 'Voice Isolation: ON' : 'Voice Isolation: OFF'}
            >
              <Sparkles className="w-4 h-4" />
            </button>

            {/* Minimize to Floating PiP */}
            <button
              onClick={togglePip}
              className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition active:scale-95"
              title="Minimize to Chat (Picture-in-Picture)"
            >
              <Minimize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bottom Control Bar Dock */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-5 pb-safe">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center text-white transition-all duration-200 active:scale-90 shadow-xl ${
              isMuted
                ? 'bg-red-500/80 border border-red-400 ring-2 ring-red-500/40 text-white'
                : 'bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/20'
            }`}
            title={isMuted ? 'Unmute Mic' : 'Mute Mic'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Camera Video On/Off */}
          {callType === 'video' && (
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
          )}

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

          {/* Screen Share on Desktop */}
          {callType === 'video' && (
            <button
              onClick={toggleScreenShare}
              className={`hidden sm:flex w-12 h-12 sm:w-14 sm:h-14 rounded-2xl items-center justify-center text-white transition-all duration-200 active:scale-90 shadow-xl ${
                isScreenSharing
                  ? 'bg-white text-black font-bold'
                  : 'bg-white/15 hover:bg-white/25 backdrop-blur-xl border border-white/20'
              }`}
              title={isScreenSharing ? 'Stop Screen Share' : 'Share Screen'}
            >
              <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* End Call (Red Button) */}
          <button
            onClick={endCall}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 active:scale-90 transition-all duration-200 ml-2"
            title="End Call"
          >
            <PhoneOff className="w-7 h-7 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
};
