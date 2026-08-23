import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';

export const ConnectionBanner: React.FC = () => {
  const { connectionState } = useSocket();
  const { offlineQueue } = useChat();

  if (connectionState === 'connected' && offlineQueue.length === 0) {
    return null;
  }

  return (
    <div className="w-full bg-amber-500/10 border-b border-amber-500/20 px-4 py-2 text-xs flex items-center justify-between text-amber-300 animate-slide-down">
      <div className="flex items-center gap-2">
        {connectionState === 'reconnecting' ? (
          <>
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-amber-400" />
            <span>Reconnecting to chat gateway...</span>
          </>
        ) : (
          <>
            <WifiOff className="w-3.5 h-3.5 text-red-400" />
            <span className="text-red-300">You are currently offline.</span>
          </>
        )}
      </div>

      {offlineQueue.length > 0 && (
        <div className="text-[11px] bg-amber-500/20 px-2 py-0.5 rounded-full border border-amber-500/30">
          {offlineQueue.length} message{offlineQueue.length > 1 ? 's' : ''} queued
        </div>
      )}
    </div>
  );
};
