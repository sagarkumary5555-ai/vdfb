import React, { useState, useEffect } from 'react';
import { Search, X, Calendar, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { useChat } from '../../context/ChatContext.js';
import { messageApi } from '../../services/api.js';
import { Message } from '../../types/index.js';

export const SearchModal: React.FC = () => {
  const { isSearchOpen, setIsSearchOpen, jumpToMessage } = useChat();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Message[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    if (!isSearchOpen) {
      setQuery('');
      setResults([]);
    }
  }, [isSearchOpen]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    try {
      const data = await messageApi.searchMessages({ query: query.trim() });
      setResults(data.messages);
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-8 sm:pt-20 p-3 sm:p-4 bg-black/80 backdrop-blur-lg animate-fade-in select-none">
      <div className="relative w-full max-w-xl glass-dropdown rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-slide-down">
        {/* Search Input Bar */}
        <form onSubmit={handleSearch} className="p-3.5 sm:p-4 border-b border-white/10 flex items-center gap-2.5">
          <Search className="w-5 h-5 text-slate-400 flex-shrink-0" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search messages..."
            autoFocus
            className="flex-1 bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="text-slate-400 hover:text-slate-200 text-xs px-1"
            >
              Clear
            </button>
          )}
          <button
            type="button"
            onClick={() => setIsSearchOpen(false)}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 active:scale-95"
          >
            <X className="w-4 h-4" />
          </button>
        </form>

        {/* Results List */}
        <div className="max-h-[65vh] overflow-y-auto p-2.5 sm:p-3 space-y-1.5">
          {isSearching ? (
            <div className="py-12 text-center text-xs text-slate-400">
              <div className="w-5 h-5 border-2 border-brand-pink border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              Searching messages...
            </div>
          ) : results.length > 0 ? (
            results.map((msg) => (
              <button
                key={msg.id}
                onClick={() => {
                  setIsSearchOpen(false);
                  jumpToMessage(msg.id);
                }}
                className="w-full text-left p-3 rounded-2xl bg-white/5 hover:bg-white/10 border border-white/5 transition flex items-center justify-between group active:scale-[0.99]"
              >
                <div className="space-y-1 flex-1 pr-3 truncate">
                  <div className="flex items-center gap-2 text-xs text-slate-300">
                    <span className="font-semibold text-white">{msg.sender.displayName}</span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-[11px] text-slate-400">
                      <Calendar className="w-3 h-3" />
                      {format(new Date(msg.createdAt), 'MMM d, HH:mm')}
                    </span>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-200 truncate">
                    {msg.content || (msg.attachments.length ? `[Attachment: ${msg.attachments[0].originalName}]` : '')}
                  </p>
                </div>
                <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-brand-pink group-hover:translate-x-0.5 transition-all flex-shrink-0" />
              </button>
            ))
          ) : query ? (
            <div className="py-12 text-center text-xs text-slate-400">
              No matching messages found for "{query}"
            </div>
          ) : (
            <div className="py-10 text-center text-xs text-slate-400">
              Type keyword and press search to find past messages.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
