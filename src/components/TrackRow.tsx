'use client';
import { motion } from 'framer-motion';
import { MoreHorizontal, Play, Pause, Heart, ListPlus } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Artwork } from './Artwork';
import { Equalizer } from './Equalizer';
import { SourceBadge } from './SourceBadge';
import { usePlayer } from '@/lib/player-store';
import { fmtTime } from '@/lib/format';
import { tap } from '@/lib/haptics';
import type { Track } from '@/lib/types';

export function TrackRow({
  track,
  queue,
  index,
  showIndex = false,
  onPlay,
}: {
  track: Track;
  queue: Track[];
  index: number;
  showIndex?: boolean;
  onPlay?: () => void;
}) {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const liked = usePlayer((s) => !!s.liked[track.id]);
  const isActive = current?.id === track.id;
  const playing = isActive && isPlaying;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
      className={`group flex items-center gap-3 rounded-[20px] px-2.5 py-2 border transition-all duration-300 ${
        isActive
          ? 'bg-[#ff5500]/[0.08] border-[#ff5500]/20 ring-1 ring-[#ff5500]/15'
          : 'bg-white/[0.02] border-transparent hover:bg-white/[0.06] active:scale-[0.995]'
      }`}
    >
      <button
        onClick={() => {
          tap('light');
          usePlayer.getState().play(track, queue);
          onPlay?.();
        }}
        className="relative size-12 shrink-0 overflow-hidden rounded-xl ring-1 ring-white/5"
        aria-label={`Play ${track.title}`}
      >
        <Artwork src={track.artwork} alt={track.title} rounded="rounded-xl" />
        <div
          className={`absolute inset-0 grid place-items-center bg-black/45 transition-opacity ${
            isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
          }`}
        >
          {playing ? (
            <Equalizer playing className="text-white" />
          ) : (
            <Play size={18} fill="currentColor" className="text-white translate-x-[1px]" />
          )}
        </div>
        {showIndex && !isActive && (
          <div className="absolute inset-0 grid place-items-center bg-black/30 text-[12px] tabular-nums font-medium text-white/80 opacity-100 group-hover:opacity-0 transition-opacity">
            {index + 1}
          </div>
        )}
      </button>

      <button
        onClick={() => {
          tap('light');
          usePlayer.getState().play(track, queue);
          onPlay?.();
        }}
        className="min-w-0 flex-1 text-left"
      >
        <div className="flex items-center gap-2">
          <span className={`truncate text-[15px] font-semibold ${isActive ? 'text-[#ff8a2a]' : 'text-ink-50'}`}>
            {track.title}
          </span>
          {playing && <Equalizer playing className="text-[#ff5500] shrink-0" />}
        </div>
        <div className="flex items-center gap-1.5 truncate text-[12.5px] text-ink-400">
          <span className="truncate">{track.artist}</span>
          <span className="opacity-50">·</span>
          <SourceBadge source={track.source} />
        </div>
      </button>

      <span className="hidden tabular-nums text-[12px] text-ink-500 sm:block">{fmtTime(track.durationSec)}</span>

      <Tooltip.Provider delayDuration={400}>
        <Tooltip.Root>
          <Tooltip.Trigger asChild>
            <button
              onClick={() => {
                tap('select');
                usePlayer.getState().toggleLike(track);
                toast(liked ? 'Removed from liked' : 'Added to liked', { duration: 1500 });
              }}
              aria-label={liked ? 'Unlike' : 'Like'}
              className={`rounded-full p-2 transition ${
                liked ? 'text-rose-400' : 'text-ink-400 hover:text-ink-50'
              } hover:bg-white/10 active:scale-95`}
            >
              <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </Tooltip.Trigger>
          <Tooltip.Portal>
            <Tooltip.Content
              sideOffset={6}
              className="rounded-md bg-paper-2/90 backdrop-blur px-2 py-1 text-[11px] text-ink-300 ring-1 ring-white/10"
            >
              {liked ? 'Liked' : 'Like'}
            </Tooltip.Content>
          </Tooltip.Portal>
        </Tooltip.Root>
      </Tooltip.Provider>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button
            aria-label="More"
            className="rounded-full p-2 text-ink-400 hover:text-ink-50 hover:bg-white/10 active:scale-95 transition"
          >
            <MoreHorizontal size={16} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/40 backdrop-blur-md" />
          <Dialog.Content
            className="fixed left-1/2 top-1/2 z-50 w-[min(380px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl glass-2 grain p-2 ring-soft"
          >
            <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <div className="size-12 overflow-hidden rounded-xl ring-1 ring-white/10">
                <Artwork src={track.artwork} alt={track.title} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-ink-50">{track.title}</div>
                <div className="truncate text-[12px] text-ink-400">{track.artist}</div>
              </div>
            </div>
            <div className="hairline mb-1" />
            <ActionRow
              icon={<ListPlus size={16} />}
              label="Play next"
              onClick={() => {
                usePlayer.getState().enqueueNext(track);
                toast('Playing next');
              }}
            />
            <ActionRow
              icon={<Heart size={16} />}
              label={liked ? 'Remove from liked' : 'Add to liked'}
              onClick={() => usePlayer.getState().toggleLike(track)}
            />
            <Dialog.Close asChild>
              <button className="mt-1 w-full rounded-2xl px-3 py-2.5 text-[13px] text-ink-400 hover:bg-white/5">
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.div>
  );
}

function ActionRow({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Dialog.Close asChild>
      <button
        onClick={onClick}
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] text-ink-50 hover:bg-white/[0.06]"
      >
        <span className="grid size-8 place-items-center rounded-full bg-white/10 text-ink-50">{icon}</span>
        {label}
      </button>
    </Dialog.Close>
  );
}
