'use client';
import { motion } from 'framer-motion';
import { Pause, Play, SkipForward } from 'lucide-react';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { Marquee } from './Marquee';
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
    <motion.button
      onClick={onExpand}
      initial={{ opacity: 0, y: 16, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ type: 'spring', stiffness: 320, damping: 30 }}
      className="relative flex w-full items-center gap-3 overflow-hidden rounded-[24px] px-2.5 py-2.5 text-left glass-2"
      style={{
        boxShadow: '0 16px 40px -12px rgba(255,85,0,.35), 0 16px 32px -16px rgba(0,0,0,.6), inset 0 1px 0 rgba(255,255,255,.08)',
      }}
    >
      <div className="relative size-12 shrink-0 overflow-hidden rounded-2xl ring-1 ring-white/15">
        <Artwork src={current.artwork} alt={current.title} rounded="rounded-2xl" />
        {buffering && (
          <div className="absolute inset-0 grid place-items-center bg-black/50">
            <div className="size-4 animate-spin rounded-full border-2 border-white/80 border-t-transparent" />
          </div>
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 text-[13.5px] text-white">
          <Marquee text={current.title} active={isPlaying} className="font-semibold" />
          {isPlaying && <Equalizer playing className="shrink-0 text-[#ff6a00]" />}
        </div>
        <div className="truncate text-[12px] text-ink-400">{current.artist} · SoundCloud</div>
      </div>
      <button
        onClick={(e) => {
          e.stopPropagation();
          usePlayer.getState().toggle();
        }}
        aria-label={isPlaying ? 'Pause' : 'Play'}
        className="grid size-11 place-items-center rounded-full bg-gradient-to-br from-[#ff5500] to-[#ff8a00] text-white shadow-glow transition hover:brightness-110 active:scale-95"
      >
        {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="translate-x-[1px]" />}
      </button>
      <button
        onClick={(e) => {
          e.stopPropagation();
          usePlayer.getState().next();
        }}
        aria-label="Next"
        className="grid size-10 place-items-center rounded-full text-ink-300 hover:bg-white/10 hover:text-white active:scale-95 transition"
      >
        <SkipForward size={18} />
      </button>

      <span className="absolute inset-x-4 bottom-1.5 h-[3px] overflow-hidden rounded-full bg-white/[0.08]">
        <motion.span
          className="block h-full rounded-full"
          style={{ background: 'linear-gradient(90deg, #ff5500, #ffb020, #ff2d55)' }}
          animate={{ width: `${pct}%` }}
          transition={{ type: 'tween', duration: 0.25 }}
        />
      </span>
    </motion.button>
  );
}
