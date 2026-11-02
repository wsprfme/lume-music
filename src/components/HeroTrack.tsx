'use client';
import { Play, Pause } from 'lucide-react';
import { Artwork } from './Artwork';
import { usePlayer } from '@/lib/player-store';
import { fmtTime } from '@/lib/format';
import type { Track } from '@/lib/types';

export function HeroTrack({ track, queue }: { track: Track; queue: Track[] }) {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const isActive = current?.id === track.id && isPlaying;

  function toggle() {
    if (current?.id === track.id) usePlayer.getState().toggle();
    else usePlayer.getState().play(track, queue);
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-white/[0.08] bg-paper-2">
      <div className="flex items-center gap-4 p-4">
        <div className="size-24 shrink-0 overflow-hidden rounded-2xl">
          <Artwork src={track.artwork} alt={track.title} rounded="" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-[18px] font-bold leading-tight text-white">{track.title}</h2>
          <p className="mt-0.5 truncate text-[13px] text-ink-400">{track.artist}</p>
          <p className="mt-1 text-[12px] tabular-nums text-ink-500">
            {fmtTime(track.durationSec)}
            {track.playCount ? ` · ${Intl.NumberFormat('en', { notation: 'compact' }).format(track.playCount)} plays` : ''}
          </p>
          <button
            onClick={toggle}
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-[13px] font-bold text-black active:scale-[0.98]"
          >
            {isActive ? (
              <>
                <Pause size={14} fill="currentColor" /> Pause
              </>
            ) : (
              <>
                <Play size={14} fill="currentColor" /> Play
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
