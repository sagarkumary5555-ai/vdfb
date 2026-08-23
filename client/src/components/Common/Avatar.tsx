import React, { useState } from 'react';
import { Heart, Sparkles } from 'lucide-react';

interface AvatarProps {
  name: string;
  username?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  status?: 'online' | 'away' | 'offline' | null;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  username,
  avatarUrl,
  size = 'md',
  className = '',
  status = null,
}) => {
  const [imageError, setImageError] = useState(false);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-lg',
    sm: 'w-8 h-8 text-xs rounded-xl',
    md: 'w-10 h-10 text-sm rounded-2xl',
    lg: 'w-12 h-12 text-base rounded-2xl',
    xl: 'w-16 h-16 text-lg rounded-3xl',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 -bottom-0.5 -right-0.5 border',
    sm: 'w-2.5 h-2.5 -bottom-0.5 -right-0.5 border-2',
    md: 'w-3.5 h-3.5 -bottom-0.5 -right-0.5 border-2',
    lg: 'w-4 h-4 -bottom-1 -right-1 border-2',
    xl: 'w-5 h-5 -bottom-1 -right-1 border-2',
  };

  const isSomething =
    username?.toLowerCase().includes('something') ||
    name.toLowerCase().includes('something') ||
    name.includes('❤️');

  const initial = name ? name.charAt(0).toUpperCase() : 'U';

  const renderFallback = () => {
    if (isSomething) {
      return (
        <div
          className={`${sizeClasses[size]} bg-gradient-to-tr from-pink-900 via-rose-700 to-purple-600 flex items-center justify-center font-bold text-white shadow-inner border border-rose-400/30 flex-shrink-0`}
        >
          {size === 'xs' || size === 'sm' ? (
            <Heart className="w-3.5 h-3.5 text-white fill-white/80" />
          ) : (
            <div className="flex items-center justify-center">
              <span>{initial}</span>
              <Heart className="w-2.5 h-2.5 ml-0.5 text-pink-200 fill-pink-200" />
            </div>
          )}
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-700 flex items-center justify-center font-bold text-white shadow-inner border border-indigo-400/30 flex-shrink-0`}
      >
        {size === 'xs' || size === 'sm' ? (
          <Sparkles className="w-3.5 h-3.5 text-cyan-300" />
        ) : (
          <div className="flex items-center justify-center">
            <span>{initial}</span>
            <Sparkles className="w-2.5 h-2.5 ml-0.5 text-cyan-300" />
          </div>
        )}
      </div>
    );
  };

  return (
    <div className={`relative inline-block flex-shrink-0 select-none ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} object-cover bg-dark-950 border border-white/20 shadow-md flex-shrink-0`}
          loading="lazy"
        />
      ) : (
        renderFallback()
      )}

      {/* Real-Time Online/Offline Status Indicator Dot */}
      {status !== null && (
        <span
          className={`absolute rounded-full border-dark-950 transition-colors duration-300 ${statusDotSizes[size]} ${
            status === 'online'
              ? 'bg-emerald-500 shadow-sm shadow-emerald-500/60 ring-1 ring-emerald-400/50'
              : status === 'away'
              ? 'bg-amber-400 shadow-sm shadow-amber-400/60'
              : 'bg-slate-500'
          }`}
          title={status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
