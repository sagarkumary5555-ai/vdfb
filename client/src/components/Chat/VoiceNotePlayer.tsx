import React, { useState, useRef, useEffect } from 'react';
import { Play, Pause } from 'lucide-react';

interface VoiceNotePlayerProps {
  src: string;
  duration?: string;
  isMe?: boolean;
}

export const VoiceNotePlayer: React.FC<VoiceNotePlayerProps> = ({ src, isMe = false }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [totalDuration, setTotalDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState<1 | 1.5 | 2>(1);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-calculated pseudo-waveform bar heights for realistic voice look
  const waveformBars = [
    25, 45, 70, 90, 60, 40, 80, 100, 75, 50, 65, 85, 40, 60, 95, 70, 45, 80, 60, 35, 75, 90, 55, 30,
  ];

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleLoadedMetadata = () => {
      if (audio.duration && !isNaN(audio.duration) && isFinite(audio.duration)) {
        setTotalDuration(audio.duration);
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
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('ended', handleEnded);
    };
  }, []);

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

  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!audioRef.current || !totalDuration) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const newTime = (clickX / width) * totalDuration;
    audioRef.current.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const cyclePlaybackRate = () => {
    const rates: Array<1 | 1.5 | 2> = [1, 1.5, 2];
    const nextRate = rates[(rates.indexOf(playbackRate) + 1) % rates.length];
    setPlaybackRate(nextRate);
    if (audioRef.current) {
      audioRef.current.playbackRate = nextRate;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs) || !isFinite(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const progressPercent = totalDuration ? (currentTime / totalDuration) * 100 : 0;

  return (
    <div className={`flex items-center gap-3 p-2 sm:p-2.5 rounded-2xl ${
      isMe ? 'bg-black/30' : 'bg-[#080B12]/80'
    } border border-white/10 select-none max-w-xs sm:max-w-sm mt-1.5 shadow-inner`}>
      <audio ref={audioRef} src={src} preload="metadata" />

      {/* Play/Pause Button */}
      <button
        type="button"
        onClick={togglePlay}
        className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center transition active:scale-95 flex-shrink-0 ${
          isMe
            ? 'bg-white text-black shadow-md hover:bg-zinc-200'
            : 'bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md hover:opacity-90 shadow-blue-500/20'
        }`}
      >
        {isPlaying ? (
          <Pause className="w-4 h-4 fill-current" />
        ) : (
          <Play className="w-4 h-4 fill-current ml-0.5" />
        )}
      </button>

      {/* Waveform Visualization & Seek Bar */}
      <div className="flex-1 min-w-0">
        <div
          onClick={handleSeek}
          className="h-8 flex items-center gap-[2.5px] cursor-pointer group relative py-1"
          title="Click to seek"
        >
          {waveformBars.map((h, i) => {
            const barProgress = (i / waveformBars.length) * 100;
            const isPlayed = barProgress <= progressPercent;

            return (
              <div
                key={i}
                className={`flex-1 rounded-full transition-all duration-150 ${
                  isPlayed
                    ? isMe
                      ? 'bg-white shadow-[0_0_8px_rgba(255,255,255,0.6)]'
                      : 'bg-blue-400 shadow-[0_0_8px_rgba(59,130,246,0.6)]'
                    : isMe
                    ? 'bg-white/35 group-hover:bg-white/50'
                    : 'bg-zinc-700/60 group-hover:bg-zinc-600'
                }`}
                style={{
                  height: `${h}%`,
                  transform: isPlaying && isPlayed ? 'scaleY(1.15)' : 'scaleY(1)',
                }}
              />
            );
          })}
        </div>

        {/* Time & Speed Controls */}
        <div className="flex items-center justify-between text-[10px] text-zinc-300 font-medium px-0.5 mt-0.5">
          <span>{formatTime(isPlaying ? currentTime : totalDuration || currentTime)}</span>
          <button
            type="button"
            onClick={cyclePlaybackRate}
            className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-zinc-300 hover:text-white font-bold transition"
            title="Cycle speed"
          >
            {playbackRate}x
          </button>
        </div>
      </div>
    </div>
  );
};
