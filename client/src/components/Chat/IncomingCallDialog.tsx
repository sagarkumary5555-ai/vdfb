import React from 'react';
import { Phone, Video, PhoneOff } from 'lucide-react';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';

export const IncomingCallDialog: React.FC = () => {
  const { callState, callerInfo, acceptCall, rejectCall } = useCall();

  if (callState !== 'incoming' || !callerInfo) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#121215] rounded-3xl border border-white/20 p-6 sm:p-8 shadow-2xl flex flex-col items-center text-center animate-slide-up overflow-hidden">
        
        {/* Caller Avatar with Animated Pulse Rings */}
        <div className="relative my-4">
          <div className="absolute inset-0 rounded-full bg-white/20 animate-ping" />
          <div className="absolute -inset-2 rounded-full border-2 border-white/40 animate-pulse" />
          <Avatar
            name={callerInfo.callerName}
            username={callerInfo.callerUsername}
            size="lg"
            className="relative z-10 w-24 h-24 ring-4 ring-white/20 shadow-2xl"
          />
        </div>

        {/* Caller Details */}
        <h2 className="text-xl font-bold text-white drop-shadow mt-2">
          {callerInfo.callerName}
        </h2>
        <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mt-1 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
          {callerInfo.type === 'video' ? (
            <>
              <Video className="w-3.5 h-3.5 animate-pulse" />
              <span>Incoming HD Video Call...</span>
            </>
          ) : (
            <>
              <Phone className="w-3.5 h-3.5 animate-pulse" />
              <span>Incoming HD Voice Call...</span>
            </>
          )}
        </div>

        <p className="text-[11px] text-zinc-400 mt-4 mb-8">
          Encrypted P2P WebRTC Connection • ChatUs PRO
        </p>

        {/* Call Action Buttons */}
        <div className="flex items-center justify-center gap-8 w-full">
          {/* Decline Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={rejectCall}
              className="w-16 h-16 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-600/40 active:scale-90 transition-all duration-200"
              title="Decline Call"
            >
              <PhoneOff className="w-7 h-7" />
            </button>
            <span className="text-xs font-medium text-zinc-400">Decline</span>
          </div>

          {/* Accept Button */}
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={acceptCall}
              className="w-16 h-16 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center shadow-lg shadow-emerald-600/40 active:scale-90 transition-all duration-200 animate-bounce"
              title="Accept Call"
            >
              {callerInfo.type === 'video' ? (
                <Video className="w-7 h-7" />
              ) : (
                <Phone className="w-7 h-7" />
              )}
            </button>
            <span className="text-xs font-semibold text-emerald-400">Accept</span>
          </div>
        </div>
      </div>
    </div>
  );
};
