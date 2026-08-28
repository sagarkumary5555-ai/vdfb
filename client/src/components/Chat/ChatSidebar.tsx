import React, { useState } from 'react';
import {
  Search,
  Plus,
  Users,
  Settings,
  FolderArchive,
  X,
  MessageSquare,
  UserPlus,
  UserCheck,
  Check,
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
    setIsFriendsModalOpen,
    pendingFriendCount,
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'direct' | 'groups'>('all');

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
    if (filterTab === 'direct' && c.isGroup) return false;
    if (filterTab === 'groups' && !c.isGroup) return false;

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const userMatch =
      c.otherUser?.username?.toLowerCase().includes(q) ||
      c.otherUser?.displayName?.toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  return (
    <aside className="w-full h-[100dvh] bg-black border-r border-white/10 flex flex-col select-none flex-shrink-0 z-20 font-sans">
      {/* Top Header: Current User Profile + Action Tools */}
      <div className="p-3.5 sm:p-4 border-b border-white/10 flex items-center justify-between bg-[#0A0A0C]">
        {/* User Monogram & Info */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-3 hover:opacity-90 transition text-left min-w-0 group"
          title="Account Profile & Preferences"
        >
          <div className="relative">
            <Avatar
              name={user?.displayName || 'User'}
              username={user?.username}
              avatarUrl={user?.avatarUrl}
              size="md"
              status="online"
              className="ring-2 ring-white/20 group-hover:ring-white transition-all shadow-lg"
            />
          </div>
          <div className="min-w-0">
            <div className="text-sm font-bold text-white tracking-tight truncate flex items-center gap-1.5">
              <span>{user?.displayName || user?.username}</span>
              <span className="text-[9px] uppercase tracking-wider font-extrabold text-black bg-white px-1.5 py-0.5 rounded">
                PRO
              </span>
            </div>
            <div className="text-[11px] text-zinc-400 truncate flex items-center gap-1 mt-0.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              <span>Online • @{user?.username}</span>
            </div>
          </div>
        </button>

        {/* Action Dock */}
        <div className="flex items-center gap-1">
          {/* Friends & Connections */}
          <button
            onClick={() => setIsFriendsModalOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 relative"
            title="Friends & Requests"
          >
            <UserCheck className="w-4 h-4 stroke-[1.8]" />
            {pendingFriendCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-white ring-2 ring-black animate-pulse" />
            )}
          </button>

          {/* Shared Media */}
          <button
            onClick={() => setIsSharedMediaOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Shared Files & Media"
          >
            <FolderArchive className="w-4 h-4 stroke-[1.8]" />
          </button>

          {/* Settings */}
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
            title="Settings & Audio DSP"
          >
            <Settings className="w-4 h-4 stroke-[1.8]" />
          </button>
        </div>
      </div>

      {/* Prominent Quick Actions & Filter Search */}
      <div className="p-3 border-b border-white/10 bg-[#08080A] space-y-2.5">
        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-1.5">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="py-2 px-2 bg-white hover:bg-zinc-200 active:scale-95 text-black rounded-xl text-xs font-bold shadow transition flex items-center justify-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5 stroke-[3]" />
            <span>New Chat</span>
          </button>

          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="py-2 px-2 bg-[#141416] hover:bg-[#1E1E22] active:scale-95 text-zinc-200 hover:text-white border border-white/10 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition"
          >
            <Users className="w-3.5 h-3.5 text-zinc-400" />
            <span>Group</span>
          </button>

          <button
            onClick={() => setIsFriendsModalOpen(true)}
            className="py-2 px-2 bg-[#141416] hover:bg-[#1E1E22] active:scale-95 text-zinc-300 hover:text-white border border-white/10 rounded-xl text-xs font-semibold shadow-sm flex items-center justify-center gap-1.5 transition relative"
          >
            <UserPlus className="w-3.5 h-3.5 text-zinc-400" />
            <span>Friends</span>
            {pendingFriendCount > 0 && (
              <span className="w-3.5 h-3.5 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingFriendCount}
              </span>
            )}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search conversations..."
            className="w-full pl-9 pr-8 py-2 bg-[#101014] border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white focus:bg-[#141418] transition"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-2.5 text-zinc-400 hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Segmented Filter Pills */}
        <div className="flex items-center gap-1 pt-0.5 bg-black p-1 rounded-xl border border-white/10">
          {[
            { id: 'all', label: 'All Chats' },
            { id: 'direct', label: 'Direct' },
            { id: 'groups', label: 'Groups' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilterTab(tab.id as any)}
              className={`flex-1 py-1 px-2 rounded-lg text-xs font-semibold transition ${
                filterTab === tab.id
                  ? 'bg-white text-black shadow font-bold'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="py-16 text-center text-xs text-zinc-500 px-4 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-[#121214] border border-white/10 flex items-center justify-center mx-auto text-zinc-400 shadow-inner">
              <MessageSquare className="w-5 h-5 stroke-[1.8]" />
            </div>
            <p className="font-medium text-zinc-400">
              {searchQuery
                ? `No conversations matching "${searchQuery}"`
                : filterTab === 'groups'
                ? 'No groups yet. Click "Group" to create one!'
                : 'No messages yet.'}
            </p>
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                onClick={() => setIsFriendsModalOpen(true)}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 flex items-center gap-1.5"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Find & Add Friends</span>
              </button>
            </div>
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
                subtitleText = `Active ${formatDistanceToNowStrict(new Date(partner.lastSeen))} ago`;
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
                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all text-left group relative ${
                  isSelected
                    ? 'bg-[#18181C] border border-white/20 text-white shadow-lg'
                    : 'hover:bg-white/[0.05] text-zinc-300 border border-transparent'
                }`}
              >
                {/* Avatar with Status */}
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
                    <span className="text-xs sm:text-sm font-bold text-white truncate flex items-center gap-1">
                      <span>{displayName}</span>
                      {!conv.isGroup && (
                        <span className="text-[10px] text-zinc-400 font-mono">✓</span>
                      )}
                    </span>
                    {timeFormatted && (
                      <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-1 font-medium">
                        {timeFormatted}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center justify-between gap-1">
                    <p
                      className={`text-xs truncate flex items-center gap-1 ${
                        conv.unreadCount > 0
                          ? 'text-white font-bold'
                          : isPartnerOnline && !conv.lastMessage
                          ? 'text-zinc-200 font-medium'
                          : 'text-zinc-400'
                      }`}
                    >
                      {conv.lastMessage && conv.lastMessage.senderId === user?.id && (
                        <Check className="w-3.5 h-3.5 text-zinc-300 inline flex-shrink-0" />
                      )}
                      <span className="truncate">{subtitleText}</span>
                    </p>

                    {/* Unread Counter Badge in B&W */}
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
