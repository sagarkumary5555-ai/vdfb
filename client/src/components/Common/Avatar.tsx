import React, { useState, useEffect } from 'react';
import { Users } from 'lucide-react';

interface AvatarProps {
  name: string;
  username?: string;
  avatarUrl?: string | null;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl';
  className?: string;
  status?: 'online' | 'away' | 'offline' | null;
  isGroup?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  name,
  username,
  avatarUrl,
  size = 'md',
  className = '',
  status = null,
  isGroup = false,
}) => {
  const [imageError, setImageError] = useState(false);

  // Reset error when avatarUrl changes
  useEffect(() => {
    setImageError(false);
  }, [avatarUrl]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-[10px] rounded-full',
    sm: 'w-8 h-8 text-xs rounded-full',
    md: 'w-10 h-10 text-sm rounded-full',
    lg: 'w-12 h-12 text-base rounded-full',
    xl: 'w-16 h-16 text-lg rounded-full',
    '2xl': 'w-20 h-20 text-2xl rounded-full',
    '3xl': 'w-28 h-28 text-3xl rounded-full',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
    '3xl': 'w-14 h-14',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 bottom-0 right-0 border',
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
    xl: 'w-4.5 h-4.5 bottom-0 right-0 border-2',
    '2xl': 'w-5 h-5 bottom-1 right-1 border-2',
    '3xl': 'w-6 h-6 bottom-1 right-1 border-2',
  };

  const initial = name ? name.trim().charAt(0).toUpperCase() : (username ? username.charAt(0).toUpperCase() : 'U');

  const renderFallback = () => {
    if (isGroup) {
      return (
        <div
          className={`${sizeClasses[size]} bg-zinc-800 border border-white/15 flex items-center justify-center font-bold text-white flex-shrink-0 shadow`}
        >
          <Users className={`${iconSizes[size]} text-zinc-300`} />
        </div>
      );
    }

    return (
      <div
        className={`${sizeClasses[size]} bg-zinc-800 border border-white/20 flex items-center justify-center font-bold text-white flex-shrink-0 shadow`}
      >
        <span>{initial}</span>
      </div>
    );
  };

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      {avatarUrl && !imageError ? (
        <img
          src={avatarUrl}
          alt={name || 'Avatar'}
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} object-cover bg-zinc-900 border border-white/20 shadow-md flex-shrink-0 rounded-full`}
          loading="lazy"
        />
      ) : (
        renderFallback()
      )}

      {/* Status Dot */}
      {status !== null && !isGroup && (
        <span
          className={`absolute rounded-full border-black transition-colors duration-200 ${statusDotSizes[size]} ${
            status === 'online'
              ? 'bg-emerald-500 ring-1 ring-emerald-400/50'
              : status === 'away'
              ? 'bg-amber-400'
              : 'bg-zinc-600'
          }`}
          title={status === 'online' ? 'Online' : 'Offline'}
        />
      )}
    </div>
  );
};
