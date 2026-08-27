import React from 'react';
import { Search, Settings, Image, Phone, Video, ChevronLeft } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';

export const ChatHeader: React.FC = () => {
  const { isPartnerTyping } = useSocket();
  const {
    activePartner,
    activeConversation,
    setIsSearchOpen,
    setIsSettingsOpen,
    setIsSharedMediaOpen,
    setIsSidebarOpen,
  } = useChat();
  const { startCall, callState } = useCall();

  const partnerName = activePartner?.displayName || activeConversation?.name || 'Direct Message';
  const partnerUsername = activePartner?.username || 'user';
  const partnerAvatar = activePartner?.avatarUrl;

  const formatLastSeen = () => {
    if (isPartnerTyping) {
      return (
        <span className="text-white font-bold animate-pulse flex items-center gap-1">
          typing...
        </span>
      );
    }

    if (activePartner?.lastSeen) {
      const d = new Date(activePartner.lastSeen);
      const timeStr = format(d, 'HH:mm');
      const dateStr = isToday(d) ? 'today' : format(d, 'MMM d');
      return <span className="text-zinc-400">Active {dateStr} at {timeStr}</span>;
    }

    return <span className="text-emerald-400 font-medium">Active now</span>;
  };

  return (
    <header className="h-16 px-3 sm:px-6 bg-[#0c0c0e] border-b border-white/10 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Left: Mobile Back Button + Partner Profile */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        {/* Mobile Back to Inbox Button */}
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-1.5 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Back to inbox"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <Avatar
          name={partnerName}
          username={partnerUsername}
          avatarUrl={partnerAvatar}
          size="md"
          status={activePartner?.lastSeen ? 'online' : 'offline'}
        />

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {partnerName}
            </h1>
          </div>

          <div className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1.5 truncate">
            {formatLastSeen()}
            {activePartner?.customStatus && (
              <span className="hidden sm:inline text-zinc-500 truncate font-normal">
                • {activePartner.customStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions (Voice Call, Video Call, Search, Media) */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {/* Voice Call Button */}
        <button
          onClick={() => startCall('audio')}
          disabled={callState !== 'idle' || !activePartner}
          className="p-2 sm:p-2.5 rounded-xl text-white bg-white/5 hover:bg-white/15 active:scale-95 transition border border-white/10 disabled:opacity-30"
          title="Voice Call"
        >
          <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        {/* Video Call Button */}
        <button
          onClick={() => startCall('video')}
          disabled={callState !== 'idle' || !activePartner}
          className="p-2 sm:p-2.5 rounded-xl text-white bg-white/5 hover:bg-white/15 active:scale-95 transition border border-white/10 disabled:opacity-30"
          title="Video Call"
        >
          <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={() => setIsSharedMediaOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Shared Media"
        >
          <Image className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Search conversation"
        >
          <Search className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>

        <button
          onClick={() => setIsSettingsOpen(true)}
          className="p-2 sm:p-2.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 active:scale-95 transition"
          title="Settings"
        >
          <Settings className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
        </button>
      </div>
    </header>
  );
};
