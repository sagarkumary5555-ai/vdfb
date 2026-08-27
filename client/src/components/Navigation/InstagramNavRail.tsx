import React from 'react';
import {
  Home,
  Search,
  Compass,
  Film,
  Send,
  Heart,
  PlusSquare,
  Menu,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.js';
import { useChat } from '../../context/ChatContext.js';
import { Avatar } from '../Common/Avatar.js';

export const InstagramNavRail: React.FC = () => {
  const { user } = useAuth();
  const {
    conversations,
    setIsNewChatModalOpen,
    setIsSearchOpen,
    setIsSettingsOpen,
  } = useChat();

  const unreadTotal = conversations.reduce((acc, c) => acc + (c.unreadCount || 0), 0);

  return (
    <nav className="hidden md:flex flex-col justify-between items-center xl:items-start w-16 lg:w-18 xl:w-60 h-[100dvh] bg-black border-r border-[#262626] py-6 px-3 xl:px-4 select-none flex-shrink-0 z-30 transition-all duration-200">
      {/* Top: ChatUs Brand Logo */}
      <div className="flex flex-col items-center xl:items-start gap-7 w-full">
        {/* Brand Logo & Name */}
        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-2 py-1 text-white hover:opacity-80 transition group"
          title="ChatUs"
        >
          <div className="w-8 h-8 rounded-xl bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter shadow-md group-hover:scale-105 transition flex-shrink-0">
            CU
          </div>
          <span className="hidden xl:inline text-2xl font-bold tracking-tight text-white font-serif italic">
            ChatUs
          </span>
        </button>

        {/* Navigation Action Links */}
        <div className="flex flex-col items-center xl:items-start gap-2 w-full">
          {/* Home */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Home"
          >
            <Home className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Home</span>
          </button>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Search"
          >
            <Search className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Search</span>
          </button>

          {/* Explore / Moments */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Explore"
          >
            <Compass className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Explore</span>
          </button>

          {/* Reels / Clips */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Reels"
          >
            <Film className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Reels</span>
          </button>

          {/* Messages (Active highlight) */}
          <button
            onClick={() => {}}
            className="w-full relative p-3 xl:px-3.5 xl:py-3 rounded-2xl text-white bg-white/15 border border-white/20 transition active:scale-95 shadow-md flex items-center gap-4 group"
            title="Messages"
          >
            <div className="relative flex-shrink-0">
              <Send className="w-6 h-6 fill-white stroke-[1.8]" />
              {unreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-4 h-4 rounded-full bg-[#0095f6] text-[10px] font-black text-white flex items-center justify-center border border-black">
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </span>
              )}
            </div>
            <span className="hidden xl:inline text-sm font-bold text-white">Messages</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Notifications"
          >
            <Heart className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Notifications</span>
          </button>

          {/* Create (+) */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Create New Message / Group"
          >
            <PlusSquare className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-medium">Create</span>
          </button>
        </div>
      </div>

      {/* Bottom: Profile & Settings Menu */}
      <div className="flex flex-col items-center xl:items-start gap-2 w-full">
        {/* User Profile Avatar */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full p-2.5 xl:px-3 xl:py-2.5 rounded-2xl hover:bg-white/10 transition active:scale-95 flex items-center gap-3.5 group"
          title={`Profile (@${user?.username})`}
        >
          <div className="p-0.5 rounded-full ring-2 ring-transparent group-hover:ring-white transition flex-shrink-0">
            <Avatar
              name={user?.displayName || 'User'}
              username={user?.username}
              avatarUrl={user?.avatarUrl}
              size="sm"
              className="w-6 h-6"
            />
          </div>
          <span className="hidden xl:inline text-sm font-medium text-zinc-200 truncate">
            Profile
          </span>
        </button>

        {/* More Settings Menu */}
        <button
          onClick={() => setIsSettingsOpen(true)}
          className="w-full p-2.5 xl:px-3.5 xl:py-2.5 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
          title="Settings & More"
        >
          <Menu className="w-6 h-6 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
          <span className="hidden xl:inline text-sm font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};
