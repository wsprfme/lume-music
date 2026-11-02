'use client';
import { Artwork } from './Artwork';
import { usePlayer } from '@/lib/player-store';
import type { Track } from '@/lib/types';

export function TrackTile({ track, queue }: { track: Track; queue: Track[] }) {
  const current = usePlayer((s) => s.current);
  const isActive = current?.id === track.id;

  return (
    <button
      onClick={() => usePlayer.getState().play(track, queue)}
      className={`w-[148px] shrink-0 overflow-hidden rounded-2xl border p-2 text-left ${
        isActive ? 'border-[#ff5500]/40 bg-paper-2' : 'border-white/[0.07] bg-paper-2'
      }`}
    >
      <div className="relative aspect-square w-full overflow-hidden rounded-xl">
        <Artwork src={track.artwork} alt={track.title} rounded="" />
      </div>
      <div className="px-1 pb-1 pt-2">
        <div className={`truncate text-[13px] font-semibold ${isActive ? 'text-white' : 'text-ink-50'}`}>
          {track.title}
        </div>
        <div className="mt-0.5 truncate text-[12px] text-ink-400">{track.artist}</div>
      </div>
    </button>
  );
}
