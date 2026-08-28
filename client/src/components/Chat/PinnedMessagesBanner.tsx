import React from 'react';
import { Pin, ChevronRight, X } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';

export const PinnedMessagesBanner: React.FC = () => {
  const { pinnedMessages, jumpToMessage, togglePin } = useChat();

  if (pinnedMessages.length === 0) return null;

  const currentPinned = pinnedMessages[0];

  return (
    <div className="px-4 py-2 bg-[#0E0E10] border-b border-white/10 flex items-center justify-between text-xs animate-slide-down select-none shadow-sm">
      <button
        onClick={() => jumpToMessage(currentPinned.id)}
        className="flex items-center gap-2.5 min-w-0 flex-1 text-left hover:opacity-80 transition group"
      >
        <div className="p-1 rounded-lg bg-white text-black flex-shrink-0">
          <Pin className="w-3 h-3 fill-black" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-white">
              Pinned Message
            </span>
            {pinnedMessages.length > 1 && (
              <span className="text-[10px] text-black bg-white px-1.5 py-0.2 rounded-full font-extrabold">
                1 of {pinnedMessages.length}
              </span>
            )}
          </div>
          <p className="text-zinc-400 truncate max-w-sm sm:max-w-md mt-0.5">
            {currentPinned.content || '[Attachment]'}
          </p>
        </div>
        <ChevronRight className="w-4 h-4 text-zinc-400 group-hover:text-white transition flex-shrink-0" />
      </button>

      <button
        onClick={() => togglePin(currentPinned.id)}
        className="p-1.5 ml-2 text-zinc-400 hover:text-white rounded-lg hover:bg-white/10 transition"
        title="Unpin Message"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
