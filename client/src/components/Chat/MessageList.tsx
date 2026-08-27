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

    if (scrollTop < 80 && hasMore && !isLoadingMore) {
      loadMoreMessages();
    }

    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;
    setShouldAutoScroll(isNearBottom);
  };

  if (isLoading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
        <div className="w-7 h-7 border-2 border-brand-pink border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide text-slate-300">Opening private space...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 select-none">
        <div className="max-w-sm text-center p-6 sm:p-8 rounded-3xl glass-panel border border-white/15 shadow-2xl backdrop-blur-2xl">
          <div className="inline-flex p-3 rounded-2xl bg-brand-rose/15 border border-brand-rose/30 mb-3 shadow-inner">
            <Lock className="w-6 h-6 text-brand-pink" />
          </div>
          <h2 className="text-base sm:text-lg font-bold text-white mb-1 drop-shadow-sm">Private Duo Space</h2>
          <p className="text-xs text-slate-300 mb-5 leading-relaxed">
            Encrypted conversation between <span className="font-semibold text-white">Sagar</span> &{' '}
            <span className="font-semibold text-white">Something</span>.
          </p>
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-brand-pink bg-brand-rose/15 px-3.5 py-1.5 rounded-full border border-brand-rose/30 shadow-sm">
            <Heart className="w-3.5 h-3.5 fill-brand-pink" />
            <span>Say hello to start chatting ❤️</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={listContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-0.5 custom-scrollbar"
    >
      {/* Top Loading Indicator */}
      {isLoadingMore && (
        <div className="py-2 text-center text-xs text-slate-400 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
          <span>Loading older messages...</span>
        </div>
      )}

      {/* Message List with Intelligent Grouping */}
      {messages.map((message, index) => {
        const prevMessage = messages[index - 1];
        const nextMessage = messages[index + 1];

        const isFirstOfDate =
          !prevMessage || !isSameDay(new Date(message.createdAt), new Date(prevMessage.createdAt));

        const isSameSenderAsPrev =
          !isFirstOfDate && prevMessage && (prevMessage.senderId === message.senderId || prevMessage.sender.username === message.sender.username);

        const isSameSenderAsNext =
          nextMessage &&
          isSameDay(new Date(message.createdAt), new Date(nextMessage.createdAt)) &&
          (nextMessage.senderId === message.senderId || nextMessage.sender.username === message.sender.username);

        const isFirstInGroup = !isSameSenderAsPrev;
        const isLastInGroup = !isSameSenderAsNext;

        return (
          <React.Fragment key={message.id || message.localId}>
            {isFirstOfDate && <DateSeparator date={message.createdAt} />}
            <MessageItem
              message={message}
              isFirstInGroup={isFirstInGroup}
              isLastInGroup={isLastInGroup}
            />
          </React.Fragment>
        );
      })}

      <div ref={bottomRef} />
    </div>
  );
};
