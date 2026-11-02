'use client';
import { Heart, Play, Shuffle } from 'lucide-react';
import { TrackRow } from '../TrackRow';
import { usePlayer } from '@/lib/player-store';

export function LikedView() {
  const liked = usePlayer((s) => s.liked);
  const tracks = Object.values(liked);

  return (
    <div className="space-y-5">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-white">Liked</h1>
        <p className="mt-1 text-[13px] text-ink-400">
          {tracks.length === 0 ? 'Tap the heart on any track to save it here.' : `${tracks.length} saved on this device.`}
        </p>
      </header>

      {tracks.length === 0 ? (
        <div className="rounded-3xl border border-white/[0.08] bg-paper-2 px-5 py-12 text-center">
          <div className="mx-auto mb-3 grid size-12 place-items-center rounded-full bg-white/10 text-rose-400">
            <Heart size={20} />
          </div>
          <div className="text-[15px] text-white">Nothing liked yet</div>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-2">
            <button
              onClick={() => usePlayer.getState().play(tracks[0], tracks)}
              className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-[13px] font-semibold text-black active:scale-[0.98]"
            >
              <Play size={14} fill="currentColor" /> Play
            </button>
            <button
              onClick={() => {
                const list = [...tracks].sort(() => Math.random() - 0.5);
                if (list[0]) usePlayer.getState().play(list[0], list);
                if (!usePlayer.getState().shuffle) usePlayer.getState().toggleShuffle();
              }}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-paper-2 px-4 py-2 text-[13px] text-white"
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
    </div>
  );
}
