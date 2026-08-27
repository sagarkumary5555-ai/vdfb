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

const GRADIENTS = [
  'bg-gradient-to-tr from-blue-600 to-cyan-500',
  'bg-gradient-to-tr from-purple-600 to-pink-500',
  'bg-gradient-to-tr from-emerald-600 to-teal-400',
  'bg-gradient-to-tr from-amber-500 to-orange-600',
  'bg-gradient-to-tr from-rose-600 to-red-500',
  'bg-gradient-to-tr from-indigo-600 to-violet-500',
];

const getGradientForName = (str: string) => {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
};

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
    xs: 'w-6 h-6 text-[10px]',
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
  };

  const iconSizes = {
    xs: 'w-3 h-3',
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6',
    xl: 'w-8 h-8',
    '2xl': 'w-10 h-10',
    '3xl': 'w-12 h-12',
  };

  const statusDotSizes = {
    xs: 'w-2 h-2 bottom-0 right-0 border',
    sm: 'w-2.5 h-2.5 bottom-0 right-0 border-2',
    md: 'w-3 h-3 bottom-0 right-0 border-2',
    lg: 'w-3.5 h-3.5 bottom-0 right-0 border-2',
    xl: 'w-4 h-4 bottom-0 right-0 border-2',
    '2xl': 'w-5 h-5 bottom-1 right-1 border-2',
    '3xl': 'w-6 h-6 bottom-1 right-1 border-2',
  };

  const displayName = name || username || 'User';
  const initial = displayName.trim().charAt(0).toUpperCase() || 'U';
  const gradientClass = isGroup ? 'bg-zinc-800' : getGradientForName(displayName);

  return (
    <div className={`relative inline-flex items-center justify-center flex-shrink-0 select-none ${className}`}>
      {avatarUrl && !imageError && avatarUrl.startsWith('http') ? (
        <img
          src={avatarUrl}
          alt=""
          onError={() => setImageError(true)}
          className={`${sizeClasses[size]} rounded-full object-cover bg-zinc-900 border border-white/10 shadow-md flex-shrink-0`}
          loading="lazy"
        />
      ) : (
        <div
          className={`${sizeClasses[size]} ${gradientClass} rounded-full border border-white/15 flex items-center justify-center font-bold text-white flex-shrink-0 shadow-md`}
        >
          {isGroup ? (
            <Users className={`${iconSizes[size]} text-white/80`} />
          ) : (
            <span>{initial}</span>
          )}
        </div>
      )}

      {/* Status Dot */}
      {status !== null && !isGroup && (
        <span
          className={`absolute rounded-full border-black transition-colors duration-200 ${statusDotSizes[size]} ${
            status === 'online'
              ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]'
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
