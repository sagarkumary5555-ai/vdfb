import React from 'react';
import {
  Search,
  Settings,
  Image,
  Pin,
  Heart,
  Shield,
  Bot,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatSidebar: React.FC = () => {
  const { user, partnerUser } = useAuth();
  const { partnerStatus, isPartnerTyping } = useSocket();
  const {
    messages,
    pinnedMessages,
    setIsSearchOpen,
    setIsSettingsOpen,
    setIsSharedMediaOpen,
  } = useChat();

  const partnerName = partnerUser?.displayName || (user?.username === 'sagar' ? 'Something ❤️' : 'Sagar');
  const partnerUsername = partnerUser?.username || (user?.username === 'sagar' ? 'something' : 'sagar');
  const partnerAvatar =
    partnerUser?.avatarUrl ||
    (user?.username === 'sagar'
      ? 'https://api.dicebear.com/7.x/lorelei/svg?seed=Something&backgroundColor=31102f'
      : 'https://api.dicebear.com/7.x/bottts/svg?seed=Sagar&backgroundColor=1e293b');

  const lastMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  return (
    <aside className="hidden lg:flex flex-col w-80 h-[100dvh] glass-panel border-r border-white/10 select-none flex-shrink-0 z-20">
      {/* Top Header: App Branding */}
      <div className="p-4 border-b border-white/10 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-gradient-to-tr from-brand-rose/30 to-brand-purple/30 border border-brand-rose/40 shadow-inner">
            <Heart className="w-5 h-5 text-brand-pink fill-brand-pink/50 animate-pulse-subtle" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight flex items-center gap-1">
              Private Duo Space
            </h2>
            <div className="text-[10px] text-slate-400 flex items-center gap-1 font-medium">
              <Shield className="w-3 h-3 text-brand-emerald" />
              <span>Sagar & Something</span>
            </div>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>

      {/* Quick Search Bar Trigger */}
      <div className="p-3 border-b border-white/5">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="w-full py-2 px-3 rounded-xl bg-dark-950/70 border border-white/10 text-xs text-slate-400 flex items-center justify-between hover:border-brand-pink/40 hover:text-slate-200 transition"
        >
          <div className="flex items-center gap-2">
            <Search className="w-3.5 h-3.5" />
            <span>Search messages...</span>
          </div>
          <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] text-slate-400 font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Main Conversation Tile */}
      <div className="p-3 flex-1 overflow-y-auto space-y-2">
        <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2">
          Direct Message
        </div>

        <div className="p-3 rounded-2xl bg-white/10 border border-white/15 shadow-lg flex items-center gap-3 cursor-pointer group hover:bg-white/15 transition">
          <Avatar
            name={partnerName}
            username={partnerUsername}
            avatarUrl={partnerAvatar}
            size="md"
            status={partnerStatus}
          />

          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-white truncate">{partnerName}</span>
              <span className="text-[10px] text-emerald-400 font-medium">
                {partnerStatus === 'online' ? 'Online' : ''}
              </span>
            </div>

            <p className="text-xs text-slate-300 truncate mt-0.5">
              {isPartnerTyping ? (
                <span className="text-brand-pink font-semibold animate-pulse">typing...</span>
              ) : lastMessage ? (
                lastMessage.content || (lastMessage.attachments.length ? `[Attachment]` : '')
              ) : (
                'Start your conversation ❤️'
              )}
            </p>
          </div>
        </div>

        {/* Quick Hub Cards */}
        <div className="pt-4 space-y-2">
          <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400 px-2">
            Features & Media
          </div>

          <button
            onClick={() => setIsSharedMediaOpen(true)}
            className="w-full p-2.5 rounded-xl bg-dark-950/60 border border-white/10 hover:border-brand-pink/40 hover:bg-white/5 transition flex items-center justify-between text-xs text-slate-300 group"
          >
            <div className="flex items-center gap-2.5">
              <div className="p-1.5 rounded-lg bg-cyan-500/15 text-cyan-400">
                <Image className="w-4 h-4" />
              </div>
              <span className="font-medium">Shared Media & Files</span>
            </div>
            <span className="text-[10px] text-slate-500 group-hover:text-slate-300">View</span>
          </button>

          {pinnedMessages.length > 0 && (
            <button
              onClick={() => setIsSharedMediaOpen(false)}
              className="w-full p-2.5 rounded-xl bg-dark-950/60 border border-white/10 hover:border-brand-pink/40 hover:bg-white/5 transition flex items-center justify-between text-xs text-slate-300 group"
            >
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 rounded-lg bg-amber-500/15 text-amber-400">
                  <Pin className="w-4 h-4" />
                </div>
                <span className="font-medium">Pinned Messages</span>
              </div>
              <span className="text-[10px] bg-brand-rose/20 text-brand-pink px-2 py-0.5 rounded-full font-bold">
                {pinnedMessages.length}
              </span>
            </button>
          )}

          <div className="p-3 rounded-2xl bg-gradient-to-br from-purple-950/40 to-pink-950/40 border border-white/10 space-y-1.5">
            <div className="flex items-center gap-2 text-xs font-semibold text-white">
              <Bot className="w-4 h-4 text-[#5865F2]" />
              <span>Discord Bridge Connected</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Messages and attachments sync live between this website and Discord.
            </p>
          </div>
        </div>
      </div>

      {/* Current User Bottom Bar */}
      <div className="p-3 border-t border-white/10 bg-dark-950/70 flex items-center justify-between">
        <div className="flex items-center gap-2.5 truncate">
          <Avatar
            name={user?.displayName || 'User'}
            username={user?.username}
            avatarUrl={user?.avatarUrl}
            size="sm"
          />
          <div className="truncate">
            <div className="text-xs font-bold text-white truncate">{user?.displayName}</div>
            <div className="text-[10px] text-slate-400">@{user?.username}</div>
          </div>
        </div>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition"
          title="Account Settings"
        >
          <Settings className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
