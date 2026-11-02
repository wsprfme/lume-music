'use client';
import { MoreHorizontal, Play, Heart, ListPlus } from 'lucide-react';
import * as Dialog from '@radix-ui/react-dialog';
import { toast } from 'sonner';
import { Artwork } from './Artwork';
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

  function play() {
    tap('light');
    usePlayer.getState().play(track, queue);
    onPlay?.();
  }

  return (
    <div
      className={`flex items-center gap-3 rounded-2xl px-2 py-2 ${
        isActive ? 'bg-white/[0.06]' : ''
      }`}
    >
      <button
        onClick={play}
        className="relative size-12 shrink-0 overflow-hidden rounded-xl"
        aria-label={`Play ${track.title}`}
      >
        <Artwork src={track.artwork} alt={track.title} rounded="rounded-xl" />
        {showIndex && !isActive && (
          <span className="absolute inset-0 grid place-items-center bg-black/30 text-[12px] tabular-nums text-white/80">
            {index + 1}
          </span>
        )}
        {isActive && (
          <span className="absolute inset-0 grid place-items-center bg-black/40">
            <span className={`size-1.5 rounded-full ${isPlaying ? 'bg-[#ff5500]' : 'bg-white/70'}`} />
          </span>
        )}
      </button>

      <button onClick={play} className="min-w-0 flex-1 text-left">
        <div className="truncate text-[15px] font-medium text-white">{track.title}</div>
        <div className="truncate text-[12.5px] text-ink-400">{track.artist}</div>
      </button>

      <span className="hidden tabular-nums text-[12px] text-ink-500 sm:block">{fmtTime(track.durationSec)}</span>

      <button
        onClick={() => {
          tap('select');
          usePlayer.getState().toggleLike(track);
          toast(liked ? 'Removed from liked' : 'Added to liked', { duration: 1200 });
        }}
        aria-label={liked ? 'Unlike' : 'Like'}
        className={`rounded-full p-2 ${liked ? 'text-rose-400' : 'text-ink-400'}`}
      >
        <Heart size={16} fill={liked ? 'currentColor' : 'none'} />
      </button>

      <Dialog.Root>
        <Dialog.Trigger asChild>
          <button aria-label="More" className="rounded-full p-2 text-ink-400">
            <MoreHorizontal size={16} />
          </button>
        </Dialog.Trigger>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-40 bg-black/50" />
          <Dialog.Content className="fixed left-1/2 top-1/2 z-50 w-[min(380px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-3xl border border-white/10 bg-paper-2 p-2">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-3">
              <div className="size-12 overflow-hidden rounded-xl">
                <Artwork src={track.artwork} alt={track.title} />
              </div>
              <div className="min-w-0">
                <div className="truncate text-[14px] font-medium text-white">{track.title}</div>
                <div className="truncate text-[12px] text-ink-400">{track.artist}</div>
              </div>
            </div>
            <div className="my-1 h-px bg-white/10" />
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
              <button className="mt-1 w-full rounded-2xl px-3 py-2.5 text-[13px] text-ink-400">
                Close
              </button>
            </Dialog.Close>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </div>
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
        className="flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-[14px] text-white"
      >
        <span className="grid size-8 place-items-center rounded-full bg-white/10">{icon}</span>
        {label}
      </button>
    </Dialog.Close>
  );
}
