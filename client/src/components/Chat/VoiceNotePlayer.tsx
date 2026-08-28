import React, { useState, useEffect, useRef } from 'react';
import { Play, Pause, Volume2 } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
  isMe?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<number>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Generate 24 static waveform heights
  const bars = useRef<number[]>([
    20, 45, 75, 30, 85, 60, 40, 95, 65, 30, 80, 50, 90, 70, 35, 80, 60, 45, 100, 75, 40, 60, 30, 50,
  ]).current;

  useEffect(() => {
    const audio = new Audio(src);
    audioRef.current = audio;

    const handleLoadedMetadata = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleEnded = () => {
      setIsPlaying(false);
      setCurrentTime(0);
    };

    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('ended', handleEnded);

    return () => {
      audio.pause();
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, [src]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (index: number) => {
    if (!audioRef.current || duration === 0) return;
    const seekTime = (index / bars.length) * duration;
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const nextIndex = (rates.indexOf(playbackRate) + 1) % rates.length;
    const newRate = rates[nextIndex];
    audioRef.current.playbackRate = newRate;
    setPlaybackRate(newRate);
  };

  const formatTime = (secs: number) => {
    if (!Number.isFinite(secs) || isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div
      className={`flex items-center gap-3 p-3 rounded-2xl border max-w-xs sm:max-w-sm select-none transition shadow-sm ${
        isMe
          ? 'bg-black/10 border-black/20 text-black'
          : 'bg-[#141416] border-white/15 text-white'
      }`}
    >
      {/* Play / Pause Toggle Button in B&W */}
      <button
        onClick={togglePlay}
        className={`p-2.5 rounded-xl transition active:scale-95 flex items-center justify-center flex-shrink-0 ${
          isMe
            ? 'bg-black text-white hover:bg-black/80'
            : 'bg-white text-black hover:bg-zinc-200'
        }`}
        title={isPlaying ? 'Pause Voice Note' : 'Play Voice Note'}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current stroke-[1.5]" />
        ) : (
          <Play className="w-4 h-4 fill-current stroke-[1.5] ml-0.5" />
        )}
      </button>

      {/* Waveform Visualization Bars in B&W */}
      <div className="flex-1 flex flex-col justify-center min-w-0">
        <div className="flex items-center gap-0.5 sm:gap-1 h-8 cursor-pointer group py-1">
          {bars.map((height, i) => {
            const barProgress = (i / bars.length) * 100;
            const isPlayed = barProgress <= progress;

            return (
              <div
                key={i}
                onClick={() => handleSeek(i)}
                style={{ height: `${height}%` }}
                className={`flex-1 rounded-full transition-all duration-100 ${
                  isPlayed
                    ? isMe
                      ? 'bg-black'
                      : 'bg-white'
                    : isMe
                    ? 'bg-black/25 group-hover:bg-black/40'
                    : 'bg-white/20 group-hover:bg-white/35'
                }`}
              />
            );
          })}
        </div>

        {/* Timestamps & Rate Switcher */}
        <div className="flex items-center justify-between text-[10px] mt-0.5">
          <span className={`font-mono font-bold ${isMe ? 'text-black/80' : 'text-zinc-300'}`}>
            {formatTime(isPlaying ? currentTime : duration || currentTime)}
          </span>

          <div className="flex items-center gap-1.5">
            <Volume2 className={`w-3 h-3 ${isMe ? 'text-black/60' : 'text-zinc-500'}`} />
            <button
              onClick={cyclePlaybackRate}
              className={`px-1.5 py-0.2 rounded font-bold text-[9px] transition ${
                isMe
                  ? 'bg-black/20 text-black hover:bg-black/30'
                  : 'bg-white/15 text-white hover:bg-white/25'
              }`}
              title="Change Speed"
            >
              {playbackRate}x
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
