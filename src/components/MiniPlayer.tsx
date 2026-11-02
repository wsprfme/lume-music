'use client';
import { Pause, Play, SkipForward } from 'lucide-react';
import { Artwork } from './Artwork';
import { usePlayer } from '@/lib/player-store';

export function MiniPlayer({ onExpand }: { onExpand: () => void }) {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  if (!current) return null;
  const pct = duration ? Math.min(100, (position / duration) * 100) : 0;

  return (
    <div
      onClick={onExpand}
      role="button"
      tabIndex={0}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-2xl border border-white/[0.08] bg-paper-2 px-2.5 py-2 text-left"
    >
      <div className="relative size-11 shrink-0 overflow-hidden rounded-xl">
        <Artwork src={current.artwork} alt={current.title} rounded="rounded-xl" />
        {buffering && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <div className="size-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-[13.5px] font-medium text-white">{current.title}</div>
        <div className="truncate text-[12px] text-ink-400">{current.artist}</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          usePlayer.getState().toggle();
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="grid size-10 shrink-0 place-items-center rounded-full bg-white text-black active:scale-95"
      >
        {isPlaying ? <Pause size={17} fill="currentColor" /> : <Play size={17} fill="currentColor" className="translate-x-[1px]" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          usePlayer.getState().next();
        }}
        aria-label="Next"
        className="grid size-9 shrink-0 place-items-center rounded-full text-ink-300 active:scale-95"
      >
        <SkipForward size={17} />
      </button>

      <span className="absolute inset-x-3 bottom-1 h-[2px] overflow-hidden rounded-full bg-white/10">
        <span className="block h-full bg-[#ff5500]" style={{ width: `${pct}%` }} />
      </span>
    </div>
  );
}
