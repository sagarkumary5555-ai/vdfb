import React, { useState } from 'react';
import {
  Search,
  SquarePen,
  Settings,
  FolderArchive,
  X,
  MessageSquare,
} from 'lucide-react';
import { format, isToday, isYesterday, formatDistanceToNowStrict } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatSidebar: React.FC = () => {
  const { user } = useAuth();
  const { isUserOnline } = useSocket();
  const {
    conversations,
    activeConversation,
    selectConversation,
    setIsNewChatModalOpen,
    setIsSettingsOpen,
    setIsSharedMediaOpen,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return format(d, 'HH:mm');
      if (isYesterday(d)) return 'Yesterday';
      return formatDistanceToNowStrict(d, { addSuffix: false });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const userMatch =
      c.otherUser?.username?.toLowerCase().includes(q) ||
      c.otherUser?.displayName?.toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  return (
    <aside className="w-full h-[100dvh] bg-[#0c0c0e] border-r border-white/10 flex flex-col select-none flex-shrink-0 z-20">
      {/* Top Header: Brand + Current User Profile + Action Tools */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#111114]">
        {/* User Monogram & Info */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 hover:opacity-85 transition text-left min-w-0"
          title="Account Profile & Settings"
        >
          <Avatar
            name={user?.displayName || 'User'}
            username={user?.username}
            avatarUrl={user?.avatarUrl}
            size="md"
            status="online"
          />
          <div className="min-w-0">
            <div className="text-sm font-bold text-white truncate flex items-center gap-1.5">
              <span>{user?.displayName || user?.username}</span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span>Online • @{user?.username}</span>
            </div>
          </div>
        </button>

        {/* Action Buttons */}
        <div className="flex items-center gap-1">
          {/* Shared Media */}
          <button
            onClick={() => setIsSharedMediaOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Shared Files & Media"
          >
            <FolderArchive className="w-4.5 h-4.5" />
          </button>

          {/* New Chat / Group */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 rounded-xl text-white hover:bg-white/10 transition active:scale-95 bg-white/5 border border-white/10"
            title="New Chat or Group"
          >
            <SquarePen className="w-4.5 h-4.5" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Settings"
          >
            <Settings className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {/* Clean Search Input */}
      <div className="p-3 border-b border-white/5 bg-[#0e0e11]">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search chats..."
            className="w-full pl-10 pr-9 py-2 bg-black/60 border border-white/10 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-2.5 text-zinc-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-500 px-4 space-y-3">
            <MessageSquare className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="font-medium">No conversations found.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95"
            >
              Start New Chat
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const partner = conv.otherUser;
            const isPartnerOnline = partner ? isUserOnline(partner.id) : false;
            const displayName = conv.isGroup
              ? conv.name
              : partner?.displayName || conv.name || 'Friend';
            const username = partner?.username || 'user';
            const avatarUrl = partner?.avatarUrl;

            let subtitleText = '';
            if (conv.lastMessage?.content) {
              subtitleText = conv.lastMessage.content;
            } else if (conv.lastMessage?.attachments?.length) {
              subtitleText = '📎 Attachment';
            } else if (!conv.isGroup && isPartnerOnline) {
              subtitleText = 'Active now';
            } else if (!conv.isGroup && partner?.lastSeen) {
              try {
                subtitleText = `Last seen ${formatDistanceToNowStrict(new Date(partner.lastSeen))} ago`;
              } catch {
                subtitleText = 'Tap to chat';
              }
            } else {
              subtitleText = 'Tap to chat';
            }

            const timeFormatted = conv.lastMessage
              ? formatMessageTime(conv.lastMessage.createdAt)
              : '';

            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group ${
                  isSelected
                    ? 'bg-zinc-800/90 text-white shadow-lg border border-white/15'
                    : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                }`}
              >
                {/* Avatar with Live Status */}
                <Avatar
                  name={displayName || 'Chat'}
                  username={username}
                  avatarUrl={avatarUrl}
                  size="lg"
                  isGroup={conv.isGroup}
                  status={
                    !conv.isGroup && partner
                      ? isPartnerOnline
                        ? 'online'
                        : 'offline'
                      : null
                  }
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {displayName}
                    </span>
                    {timeFormatted && (
                      <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-1">
                        {timeFormatted}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate ${
                        conv.unreadCount > 0
                          ? 'text-white font-bold'
                          : isPartnerOnline && !conv.lastMessage
                          ? 'text-emerald-400 font-medium'
                          : 'text-zinc-400'
                      }`}
                    >
                      {subtitleText}
                    </p>

                    {/* Unread Counter Badge */}
                    {conv.unreadCount > 0 && (
                      <span className="px-1.5 min-w-4 h-4 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center flex-shrink-0 shadow">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
