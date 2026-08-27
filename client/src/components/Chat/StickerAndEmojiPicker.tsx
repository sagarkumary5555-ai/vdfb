import React, { useState } from 'react';
import {
  Search,
  Heart,
  Sparkles,
  Smile,
  Cat,
  ThumbsUp,
  X,
  Gift,
  Film,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StickerAndEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSendSticker: (stickerText: string) => void;
  onClose: () => void;
}

interface StickerItem {
  id: string;
  name: string;
  badge: string;
  content: string;
  caption: string;
}

interface GifItem {
  id: string;
  title: string;
  url: string;
  previewUrl: string;
  category: string;
}

const CUSTOM_STICKERS: StickerItem[] = [
  { id: 'vip_1', name: 'ChatUs VIP', badge: '💎', content: '💎 ChatUs VIP Member 💎', caption: 'VIP Status' },
  { id: 'fire_1', name: 'Pure Fire', badge: '🔥', content: '🔥 That is absolute fire! ⚡', caption: 'Incredible' },
  { id: 'spark_1', name: 'Good Vibes', badge: '✨', content: '✨ Sending good vibes only 🌟', caption: 'Positive Vibes' },
  { id: 'win_1', name: 'Big Win', badge: '🏆', content: '🏆 That was a massive win! 🏆', caption: 'Champion' },
  { id: 'talk_1', name: 'Let\'s Talk', badge: '💬', content: '💬 Hey, let\'s catch up! 💬', caption: 'Quick Chat' },
  { id: 'cool_1', name: 'Super Chill', badge: '🕶️', content: '🕶️ Staying super cool & calm 🧊', caption: 'Chill Mood' },
  { id: 'cheer_1', name: 'Celebrate', badge: '🎉', content: '🎉 Big congratulations! Let\'s celebrate! 🥳', caption: 'Party Time' },
  { id: 'love_1', name: 'Big Love', badge: '❤️', content: '❤️ Much love & respect 🤝 ❤️', caption: 'Respect' },
  { id: 'hustle_1', name: 'Grind Time', badge: '🚀', content: '🚀 To the moon! Hustle never stops ⚡', caption: 'Hustle' },
  { id: 'night_1', name: 'Good Night', badge: '🌙', content: '🌙 Goodnight & take care ⭐ 😴', caption: 'Goodnight' },
  { id: 'cozy_1', name: 'Coffee Break', badge: '☕', content: '☕ Coffee break time ✨', caption: 'Coffee Time' },
  { id: 'star_1', name: 'Rockstar', badge: '⭐', content: '⭐ You are a true star! ⭐', caption: 'Rockstar' },
];

const CURATED_GIFS: GifItem[] = [
  // Trending / Reactions
  {
    id: 'g_trend_1',
    title: 'Mind Blown',
    category: 'trending',
    url: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/26ufdipQqU2lhNA4g/200w.gif',
  },
  {
    id: 'g_trend_2',
    title: 'Laughing Cat',
    category: 'trending',
    url: 'https://media.giphy.com/media/ICOgUNjpvO0PC/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/ICOgUNjpvO0PC/200w.gif',
  },
  {
    id: 'g_trend_3',
    title: 'Awesome Celebration',
    category: 'trending',
    url: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/artj92V8o75VPL7AeQ/200w.gif',
  },
  {
    id: 'g_trend_4',
    title: 'Thumbs Up Cool',
    category: 'trending',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/111ebonMs90YLu/200w.gif',
  },
  // Reactions / Laugh
  {
    id: 'g_react_1',
    title: 'Popcorn Chill',
    category: 'reactions',
    url: 'https://media.giphy.com/media/hVTouq08miyGT52UKL/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/hVTouq08miyGT52UKL/200w.gif',
  },
  {
    id: 'g_react_2',
    title: 'Excited Dog',
    category: 'reactions',
    url: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3o7abKhOpu0NwenH3O/200w.gif',
  },
  {
    id: 'g_react_3',
    title: 'Confused John Travolta',
    category: 'reactions',
    url: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/g01ZnwAUvutuK8GIQn/200w.gif',
  },
  {
    id: 'g_react_4',
    title: 'Shocked Face',
    category: 'reactions',
    url: 'https://media.giphy.com/media/5VKbvrjxpVJCM/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/5VKbvrjxpVJCM/200w.gif',
  },
  // Love & Vibes
  {
    id: 'g_love_1',
    title: 'Sending Hearts',
    category: 'love',
    url: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/26FLdmIp6wJr91JAI/200w.gif',
  },
  {
    id: 'g_love_2',
    title: 'Bear Hug',
    category: 'love',
    url: 'https://media.giphy.com/media/l8ooTpH62ae15px6n8/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/l8ooTpH62ae15px6n8/200w.gif',
  },
  {
    id: 'g_love_3',
    title: 'Sparkle Hearts',
    category: 'love',
    url: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/M90mJvfWfd5mbUuULX/200w.gif',
  },
  // Anime & Gaming
  {
    id: 'g_anime_1',
    title: 'Anime Dance Party',
    category: 'anime',
    url: 'https://media.giphy.com/media/StqZt2cIl0ekw/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/StqZt2cIl0ekw/200w.gif',
  },
  {
    id: 'g_anime_2',
    title: 'Gamer Victory',
    category: 'anime',
    url: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/3oKIPnAiaMCws8nOsE/200w.gif',
  },
  {
    id: 'g_anime_3',
    title: 'Epic Anime Powerup',
    category: 'anime',
    url: 'https://media.giphy.com/media/cb9aF9tzoRjgQ/giphy.gif',
    previewUrl: 'https://media.giphy.com/media/cb9aF9tzoRjgQ/200w.gif',
  },
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
  const [activeTab, setActiveTab] = useState<'gifs' | 'stickers' | 'emojis'>('gifs');
  const [activeCategory, setActiveCategory] = useState<string>('faces');
  const [gifCategory, setGifCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStickerClick = (sticker: StickerItem) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#ffffff', '#a1a1aa', '#52525b'],
    });
    onSendSticker(sticker.content);
    onClose();
  };

  const handleGifClick = (gif: GifItem) => {
    onSendSticker(`[GIF:${gif.url}]`);
    onClose();
  };

  const filteredStickers = CUSTOM_STICKERS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredGifs = CURATED_GIFS.filter((g) => {
    const matchCategory = gifCategory === 'all' || g.category === gifCategory;
    const matchSearch =
      !searchQuery.trim() ||
      g.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCategory && matchSearch;
  });

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs sm:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 w-full sm:absolute sm:inset-x-auto sm:bottom-16 sm:left-4 sm:w-[400px] bg-[#121215] rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/15 shadow-2xl overflow-hidden animate-slide-up select-none flex flex-col max-h-[65vh] sm:max-h-[420px]">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden flex-shrink-0" />

        {/* Header Bar with Search and Tab Switcher */}
        <div className="p-3 border-b border-white/10 bg-[#0e0e11] space-y-2.5 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Tabs: GIFs, Stickers, Emojis */}
            <div className="flex items-center gap-1 p-1 bg-black/60 rounded-2xl border border-white/10 flex-1">
              <button
                type="button"
                onClick={() => setActiveTab('gifs')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'gifs'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Film className="w-3.5 h-3.5" />
                <span>GIFs</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('stickers')}
                className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'stickers'
                    ? 'bg-white text-black shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Stickers</span>
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
                activeTab === 'gifs'
                  ? 'Search GIFs (reactions, anime, party)...'
                  : activeTab === 'stickers'
                  ? 'Search stickers...'
                  : 'Search emojis...'
              }
              className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Body: GIFs, Stickers or Emojis */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          {/* TAB 1: GIFs BROWSER */}
          {activeTab === 'gifs' && (
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'all', name: 'All' },
                  { id: 'trending', name: '🔥 Trending' },
                  { id: 'reactions', name: '😂 Laugh' },
                  { id: 'love', name: '❤️ Love' },
                  { id: 'anime', name: '🎮 Anime' },
                ].map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => setGifCategory(c.id)}
                    className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition flex-shrink-0 ${
                      gifCategory === c.id
                        ? 'bg-white text-black shadow'
                        : 'bg-zinc-900 border border-white/10 text-zinc-400 hover:text-white'
                    }`}
                  >
                    {c.name}
                  </button>
                ))}
              </div>

              {/* GIFs Masonry/Grid */}
              <div className="grid grid-cols-2 gap-2">
                {filteredGifs.map((gif) => (
                  <button
                    key={gif.id}
                    type="button"
                    onClick={() => handleGifClick(gif)}
                    className="relative rounded-2xl overflow-hidden bg-zinc-900 border border-white/10 hover:border-white/40 group aspect-[4/3] focus:outline-none shadow-md transition-all duration-200 active:scale-95"
                  >
                    <img
                      src={gif.previewUrl}
                      alt={gif.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                      <span className="text-[10px] font-bold text-white truncate">
                        {gif.title}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 2: STICKERS GRID */}
          {activeTab === 'stickers' && (
            <div className="grid grid-cols-2 gap-2">
              {filteredStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => handleStickerClick(sticker)}
                  className="p-3 rounded-2xl bg-[#18181b] border border-white/10 hover:border-white/30 hover:bg-white/5 transition-all duration-200 text-left group flex items-center gap-2.5 active:scale-95 shadow-md"
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">
                    {sticker.badge}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-zinc-100 group-hover:text-white truncate">
                      {sticker.name}
                    </div>
                    <div className="text-[10px] text-zinc-400 group-hover:text-zinc-300 truncate">
                      {sticker.caption}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* TAB 3: EMOJIS GRID */}
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
