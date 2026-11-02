'use client';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Track } from './types';

export type RepeatMode = 'off' | 'all' | 'one';

interface PlayerState {
  // queue
  queue: Track[];
  index: number;
  history: Track[]; // most-recent first
  shuffle: boolean;
  repeat: RepeatMode;
  // playback
  current: Track | null;
  isPlaying: boolean;
  position: number; // seconds
  duration: number;
  buffering: boolean;
  // audio
  volume: number; // 0..1
  muted: boolean;
  // ui
  expanded: boolean;
  // saved (full track snapshots so liked stays usable across sessions)
  liked: Record<string, Track>;
  // last route — for resume on cold start
  lastTab?: 'home' | 'discover' | 'search' | 'liked';

  // queue ops
  setQueue: (tracks: Track[], startIndex?: number) => void;
  play: (track: Track, queue?: Track[]) => void;
  enqueueNext: (t: Track) => void;
  enqueueLast: (t: Track) => void;
  removeAt: (i: number) => void;

  // transport
  toggle: () => void;
  next: () => void;
  prev: () => void;
  seek: (s: number) => void;
  setPosition: (s: number) => void;
  setDuration: (s: number) => void;
  setBuffering: (b: boolean) => void;
  setIsPlaying: (b: boolean) => void;

  // audio
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;

  // ui
  setExpanded: (b: boolean) => void;
  setLastTab: (t: PlayerState['lastTab']) => void;
  toggleLike: (track: Track) => void;
  isLiked: (id: string) => boolean;
}

function shuffled<T>(arr: T[], keepFirst = true): T[] {
  const a = arr.slice();
  const start = keepFirst ? 1 : 0;
  for (let i = a.length - 1; i > start; i--) {
    const j = start + Math.floor(Math.random() * (i - start + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export const usePlayer = create<PlayerState>()(
  persist(
    (set, get) => ({
      queue: [],
      index: -1,
      history: [],
      shuffle: false,
      repeat: 'off',
      current: null,
      isPlaying: false, // will be set false on rehydrate; user must tap to resume
      position: 0,
      duration: 0,
      buffering: false,
      volume: 0.85,
      muted: false,
      expanded: false,
      liked: {},
      lastTab: 'home',

      setQueue: (tracks, startIndex = 0) => {
        const t = tracks[startIndex] ?? null;
        set({ queue: tracks, index: startIndex, current: t });
      },
      play: (track, queue) => {
        const q = queue ?? get().queue;
        const idx = q.findIndex((t) => t.id === track.id);
        const cur = get().current;
        const hist = cur && cur.id !== track.id ? [cur, ...get().history.slice(0, 49)] : get().history;
        if (idx >= 0) set({ queue: q, index: idx, current: q[idx], isPlaying: true, history: hist, position: 0 });
        else set({ queue: [track], index: 0, current: track, isPlaying: true, history: hist, position: 0 });
      },
      enqueueNext: (t) => {
        const { queue, index } = get();
        const q = queue.slice();
        q.splice(index + 1, 0, t);
        set({ queue: q });
      },
      enqueueLast: (t) => set((s) => ({ queue: [...s.queue, t] })),
      removeAt: (i) => {
        const { queue, index } = get();
        const q = queue.filter((_, k) => k !== i);
        let ni = index;
        if (i < index) ni = index - 1;
        else if (i === index) ni = Math.min(index, q.length - 1);
        set({ queue: q, index: ni, current: q[ni] ?? null });
      },

      toggle: () => set((s) => ({ isPlaying: s.current ? !s.isPlaying : false })),
      next: () => {
        const { queue, index, repeat, shuffle } = get();
        if (queue.length === 0) return;
        if (repeat === 'one') return set({ position: 0 });
        let ni = index + 1;
        if (shuffle) {
          ni = Math.floor(Math.random() * queue.length);
          if (ni === index && queue.length > 1) ni = (ni + 1) % queue.length;
        }
        if (ni >= queue.length) {
          if (repeat === 'all') ni = 0;
          else return set({ isPlaying: false, position: 0 });
        }
        const cur = get().current;
        const hist = cur ? [cur, ...get().history.slice(0, 49)] : get().history;
        set({ index: ni, current: queue[ni], isPlaying: true, position: 0, history: hist });
      },
      prev: () => {
        const { queue, index, position } = get();
        if (queue.length === 0) return;
        if (position > 3) return set({ position: 0 });
        const ni = (index - 1 + queue.length) % queue.length;
        set({ index: ni, current: queue[ni], isPlaying: true, position: 0 });
      },
      seek: (s) => set({ position: s }),
      setPosition: (s) => set({ position: s }),
      setDuration: (s) => set({ duration: s }),
      setBuffering: (b) => set({ buffering: b }),
      setIsPlaying: (b) => set({ isPlaying: b }),

      setVolume: (v) => set({ volume: Math.max(0, Math.min(2, v)), muted: v === 0 }),
      toggleMute: () => set((s) => ({ muted: !s.muted })),
      toggleShuffle: () => {
        const { shuffle, queue, current } = get();
        if (!shuffle && current) {
          const rest = queue.filter((t) => t.id !== current.id);
          const sh = shuffled([current, ...rest], true);
          set({ shuffle: true, queue: sh, index: 0, current: sh[0] });
        } else {
          set({ shuffle: !shuffle });
        }
      },
      cycleRepeat: () =>
        set((s) => ({ repeat: s.repeat === 'off' ? 'all' : s.repeat === 'all' ? 'one' : 'off' })),

      setExpanded: (b) => set({ expanded: b }),
      setLastTab: (t) => set({ lastTab: t }),
      toggleLike: (track) =>
        set((s) => {
          const liked = { ...s.liked };
          if (liked[track.id]) delete liked[track.id];
          else liked[track.id] = track;
          return { liked };
        }),
      isLiked: (id) => !!get().liked[id],
    }),
    {
      name: 'lume:player',
      version: 2,
      migrate: (state, fromVersion) => {
        const s = (state as Partial<PlayerState> & { liked?: unknown }) ?? {};
        if (fromVersion < 2 && s.liked && typeof s.liked === 'object') {
          const next: Record<string, Track> = {};
          for (const [k, v] of Object.entries(s.liked as Record<string, unknown>)) {
            if (v && typeof v === 'object' && (v as Track).id) next[k] = v as Track;
          }
          s.liked = next;
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return s as any;
      },
      partialize: (s) => ({
        volume: s.volume,
        muted: s.muted,
        shuffle: s.shuffle,
        repeat: s.repeat,
        liked: s.liked,
        lastTab: s.lastTab,
        // resume state
        queue: s.queue,
        index: s.index,
        current: s.current,
        position: s.position,
        history: s.history,
      }),
      // Always start paused after rehydrate (browser autoplay rules).
      onRehydrateStorage: () => (state) => {
        if (state) state.isPlaying = false;
      },
    },
  ),
);
