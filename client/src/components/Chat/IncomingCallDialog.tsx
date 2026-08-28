import React from 'react';
import { Phone, Video, PhoneOff, ShieldCheck, Sparkles } from 'lucide-react';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';

export const IncomingCallDialog: React.FC = () => {
  const { callState, callerInfo, acceptCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !callerInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl animate-fade-in select-none font-sans">
      <div className="relative w-full max-w-sm bg-[#0E0E10] rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-slide-up overflow-hidden">
        
        {/* Caller Avatar with Animated Pulse Rings */}
        <div className="relative my-4">
          <div className="absolute -inset-4 rounded-full bg-white/10 animate-ping" />
          <div className="absolute -inset-2 rounded-full border-2 border-white/30 animate-pulse" />
          <div className="relative z-10 ring-4 ring-white/20 rounded-full shadow-2xl overflow-hidden">
            <Avatar
              name={callerInfo.callerName}
              username={callerInfo.callerUsername}
              avatarUrl={callerInfo.callerAvatar}
              size="2xl"
              className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
            />
          </div>
        </div>

        {/* Caller Details */}
        <h2 className="text-xl sm:text-2xl font-black text-white drop-shadow mt-2 flex items-center justify-center gap-1.5">
          <span>{callerInfo.callerName}</span>
          <ShieldCheck className="w-5 h-5 text-white" />
        </h2>
        <p className="text-xs text-zinc-400 font-medium mt-0.5">@{callerInfo.callerUsername}</p>

        {/* Incoming Call Type Badge in B&W */}
        <div className="flex items-center gap-1.5 text-xs font-bold text-black mt-3 bg-white px-3.5 py-1.5 rounded-full shadow-sm animate-pulse">
          {callerInfo.type === 'video' ? (
            <>
              <Video className="w-4 h-4 text-black" />
              <span>Incoming HD Video Call...</span>
            </>
          ) : (
            <>
              <Phone className="w-4 h-4 text-black" />
              <span>Incoming HD Voice Call...</span>
            </>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 mt-4 mb-8 flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-white inline" />
          <span>Encrypted Peer-to-Peer • Studio Audio</span>
        </p>

        {/* Call Action Buttons Dock */}
        <div className="flex items-center justify-center gap-10 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-xl active:scale-90 transition-all duration-200 border border-red-400/40"
              title="Decline Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs font-semibold text-zinc-400">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-white hover:bg-zinc-200 text-black flex items-center justify-center shadow-xl active:scale-90 transition-all duration-200 border border-white animate-bounce"
              title="Accept Call"
            >
              {callerInfo.type === 'video' ? (
                <Video className="w-7 h-7" />
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </button>
            <span className="text-xs font-bold text-white">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
