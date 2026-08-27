import React, { useState, useEffect } from 'react';
import { Search, Settings, Image, Phone, Video, ChevronLeft, Users } from 'lucide-react';
import { format, isToday } from 'date-fns';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';
import { messageApi } from '../../services/api.js';

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

  const [groupParticipantsCount, setGroupParticipantsCount] = useState<number | null>(null);

  useEffect(() => {
    if (activeConversation?.isGroup) {
      messageApi.getParticipants(activeConversation.id).then((res) => {
        setGroupParticipantsCount(res.participants.length);
      }).catch(() => {});
    } else {
      setGroupParticipantsCount(null);
    }
  }, [activeConversation?.id, activeConversation?.isGroup]);

  const isGroup = Boolean(activeConversation?.isGroup);
  const titleName = isGroup
    ? (activeConversation?.name || 'Group Chat')
    : (activePartner?.displayName || activeConversation?.name || 'Direct Message');
  const partnerUsername = activePartner?.username || 'user';
  const partnerAvatar = isGroup ? null : activePartner?.avatarUrl;

  const formatSubtitle = () => {
    if (isGroup) {
      return (
        <span className="text-zinc-400 flex items-center gap-1">
          <Users className="w-3 h-3 text-zinc-400" />
          <span>{groupParticipantsCount ? `${groupParticipantsCount} members` : 'Group conversation'}</span>
        </span>
      );
    }

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
      {/* Left: Mobile Back Button + Profile / Group Details */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1 mr-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-1.5 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Back to inbox"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <Avatar
          name={titleName}
          username={partnerUsername}
          avatarUrl={partnerAvatar}
          size="md"
          isGroup={isGroup}
          status={!isGroup && activePartner?.lastSeen ? 'online' : null}
        />

        <div className="flex flex-col min-w-0 flex-1">
          <div className="flex items-center gap-1.5 truncate">
            <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate">
              {titleName}
            </h1>
          </div>

          <div className="text-[11px] sm:text-xs text-zinc-400 flex items-center gap-1.5 truncate">
            {formatSubtitle()}
            {!isGroup && activePartner?.customStatus && (
              <span className="hidden sm:inline text-zinc-500 truncate font-normal">
                • {activePartner.customStatus}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-1 sm:gap-1.5 flex-shrink-0">
        {!isGroup && activePartner && (
          <>
            <button
              onClick={() =>
                startCall('audio', {
                  id: activePartner.id,
                  displayName: activePartner.displayName,
                  username: activePartner.username,
                  avatarUrl: activePartner.avatarUrl,
                })
              }
              disabled={callState !== 'idle'}
              className="p-2 sm:p-2.5 rounded-xl text-white bg-white/5 hover:bg-white/15 active:scale-95 transition border border-white/10 disabled:opacity-30"
              title={`Voice Call with ${activePartner.displayName}`}
            >
              <Phone className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>

            <button
              onClick={() =>
                startCall('video', {
                  id: activePartner.id,
                  displayName: activePartner.displayName,
                  username: activePartner.username,
                  avatarUrl: activePartner.avatarUrl,
                })
              }
              disabled={callState !== 'idle'}
              className="p-2 sm:p-2.5 rounded-xl text-white bg-white/5 hover:bg-white/15 active:scale-95 transition border border-white/10 disabled:opacity-30"
              title={`Video Call with ${activePartner.displayName}`}
            >
              <Video className="w-4 h-4 sm:w-4.5 sm:h-4.5" />
            </button>
          </>
        )}

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
