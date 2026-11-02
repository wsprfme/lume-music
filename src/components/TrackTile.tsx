'use client';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { Artwork } from './Artwork';
import { SourceBadge } from './SourceBadge';
import { usePlayer } from '@/lib/player-store';
import type { Track } from '@/lib/types';

export function TrackTile({ track, queue }: { track: Track; queue: Track[] }) {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isActive = current?.id === track.id;

  return (
    <motion.button
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: 'spring', stiffness: 420, damping: 28 }}
      onClick={() => usePlayer.getState().play(track, queue)}
      className="group relative w-[168px] shrink-0 overflow-hidden rounded-[22px] p-2 text-left glass transition-all duration-300 hover:ring-white/20"
      style={
        isActive
          ? { boxShadow: '0 10px 30px -10px rgba(255,85,0,.45)', borderColor: 'rgba(255,85,0,.35)' }
          : undefined
      }
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-2xl ring-1 ring-white/10">
        <Artwork src={track.artwork} alt={track.title} rounded="" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        <div className="absolute left-2 top-2">
          <SourceBadge source={track.source} />
        </div>
        <span
          className={`absolute bottom-2 right-2 grid size-10 place-items-center rounded-full transition-all duration-300 ${
            isActive && isPlaying
              ? 'bg-gradient-to-br from-[#ff5500] to-[#ff8a00] text-white opacity-100 shadow-glow'
              : 'bg-white text-stone-950 opacity-0 shadow-lg group-hover:opacity-100'
          }`}
        >
          <Play size={16} fill="currentColor" className="translate-x-[1px]" />
        </span>
      </div>
      <div className="px-1.5 pb-1.5 pt-2.5">
        <div className={`truncate text-[13.5px] font-semibold ${isActive ? 'text-[#ff8a2a]' : 'text-ink-50'}`}>
          {track.title}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-ink-400">{track.artist}</div>
      </div>
    </motion.button>
  );
}
