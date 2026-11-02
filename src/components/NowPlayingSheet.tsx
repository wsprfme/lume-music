'use client';
import { Drawer } from 'vaul';
import * as Slider from '@radix-ui/react-slider';
import * as ScrollArea from '@radix-ui/react-scroll-area';
import * as Dialog from '@radix-ui/react-dialog';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronDown,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Share2,
  Shuffle,
  SkipBack,
  SkipForward,
  Volume,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { useState } from 'react';
import { Artwork } from './Artwork';
import { SourceBadge } from './SourceBadge';
import { usePlayer } from '@/lib/player-store';
import { fmtTime } from '@/lib/format';
import { tap } from '@/lib/haptics';
import { toast } from 'sonner';

export function NowPlayingSheet() {
  const open = usePlayer((s) => s.expanded);
  const setExpanded = usePlayer((s) => s.setExpanded);
  const current = usePlayer((s) => s.current);

  return (
    <Drawer.Root
      open={open && !!current}
      onOpenChange={setExpanded}
      shouldScaleBackground
      setBackgroundColorOnScale={false}
    >
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm" />
        <Drawer.Content
          className="fixed inset-x-0 bottom-0 z-50 flex h-[100dvh] flex-col overflow-hidden bg-paper outline-none"
        >
          {/* Central drag handle for iOS native-like touch/drag affordance */}
          <div className="mx-auto mt-3 h-1 w-9 shrink-0 rounded-full bg-white/20" />
          <Drawer.Title className="sr-only">Now playing</Drawer.Title>
          <Drawer.Description className="sr-only">Currently playing track</Drawer.Description>
          <SheetBody />
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}

function SheetBody() {
  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const buffering = usePlayer((s) => s.buffering);
  const position = usePlayer((s) => s.position);
  const duration = usePlayer((s) => s.duration);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);
  const shuffle = usePlayer((s) => s.shuffle);
  const repeat = usePlayer((s) => s.repeat);
  const liked = usePlayer((s) => (current ? !!s.liked[current.id] : false));
  const [showQueue, setShowQueue] = useState(false);

  if (!current) return null;

  return (
    <div className="relative flex h-full flex-col overflow-hidden">
      {/* ---- Background: pure gradient driven by extracted palette (no image filter, no blur) ---- */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-0 grain"
        style={{
          background:
            'radial-gradient(110% 70% at 30% 0%, rgb(var(--tint-1) / .45), transparent 60%),\
             radial-gradient(110% 70% at 80% 25%, rgb(var(--tint-2) / .35), transparent 60%),\
             linear-gradient(180deg, rgba(8,9,14,.35), rgb(var(--paper)))',
        }}
      />

      {/* ---- Header: pinned ---- */}
      <div className="relative z-20">
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-paper/80 to-transparent" />
        <div className="safe-top flex items-center justify-between px-4 pb-2">
          <Drawer.Close asChild>
            <button
              aria-label="Close"
              className="grid size-10 place-items-center rounded-full text-ink-100 hover:bg-white/10 active:scale-95 transition"
            >
              <ChevronDown size={20} />
            </button>
          </Drawer.Close>
          <div className="flex items-center gap-2 text-[10.5px] uppercase tracking-[0.2em] text-ink-200">
            <span data-on={isPlaying} className="size-1.5 rounded-full bg-tint-1 pulse-dot" />
            Now playing
          </div>
          <button
            onClick={() => setShowQueue(true)}
            aria-label="Queue"
            className="grid size-10 place-items-center rounded-full text-ink-100 hover:bg-white/10 active:scale-95 transition"
          >
            <ListMusic size={18} />
          </button>
        </div>
      </div>

      {/* ---- Body ---- */}
      <div className="relative z-10 mx-auto flex w-full max-w-[440px] flex-1 flex-col justify-between px-5 pt-2 overflow-hidden">
        {/* Artwork Centering Container: flex-1 to occupy all available vertical space */}
        <div className="flex flex-1 min-h-0 items-center justify-center py-4">
          <motion.div
            layout
            initial={{ scale: 0.96, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 28 }}
            className="relative aspect-square w-full max-h-full max-w-full overflow-hidden rounded-[24px] ring-1 ring-white/10 shadow-glow"
          >
            <Artwork src={current.artwork} alt={current.title} rounded="" />
            <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/10" />
            <AnimatePresence>
              {!isPlaying && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 0.35 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-black"
                />
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* Controls Section: packed together at the bottom */}
        <div className="flex flex-col gap-5 shrink-0 pb-4">
          {/* Title row */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="truncate text-[22px] font-semibold leading-tight tracking-tight text-ink-50">
                {current.title}
              </h1>
              <div className="mt-1 flex items-center gap-2">
                <span className="truncate text-[14px] text-ink-300">{current.artist}</span>
                <SourceBadge source={current.source} />
              </div>
            </div>
            <button
              onClick={() => usePlayer.getState().toggleLike(current)}
              aria-label={liked ? 'Unlike' : 'Like'}
              className={`grid size-10 shrink-0 place-items-center rounded-full transition ${
                liked ? 'text-rose-400 bg-rose-400/10 ring-1 ring-rose-400/20' : 'text-ink-300 hover:bg-white/10'
              }`}
            >
              <Heart size={18} fill={liked ? 'currentColor' : 'none'} />
            </button>
          </div>

          {/* Seek */}
          <div>
            <Slider.Root
              className="group relative flex h-5 touch-none select-none items-center"
              min={0}
              max={Math.max(1, duration)}
              step={0.1}
              value={[position]}
              onValueChange={([v]) => usePlayer.getState().seek(v)}
              aria-label="Seek"
            >
              <Slider.Track className="relative h-1 w-full grow overflow-hidden rounded-full bg-white/15">
                <Slider.Range
                  className="absolute h-full"
                  style={{
                    background:
                      'linear-gradient(90deg, rgb(var(--tint-1)), rgb(var(--tint-2)), rgb(var(--tint-3)))',
                  }}
                />
              </Slider.Track>
              <Slider.Thumb className="block size-3.5 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,.4)] outline-none ring-4 ring-white/0 transition-all duration-150 group-hover:scale-110 group-hover:ring-white/15 group-active:scale-120 group-active:ring-white/20 focus-visible:scale-110" />
            </Slider.Root>
            <div className="mt-2 flex items-center justify-between text-[11.5px] tabular-nums text-ink-400">
              <span>{fmtTime(position)}</span>
              <span>-{fmtTime(Math.max(0, duration - position))}</span>
            </div>
          </div>

          {/* Transport — equal-width grid so it never overflows */}
          <div className="grid grid-cols-5 items-center gap-1">
            <button
              onClick={() => usePlayer.getState().toggleShuffle()}
              aria-label="Shuffle"
              className={`mx-auto grid size-10 place-items-center rounded-full transition ${
                shuffle ? 'text-tint-1 bg-tint-1/10' : 'text-ink-300 hover:bg-white/10'
              }`}
            >
              <Shuffle size={18} />
            </button>
            <button
              onClick={() => {
                tap('light');
                usePlayer.getState().prev();
              }}
              aria-label="Previous"
              className="mx-auto grid size-12 place-items-center rounded-full text-ink-100 hover:bg-white/10 active:scale-95 transition"
            >
              <SkipBack size={22} fill="currentColor" />
            </button>
            <motion.button
              whileTap={{ scale: 0.9 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              onClick={() => {
                tap('medium');
                usePlayer.getState().toggle();
              }}
              aria-label={isPlaying ? 'Pause' : 'Play'}
              className="mx-auto grid size-[64px] place-items-center rounded-full bg-white text-paper shadow-glow"
            >
              {buffering ? (
                <span className="size-5 animate-spin rounded-full border-2 border-paper border-t-transparent" />
              ) : isPlaying ? (
                <Pause size={26} fill="currentColor" />
              ) : (
                <Play size={26} fill="currentColor" className="translate-x-[1px]" />
              )}
            </motion.button>
            <button
              onClick={() => {
                tap('light');
                usePlayer.getState().next();
              }}
              aria-label="Next"
              className="mx-auto grid size-12 place-items-center rounded-full text-ink-100 hover:bg-white/10 active:scale-95 transition"
            >
              <SkipForward size={22} fill="currentColor" />
            </button>
            <button
              onClick={() => usePlayer.getState().cycleRepeat()}
              aria-label="Repeat"
              className={`mx-auto grid size-10 place-items-center rounded-full transition ${
                repeat !== 'off' ? 'text-tint-1 bg-tint-1/10' : 'text-ink-300 hover:bg-white/10'
              }`}
            >
              {repeat === 'one' ? <Repeat1 size={18} /> : <Repeat size={18} />}
            </button>
          </div>

          {/* Volume + share */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => usePlayer.getState().toggleMute()}
              aria-label={muted ? 'Unmute' : 'Mute'}
              className="text-ink-300 hover:text-ink-50"
            >
              {muted || volume === 0 ? (
                <VolumeX size={18} />
              ) : volume < 0.5 ? (
                <Volume size={18} />
              ) : (
                <div className="relative flex items-center">
                  <Volume2 size={18} className={volume > 1.0 ? "text-tint-1" : ""} />
                  {volume > 1.0 && (
                    <span className="absolute -top-3.5 -right-3.5 text-[8px] font-black text-tint-1 bg-tint-1/10 px-0.5 rounded-[3px] border border-tint-1/20">
                      {Math.round(volume * 100)}%
                    </span>
                  )}
                </div>
              )}
            </button>
            <Slider.Root
              className="group relative flex h-4 flex-1 touch-none select-none items-center"
              min={0}
              max={2}
              step={0.01}
              value={[muted ? 0 : volume]}
              onValueChange={([v]) => usePlayer.getState().setVolume(v)}
              aria-label="Volume"
            >
              <Slider.Track className="relative h-[3px] w-full grow overflow-hidden rounded-full bg-white/15">
                <Slider.Range className={`absolute h-full transition-all ${volume > 1.0 ? 'bg-gradient-to-r from-ink-50/85 to-tint-1' : 'bg-ink-50/85'}`} />
              </Slider.Track>
              <Slider.Thumb className="block size-3 rounded-full bg-white shadow-[0_4px_12px_rgba(0,0,0,.4)] outline-none ring-2 ring-white/10 transition-transform focus-visible:scale-110" />
            </Slider.Root>
            <button
              onClick={async () => {
                if (current.permalink) {
                  try {
                    if (navigator.share) {
                      await navigator.share({ title: current.title, url: current.permalink });
                    } else {
                      await navigator.clipboard.writeText(current.permalink);
                      toast('Link copied');
                    }
                  } catch {
                    /* dismissed */
                  }
                }
              }}
              aria-label="Share"
              className="grid size-9 place-items-center rounded-full text-ink-300 hover:bg-white/10 hover:text-ink-50 transition"
            >
              <Share2 size={16} />
            </button>
          </div>

          <div className="safe-bottom" />
        </div>
      </div>

      <QueueDialog open={showQueue} onOpenChange={setShowQueue} />
    </div>
  );
}

function QueueDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (b: boolean) => void }) {
  const queue = usePlayer((s) => s.queue);
  const index = usePlayer((s) => s.index);
  const current = usePlayer((s) => s.current);

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-md" />
        <Dialog.Content className="fixed inset-x-0 bottom-0 z-[70] mx-auto max-h-[78dvh] w-full max-w-md overflow-hidden rounded-t-[28px] glass-2 grain ring-soft">
          <Dialog.Title className="sr-only">Up next</Dialog.Title>
          <div className="flex items-center justify-between px-5 py-4">
            <h3 className="text-[15px] font-semibold text-ink-50">Up next</h3>
            <span className="text-[11.5px] text-ink-400">{queue.length} tracks</span>
          </div>
          <div className="hairline" />
          <ScrollArea.Root className="max-h-[64dvh] overflow-hidden">
            <ScrollArea.Viewport className="h-full w-full">
              <div className="flex flex-col gap-1 p-2">
                {queue.map((t, i) => {
                  const active = current?.id === t.id;
                  const upcoming = i > index;
                  return (
                    <button
                      key={`${t.id}-${i}`}
                      onClick={() => {
                        usePlayer.getState().play(t, queue);
                        onOpenChange(false);
                      }}
                      className={`flex items-center gap-3 rounded-2xl px-2.5 py-2.5 text-left border transition-all duration-200 ${
                        active
                          ? 'bg-tint-1/[0.08] border-tint-1/15 text-tint-1 ring-1 ring-tint-1/10'
                          : upcoming
                          ? 'border-transparent hover:bg-white/[0.04]'
                          : 'border-transparent opacity-50 hover:opacity-90'
                      }`}
                    >
                      <div className="size-10 overflow-hidden rounded-lg ring-1 ring-white/10">
                        <Artwork src={t.artwork} alt={t.title} />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] font-medium">
                          {t.title}
                        </div>
                        <div className="truncate text-[11.5px] text-ink-400">{t.artist}</div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea.Viewport>
          </ScrollArea.Root>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
