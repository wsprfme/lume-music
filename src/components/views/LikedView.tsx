'use client';
import { motion } from 'framer-motion';
import { Heart, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../TrackRow';
import { usePlayer } from '@/lib/player-store';

export function LikedView() {
  const liked = usePlayer((s) => s.liked);
  const tracks = Object.values(liked);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="space-y-5"
    >
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-400">Library</div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink-50">Liked</h1>
        <p className="mt-1 text-[13.5px] text-ink-400">
          {tracks.length === 0 ? 'Tap the heart on any track to save it here.' : `${tracks.length} tracks saved on this device.`}
        </p>
      </header>

      {tracks.length === 0 ? (
        <div className="rounded-3xl px-5 py-12 text-center glass">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white/10 text-rose-400">
            <Heart size={20} />
          </div>
          <div className="text-[15px] text-ink-50">Nothing liked yet</div>
          <div className="mt-1 text-[13px] text-ink-400">
            Use the heart on any track and it'll show up here.
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => usePlayer.getState().play(tracks[0], tracks)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-paper shadow-glow active:scale-[0.98] transition"
            >
              <Play size={14} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => {
                const list = [...tracks].sort(() => Math.random() - 0.5);
                if (list[0]) usePlayer.getState().play(list[0], list);
                if (!usePlayer.getState().shuffle) usePlayer.getState().toggleShuffle();
              }}
              className="inline-flex items-center gap-2 rounded-full glass-pill px-4 py-2 text-[13px] text-ink-50 hover:bg-white/10 transition"
            >
              <Shuffle size={13} /> Shuffle
            </button>
          </div>
          <div className="flex flex-col">
            {tracks.map((t, i) => (
              <TrackRow key={t.id} track={t} queue={tracks} index={i} />
            ))}
          </div>
        </>
      )}
    </motion.div>
  );
}
