import React, { useState } from 'react';
import { Search, Heart, Sparkles, Smile, Cat, ThumbsUp, X, Gift } from 'lucide-react';
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

const CUSTOM_STICKERS: StickerItem[] = [
  { id: 'love_1', name: 'Infinite Love', badge: '💖', content: '💖 Loving You Always 💖', caption: 'Loving You' },
  { id: 'love_2', name: 'Warm Hug', badge: '🫂', content: '🫂 *Sends the warmest tightest hug* 🫂', caption: 'Warm Hug' },
  { id: 'love_3', name: 'Sweet Kiss', badge: '💋', content: '💋 Sending you a sweet kiss ✨', caption: 'Sweet Kiss' },
  { id: 'love_4', name: 'Red Roses', badge: '🌹', content: '🌹 💐 A bouquet of roses for you 💐 🌹', caption: 'Roses For You' },
  { id: 'love_5', name: 'Sparkling Heart', badge: '✨', content: '✨ ❤️ You make my world shine brighter ❤️ ✨', caption: 'My Star' },
  { id: 'love_6', name: 'Cute Teddy', badge: '🧸', content: '🧸 Cuddle time! 🧸', caption: 'Cuddles' },
  { id: 'love_7', name: 'Forever & Always', badge: '💍', content: '💍 Sagar & Something Forever ❤️', caption: 'Forever' },
  { id: 'love_8', name: 'Love Letter', badge: '💌', content: '💌 Thinking of you right now... 💕', caption: 'Love Note' },
  { id: 'mood_1', name: 'Cheer Up', badge: '🥳', content: '🎉 Yay! Let\'s celebrate! 🥳 🥂', caption: 'Celebrate' },
  { id: 'mood_2', name: 'Cozy Coffee', badge: '☕', content: '☕ Sending warm cozy coffee vibes ☕ ✨', caption: 'Cozy Coffee' },
  { id: 'mood_3', name: 'Sweet Dreams', badge: '🌙', content: '🌙 ✨ Goodnight & Sweet Dreams ⭐ 😴', caption: 'Goodnight' },
  { id: 'mood_4', name: 'Cute Kitty', badge: '🐱', content: '🐱 *Purrs softly next to you* 🐾 🌸', caption: 'Kitty Purr' },
  { id: 'mood_5', name: 'On Fire', badge: '🔥', content: '🔥 You\'re absolutely amazing! 🔥 ⚡', caption: 'Amazing' },
  { id: 'mood_6', name: 'Sweet Treats', badge: '🍫', content: '🍓 🍫 Sweet treats for a sweet person 🍰 🍓', caption: 'Sweet Treats' },
];

const EMOJI_SETS = [
  {
    id: 'love',
    name: 'Love & Romance',
    icon: Heart,
    emojis: [
      '❤️', '💖', '💘', '💝', '💗', '💓', '💞', '💕', '💌', '💟', '❣️', '💔',
      '💋', '🫂', '💍', '💐', '🌹', '🥀', '🌺', '🌸', '🌷', '🌻', '🪻', '🪷',
      '🥰', '😍', '😘', '😚', '😙', '😻', '🏩', '💒', '🎀', '🪄', '💎', '✨',
    ],
  },
  {
    id: 'faces',
    name: 'Smiles & Expressions',
    icon: Smile,
    emojis: [
      '😊', '😁', '😂', '🤣', '🥹', '🥺', '😇', '😋', '😛', '😜', '🤪', '🤩',
      '🥳', '🤗', '😌', '🤤', '😴', '🤠', '😎', '🤓', '🧐', '🤭', '🤫', '🤔',
      '🥵', '🥶', '🤯', '😭', '😤', '🫣', '🫡', '🫠', '🤭', '🫢', '🥱', '😴',
    ],
  },
  {
    id: 'vibes',
    name: 'Magic & Vibes',
    icon: Sparkles,
    emojis: [
      '🔥', '✨', '🌟', '⭐', '💫', '🌙', '☀️', '🌈', '⚡', '💎', '🔮', '🪄',
      '🧸', '🎁', '🎈', '🎉', '🎊', '🥂', '🍷', '🍰', '🍫', '🍓', '☕', '🧁',
      '🍿', '🍭', '🧋', '🍡', '🍧', '🎂', '🍩', '🧃', '🍪', '🥞', '🥐', '🍒',
    ],
  },
  {
    id: 'animals',
    name: 'Cute Pets & Nature',
    icon: Cat,
    emojis: [
      '🐱', '🐶', '🐰', '🦊', '🐼', '🐨', '🐯', '🦁', '🦄', '🦋', '🐥', '🐧',
      '🦔', '🐾', '🌸', '🍀', '🍓', '🍑', '🍒', '🪴', '🍁', '🍂', '🍄', '🌼',
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
];

export const StickerAndEmojiPicker: React.FC<StickerAndEmojiPickerProps> = ({
  onSelectEmoji,
  onSendSticker,
  onClose,
}) => {
  const [activeTab, setActiveTab] = useState<'stickers' | 'emojis'>('stickers');
  const [activeCategory, setActiveCategory] = useState<string>('love');
  const [searchQuery, setSearchQuery] = useState('');

  const handleStickerClick = (sticker: StickerItem) => {
    confetti({
      particleCount: 25,
      spread: 60,
      origin: { y: 0.85 },
      colors: ['#f43f5e', '#ec4899', '#a855f7'],
    });
    onSendSticker(sticker.content);
    onClose();
  };

  const filteredStickers = CUSTOM_STICKERS.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.caption.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <>
      {/* Backdrop for mobile */}
      <div
        className="fixed inset-0 z-40 bg-black/50 backdrop-blur-xs sm:hidden"
        onClick={onClose}
      />

      <div className="fixed inset-x-0 bottom-0 z-50 w-full sm:absolute sm:inset-x-auto sm:bottom-16 sm:left-4 sm:w-[380px] glass-dropdown rounded-t-3xl sm:rounded-3xl border-t sm:border border-white/20 shadow-2xl overflow-hidden animate-slide-up select-none flex flex-col max-h-[60vh] sm:max-h-[380px]">
        {/* Mobile Pull Handle Indicator */}
        <div className="w-12 h-1 bg-white/20 rounded-full mx-auto mt-2 sm:hidden flex-shrink-0" />

        {/* Header Bar with Search and Tab Switcher */}
        <div className="p-3 border-b border-white/10 bg-dark-950/80 space-y-2 flex-shrink-0">
          <div className="flex items-center justify-between gap-2">
            {/* Tabs */}
            <div className="flex items-center gap-1 p-1 bg-dark-900/90 rounded-2xl border border-white/10 flex-1">
              <button
                type="button"
                onClick={() => setActiveTab('stickers')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'stickers'
                    ? 'bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gift className="w-3.5 h-3.5" />
                <span>Stickers</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveTab('emojis')}
                className={`flex-1 py-1.5 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  activeTab === 'emojis'
                    ? 'bg-gradient-to-r from-brand-rose to-brand-purple text-white shadow-md'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Smile className="w-3.5 h-3.5" />
                <span>3D Emojis</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={activeTab === 'stickers' ? 'Search stickers...' : 'Search emojis...'}
              className="w-full pl-8 pr-3 py-1.5 bg-dark-900/80 border border-white/10 rounded-xl text-xs text-white placeholder-slate-400 focus:outline-none focus:border-brand-pink"
            />
          </div>
        </div>

        {/* Body: Stickers or Emojis */}
        <div className="p-3 overflow-y-auto flex-1 custom-scrollbar pb-safe">
          {activeTab === 'stickers' ? (
            /* Stickers Grid */
            <div className="grid grid-cols-2 gap-2">
              {filteredStickers.map((sticker) => (
                <button
                  key={sticker.id}
                  type="button"
                  onClick={() => handleStickerClick(sticker)}
                  className="p-3 rounded-2xl bg-dark-950/70 border border-white/10 hover:border-brand-pink/50 hover:bg-brand-rose/10 transition-all duration-200 text-left group flex items-center gap-2.5 active:scale-95 shadow-md"
                >
                  <span className="text-2xl group-hover:scale-125 transition-transform">
                    {sticker.badge}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-bold text-slate-100 group-hover:text-white truncate">
                      {sticker.name}
                    </div>
                    <div className="text-[10px] text-slate-400 group-hover:text-brand-pink truncate">
                      {sticker.caption}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          ) : (
            /* Emojis Grid with Sub-Category Pills */
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
                          ? 'bg-brand-rose/25 text-brand-pink border border-brand-rose/40 font-semibold'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
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
                    <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
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
