import React from 'react';
import { Search, Settings, Image, Phone, Video } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useAuth } from '../../context/AuthContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatHeader: React.FC = () => {
  const { user, partnerUser } = useAuth();
  const { partnerStatus, partnerLastSeen, isPartnerTyping } = useSocket();
  const {
    setIsSearchOpen,
    setIsSettingsOpen,
    setIsSharedMediaOpen,
  } = useChat();
  const { startCall, callState } = useCall();

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
      <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 mr-2">
        <Avatar
          name={partnerName}
          username={partnerUsername}
          avatarUrl={partnerAvatar}
          size="md"
          status={partnerStatus}
        />

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate flex items-center gap-1 drop-shadow-sm">
              <span className="truncate">{partnerName}</span>
            </h1>
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
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Voice Call Button */}
        <button
          onClick={() => startCall('audio')}
          disabled={callState !== 'idle'}
          className="p-2 sm:p-2.5 rounded-xl text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 active:scale-95 transition border border-emerald-500/20 disabled:opacity-40"
          title="Start Live Voice Call"
        >
          <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Video Call Button */}
        <button
          onClick={() => startCall('video')}
          disabled={callState !== 'idle'}
          className="p-2 sm:p-2.5 rounded-xl text-brand-pink bg-brand-rose/10 hover:bg-brand-rose/20 active:scale-95 transition border border-brand-rose/20 disabled:opacity-40"
          title="Start Live Video Call"
        >
          <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

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
      </div>
    </header>
  );
};
