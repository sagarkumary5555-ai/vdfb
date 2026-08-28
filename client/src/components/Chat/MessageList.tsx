import React, { useEffect, useRef, useState } from 'react';
import { isSameDay } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { MessageItem } from './MessageItem.js';
import { DateSeparator } from './DateSeparator.js';
import { Avatar } from '../Common/Avatar.js';
import { ShieldCheck } from 'lucide-react';

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
    viewUserProfile,
    setIsSharedMediaOpen,
  } = useChat();

  const { isUserOnline } = useSocket();
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
      <div className="flex-1 flex flex-col items-center justify-center gap-3 text-zinc-400 bg-[#06080E]">
        <div className="w-7 h-7 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-medium tracking-wide text-zinc-300">Loading encrypted messages...</span>
      </div>
    );
  }

  const isGroup = Boolean(activeConversation?.isGroup);
  const partnerName = isGroup
    ? (activeConversation?.name || 'Group Chat')
    : (activePartner?.displayName || activeConversation?.name || 'Friend');
  const partnerUsername = activePartner?.username || 'user';
  const partnerAvatar = isGroup ? null : activePartner?.avatarUrl;
  const isOnline = !isGroup && activePartner ? isUserOnline(activePartner.id) : false;

  const handleProfileClick = () => {
    if (isGroup) {
      setIsSharedMediaOpen(true);
    } else if (activePartner) {
      viewUserProfile(activePartner);
    }
  };

  // Luxury Empty Chat State
  if (messages.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center p-4 sm:p-6 select-none bg-[#06080E]">
        <div className="max-w-md w-full text-center p-6 sm:p-8 rounded-3xl bg-[#0C101A] border border-white/[0.1] shadow-2xl space-y-4 animate-fade-in">
          {/* Avatar Header */}
          <div
            onClick={handleProfileClick}
            className="flex justify-center cursor-pointer group"
            title="View Profile"
          >
            <Avatar
              name={partnerName}
              username={partnerUsername}
              avatarUrl={partnerAvatar}
              size="2xl"
              isGroup={isGroup}
              status={!isGroup ? (isOnline ? 'online' : 'offline') : null}
              className="group-hover:scale-105 transition-transform ring-4 ring-white/10"
            />
          </div>

          <div>
            <h2
              onClick={handleProfileClick}
              className="text-lg sm:text-xl font-bold text-white tracking-tight cursor-pointer hover:text-blue-300 transition flex items-center justify-center gap-1.5"
            >
              <span>{partnerName}</span>
              {!isGroup && <ShieldCheck className="w-4 h-4 text-emerald-400" />}
            </h2>
            {!isGroup && (
              <p className="text-xs text-zinc-400 mt-0.5">@{partnerUsername} • ChatUs PRO</p>
            )}
            {activePartner?.customStatus && !isGroup && (
              <div className="inline-block mt-2 px-3 py-1 rounded-full bg-[#141824] border border-white/10 text-xs text-zinc-300">
                {activePartner.customStatus}
              </div>
            )}
          </div>

          <div className="flex justify-center pt-1">
            <button
              onClick={handleProfileClick}
              className="px-4 py-1.5 bg-[#141824] hover:bg-[#1E2436] text-white text-xs font-semibold rounded-xl border border-white/10 transition active:scale-95 shadow"
            >
              View profile
            </button>
          </div>

          <div className="p-3.5 bg-black/40 rounded-2xl border border-white/5 space-y-1">
            <p className="text-xs text-zinc-400">
              No messages here yet. Send a greeting to start the conversation!
            </p>
          </div>

          {/* Quick Starter Pills */}
          <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
            <button
              onClick={() => sendMessage('Hey! 👋')}
              className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold rounded-xl shadow-md transition active:scale-95 flex items-center gap-1.5"
            >
              <span>Say Hello 👋</span>
            </button>
            <button
              onClick={() => sendMessage('How are you doing today? ✨')}
              className="px-4 py-2 bg-[#141824] hover:bg-[#1E2436] text-zinc-200 hover:text-white text-xs font-semibold rounded-xl border border-white/[0.08] transition active:scale-95"
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
      className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 space-y-0.5 custom-scrollbar bg-[#06080E]"
    >
      {/* Top Loading Indicator */}
      {isLoadingMore && (
        <div className="py-2 text-center text-xs text-zinc-400 flex items-center justify-center gap-2">
          <div className="w-3.5 h-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading older messages...</span>
        </div>
      )}

      {/* Hero at Top of Chat (when reached top) */}
      {!hasMore && (
        <div className="py-8 pb-6 flex flex-col items-center justify-center text-center space-y-3 animate-fade-in border-b border-white/[0.06] mb-4">
          <div
            onClick={handleProfileClick}
            className="cursor-pointer group story-ring-luxury p-1 rounded-full"
            title="Click to view profile"
          >
            <Avatar
              name={partnerName}
              username={partnerUsername}
              avatarUrl={partnerAvatar}
              size="2xl"
              className="w-22 h-22 ring-2 ring-black group-hover:scale-105 transition-transform"
              isGroup={isGroup}
              status={!isGroup ? (isOnline ? 'online' : 'offline') : null}
            />
          </div>

          <div>
            <h3
              onClick={handleProfileClick}
              className="text-lg font-bold text-white tracking-tight cursor-pointer hover:text-blue-300 transition"
            >
              {partnerName}
            </h3>
            <p className="text-xs text-zinc-400 mt-0.5">
              @{partnerUsername} • ChatUs PRO
            </p>
            {activePartner?.bio && (
              <p className="text-xs text-zinc-300 max-w-sm mx-auto mt-1 line-clamp-2">
                {activePartner.bio}
              </p>
            )}
          </div>

          <button
            onClick={handleProfileClick}
            className="px-4 py-1.5 bg-[#141824] hover:bg-[#1E2436] text-white text-xs font-semibold rounded-xl border border-white/10 transition active:scale-95 shadow"
          >
            View profile
          </button>
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
