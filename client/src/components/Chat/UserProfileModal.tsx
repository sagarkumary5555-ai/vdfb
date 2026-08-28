import React, { useState } from 'react';
import {
  X,
  MessageSquare,
  Phone,
  Video,
  ShieldCheck,
  FolderArchive,
  UserPlus,
  Trash2,
  Sparkles,
  Clock,
} from 'lucide-react';
import { formatDistanceToNowStrict } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { useCall } from '../../context/CallContext.js';
import { Avatar } from '../Common/Avatar.js';
import { User } from '../../types/index.js';

interface UserProfileModalProps {
  user: User | null;
  onClose: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({ user, onClose }) => {
  const {
    friends,
    sendFriendRequest,
    removeFriend,
    startDirectChatWithUser,
    setIsSharedMediaOpen,
    openLightbox,
  } = useChat();

  const { isUserOnline, getUserLastSeen } = useSocket();
  const { startCall, callState } = useCall();

  const [isProcessing, setIsProcessing] = useState(false);
  const [statusNotice, setStatusNotice] = useState<string | null>(null);

  if (!user) return null;

  const isOnline = isUserOnline(user.id);
  const lastSeen = getUserLastSeen(user.id) || user.lastSeen;
  const isFriend = friends.some((f) => f.id === user.id);

  const handleSendFriendReq = async () => {
    setIsProcessing(true);
    setStatusNotice(null);
    try {
      const res = await sendFriendRequest(user.username);
      setStatusNotice(res.message);
    } catch (err: any) {
      setStatusNotice(err.response?.data?.error || err.message || 'Failed to send request');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveFriend = async () => {
    if (confirm(`Remove @${user.username} from your friends?`)) {
      setIsProcessing(true);
      try {
        await removeFriend(user.id);
        setStatusNotice('Friend removed');
      } catch {
        setStatusNotice('Failed to remove friend');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleStartCall = (type: 'audio' | 'video') => {
    onClose();
    startCall(type, {
      id: user.id,
      displayName: user.displayName,
      username: user.username,
      avatarUrl: user.avatarUrl,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-xl animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-[#0E0E10] rounded-3xl border border-white/20 shadow-2xl overflow-hidden animate-slide-up flex flex-col">
        
        {/* Cover / Header Monochrome */}
        <div className="h-28 bg-[#141416] relative flex items-start justify-end p-3.5 border-b border-white/10">
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-black/60 hover:bg-black text-zinc-300 hover:text-white transition border border-white/10"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Profile Details Container */}
        <div className="px-6 pb-6 pt-0 relative flex flex-col items-center text-center -mt-14 space-y-4">
          
          {/* Avatar with click to zoom */}
          <div
            onClick={() => user.avatarUrl && openLightbox(user.avatarUrl, user.displayName)}
            className="relative cursor-pointer group"
            title="Click to view full photo"
          >
            <div className="ring-4 ring-[#0E0E10] rounded-full overflow-hidden shadow-2xl">
              <Avatar
                name={user.displayName}
                username={user.username}
                avatarUrl={user.avatarUrl}
                size="2xl"
                className="w-24 h-24 sm:w-28 sm:h-28 object-cover"
                status={isOnline ? 'online' : 'offline'}
              />
            </div>
            {user.avatarUrl && (
              <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center text-white text-xs font-bold transition">
                Zoom 🔍
              </div>
            )}
          </div>

          {/* User Names & Status */}
          <div className="space-y-1 w-full">
            <h2 className="text-xl font-extrabold text-white tracking-tight flex items-center justify-center gap-1.5">
              <span>{user.displayName}</span>
              {isFriend && (
                <span title="Verified Friend">
                  <ShieldCheck className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                </span>
              )}
            </h2>
            <p className="text-xs text-zinc-400 font-medium">@{user.username} • ChatUs PRO</p>

            {/* Online / Active status */}
            <div className="pt-1 flex items-center justify-center gap-1.5 text-xs">
              {isOnline ? (
                <span className="text-emerald-400 font-bold flex items-center gap-1.5 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                  Active Now
                </span>
              ) : (
                <span className="text-zinc-400 text-[11px] flex items-center gap-1">
                  <Clock className="w-3 h-3 text-zinc-500" />
                  {lastSeen ? `Last active ${formatDistanceToNowStrict(new Date(lastSeen))} ago` : 'Offline'}
                </span>
              )}
            </div>
          </div>

          {/* Status Message / Notice */}
          {statusNotice && (
            <div className="w-full p-2.5 rounded-xl bg-white/10 border border-white/15 text-xs text-zinc-200">
              {statusNotice}
            </div>
          )}

          {/* Custom Status / Bio Card */}
          {(user.customStatus || user.bio) && (
            <div className="w-full p-3.5 bg-[#141416] rounded-2xl border border-white/10 text-left space-y-1.5 shadow-sm">
              {user.customStatus && (
                <div className="text-xs font-semibold text-white flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                  <span>{user.customStatus}</span>
                </div>
              )}
              {user.bio && (
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {user.bio}
                </p>
              )}
            </div>
          )}

          {/* Quick Action Grid */}
          <div className="w-full grid grid-cols-3 gap-2 pt-1">
            <button
              onClick={() => {
                onClose();
                startDirectChatWithUser(user);
              }}
              className="py-2.5 px-3 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-md transition active:scale-95 flex flex-col items-center justify-center gap-1"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat</span>
            </button>

            <button
              onClick={() => handleStartCall('audio')}
              disabled={callState !== 'idle'}
              className="py-2.5 px-3 rounded-xl bg-[#141416] hover:bg-[#1E1E22] text-zinc-200 hover:text-white font-semibold text-xs border border-white/10 transition active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-40 shadow-sm"
            >
              <Phone className="w-4 h-4 text-white" />
              <span>Voice</span>
            </button>

            <button
              onClick={() => handleStartCall('video')}
              disabled={callState !== 'idle'}
              className="py-2.5 px-3 rounded-xl bg-[#141416] hover:bg-[#1E1E22] text-zinc-200 hover:text-white font-semibold text-xs border border-white/10 transition active:scale-95 flex flex-col items-center justify-center gap-1 disabled:opacity-40 shadow-sm"
            >
              <Video className="w-4 h-4 text-white" />
              <span>Video</span>
            </button>
          </div>

          {/* Secondary Actions */}
          <div className="w-full pt-3 border-t border-white/10 flex items-center justify-between text-xs text-zinc-400">
            <button
              onClick={() => {
                onClose();
                setIsSharedMediaOpen(true);
              }}
              className="flex items-center gap-1.5 hover:text-white transition"
            >
              <FolderArchive className="w-3.5 h-3.5" />
              <span>Shared Media</span>
            </button>

            {isFriend ? (
              <button
                onClick={handleRemoveFriend}
                disabled={isProcessing}
                className="flex items-center gap-1 text-zinc-400 hover:text-red-400 transition"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Unfriend</span>
              </button>
            ) : (
              <button
                onClick={handleSendFriendReq}
                disabled={isProcessing}
                className="flex items-center gap-1 text-white font-bold hover:underline transition"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Friend</span>
              </button>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};
