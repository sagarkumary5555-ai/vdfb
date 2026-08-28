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
} from 'lucide-react';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';

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
    remoteAudioLevel,
    isRemoteSpeaking,
    isLocalSpeaking,
    networkQuality,
    volumeBoost,
    setVolumeBoost,
    endCall,
    toggleMute,
    toggleVideo,
    toggleVoiceIsolation,
    toggleScreenShare,
    switchCamera,
    togglePip,
  } = useCall();

  const [showVolumeSlider, setShowVolumeSlider] = useState(false);

  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteAudioRef = useRef<HTMLAudioElement | null>(null);

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

  if (callState === 'idle' || callState === 'incoming') return null;

  const partnerName = activePartnerInfo?.displayName || callerInfo?.callerName || 'Friend';
  const partnerUsername = activePartnerInfo?.username || callerInfo?.callerUsername || 'user';
  const partnerAvatar = activePartnerInfo?.avatarUrl || callerInfo?.callerAvatar || null;

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Generate 12 responsive dynamic waveform bar heights based on real-time audio volume
  const getDynamicBarHeight = (barIndex: number): number => {
    if (callState !== 'connected') return 20;
    const baseHeight = 15;
    const multiplier = (remoteAudioLevel / 100) * 85;
    // Harmonic curve across bars
    const factor = Math.sin((barIndex / 12) * Math.PI) * 0.8 + 0.3;
    return Math.min(100, Math.max(10, Math.round(baseHeight + multiplier * factor)));
  };

  // ========================================================
  // Floating Picture-in-Picture (PiP) Mode
  // ========================================================
  if (isPip) {
    return (
      <div className="fixed bottom-20 right-4 sm:bottom-6 sm:right-6 z-50 w-64 sm:w-72 bg-[#0E111A]/95 rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-slide-up flex flex-col select-none backdrop-blur-2xl">
        <audio ref={remoteAudioRef} autoPlay playsInline />
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
      <div className="relative w-full h-[100dvh] sm:h-auto sm:max-w-4xl sm:aspect-[16/10] bg-[#07090E] rounded-none sm:rounded-3xl border-0 sm:border border-white/[0.12] shadow-2xl overflow-hidden flex flex-col">
        
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
          </div>
        ) : (
          /* Voice Call Visualizer & Active Speaker Stage */
          <div className="relative flex-1 w-full h-full flex flex-col items-center justify-center p-6 bg-gradient-to-b from-[#0F1420] via-[#090C14] to-[#05070A]">
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
                className={`w-full h-full object-cover ${isScreenSharing ? '' : '-scale-x-100'}`}
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
            <div className="hidden sm:flex items-center gap-1 text-[10px] text-zinc-300 bg-black/60 px-2.5 py-1 rounded-full border border-white/10 backdrop-blur-md">
              <Activity className="w-3 h-3 text-emerald-400" />
              <span className="font-semibold text-emerald-400 capitalize">{networkQuality}</span>
              <span className="text-zinc-500">• HD Opus</span>
            </div>

            {/* Studio Voice Isolation Badge */}
            {voiceIsolation && (
              <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-amber-300 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20 font-semibold backdrop-blur-md">
                <Sparkles className="w-3 h-3 text-amber-400" />
                Studio DSP Active
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Volume Booster Slider Toggle */}
            <div className="relative">
              <button
                onClick={() => setShowVolumeSlider(!showVolumeSlider)}
                className={`p-2.5 rounded-2xl border transition active:scale-95 backdrop-blur-md ${
                  volumeBoost > 1.0
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md shadow-blue-900/50'
                    : 'bg-black/60 hover:bg-black/80 text-zinc-300 border-white/10'
                }`}
                title={`Volume Boost: ${Math.round(volumeBoost * 100)}%`}
              >
                <Sliders className="w-4 h-4" />
              </button>

              {/* Volume Slider Dropdown */}
              {showVolumeSlider && (
                <div className="absolute right-0 top-12 p-3 bg-[#111420] border border-white/15 rounded-2xl shadow-2xl z-40 w-48 flex flex-col gap-2 backdrop-blur-xl animate-fade-in">
                  <div className="flex items-center justify-between text-xs font-bold text-white">
                    <span>Voice Output Volume</span>
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
                    <span>100% (Norm)</span>
                    <span>200% (Boost)</span>
                  </div>
                </div>
              )}
            </div>

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

        {/* Bottom Control Bar Dock */}
        <div className="absolute bottom-0 inset-x-0 z-20 p-4 sm:p-6 bg-gradient-to-t from-black/95 via-black/60 to-transparent flex items-center justify-center gap-3 sm:gap-4 pb-safe flex-wrap">
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
    </div>
  );
};
