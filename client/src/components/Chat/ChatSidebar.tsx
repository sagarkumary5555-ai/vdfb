import React, { useState } from 'react';
import {
  Search,
  SquarePen,
  ChevronDown,
  Plus,
  Music,
  X,
  Sparkles,
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
  } = useChat();

  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'primary' | 'general' | 'requests'>('primary');

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      if (isToday(d)) return format(d, 'HH:mm');
      if (isYesterday(d)) return '1d';
      return formatDistanceToNowStrict(d, { addSuffix: false });
    } catch {
      return '';
    }
  };

  const filteredConversations = conversations.filter((c) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = c.name?.toLowerCase().includes(q);
    const userMatch = c.otherUser?.username?.toLowerCase().includes(q) || c.otherUser?.displayName?.toLowerCase().includes(q);
    return nameMatch || userMatch;
  });

  // Instagram 24h Notes
  const sampleNotes = [
    {
      id: 'self',
      isSelf: true,
      name: 'Your note',
      username: user?.username || 'user',
      avatarUrl: user?.avatarUrl,
      noteText: user?.customStatus || 'Share a thought...',
      music: false,
      hasStory: false,
    },
    ...conversations.slice(0, 6).map((c, i) => {
      const isOnline = c.otherUser ? isUserOnline(c.otherUser.id) : false;
      return {
        id: c.id,
        isSelf: false,
        name: c.otherUser?.displayName || c.name || 'Friend',
        username: c.otherUser?.username || 'user',
        avatarUrl: c.otherUser?.avatarUrl,
        noteText: c.otherUser?.customStatus || (isOnline ? 'Active vibes ✨' : i % 2 === 0 ? 'Weekend plans? 🎵' : 'Tu hai kahan 🎧'),
        music: i < 2,
        hasStory: true,
      };
    }),
  ];

  return (
    <aside className="w-full lg:w-[350px] xl:w-[380px] h-[100dvh] bg-black border-r border-[#262626] flex flex-col select-none flex-shrink-0 z-20">
      {/* Top Header: @username dropdown + New Message Icon */}
      <div className="px-5 pt-5 pb-3 flex items-center justify-between flex-shrink-0">
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="flex items-center gap-1.5 group hover:opacity-80 transition min-w-0"
          title="Account Switcher / Profile"
        >
          <span className="text-xl font-bold text-white tracking-tight truncate">
            {user?.username || 'lifejourneyw'}
          </span>
          <ChevronDown className="w-4 h-4 text-zinc-400 group-hover:text-white transition mt-0.5" />
        </button>

        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="p-2 rounded-xl text-white hover:bg-white/10 active:scale-95 transition flex-shrink-0"
          title="New Message (Direct or Group)"
        >
          <SquarePen className="w-5 h-5 stroke-[1.9]" />
        </button>
      </div>

      {/* Search Bar (Instagram Pill Shape) */}
      <div className="px-4 py-2 flex-shrink-0">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search"
            className="w-full pl-10 pr-9 py-2 bg-[#262626] rounded-xl text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-zinc-600 transition"
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

      {/* Instagram 24h Notes Carousel */}
      <div className="px-4 py-3 border-b border-[#1f1f23] overflow-x-auto custom-scrollbar flex items-start gap-4 flex-shrink-0">
        {sampleNotes.map((note) => (
          <div
            key={note.id}
            onClick={() => note.isSelf ? setIsSettingsOpen(true) : {}}
            className="flex flex-col items-center flex-shrink-0 cursor-pointer group w-18"
          >
            {/* Thought Note Bubble */}
            <div className="relative mb-2">
              <div className="max-w-[80px] px-2.5 py-1 bg-[#262626] text-white text-[10px] font-medium rounded-2xl shadow-lg border border-white/10 flex items-center justify-center gap-1 truncate text-center group-hover:scale-105 transition animate-fade-in">
                {note.music && <Music className="w-2.5 h-2.5 text-zinc-400 flex-shrink-0" />}
                <span className="truncate">{note.noteText}</span>
              </div>
              {/* Little speech bubble tail dot */}
              <div className="w-1.5 h-1.5 rounded-full bg-[#262626] absolute -bottom-1 left-4 border border-white/10" />
            </div>

            {/* Note Avatar Circle */}
            <div className="relative">
              <div className={note.hasStory ? 'story-ring-active' : ''}>
                <Avatar
                  name={note.name}
                  username={note.username}
                  avatarUrl={note.avatarUrl}
                  size="lg"
                  className="w-14 h-14 ring-2 ring-black"
                />
              </div>
              {note.isSelf && (
                <div className="absolute bottom-0 right-0 w-4 h-4 rounded-full bg-white text-black flex items-center justify-center border-2 border-black">
                  <Plus className="w-3 h-3 stroke-[3]" />
                </div>
              )}
            </div>

            <span className="text-[11px] text-zinc-400 mt-1.5 truncate max-w-[68px] text-center font-medium">
              {note.name}
            </span>
          </div>
        ))}
      </div>

      {/* Category Tabs: Primary vs General vs Requests */}
      <div className="px-4 pt-3 pb-2 flex items-center justify-between border-b border-[#18181b] flex-shrink-0">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setActiveTab('primary')}
            className={`text-sm font-bold transition pb-1 border-b-2 ${
              activeTab === 'primary'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            Messages
          </button>
          <button
            onClick={() => setActiveTab('general')}
            className={`text-sm font-bold transition pb-1 border-b-2 ${
              activeTab === 'general'
                ? 'text-white border-white'
                : 'text-zinc-500 border-transparent hover:text-zinc-300'
            }`}
          >
            Channels
          </button>
        </div>

        <button
          onClick={() => setActiveTab('requests')}
          className={`text-xs font-semibold transition ${
            activeTab === 'requests' ? 'text-blue-400 font-bold' : 'text-zinc-400 hover:text-white'
          }`}
        >
          Requests
        </button>
      </div>

      {/* Conversation List */}
      <div className="flex-1 overflow-y-auto px-2 py-1 space-y-0.5 custom-scrollbar">
        {filteredConversations.length === 0 ? (
          <div className="py-20 text-center text-xs text-zinc-500 px-4 space-y-3 animate-fade-in">
            <Sparkles className="w-8 h-8 text-zinc-600 mx-auto" />
            <p className="font-medium">No messages found.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95"
            >
              Send Message
            </button>
          </div>
        ) : (
          filteredConversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const partner = conv.otherUser;
            const isPartnerOnline = partner ? isUserOnline(partner.id) : false;
            const displayName = conv.isGroup ? conv.name : (partner?.displayName || conv.name || 'Friend');
            const username = partner?.username || 'user';
            const avatarUrl = partner?.avatarUrl;

            let subtitleText = '';
            if (conv.lastMessage?.content) {
              subtitleText = conv.lastMessage.content;
            } else if (conv.lastMessage?.attachments?.length) {
              subtitleText = 'sent an attachment.';
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

            const timeFormatted = conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : '';

            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full px-3 py-2.5 rounded-xl flex items-center gap-3 transition-all text-left group ${
                  isSelected
                    ? 'bg-[#262626] text-white shadow'
                    : 'hover:bg-[#1a1a1a] text-zinc-300'
                }`}
              >
                {/* Avatar with Live Breathing Status */}
                <Avatar
                  name={displayName || 'Chat'}
                  username={username}
                  avatarUrl={avatarUrl}
                  size="lg"
                  className="w-13 h-13 flex-shrink-0"
                  isGroup={conv.isGroup}
                  status={!conv.isGroup && partner ? (isPartnerOnline ? 'online' : 'offline') : null}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-white truncate group-hover:text-white">
                      {displayName}
                    </span>
                  </div>

                  <div className="flex items-center gap-1 text-xs text-zinc-400 mt-0.5 truncate">
                    <span className={`truncate ${conv.unreadCount > 0 ? 'text-white font-bold' : ''} ${isPartnerOnline && !conv.lastMessage ? 'text-emerald-400 font-medium' : ''}`}>
                      {subtitleText}
                    </span>
                    {timeFormatted && (
                      <>
                        <span className="text-zinc-600 flex-shrink-0">•</span>
                        <span className="flex-shrink-0 text-zinc-500">{timeFormatted}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Unread Blue Dot Indicator */}
                {conv.unreadCount > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-[#0095f6] flex-shrink-0" />
                )}
              </button>
            );
          })
        )}
      </div>
    </aside>
  );
};
