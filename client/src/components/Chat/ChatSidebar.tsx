import React from 'react';
import {
  Search,
  Settings,
  Image,
  Pin,
  SquarePen,
  MessageSquare,
  Sparkles,
} from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatSidebar: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    activeConversation,
    selectConversation,
    pinnedMessages,
    setIsNewChatModalOpen,
    setIsSettingsOpen,
    setIsSharedMediaOpen,
  } = useChat();

  const formatMessageTime = (dateStr: string) => {
    try {
      const d = new Date(dateStr);
      return isToday(d) ? format(d, 'HH:mm') : format(d, 'MMM d');
    } catch {
      return '';
    }
  };

  return (
    <aside className="w-full lg:w-80 h-[100dvh] bg-[#09090b] border-r border-white/10 flex flex-col select-none flex-shrink-0 z-20">
      {/* Top Header: Instagram Style Account Dropdown & New Message */}
      <div className="p-3.5 border-b border-white/10 flex items-center justify-between bg-[#0e0e10]">
        <div className="flex items-center gap-2 min-w-0">
          <Avatar
            name={user?.displayName || 'User'}
            username={user?.username}
            avatarUrl={user?.avatarUrl}
            size="sm"
          />
          <div className="min-w-0">
            <h2 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate flex items-center gap-1">
              @{user?.username}
            </h2>
            <div className="text-[10px] text-zinc-400 truncate">
              {user?.displayName}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="p-2 rounded-xl text-zinc-300 hover:text-white bg-white/5 hover:bg-white/10 transition active:scale-95"
            title="New Chat / Search User"
          >
            <SquarePen className="w-4 h-4" />
          </button>
          <button
            onClick={() => setIsSettingsOpen(true)}
            className="p-2 rounded-xl text-zinc-300 hover:text-white hover:bg-white/10 transition"
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Quick Search Button */}
      <div className="p-3 border-b border-white/5 bg-[#09090b]">
        <button
          onClick={() => setIsNewChatModalOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-zinc-900/90 border border-white/10 text-xs text-zinc-400 flex items-center justify-between hover:border-white/30 hover:text-zinc-200 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search friends (@username)...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-zinc-400 font-mono">+</kbd>
        </button>
      </div>

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
        <div className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 px-2 py-1 flex items-center justify-between">
          <span>Messages</span>
          <span>{conversations.length}</span>
        </div>

        {conversations.length === 0 ? (
          <div className="py-12 text-center text-xs text-zinc-500 px-4 space-y-3">
            <MessageSquare className="w-8 h-8 mx-auto text-zinc-600" />
            <p>No conversations yet.</p>
            <button
              onClick={() => setIsNewChatModalOpen(true)}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95"
            >
              Start New Message
            </button>
          </div>
        ) : (
          conversations.map((conv) => {
            const isSelected = activeConversation?.id === conv.id;
            const partner = conv.otherUser;
            const displayName = partner?.displayName || conv.name || 'Friend';
            const username = partner?.username || 'user';
            const avatarUrl = partner?.avatarUrl;
            const lastMessageText = conv.lastMessage?.content || (conv.lastMessage?.attachments?.length ? '[Attachment]' : 'New conversation');
            const timeFormatted = conv.lastMessage ? formatMessageTime(conv.lastMessage.createdAt) : '';

            return (
              <button
                key={conv.id}
                onClick={() => selectConversation(conv)}
                className={`w-full p-2.5 rounded-2xl flex items-center gap-3 transition-all text-left ${
                  isSelected
                    ? 'bg-zinc-800/90 text-white shadow-md border border-white/15'
                    : 'hover:bg-white/5 text-zinc-300 border border-transparent'
                }`}
              >
                <Avatar
                  name={displayName}
                  username={username}
                  avatarUrl={avatarUrl}
                  size="md"
                  status={partner?.lastSeen ? 'online' : 'offline'}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className="text-xs sm:text-sm font-semibold text-white truncate">
                      {displayName}
                    </span>
                    <span className="text-[10px] text-zinc-400 flex-shrink-0 ml-1">
                      {timeFormatted}
                    </span>
                  </div>

                  <div className="flex items-center justify-between mt-0.5">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-white font-semibold' : 'text-zinc-400'}`}>
                      {lastMessageText}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="w-4 h-4 rounded-full bg-white text-black text-[9px] font-black flex items-center justify-center flex-shrink-0 ml-1">
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            );
          })
        )}

        {/* Feature Hub Card */}
        <div className="pt-4 space-y-1.5 border-t border-white/5 mt-3">
          <button
            onClick={() => setIsSharedMediaOpen(true)}
            className="w-full p-2 rounded-xl bg-zinc-900/60 border border-white/5 hover:border-white/20 hover:bg-white/5 transition flex items-center justify-between text-xs text-zinc-300 group"
          >
            <div className="flex items-center gap-2">
              <Image className="w-3.5 h-3.5 text-zinc-400" />
              <span className="font-medium">Shared Media</span>
            </div>
            <span className="text-[10px] text-zinc-500">Files</span>
          </button>

          {pinnedMessages.length > 0 && (
            <div className="w-full p-2 rounded-xl bg-zinc-900/60 border border-white/5 flex items-center justify-between text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <Pin className="w-3.5 h-3.5 text-zinc-400" />
                <span className="font-medium">Pinned Items</span>
              </div>
              <span className="text-[10px] bg-white/10 text-white px-1.5 py-0.5 rounded-full font-bold">
                {pinnedMessages.length}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Footer Banner */}
      <div className="p-3 border-t border-white/10 bg-[#0e0e10] flex items-center justify-between">
        <div className="flex items-center gap-2 text-[11px] text-zinc-400">
          <Sparkles className="w-3.5 h-3.5 text-white" />
          <span>HD Calling & Noise Gate</span>
        </div>
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="text-[11px] font-semibold text-white hover:underline"
        >
          Settings
        </button>
      </div>
    </aside>
  );
};
