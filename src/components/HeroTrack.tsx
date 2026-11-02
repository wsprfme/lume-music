'use client';
import { motion } from 'framer-motion';
import { Play, Pause, ExternalLink } from 'lucide-react';
import { Artwork } from './Artwork';
import { SourceBadge } from './SourceBadge';
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
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 280, damping: 30 }}
      className="relative overflow-hidden rounded-[28px] ring-1 ring-white/10 grain"
    >
      {/* Ember gradient wash */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(130% 90% at 15% 0%, rgb(var(--tint-1) / .5), transparent 55%), radial-gradient(120% 90% at 95% 20%, rgb(var(--tint-2) / .32), transparent 55%), radial-gradient(120% 120% at 50% 110%, rgb(var(--tint-3) / .28), transparent 60%), linear-gradient(180deg, rgba(28,17,10,.5), rgba(12,8,6,.96))',
        }}
      />
      {/* Blurred artwork echo */}
      <div className="absolute inset-0 opacity-25 blur-3xl scale-125 pointer-events-none">
        <Artwork src={track.artwork} alt="" rounded="" />
      </div>

      <div className="relative p-5">
        <div className="mb-4 flex items-center justify-between">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 text-[10.5px] font-semibold uppercase tracking-[0.18em] text-amber-100/90 ring-1 ring-white/15 backdrop-blur">
            <span className="size-1.5 animate-pulse rounded-full bg-[rgb(var(--tint-1))]" />
            Featured drop
          </span>
          <SourceBadge source={track.source} />
        </div>

        <div className="flex items-end gap-4">
          <div className="relative size-32 shrink-0 sm:size-40">
            <div className="absolute -inset-2 rounded-[26px] bg-gradient-to-br from-[rgb(var(--tint-1))] via-[rgb(var(--tint-2))] to-[rgb(var(--tint-3))] opacity-40 blur-xl" />
            <div className="relative size-full overflow-hidden rounded-[22px] ring-1 ring-white/20 shadow-depth">
              <Artwork src={track.artwork} alt={track.title} rounded="" />
            </div>
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <h2 className="truncate text-[24px] font-bold leading-tight tracking-tight text-white drop-shadow">
              {track.title}
            </h2>
            <p className="mt-1 truncate text-[14px] font-medium text-amber-100/70">{track.artist}</p>
            <p className="mt-1.5 flex items-center gap-2 text-[12px] tabular-nums text-white/50">
              <span>{fmtTime(track.durationSec)}</span>
              {track.playCount ? (
                <>
                  <span>·</span>
                  <span>{Intl.NumberFormat('en', { notation: 'compact' }).format(track.playCount)} plays</span>
                </>
              ) : null}
            </p>
          </div>
        </div>

        <div className="mt-5 flex items-center gap-2.5">
          <button
            onClick={toggle}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-gradient-to-r from-[#ff5500] to-[#ff8a00] px-5 py-3 text-[14px] font-bold text-white shadow-glow transition hover:brightness-110 active:scale-[0.99]"
          >
            {isActive ? (
              <>
                <Pause size={16} fill="currentColor" /> Pause
              </>
            ) : (
              <>
                <Play size={16} fill="currentColor" className="translate-x-[1px]" /> Play now
              </>
            )}
          </button>
          <a
            href={track.permalink}
            target="_blank"
            rel="noreferrer"
            aria-label="Open on SoundCloud"
            className="grid size-[46px] place-items-center rounded-full glass-pill text-white transition hover:bg-white/15"
          >
            <ExternalLink size={17} />
          </a>
        </div>
      </div>
    </motion.div>
  );
}
