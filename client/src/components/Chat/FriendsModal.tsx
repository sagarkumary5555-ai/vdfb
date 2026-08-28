import React, { useState } from 'react';
import {
  Users,
  UserPlus,
  UserCheck,
  Search,
  X,
  Check,
  MessageSquare,
  Trash2,
} from 'lucide-react';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { authApi } from '../../services/api.js';
import { User } from '../../types/index.js';
import { Avatar } from '../Common/Avatar.js';

export const FriendsModal: React.FC = () => {
  const {
    isFriendsModalOpen,
    setIsFriendsModalOpen,
    friends,
    incomingRequests,
    outgoingRequests,
    pendingFriendCount,
    sendFriendRequest,
    acceptFriendRequest,
    declineFriendRequest,
    removeFriend,
    startDirectChatWithUser,
    viewUserProfile,
  } = useChat();

  const { isUserOnline } = useSocket();

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'add'>('friends');
  const [searchTarget, setSearchTarget] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [foundUsers, setFoundUsers] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [actionMsg, setActionMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Search platform users to add
  const handleSearchUsers = async (q: string) => {
    setSearchQuery(q);
    if (!q.trim()) {
      setFoundUsers([]);
      return;
    }
    setIsSearching(true);
    try {
      const res = await authApi.searchUsers(q);
      setFoundUsers(res.users);
    } catch {
      setFoundUsers([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSendRequest = async (target: string) => {
    setActionMsg(null);
    setProcessingId(target);
    try {
      const res = await sendFriendRequest(target);
      setActionMsg({ type: 'success', text: res.message });
      setSearchTarget('');
    } catch (err: any) {
      setActionMsg({ type: 'error', text: err.response?.data?.error || err.message || 'Failed to send request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleAccept = async (requesterId: string) => {
    setProcessingId(requesterId);
    try {
      await acceptFriendRequest(requesterId);
      setActionMsg({ type: 'success', text: 'Friend request accepted! You can now chat.' });
    } catch (err: any) {
      setActionMsg({ type: 'error', text: 'Failed to accept request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleDecline = async (requesterId: string) => {
    setProcessingId(requesterId);
    try {
      await declineFriendRequest(requesterId);
      setActionMsg({ type: 'success', text: 'Request declined' });
    } catch {
      setActionMsg({ type: 'error', text: 'Failed to decline request' });
    } finally {
      setProcessingId(null);
    }
  };

  const handleRemoveFriend = async (friendId: string, name: string) => {
    if (confirm(`Remove ${name} from your friends list?`)) {
      setProcessingId(friendId);
      try {
        await removeFriend(friendId);
        setActionMsg({ type: 'success', text: `${name} removed from friends` });
      } catch {
        setActionMsg({ type: 'error', text: 'Failed to remove friend' });
      } finally {
        setProcessingId(null);
      }
    }
  };

  if (!isFriendsModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#121215] rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[88vh]">
        
        {/* Header Bar */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e11] flex-shrink-0">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white text-black font-bold">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">Friends & Connections</h2>
              <div className="text-[10px] text-zinc-400">Only friends can direct chat & join groups</div>
            </div>
          </div>

          <button
            onClick={() => setIsFriendsModalOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Action Message Alert */}
        {actionMsg && (
          <div
            className={`p-2.5 mx-3 mt-3 rounded-xl text-xs flex items-center justify-between gap-2 flex-shrink-0 ${
              actionMsg.type === 'success'
                ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30'
                : 'bg-red-500/15 text-red-300 border border-red-500/30'
            }`}
          >
            <div className="flex items-center gap-2 truncate">
              <span>{actionMsg.type === 'success' ? '✅' : '⚠️'}</span>
              <span className="truncate">{actionMsg.text}</span>
            </div>
            <button onClick={() => setActionMsg(null)} className="text-zinc-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab Switcher Pills */}
        <div className="p-2 border-b border-white/10 bg-[#0a0a0d] flex items-center gap-1 flex-shrink-0">
          <button
            onClick={() => setActiveTab('friends')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'friends'
                ? 'bg-white text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            <span>Friends ({friends.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('requests')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 relative ${
              activeTab === 'requests'
                ? 'bg-white text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Requests</span>
            {pendingFriendCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-500 text-black text-[9px] font-black flex items-center justify-center animate-pulse">
                {pendingFriendCount}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('add')}
            className={`flex-1 py-2 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeTab === 'add'
                ? 'bg-white text-black shadow'
                : 'text-zinc-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span>Add Friend</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar bg-[#121215]">
          
          {/* TAB 1: FRIENDS LIST */}
          {activeTab === 'friends' && (
            friends.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500 space-y-3 px-4">
                <Users className="w-8 h-8 mx-auto text-zinc-600" />
                <p className="font-medium">No friends added yet.</p>
                <button
                  onClick={() => setActiveTab('add')}
                  className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 flex items-center gap-1.5 mx-auto"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>Add Your First Friend</span>
                </button>
              </div>
            ) : (
              friends.map((f) => {
                const isOnline = isUserOnline(f.id);
                return (
                  <div
                    key={f.id}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 flex items-center justify-between gap-3 group hover:border-white/20 transition"
                  >
                    <div
                      onClick={() => viewUserProfile(f)}
                      className="flex items-center gap-3 min-w-0 cursor-pointer group-hover:opacity-90"
                      title="Click to view profile"
                    >
                      <Avatar
                        name={f.displayName}
                        username={f.username}
                        avatarUrl={f.avatarUrl}
                        size="md"
                        status={isOnline ? 'online' : 'offline'}
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-white truncate group-hover:underline">{f.displayName}</div>
                        <div className="text-[10px] text-zinc-400 truncate">@{f.username}</div>
                        {f.customStatus && (
                          <div className="text-[10px] text-zinc-500 truncate mt-0.5">{f.customStatus}</div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 flex-shrink-0">
                      <button
                        onClick={() => startDirectChatWithUser(f)}
                        className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-200 transition active:scale-95 shadow"
                        title="Start Chat"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Chat</span>
                      </button>

                      <button
                        onClick={() => handleRemoveFriend(f.id, f.displayName)}
                        disabled={processingId === f.id}
                        className="p-2 rounded-xl text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition active:scale-95"
                        title="Remove Friend"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })
            )
          )}

          {/* TAB 2: REQUESTS */}
          {activeTab === 'requests' && (
            <div className="space-y-4">
              {/* Incoming Requests */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                  Incoming Requests ({incomingRequests.length})
                </div>

                {incomingRequests.length === 0 ? (
                  <div className="py-6 text-center text-xs text-zinc-500 border border-white/5 rounded-2xl bg-zinc-950/40">
                    No pending incoming friend requests
                  </div>
                ) : (
                  incomingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-3 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Avatar
                          name={req.user.displayName}
                          username={req.user.username}
                          avatarUrl={req.user.avatarUrl}
                          size="md"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-white truncate">{req.user.displayName}</div>
                          <div className="text-[10px] text-zinc-400 truncate">@{req.user.username}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          onClick={() => handleAccept(req.user.id)}
                          disabled={processingId === req.user.id}
                          className="px-3 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1 hover:bg-zinc-200 transition active:scale-95 shadow"
                        >
                          <Check className="w-3.5 h-3.5 stroke-[3]" />
                          <span>Accept</span>
                        </button>

                        <button
                          onClick={() => handleDecline(req.user.id)}
                          disabled={processingId === req.user.id}
                          className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95"
                          title="Decline"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Outgoing Requests */}
              {outgoingRequests.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                    Sent Requests ({outgoingRequests.length})
                  </div>

                  {outgoingRequests.map((req) => (
                    <div
                      key={req.id}
                      className="p-2.5 rounded-2xl bg-zinc-950/60 border border-white/5 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Avatar
                          name={req.user.displayName}
                          username={req.user.username}
                          avatarUrl={req.user.avatarUrl}
                          size="sm"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-semibold text-zinc-300 truncate">{req.user.displayName}</div>
                          <div className="text-[10px] text-zinc-500 truncate">@{req.user.username}</div>
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/5">
                        Pending...
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 3: ADD FRIEND */}
          {activeTab === 'add' && (
            <div className="space-y-4">
              {/* Quick Add by exact Username or User ID */}
              <div className="p-3.5 rounded-2xl bg-zinc-900/90 border border-white/10 space-y-2.5">
                <label className="block text-xs font-bold text-white">
                  Send Direct Friend Request
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={searchTarget}
                    onChange={(e) => setSearchTarget(e.target.value)}
                    placeholder="Enter @username (e.g. something)"
                    className="flex-1 px-3.5 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                  <button
                    onClick={() => searchTarget.trim() && handleSendRequest(searchTarget.trim())}
                    disabled={!searchTarget.trim() || processingId === searchTarget.trim()}
                    className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 disabled:opacity-40"
                  >
                    Send
                  </button>
                </div>
              </div>

              {/* Browse & Search Users */}
              <div className="space-y-2">
                <div className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider px-1">
                  Search & Explore Users
                </div>
                <div className="relative">
                  <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => handleSearchUsers(e.target.value)}
                    placeholder="Type name or @username..."
                    className="w-full pl-9 pr-4 py-2 bg-zinc-950 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
                  />
                </div>

                <div className="space-y-1.5 pt-1">
                  {isSearching ? (
                    <div className="py-6 text-center text-xs text-zinc-500">Searching users...</div>
                  ) : foundUsers.length === 0 ? (
                    searchQuery ? (
                      <div className="py-6 text-center text-xs text-zinc-500">No users found</div>
                    ) : null
                  ) : (
                    foundUsers.map((u) => {
                      const isAlreadyFriend = friends.some((f) => f.id === u.id);
                      return (
                        <div
                          key={u.id}
                          className="p-2.5 rounded-2xl bg-zinc-900/60 border border-white/10 flex items-center justify-between gap-3"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <Avatar
                              name={u.displayName}
                              username={u.username}
                              avatarUrl={u.avatarUrl}
                              size="md"
                            />
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-white truncate">{u.displayName}</div>
                              <div className="text-[10px] text-zinc-400 truncate">@{u.username}</div>
                            </div>
                          </div>

                          {isAlreadyFriend ? (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-500/15 px-2.5 py-1 rounded-full border border-emerald-500/30">
                              Friends ✅
                            </span>
                          ) : (
                            <button
                              onClick={() => handleSendRequest(u.username)}
                              disabled={processingId === u.username}
                              className="px-3 py-1.5 bg-white text-black text-xs font-bold rounded-xl hover:bg-zinc-200 transition active:scale-95 shadow flex items-center gap-1"
                            >
                              <UserPlus className="w-3.5 h-3.5" />
                              <span>Add Friend</span>
                            </button>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

            </div>
          )}

        </div>

      </div>
    </div>
  );
};
