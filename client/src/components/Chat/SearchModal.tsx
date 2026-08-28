import React, { useState } from 'react';
import { Search, X, Calendar, User, ArrowRight, FileText } from 'lucide-react';
import { format } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { useAuth } from '../../context/AuthContext.js';
import { messageApi } from '../../services/api.js';
import { Message } from '../../types/index.js';
import { Avatar } from '../Common/Avatar.js';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, jumpToMessage } = useChat();
  const { user, partnerUser } = useAuth();

  const [query, setQuery] = useState('');
  const [selectedSender, setSelectedSender] = useState<string>('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  if (!isSearchOpen) return null;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() && selectedSender === 'all' && !startDate && !endDate) return;

    setIsSearching(true);
    setHasSearched(true);

    try {
      const data = await messageApi.searchMessages({
        query: query.trim() || undefined,
        senderId: selectedSender !== 'all' ? selectedSender : undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
      });
      setResults(data.messages);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectMessage = (messageId: string) => {
    setIsSearchOpen(false);
    jumpToMessage(messageId);
  };

  const clearFilters = () => {
    setQuery('');
    setSelectedSender('all');
    setStartDate('');
    setEndDate('');
    setResults([]);
    setHasSearched(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/85 backdrop-blur-2xl animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-[#0C101A] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 shadow-2xl overflow-hidden animate-slide-up max-h-[85vh] sm:max-h-[85vh] flex flex-col pb-safe">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2.5 sm:hidden flex-shrink-0" />

        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-[#080B12]">
          <div className="flex items-center gap-2">
            <Search className="w-5 h-5 text-white" />
            <h2 className="text-base sm:text-lg font-bold text-white">Search Messages</h2>
          </div>
          <button
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Form */}
        <form onSubmit={handleSearch} className="p-4 sm:p-5 border-b border-white/10 space-y-3 flex-shrink-0 bg-[#0C101A]">
          {/* Query Bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-3 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search keyword or message..."
              autoFocus
              className="w-full pl-10 pr-10 py-2.5 bg-black/60 border border-white/15 rounded-xl text-xs sm:text-sm text-white placeholder-zinc-500 focus:outline-none focus:border-white transition"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="absolute right-3 top-3 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
            {/* Sender Filter */}
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/10">
              <User className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <select
                value={selectedSender}
                onChange={(e) => setSelectedSender(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs w-full focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#121215]">All Senders</option>
                {user && <option value={user.id} className="bg-[#121215]">You ({user.displayName})</option>}
                {partnerUser && (
                  <option value={partnerUser.id} className="bg-[#121215]">
                    {partnerUser.displayName}
                  </option>
                )}
              </select>
            </div>

            {/* Date Filter */}
            <div className="flex items-center gap-2 bg-black/60 p-2 rounded-xl border border-white/10">
              <Calendar className="w-4 h-4 text-zinc-400 flex-shrink-0" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="bg-transparent text-zinc-200 text-xs w-full focus:outline-none"
              />
            </div>
          </div>

          {/* Submit & Reset Buttons */}
          <div className="flex items-center justify-between pt-1">
            <button
              type="button"
              onClick={clearFilters}
              className="text-xs text-zinc-400 hover:text-white transition"
            >
              Clear filters
            </button>
            <button
              type="submit"
              disabled={isSearching}
              className="px-4 py-2 bg-white text-black text-xs font-bold rounded-xl shadow-md hover:bg-zinc-200 disabled:opacity-50 transition active:scale-95"
            >
              {isSearching ? 'Searching...' : 'Search'}
            </button>
          </div>
        </form>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 custom-scrollbar max-h-60 sm:max-h-72 bg-[#121215]">
          {isSearching ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching message history...
            </div>
          ) : results.length > 0 ? (
            results.map((message) => (
              <div
                key={message.id}
                onClick={() => handleSelectMessage(message.id)}
                className="p-3 rounded-2xl bg-zinc-900 border border-white/10 hover:border-white/30 hover:bg-zinc-800 transition-all cursor-pointer group flex items-start justify-between gap-3 shadow-md"
              >
                <div className="flex items-start gap-2.5 min-w-0">
                  <Avatar
                    name={message.sender.displayName}
                    username={message.sender.username}
                    avatarUrl={message.sender.avatarUrl}
                    size="xs"
                    className="mt-0.5 flex-shrink-0"
                  />
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="text-xs font-bold text-zinc-200 truncate">
                        {message.sender.displayName}
                      </span>
                      <span className="text-[10px] text-zinc-400">
                        {format(new Date(message.createdAt), 'MMM d, HH:mm')}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-300 line-clamp-2 leading-relaxed">
                      {message.content || (
                        <span className="italic text-zinc-400 flex items-center gap-1">
                          <FileText className="w-3 h-3" /> [Attachment]
                        </span>
                      )}
                    </p>
                  </div>
                </div>

                <div className="p-1 rounded-lg text-zinc-400 group-hover:text-white group-hover:bg-white/10 transition flex-shrink-0 mt-1">
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </div>
            ))
          ) : hasSearched ? (
            <div className="py-8 text-center text-xs text-zinc-400">
              No matching messages found. Try another query or adjust date filters.
            </div>
          ) : (
            <div className="py-8 text-center text-xs text-zinc-400">
              Enter keywords to search across all messages and shared attachments.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
