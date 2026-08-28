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
    <nav className="hidden md:flex flex-col justify-between items-center xl:items-start w-16 lg:w-18 xl:w-60 h-[100dvh] bg-black border-r border-white/10 py-6 px-3 xl:px-4 select-none flex-shrink-0 z-30 transition-all duration-200">
      {/* Top: ChatUs Brand Logo */}
      <div className="flex flex-col items-center xl:items-start gap-7 w-full">
        {/* Brand Logo & Name */}
        <button
          onClick={() => {}}
          className="flex items-center gap-3 px-2 py-1 text-white hover:opacity-80 transition group"
          title="ChatUs PRO"
        >
          <div className="w-9 h-9 rounded-2xl bg-white text-black flex items-center justify-center font-black text-sm tracking-tighter shadow-md group-hover:scale-105 transition flex-shrink-0">
            CU
          </div>
          <span className="hidden xl:inline text-xl font-black tracking-tight text-white">
            ChatUs <span className="text-[10px] text-black font-extrabold uppercase bg-white px-1.5 py-0.5 rounded ml-1">PRO</span>
          </span>
        </button>

        {/* Navigation Action Links */}
        <div className="flex flex-col items-center xl:items-start gap-1.5 w-full">
          {/* Home */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Home"
          >
            <Home className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Home</span>
          </button>

          {/* Search */}
          <button
            onClick={() => setIsSearchOpen(true)}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Search"
          >
            <Search className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Search</span>
          </button>

          {/* Explore / Moments */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Explore"
          >
            <Compass className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Explore</span>
          </button>

          {/* Reels / Clips */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Reels"
          >
            <Film className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Reels</span>
          </button>

          {/* Messages (Active highlight in B&W) */}
          <button
            onClick={() => {}}
            className="w-full relative p-3 xl:px-3.5 xl:py-3 rounded-2xl text-black bg-white transition active:scale-95 shadow-md flex items-center gap-4 group font-bold"
            title="Messages"
          >
            <div className="relative flex-shrink-0">
              <Send className="w-5 h-5 fill-black stroke-[1.8] text-black" />
              {unreadTotal > 0 && (
                <span className="absolute -top-1.5 -right-1.5 px-1.5 min-w-4 h-4 rounded-full bg-black text-[10px] font-black text-white flex items-center justify-center border border-white">
                  {unreadTotal > 9 ? '9+' : unreadTotal}
                </span>
              )}
            </div>
            <span className="hidden xl:inline text-sm font-bold text-black">Messages</span>
          </button>

          {/* Notifications */}
          <button
            onClick={() => {}}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Notifications"
          >
            <Heart className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Notifications</span>
          </button>

          {/* Create (+) */}
          <button
            onClick={() => setIsNewChatModalOpen(true)}
            className="w-full p-3 xl:px-3.5 xl:py-3 rounded-2xl text-zinc-400 hover:text-white hover:bg-white/10 transition active:scale-95 flex items-center gap-4 group"
            title="Create New Message / Group"
          >
            <PlusSquare className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
            <span className="hidden xl:inline text-sm font-semibold">Create</span>
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
          title="Settings & Preferences"
        >
          <Menu className="w-5 h-5 stroke-[1.8] group-hover:scale-105 transition flex-shrink-0" />
          <span className="hidden xl:inline text-sm font-medium">More</span>
        </button>
      </div>
    </nav>
  );
};
