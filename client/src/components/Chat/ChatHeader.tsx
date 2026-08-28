import React, { useState, useEffect } from 'react';
import { Phone, Video, ChevronLeft, Info, Users, Search, ShieldCheck } from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useSocket } from '../../context/SocketContext.js';
import { useChat } from '../../context/ChatContext.js';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';
import { messageApi } from '../../services/api.js';

export const ChatHeader: React.FC = () => {
  const { isPartnerTyping, isUserOnline, getUserLastSeen } = useSocket();
  const {
    activePartner,
    activeConversation,
    setIsSharedMediaOpen,
    setIsSearchOpen,
    setIsSidebarOpen,
    viewUserProfile,
    friends,
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

  const isOnline = !isGroup && isUserOnline(activePartner?.id);
  const isFriend = !isGroup && activePartner && friends.some((f) => f.id === activePartner.id);
  const lastSeenStr = !isGroup ? (getUserLastSeen(activePartner?.id) || activePartner?.lastSeen) : null;

  const handleHeaderUserClick = () => {
    if (isGroup) {
      setIsSharedMediaOpen(true);
    } else if (activePartner) {
      viewUserProfile(activePartner);
    }
  };

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

    if (isOnline) {
      return (
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
          Active now
          {isFriend && (
            <span className="text-emerald-500/80 font-normal flex items-center gap-0.5 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded-md">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Friends
            </span>
          )}
          {activePartner?.customStatus && (
            <span className="text-zinc-500 font-normal truncate">
              • {activePartner.customStatus}
            </span>
          )}
        </span>
      );
    }

    if (lastSeenStr) {
      try {
        const d = new Date(lastSeenStr);
        return (
          <span className="text-zinc-500 flex items-center gap-1">
            <span>Active {formatDistanceToNowStrict(d)} ago</span>
            {isFriend && <span className="text-zinc-600">• Friend</span>}
          </span>
        );
      } catch {
        return <span className="text-zinc-500">Offline</span>;
      }
    }

    return <span className="text-zinc-500">@{partnerUsername}</span>;
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0a0a0d] border-b border-white/10 flex items-center justify-between z-30 select-none flex-shrink-0">
      {/* Left: Mobile Back Button + Profile / Group Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-1.5 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          title="Back to messages"
        >
          <ChevronLeft className="w-6 h-6 stroke-[2]" />
        </button>

        <div
          onClick={handleHeaderUserClick}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group py-1 rounded-xl hover:opacity-90 transition"
          title="Click to view profile / info"
        >
          <Avatar
            name={titleName}
            username={partnerUsername}
            avatarUrl={partnerAvatar}
            size="md"
            className="w-10 h-10 ring-1 ring-white/10 group-hover:scale-105 transition-transform"
            isGroup={isGroup}
            status={!isGroup ? (isOnline ? 'online' : 'offline') : null}
          />

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight group-hover:underline">
                {titleName}
              </h1>
              {isGroup && (
                <span className="text-[10px] font-bold text-zinc-400 bg-white/10 px-1.5 py-0.5 rounded-md flex-shrink-0">
                  GROUP
                </span>
              )}
            </div>

            <div className="text-xs flex items-center gap-1.5 truncate leading-tight mt-0.5">
              {formatSubtitle()}
            </div>
          </div>
        </div>
      </div>

      {/* Right: Actions (Search 🔍, Phone 📞, Video 📹, Info ℹ️) */}
      <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95"
          title="Search in messages (Ctrl+F)"
        >
          <Search className="w-4.5 h-4.5 stroke-[1.8]" />
        </button>

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
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95 disabled:opacity-30"
              title={`HD Voice Call with ${activePartner.displayName}`}
            >
              <Phone className="w-4.5 h-4.5 stroke-[1.8]" />
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
              className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95 disabled:opacity-30"
              title={`HD Video Call with ${activePartner.displayName}`}
            >
              <Video className="w-4.5 h-4.5 stroke-[1.8]" />
            </button>
          </>
        )}

        <button
          onClick={() => setIsSharedMediaOpen(true)}
          className="p-2 text-zinc-400 hover:text-white hover:bg-white/10 rounded-xl transition active:scale-95"
          title="Shared Media & Conversation Info"
        >
          <Info className="w-4.5 h-4.5 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};
