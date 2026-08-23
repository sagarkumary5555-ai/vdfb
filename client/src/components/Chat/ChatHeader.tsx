import React from 'react';
import { Search, Settings, Image, Bot } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatHeader: React.FC = () => {
  const { user, partnerUser } = useAuth();
  const { partnerStatus, partnerLastSeen, isPartnerTyping } = useSocket();
  const {
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

  const formatLastSeen = () => {
    if (isPartnerTyping) {
      return (
        <span className="text-brand-pink font-bold animate-pulse flex items-center gap-1">
          typing<span className="animate-bounce">...</span>
        </span>
      );
    }

    if (partnerStatus === 'online') {
      return (
        <span className="text-emerald-400 font-semibold flex items-center gap-1">
          Online
        </span>
      );
    }

    if (partnerLastSeen) {
      const d = new Date(partnerLastSeen);
      const timeStr = format(d, 'HH:mm');
      const dateStr = isToday(d) ? 'today' : format(d, 'MMM d');
      return <span className="text-slate-300">Last seen {dateStr} at {timeStr}</span>;
    }

    return <span className="text-slate-400">Offline</span>;
  };

  return (
    <header className="h-16 px-3 sm:px-6 glass-panel border-b border-white/10 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Left: Partner Profile */}
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
        <Avatar
          name={partnerName}
          username={partnerUsername}
          avatarUrl={partnerAvatar}
          size="md"
          status={partnerStatus}
        />

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate flex items-center gap-1 drop-shadow-sm">
              <span>{partnerName}</span>
            </h1>
            <span className="hidden md:inline-flex items-center gap-1 text-[10px] text-[#5865F2] bg-[#5865F2]/15 px-2 py-0.5 rounded-full border border-[#5865F2]/20 font-medium">
              <Bot className="w-2.5 h-2.5" />
              Discord Synced
            </span>
          </div>

          <div className="text-[11px] sm:text-xs text-slate-300 flex items-center gap-1.5 truncate">
            {formatLastSeen()}
            {partnerUser?.customStatus && (
              <span className="hidden sm:inline text-slate-400 truncate font-normal">
                • {partnerUser.customStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5">
        <button
          onClick={() => setIsSharedMediaOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Shared Media & Files"
        >
          <Image className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Search conversation"
        >
          <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Room settings"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Current user badge on desktop */}
        <div className="hidden sm:flex items-center gap-2 pl-2 ml-1 border-l border-white/10">
          <Avatar
            name={user?.displayName || 'User'}
            username={user?.username}
            avatarUrl={user?.avatarUrl}
            size="sm"
          />
        </div>
      </div>
    </header>
  );
};
