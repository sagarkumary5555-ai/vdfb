import React, { useEffect, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { MessageItem } from './MessageItem.js';
import { DateSeparator } from './DateSeparator.js';
import { Avatar } from '../Common/Avatar.js';

export const MessageList: React.FC = () => {
  const {
    messages,
    isLoading,
    isLoadingMore,
    hasMore,
    loadMoreMessages,
    activeConversation,
    activePartner,
    sendMessage,
  } = useChat();

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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400">
        <div className="w-7 h-7 border-2 border-white border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide text-zinc-300">Loading conversation...</span>
      </div>
    );
  }

  const isGroup = Boolean(activeConversation?.isGroup);
  const partnerName = isGroup
    ? (activeConversation?.name || 'Group Chat')
    : (activePartner?.displayName || activeConversation?.name || 'Friend');
  const partnerUsername = activePartner?.username || 'user';
  const partnerAvatar = isGroup ? null : activePartner?.avatarUrl;

  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 select-none bg-[#09090b]">
        <div className="max-w-md w-full text-center p-6 sm:p-8 rounded-3xl bg-[#111114] border border-white/10 shadow-2xl space-y-4 animate-fade-in">
          {/* Avatar Header */}
          <div className="flex justify-center">
            <Avatar
              name={partnerName}
              username={partnerUsername}
              avatarUrl={partnerAvatar}
              size="xl"
              isGroup={isGroup}
              status={!isGroup && activePartner?.lastSeen ? 'online' : null}
            />
          </div>

          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">
              {partnerName}
            </h2>
            {!isGroup && (
              <p className="text-xs text-zinc-400 mt-0.5">@{partnerUsername}</p>
            )}
            {activePartner?.customStatus && !isGroup && (
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-zinc-900 border border-white/10 text-[11px] text-zinc-300">
                {activePartner.customStatus}
              </div>
            )}
            {isGroup && (
              <p className="text-xs text-zinc-400 mt-1">Group Conversation</p>
            )}
          </div>

          <div className="p-3.5 bg-zinc-900/80 rounded-2xl border border-white/5 space-y-1.5">
            <div className="text-xs text-zinc-300 font-medium">
              Start the conversation
            </div>
            <p className="text-[11px] text-zinc-500">
              Messages and calls in this conversation are end-to-end encrypted.
            </p>
          </div>

          {/* Quick Starter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => sendMessage('Hey! 👋')}
              className="px-3.5 py-1.5 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Say Hello 👋</span>
            </button>
            <button
              onClick={() => sendMessage('How are you doing today? ✨')}
              className="px-3.5 py-1.5 bg-zinc-900 border border-white/10 hover:border-white/25 text-white text-xs font-semibold rounded-xl transition active:scale-95"
            >
              <span>How are you? ✨</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      ref={listContainerRef}
      onScroll={handleScroll}
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-3 space-y-0.5 custom-scrollbar bg-[#09090b]"
    >
      {/* Top Loading Indicator */}
      {isLoadingMore && (
        <div className="py-2 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
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
