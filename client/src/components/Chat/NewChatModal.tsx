import React, { useState, useEffect } from 'react';
import { Search, X, MessageSquare, Sparkles, UserPlus } from 'lucide-react';
import { authApi } from '../../services/api.js';
import { User } from '../../types/index.js';
import { useChat } from '../../context/ChatContext.js';
import { Avatar } from '../Common/Avatar.js';

export const NewChatModal: React.FC = () => {
  const { isNewChatModalOpen, setIsNewChatModalOpen, startDirectChatWithUser } = useChat();
  const [searchQuery, setSearchQuery] = useState('');
  const [results, setResults] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!isNewChatModalOpen) {
      setSearchQuery('');
      setResults([]);
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
  }, [searchQuery, isNewChatModalOpen]);

  if (!isNewChatModalOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-md animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-[#121214] rounded-3xl border border-white/10 shadow-2xl overflow-hidden animate-slide-up flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-4 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-white/10 text-white">
              <UserPlus className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white tracking-tight">New Message</h2>
              <p className="text-[10px] text-zinc-400">Search any friend by @username</p>
            </div>
          </div>

          <button
            onClick={() => setIsNewChatModalOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-white/10 bg-[#0a0a0c]">
          <div className="relative">
            <Search className="w-4 h-4 text-zinc-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search people (@username)..."
              autoFocus
              className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/80 border border-white/10 rounded-2xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30 transition"
            />
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
          {isLoading ? (
            <div className="py-8 text-center text-xs text-zinc-400 flex flex-col items-center justify-center gap-2">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              <span>Searching users...</span>
            </div>
          ) : results.length === 0 ? (
            <div className="py-12 text-center text-xs text-zinc-500 space-y-2">
              <Sparkles className="w-6 h-6 mx-auto text-zinc-600" />
              <p>No users found matching "{searchQuery}"</p>
            </div>
          ) : (
            results.map((u) => (
              <button
                key={u.id}
                onClick={() => startDirectChatWithUser(u)}
                className="w-full p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition flex items-center justify-between group text-left"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <Avatar
                    name={u.displayName}
                    username={u.username}
                    avatarUrl={u.avatarUrl}
                    size="md"
                    status={u.lastSeen ? 'online' : 'offline'}
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

                <div className="p-2 rounded-xl bg-white/5 text-zinc-400 group-hover:bg-white group-hover:text-black transition">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
