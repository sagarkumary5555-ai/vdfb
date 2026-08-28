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
        <span className="text-zinc-400 flex items-center gap-1.5 text-xs font-medium">
          <Users className="w-3.5 h-3.5 text-blue-400" />
          <span>{groupParticipantsCount ? `${groupParticipantsCount} members active` : 'Group conversation'}</span>
        </span>
      );
    }

    if (isPartnerTyping) {
      return (
        <span className="text-blue-400 font-bold animate-pulse flex items-center gap-1 text-xs">
          <span>typing...</span>
        </span>
      );
    }

    if (isOnline) {
      return (
        <span className="text-emerald-400 font-semibold flex items-center gap-1.5 text-xs">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
          <span>Active now</span>
          {isFriend && (
            <span className="text-emerald-300 font-medium flex items-center gap-0.5 text-[10px] bg-emerald-500/10 px-1.5 py-0.5 rounded-md border border-emerald-500/20">
              <ShieldCheck className="w-3 h-3 text-emerald-400" /> Verified Friend
            </span>
          )}
          {activePartner?.customStatus && (
            <span className="text-zinc-400 font-normal truncate hidden sm:inline">
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
          <span className="text-zinc-400 flex items-center gap-1 text-xs">
            <span>Last active {formatDistanceToNowStrict(d)} ago</span>
            {isFriend && <span className="text-zinc-500">• Friend</span>}
          </span>
        );
      } catch {
        return <span className="text-zinc-500 text-xs">Offline</span>;
      }
    }

    return <span className="text-zinc-400 text-xs">@{partnerUsername} • ChatUs PRO</span>;
  };

  return (
    <header className="h-16 px-4 sm:px-6 bg-[#0D1018]/90 border-b border-white/[0.08] backdrop-blur-2xl flex items-center justify-between z-30 select-none flex-shrink-0 shadow-lg">
      {/* Left: Mobile Back Button + Profile / Group Details */}
      <div className="flex items-center gap-2.5 min-w-0 flex-1 mr-2">
        <button
          onClick={() => setIsSidebarOpen(true)}
          className="lg:hidden p-2 -ml-1 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
          title="Back to conversations"
        >
          <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
        </button>

        <div
          onClick={handleHeaderUserClick}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group py-1 px-1.5 rounded-2xl hover:bg-white/[0.04] transition"
          title="Click to view full user profile & stats"
        >
          <div className="relative">
            <Avatar
              name={titleName}
              username={partnerUsername}
              avatarUrl={partnerAvatar}
              size="md"
              className="w-10 h-10 ring-2 ring-white/10 group-hover:ring-white/30 transition-all shadow-md group-hover:scale-105"
              isGroup={isGroup}
              status={!isGroup ? (isOnline ? 'online' : 'offline') : null}
            />
          </div>

          <div className="flex flex-col min-w-0 flex-1">
            <div className="flex items-center gap-1.5 truncate">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight truncate leading-tight group-hover:text-blue-400 transition">
                {titleName}
              </h1>
              {isGroup && (
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-indigo-300 bg-indigo-500/15 border border-indigo-500/30 px-1.5 py-0.5 rounded-md flex-shrink-0">
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

      {/* Right: Actions Dock (Search, HD Voice, HD Video, Shared Media) */}
      <div className="flex items-center gap-1.5 sm:gap-2 flex-shrink-0">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-2xl transition active:scale-95 border border-white/[0.04]"
          title="Search in messages (Ctrl+F)"
        >
          <Search className="w-4 h-4 stroke-[1.8]" />
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
              className="p-2.5 text-zinc-300 hover:text-white bg-[#181C26] hover:bg-[#222838] border border-white/[0.08] rounded-2xl transition active:scale-95 shadow-sm disabled:opacity-30 flex items-center gap-1.5"
              title={`HD Voice Call with ${activePartner.displayName}`}
            >
              <Phone className="w-4 h-4 text-emerald-400 stroke-[1.8]" />
              <span className="hidden md:inline text-xs font-semibold text-zinc-200">Call</span>
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
              className="p-2.5 text-zinc-300 hover:text-white bg-[#181C26] hover:bg-[#222838] border border-white/[0.08] rounded-2xl transition active:scale-95 shadow-sm disabled:opacity-30 flex items-center gap-1.5"
              title={`HD Video Call with ${activePartner.displayName}`}
            >
              <Video className="w-4 h-4 text-blue-400 stroke-[1.8]" />
              <span className="hidden md:inline text-xs font-semibold text-zinc-200">Video</span>
            </button>
          </>
        )}

        <button
          onClick={() => setIsSharedMediaOpen(true)}
          className="p-2.5 text-zinc-400 hover:text-white hover:bg-white/10 rounded-2xl transition active:scale-95 border border-white/[0.04]"
          title="Shared Media, Files & Audio"
        >
          <Info className="w-4 h-4 stroke-[1.8]" />
        </button>
      </div>
    </header>
  );
};
