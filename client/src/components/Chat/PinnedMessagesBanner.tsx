import React from 'react';
import { Pin, X, ChevronRight } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';

export const PinnedMessagesBanner: React.FC = () => {
  const { pinnedMessages, jumpToMessage, togglePin } = useChat();

  if (pinnedMessages.length === 0) return null;

  const currentPinned = pinnedMessages[0];

  return (
    <div className="px-3 sm:px-6 py-1.5 bg-gradient-to-r from-blue-600/20 via-indigo-600/15 to-transparent border-b border-blue-500/20 flex items-center justify-between text-xs backdrop-blur-md animate-slide-down select-none z-20">
      <div
        onClick={() => jumpToMessage(currentPinned.id)}
        className="flex items-center gap-2 truncate cursor-pointer hover:opacity-90 transition flex-1 pr-2"
      >
        <div className="p-1 rounded-lg bg-blue-500/20 text-blue-400 flex-shrink-0">
          <Pin className="w-3 h-3" />
        </div>
        <div className="truncate flex items-center gap-1.5">
          <span className="font-bold text-blue-400 text-[11px]">Pinned:</span>
          <span className="text-zinc-200 truncate text-[11px]">
            {currentPinned.content || '[Attachment]'}
          </span>
          {pinnedMessages.length > 1 && (
            <span className="text-[10px] bg-white/10 px-1.5 py-0.2 rounded-full text-zinc-300 font-bold">
              +{pinnedMessages.length - 1}
            </span>
          )}
        </div>
      </div>

      <div className="flex items-center gap-1 flex-shrink-0">
        <button
          onClick={() => jumpToMessage(currentPinned.id)}
          className="text-zinc-400 hover:text-white p-1 rounded-lg transition"
          title="Jump to message"
        >
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          onClick={() => togglePin(currentPinned.id)}
          className="text-zinc-400 hover:text-red-400 p-1 rounded-lg transition"
          title="Unpin message"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
};
