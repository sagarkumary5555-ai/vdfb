import React, { useEffect, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { Lock, Heart } from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { MessageItem } from './MessageItem.js';
import { DateSeparator } from './DateSeparator.js';

export const MessageList: React.FC = () => {
  const { messages, isLoading, isLoadingMore, hasMore, loadMoreMessages } = useChat();
  const listContainerRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevScrollHeightRef = useRef<number>(0);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);

  // Maintain scroll position when older messages are loaded
  useEffect(() => {
    if (listContainerRef.current && isLoadingMore) {
      prevScrollHeightRef.current = listContainerRef.current.scrollHeight;
    }
  }, [isLoadingMore]);

  useEffect(() => {
    if (listContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = listContainerRef.current.scrollHeight;
      listContainerRef.current.scrollTop += newScrollHeight - prevScrollHeightRef.current;
      prevScrollHeightRef.current = 0;
    } else if (shouldAutoScroll) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, shouldAutoScroll]);

  // Handle scroll upwards for pagination
  const handleScroll = () => {
    if (!listContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = listContainerRef.current;

    // If near top, load more
    if (scrollTop < 80 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }

    // Auto-scroll to bottom only if user is already near bottom
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-8 h-8 border-3 border-brand-pink border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium">Decrypting private space...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 select-none">
        <div className="max-w-sm text-center p-6 sm:p-8 rounded-3xl glass-panel border border-white/20 shadow-2xl backdrop-blur-2xl">
          <div className="inline-flex p-3.5 rounded-2xl bg-gradient-to-tr from-brand-rose/30 to-brand-purple/30 border border-brand-rose/40 mb-3 shadow-inner">
            <Lock className="w-7 h-7 text-brand-pink animate-pulse-subtle" />
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-white mb-1.5 drop-shadow-sm">Private Duo Space</h2>
          <p className="text-xs sm:text-sm text-slate-300 mb-5 leading-relaxed">
            Only <span className="font-semibold text-white">Sagar</span> &{' '}
            <span className="font-semibold text-white">Something</span> can access this conversation.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-pink bg-brand-rose/15 px-4 py-2 rounded-full border border-brand-rose/30 shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-brand-pink" />
            <span>Say hello to start your conversation ❤️</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={listContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-1"
    >
      {/* Top Loading Indicator */}
      {isLoadingMore && (
        <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
          <span>Loading older messages...</span>
        </div>
      )}

      {/* Message List with Date Separators */}
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const isFirstOfDate =
          !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));

        return (
          <React.Fragment key={message.id || message.localId}>
            {isFirstOfDate && <DateSeparator date={message.createdAt} />}
            <MessageItem message={message} />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};
