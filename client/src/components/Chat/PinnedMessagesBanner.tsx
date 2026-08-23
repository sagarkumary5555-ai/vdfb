import React from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';

export const PinnedMessagesBanner: React.FC = () => {
  const { pinnedMessages, jumpToMessage, togglePin } = useChat();

  if (pinnedMessages.length === 0) return null;

  const currentPinned = pinnedMessages[0];

  return (
    <div className="px-3 sm:px-6 py-1.5 bg-gradient-to-r from-brand-rose/20 via-brand-purple/20 to-transparent border-b border-brand-rose/20 flex items-center justify-between text-xs backdrop-blur-md animate-slide-down select-none z-20">
      <div
        onClick={() => jumpToMessage(currentPinned.id)}
        className="flex items-center gap-2 truncate cursor-pointer hover:opacity-90 transition flex-1 pr-2"
      >
        <div className="p-1 rounded-lg bg-brand-rose/30 text-brand-pink flex-shrink-0">
          <Pin className="w-3 h-3" />
        </div>
        <div className="truncate flex items-center gap-1.5">
          <span className="font-semibold text-brand-pink text-[11px]">Pinned:</span>
          <span className="text-slate-200 truncate text-[11px]">
            {currentPinned.content || '[Attachment]'}
          </span>
          {pinnedMessages.length > 1 && (
            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full text-slate-300">
              +{pinnedMessages.length - 1}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => jumpToMessage(currentPinned.id)}
          className="text-slate-400 hover:text-white p-1 rounded-lg transition"
          title="Jump to message"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => togglePin(currentPinned.id)}
          className="text-slate-400 hover:text-red-400 p-1 rounded-lg transition"
          title="Unpin message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
