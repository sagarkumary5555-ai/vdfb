import React, { useState } from 'react';
import {
  Search,
  Heart,
  Sparkles,
  Smile,
  Cat,
  ThumbsUp,
  X,
  Film,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface StickerAndEmojiPickerProps {
  onSelectEmoji: (emoji: string) => void;
  onSendSticker: (stickerText: string) => void;
  onClose: () => void;
}

interface AnimatedSticker {
  id: string;
  name: string;
  category: 'trending' | 'laugh' | 'love' | 'party' | 'gaming';
  url: string;
}

const VERIFIED_ANIMATED_STICKERS: AnimatedSticker[] = [
  // Trending / Hype
  {
    id: 's_fire',
    name: 'Pure Fire',
    category: 'trending',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Travel%20and%20places/Fire.png',
  },
  {
    id: 's_sparkle',
    name: 'Sparkles',
    category: 'trending',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Sparkles.png',
  },
  {
    id: 's_gem',
    name: 'Diamond VIP',
    category: 'trending',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Objects/Gem%20Stone.png',
  },
  {
    id: 's_mindblown',
    name: 'Mind Blown',
    category: 'trending',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Exploding%20Head.png',
  },
  // Laugh & Fun
  {
    id: 's_rofl',
    name: 'ROFL Laugh',
    category: 'laugh',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Rolling%20on%20the%20Floor%20Laughing.png',
  },
  {
    id: 's_joy',
    name: 'Tears of Joy',
    category: 'laugh',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Face%20with%20Tears%20of%20Joy.png',
  },
  {
    id: 's_zany',
    name: 'Crazy Fun',
    category: 'laugh',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Zany%20Face.png',
  },
  {
    id: 's_cool',
    name: 'Super Cool',
    category: 'laugh',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Sunglasses.png',
  },
  // Love & Romance
  {
    id: 's_redheart',
    name: 'Red Heart',
    category: 'love',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Red%20Heart.png',
  },
  {
    id: 's_hearteyes',
    name: 'Heart Eyes',
    category: 'love',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Smiling%20Face%20with%20Heart-Eyes.png',
  },
  {
    id: 's_heartarrow',
    name: 'Cupid Heart',
    category: 'love',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Heart%20with%20Arrow.png',
  },
  {
    id: 's_iloveyou',
    name: 'Love Sign',
    category: 'love',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Love-You%20Gesture.png',
  },
  // Party & Celebration
  {
    id: 's_partyface',
    name: 'Party Face',
    category: 'party',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Partying%20Face.png',
  },
  {
    id: 's_starstruck',
    name: 'Star Struck',
    category: 'party',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Smilies/Star-Struck.png',
  },
  {
    id: 's_clap',
    name: 'Clapping Hands',
    category: 'party',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Clapping%20Hands.png',
  },
  {
    id: 's_thumbsup',
    name: 'Thumbs Up',
    category: 'party',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Thumbs%20Up.png',
  },
  // Gaming & Victory
  {
    id: 's_game',
    name: 'Video Game',
    category: 'gaming',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Video%20Game.png',
  },
  {
    id: 's_trophy',
    name: 'Champion Trophy',
    category: 'gaming',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Activities/Trophy.png',
  },
  {
    id: 's_peace',
    name: 'Victory Sign',
    category: 'gaming',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Hand%20gestures/Victory%20Hand.png',
  },
  {
    id: 's_cat',
    name: 'Cute Cat',
    category: 'gaming',
    url: 'https://raw.githubusercontent.com/Tarikul-Islam-Anik/Animated-Fluent-Emojis/master/Emojis/Animals/Cat%20Face.png',
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
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
  const [activeCategory, setActiveCategory] = useState<string>('faces');
  const [stickerCategory, setStickerCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStickerClick = (sticker: AnimatedSticker) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#ffffff', '#a1a1aa', '#52525b'],
    });
    onSendSticker(`[GIF:${sticker.url}]`);
    onClose();
  };

  const filteredStickers = VERIFIED_ANIMATED_STICKERS.filter((s) => {
    const matchCategory = stickerCategory === 'all' || s.category === stickerCategory;
    const matchSearch =
      !searchQuery.trim() ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.category.toLowerCase().includes(searchQuery.toLowerCase());
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
            {/* Tabs: 3D Stickers vs Emojis */}
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
                <Film className="w-3.5 h-3.5" />
                <span>3D Stickers & GIFs</span>
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
                  ? 'Search 3D stickers (fire, laugh, love, trophy)...'
                  : 'Search emojis...'
              }
              className="w-full pl-8 pr-3 py-1.5 bg-black/60 border border-white/10 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-white/30"
            />
          </div>
        </div>

        {/* Body */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          {/* TAB 1: 3D ANIMATED STICKERS & GIFS */}
          {activeTab === 'stickers' && (
            <div className="space-y-3">
              {/* Category Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 custom-scrollbar">
                {[
                  { id: 'all', name: 'All' },
                  { id: 'trending', name: '🔥 Hype' },
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
              <div className="grid grid-cols-4 gap-2.5">
                {filteredStickers.map((sticker) => (
                  <button
                    key={sticker.id}
                    type="button"
                    onClick={() => handleStickerClick(sticker)}
                    className="flex flex-col items-center justify-center p-2 rounded-2xl bg-zinc-900/90 border border-white/10 hover:border-white/40 hover:bg-white/10 transition-all duration-150 active:scale-90 group shadow-md"
                    title={sticker.name}
                  >
                    <img
                      src={sticker.url}
                      alt={sticker.name}
                      loading="lazy"
                      className="w-12 h-12 object-contain group-hover:scale-115 transition-transform duration-200"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 truncate max-w-full group-hover:text-zinc-200">
                      {sticker.name}
                    </span>
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
