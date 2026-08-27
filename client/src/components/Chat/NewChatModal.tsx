import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Sparkles, UserPlus, Users, Check, ShieldCheck } from 'lucide-react';
import { authApi } from '../../services/api.js';
import { User } from '../../types/index.js';
import { useChat } from '../../context/ChatContext.js';
import { useSocket } from '../../context/SocketContext.js';
import { Avatar } from '../Common/Avatar.js';

export const NewChatModal: React.FC = () => {
  const {
    isNewChatModalOpen,
    setIsNewChatModalOpen,
    friends,
    sendFriendRequest,
    startDirectChatWithUser,
    createGroupConversation,
    setIsFriendsModalOpen,
  } = useChat();

  const { isUserOnline } = useSocket();
  const [tab, setTab] = useState<'direct' | 'group'>('direct');

  // Search & users
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [requestSentMap, setRequestSentMap] = useState<{ [userId: string]: boolean }>({});

  // Group creation state
  const [groupName, setGroupName] = useState('');
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  useEffect(() => {
    if (!isNewChatModalOpen) {
      setSearchQuery('');
      setResults([]);
      setGroupName('');
      setSelectedUserIds([]);
      setTab('direct');
      return;
    }

    if (!searchQuery.trim()) {
      // Default to Friends list
      setResults(friends);
      return;
    }

    const timer = setTimeout(async () => {
      setIsLoading(true);
      try {
        const res = await authApi.searchUsers(searchQuery);
        setResults(res.users);
      } catch (err) {
        console.error('Failed to search users:', err);
      } finally {
        setIsLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchQuery, isNewChatModalOpen, friends]);

  const toggleSelectUser = (userId: string) => {
    setSelectedUserIds((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSendReq = async (u: User) => {
    try {
      await sendFriendRequest(u.username);
      setRequestSentMap((prev) => ({ ...prev, [u.id]: true }));
    } catch (err: any) {
      alert(err.response?.data?.error || err.message || 'Failed to send request');
    }
  };

  const handleCreateGroup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!groupName.trim()) {
      alert('Please enter a group name');
      return;
    }
    if (selectedUserIds.length === 0) {
      alert('Please select at least 1 friend to add to the group');
      return;
    }

    setIsCreatingGroup(true);
    try {
      await createGroupConversation(groupName.trim(), selectedUserIds);
    } finally {
      setIsCreatingGroup(false);
    }
  };

  if (!isNewChatModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#121215] rounded-3xl border border-white/12 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[88vh]">
        {/* Header with Mode Switcher Tabs */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between bg-[#0e0e11]">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTab('direct')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'direct'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Direct Chat</span>
            </button>

            <button
              onClick={() => setTab('group')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                tab === 'group'
                  ? 'bg-white text-black shadow'
                  : 'text-zinc-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>New Group</span>
            </button>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Group Name input (if Group tab) */}
        {tab === 'group' && (
          <div className="p-3 border-b border-white/10 bg-[#0d0d10] space-y-2">
            <label className="block text-[11px] font-semibold text-zinc-300">
              Group Subject / Name
            </label>
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-zinc-800 border border-white/15 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-zinc-300" />
              </div>
              <input
                type="text"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                placeholder="e.g. Friends Squad 🚀"
                className="flex-1 px-3 py-2 bg-zinc-900 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white"
              />
            </div>
            {selectedUserIds.length > 0 && (
              <div className="text-[10px] text-zinc-400 font-medium pt-1">
                {selectedUserIds.length} friend{selectedUserIds.length > 1 ? 's' : ''} selected
              </div>
            )}
          </div>
        )}

        {/* Search Bar */}
        <div className="p-3 border-b border-white/10 bg-[#0a0a0c]">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={tab === 'direct' ? 'Search friends or @username...' : 'Search friends to add...'}
              autoFocus
              className="w-full pl-10 pr-4 py-2 bg-zinc-900/90 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
            />
          </div>
        </div>

        {/* Privacy Info Banner */}
        <div className="px-3.5 py-2 bg-[#0d0d10] border-b border-white/5 flex items-center justify-between text-[11px] text-zinc-400">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>{tab === 'direct' ? 'Only friends can direct chat' : 'Only friends can be added to groups'}</span>
          </div>
          <button
            onClick={() => {
              setIsNewChatModalOpen(false);
              setIsFriendsModalOpen(true);
            }}
            className="text-white hover:underline font-semibold"
          >
            Manage Friends →
          </button>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar bg-[#121215]">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching users...</span>
            </div>
          ) : (tab === 'group' ? friends : results).length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-3">
              <Sparkles className="w-6 h-6 mx-auto text-zinc-600" />
              <p>
                {tab === 'group'
                  ? 'No friends available to add yet.'
                  : `No users found matching "${searchQuery}"`}
              </p>
              <button
                onClick={() => {
                  setIsNewChatModalOpen(false);
                  setIsFriendsModalOpen(true);
                }}
                className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow hover:bg-zinc-200 transition active:scale-95 flex items-center gap-1.5 mx-auto"
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Add Friends First</span>
              </button>
            </div>
          ) : (
            (tab === 'group' ? friends : results).map((u) => {
              const isSelected = selectedUserIds.includes(u.id);
              const isOnline = isUserOnline(u.id);
              const isFriend = friends.some((f) => f.id === u.id);
              const isRequestSent = requestSentMap[u.id];

              if (tab === 'group') {
                return (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => toggleSelectUser(u.id)}
                    className={`w-full p-2.5 rounded-2xl border transition flex items-center justify-between group text-left ${
                      isSelected
                        ? 'bg-zinc-800 border-white/40 shadow'
                        : 'hover:bg-white/5 border-transparent hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar
                        name={u.displayName}
                        username={u.username}
                        avatarUrl={u.avatarUrl}
                        size="md"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-white truncate">
                          {u.displayName}
                        </div>
                        <div className="text-[11px] text-zinc-400 truncate">@{u.username}</div>
                      </div>
                    </div>

                    <div
                      className={`w-5 h-5 rounded-lg border flex items-center justify-center transition ${
                        isSelected
                          ? 'bg-white border-white text-black'
                          : 'border-zinc-600 group-hover:border-white/40'
                      }`}
                    >
                      {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                    </div>
                  </button>
                );
              }

              return (
                <div
                  key={u.id}
                  className="w-full p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition flex items-center justify-between group text-left"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <Avatar
                      name={u.displayName}
                      username={u.username}
                      avatarUrl={u.avatarUrl}
                      size="md"
                      status={isOnline ? 'online' : 'offline'}
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate group-hover:text-zinc-100">
                        {u.displayName}
                      </div>
                      <div className="text-[11px] text-zinc-400 truncate">@{u.username}</div>
                      {u.customStatus && (
                        <div className="text-[10px] text-zinc-500 truncate mt-0.5">{u.customStatus}</div>
                      )}
                    </div>
                  </div>

                  {isFriend ? (
                    <button
                      onClick={() => startDirectChatWithUser(u)}
                      className="px-3.5 py-1.5 rounded-xl bg-white text-black text-xs font-bold flex items-center gap-1.5 hover:bg-zinc-200 transition active:scale-95 shadow"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                      <span>Chat</span>
                    </button>
                  ) : isRequestSent ? (
                    <span className="text-[10px] font-semibold text-zinc-400 bg-white/5 px-2.5 py-1 rounded-full border border-white/10">
                      Request Sent
                    </span>
                  ) : (
                    <button
                      onClick={() => handleSendReq(u)}
                      className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition active:scale-95 border border-white/10 flex items-center gap-1"
                      title="Send Friend Request"
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

        {/* Create Group Footer (if Group tab) */}
        {tab === 'group' && (
          <div className="p-3 border-t border-white/10 bg-[#0d0d10] flex justify-end">
            <button
              onClick={handleCreateGroup}
              disabled={isCreatingGroup || !groupName.trim() || selectedUserIds.length === 0}
              className="px-4 py-2.5 bg-white text-black hover:bg-zinc-200 disabled:opacity-40 font-bold rounded-xl text-xs flex items-center gap-2 transition active:scale-95 shadow"
            >
              {isCreatingGroup ? (
                <div className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Users className="w-4 h-4" />
                  <span>Create Group ({selectedUserIds.length})</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
