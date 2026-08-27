import React, { useState } from 'react';
import {
  Search,
  Heart,
  Sparkles,
  Smile,
  Cat,
  ThumbsUp,
  X,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StickerAndEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSendSticker: (stickerText: string) => void;
  onClose: () => void;
}

interface LuxurySticker {
  id: string;
  badge: string;
  name: string;
  category: 'hype' | 'laugh' | 'love' | 'party' | 'gaming';
  content: string;
}

const LUXURY_STICKERS: LuxurySticker[] = [
  // Hype & Fire
  { id: 's_fire', badge: '🔥', name: 'Pure Fire', category: 'hype', content: '🔥 That is absolute fire! ⚡' },
  { id: 's_sparkle', badge: '✨', name: 'Good Vibes', category: 'hype', content: '✨ Sending good vibes only 🌟' },
  { id: 's_gem', badge: '💎', name: 'Diamond VIP', category: 'hype', content: '💎 ChatUs VIP Status 💎' },
  { id: 's_mindblown', badge: '🤯', name: 'Mind Blown', category: 'hype', content: '🤯 My mind is totally blown!' },
  { id: 's_rocket', badge: '🚀', name: 'To The Moon', category: 'hype', content: '🚀 To the moon! Hustle mode ⚡' },
  { id: 's_star', badge: '⭐', name: 'Rockstar', category: 'hype', content: '⭐ You are a true star! ⭐' },

  // Laugh & Fun
  { id: 's_rofl', badge: '🤣', name: 'ROFL Laugh', category: 'laugh', content: '🤣 Literally dead laughing!' },
  { id: 's_joy', badge: '😂', name: 'Tears of Joy', category: 'laugh', content: '😂 Too funny, cannot stop laughing!' },
  { id: 's_zany', badge: '🤪', name: 'Crazy Fun', category: 'laugh', content: '🤪 Going crazy with excitement!' },
  { id: 's_cool', badge: '😎', name: 'Super Cool', category: 'laugh', content: '😎 Staying super cool & calm 🧊' },
  { id: 's_popcorn', badge: '🍿', name: 'Popcorn Chill', category: 'laugh', content: '🍿 Sitting back with my popcorn' },
  { id: 's_skull', badge: '💀', name: 'I Am Dead', category: 'laugh', content: '💀 I cannot breathe, dying here!' },

  // Love & Romance
  { id: 's_redheart', badge: '❤️', name: 'Red Heart', category: 'love', content: '❤️ Much love & respect 🤝' },
  { id: 's_hearteyes', badge: '😍', name: 'Heart Eyes', category: 'love', content: '😍 Absolutely loving this!' },
  { id: 's_heartarrow', badge: '💘', name: 'Cupid Love', category: 'love', content: '💘 Straight to the heart!' },
  { id: 's_hug', badge: '🫂', name: 'Warm Hug', category: 'love', content: '🫂 Big warm hug for you!' },
  { id: 's_rose', badge: '🌹', name: 'Red Rose', category: 'love', content: '🌹 A beautiful rose for you ✨' },
  { id: 's_sparkheart', badge: '💖', name: 'Sparkle Heart', category: 'love', content: '💖 You make everything sparkle!' },

  // Party & Celebration
  { id: 's_partyface', badge: '🥳', name: 'Party Time', category: 'party', content: '🥳 Let the party begin! 🎉' },
  { id: 's_cheers', badge: '🥂', name: 'Cheers', category: 'party', content: '🥂 Big cheers to this moment! 🍾' },
  { id: 's_clap', badge: '👏', name: 'Big Applause', category: 'party', content: '👏 Huge round of applause! 👏' },
  { id: 's_thumbsup', badge: '👍', name: 'Thumbs Up', category: 'party', content: '👍 100% approved & agree!' },
  { id: 's_gift', badge: '🎁', name: 'Surprise Gift', category: 'party', content: '🎁 A special surprise gift for you!' },
  { id: 's_party', badge: '🎉', name: 'Celebrate', category: 'party', content: '🎉 Massive congratulations! 🎊' },

  // Gaming & Victory
  { id: 's_game', badge: '🎮', name: 'Gaming Zone', category: 'gaming', content: '🎮 Game on! Let\'s do this 🕹️' },
  { id: 's_trophy', badge: '🏆', name: 'Big Win', category: 'gaming', content: '🏆 Champion! Massive victory 🏆' },
  { id: 's_peace', badge: '✌️', name: 'Victory Peace', category: 'gaming', content: '✌️ Peace & victory always!' },
  { id: 's_cat', badge: '🐱', name: 'Cute Kitty', category: 'gaming', content: '🐱 Sending you cute purrs 🐾' },
  { id: 's_100', badge: '💯', name: '100% Real', category: 'gaming', content: '💯 Keep it 100% real always!' },
  { id: 's_crown', badge: '👑', name: 'True King', category: 'gaming', content: '👑 True king behavior right here!' },
];

const EMOJI_SETS = [
  {
    id: 'faces',
    name: 'Smiles & Expressions',
    icon: Smile,
    emojis: [
      '😊', '😁', '😂', '🤣', '🥹', '🥺', '😇', '😋', '😛', '😜', '🤪', '🤩',
      '🥳', '🤗', '😌', '🤤', '😴', '🤠', '😎', '🤓', '🧐', '🤭', '🤫', '🤔',
      '🥵', '🥶', '🤯', '😭', '😤', '🫣', '🫡', '🫠', '🫢', '🥱', '🤐', '😈',
    ],
  },
  {
    id: 'vibes',
    name: 'Magic & Energy',
    icon: Sparkles,
    emojis: [
      '🔥', '✨', '🌟', '⭐', '💫', '🌙', '☀️', '🌈', '⚡', '💎', '🔮', '🪄',
      '🧸', '🎁', '🎈', '🎉', '🎊', '🥂', '🍾', '☕', '🍿', '🍰', '🍫', '🚀',
    ],
  },
  {
    id: 'gestures',
    name: 'Hands & Gestures',
    icon: ThumbsUp,
    emojis: [
      '👍', '👎', '👏', '🙌', '🫶', '👐', '🤲', '🤝', '🙏', '✌️', '🤞', '🤟',
      '🤘', '🤙', '👈', '👉', '👆', '👇', '☝️', '🖐️', '✋', '👌', '🫰', '🤌',
    ],
  },
  {
    id: 'love',
    name: 'Hearts & Symbols',
    icon: Heart,
    emojis: [
      '🤍', '🖤', '❤️', '💖', '💘', '💝', '💗', '💓', '💞', '💕', '💌', '❣️',
      '💋', '🫂', '💍', '💐', '🌹', '🥀', '🌺', '🌸', '🌷', '🌻', '🪻', '🪷',
    ],
  },
  {
    id: 'animals',
    name: 'Pets & Nature',
    icon: Cat,
    emojis: [
      '🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🦄', '🦋', '🐥', '🐧',
      '🦔', '🐾', '🍀', '🍓', '🍑', '🍒', '🪴', '🍁', '🍂', '🍄', '🌼', '🌴',
    ],
  },
];

export const StickerAndEmojiPicker: React.FC<StickerAndEmojiPickerProps> = ({
  onSelectEmoji,
  onSendSticker,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
  const [activeCategory, setActiveCategory] = useState<string>('faces');
  const [stickerCategory, setStickerCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStickerClick = (sticker: LuxurySticker) => {
    confetti({
      particleCount: 30,
      spread: 65,
      origin: { y: 0.85 },
      colors: ['#ffffff', '#60a5fa', '#f43f5e', '#fbbf24'],
    });
    onSendSticker(sticker.content);
    onClose();
  };

  const filteredStickers = LUXURY_STICKERS.filter((s) => {
    const matchCategory = stickerCategory === 'all' || s.category === stickerCategory;
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.content.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      {/* Mobile Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 w-full sm:absolute sm:inset-x-auto sm:bottom-16 sm:left-4 sm:w-[380px] bg-[#121215] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 shadow-2xl overflow-hidden animate-slide-up select-none flex flex-col max-h-[65vh] sm:max-h-[420px]">
        {/* Mobile Pull Handle */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden flex-shrink-0" />

        {/* Header Bar */}
        <div className="p-3 border-b border-white/10 bg-[#0e0e11] space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Tabs: Stickers vs Emojis */}
            <div className="flex items-center gap-1 p-1 bg-black/60 rounded-2xl border border-white/10 flex-1">
              <button
                type="button"
                onClick={() => setActiveTab('stickers')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'stickers'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Zap className="w-3.5 h-3.5" />
                <span>3D Stickers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('emojis')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'emojis'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>Emojis</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                activeTab === 'stickers'
                  ? 'Search stickers (fire, laugh, vip, love)...'
                  : 'Search emojis...'
              }
              className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          {/* TAB 1: 3D LUXURY STICKERS */}
          {activeTab === 'stickers' && (
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'all', name: 'All' },
                  { id: 'hype', name: '🔥 Hype' },
                  { id: 'laugh', name: '😂 Laugh' },
                  { id: 'love', name: '❤️ Love' },
                  { id: 'party', name: '🎉 Party' },
                  { id: 'gaming', name: '🎮 Gaming' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setStickerCategory(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                      stickerCategory === c.id
                        ? 'bg-white text-black shadow'
                        : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* 3D Stickers Grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker)}
                    className="p-3 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/40 hover:bg-zinc-800 transition-all duration-150 active:scale-95 text-left group flex items-center gap-3 shadow-md"
                  >
                    <span className="text-3xl group-hover:scale-125 transition-transform duration-200 flex-shrink-0 filter drop-shadow-md">
                      {sticker.badge}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-white truncate group-hover:text-zinc-100">
                        {sticker.name}
                      </div>
                      <div className="text-[10px] text-zinc-400 truncate mt-0.5">
                        {sticker.category}
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: EMOJIS GRID */}
          {activeTab === 'emojis' && (
            <div className="space-y-3">
              {/* Sub-Category Switcher */}
              <div className="flex items-center gap-1 overflow-x-auto pb-1">
                {EMOJI_SETS.map((cat) => {
                  const Icon = cat.icon;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setActiveCategory(cat.id)}
                      className={`p-2 rounded-xl text-xs transition flex items-center gap-1 flex-shrink-0 ${
                        activeCategory === cat.id
                          ? 'bg-white/20 text-white border border-white/30 font-semibold'
                          : 'text-zinc-400 hover:text-zinc-200 hover:bg-white/5'
                      }`}
                      title={cat.name}
                    >
                      <Icon className="w-4 h-4" />
                    </button>
                  );
                })}
              </div>

              {/* Emojis Layout */}
              {EMOJI_SETS.filter(
                (set) =>
                  !searchQuery ||
                  set.id === activeCategory ||
                  set.name.toLowerCase().includes(searchQuery.toLowerCase())
              ).map((set) => {
                if (searchQuery && !set.name.toLowerCase().includes(searchQuery.toLowerCase())) {
                  return null;
                }
                if (!searchQuery && set.id !== activeCategory) {
                  return null;
                }

                return (
                  <div key={set.id} className="space-y-1.5">
                    <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-wider">
                      {set.name}
                    </div>
                    <div className="grid grid-cols-7 sm:grid-cols-8 gap-1">
                      {set.emojis.map((emoji) => (
                        <button
                          key={emoji}
                          type="button"
                          onClick={() => onSelectEmoji(emoji)}
                          className="w-10 h-10 sm:w-9 sm:h-9 rounded-xl hover:bg-white/15 flex items-center justify-center text-2xl sm:text-xl active:scale-90 transition-all duration-150"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
};
