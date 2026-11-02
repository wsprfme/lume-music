'use client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { RowSkeletons } from '../Skeletons';
import { TrackRow } from '../TrackRow';
import type { Track } from '@/lib/types';

const RECENT_KEY = 'lume:recent-searches';
const PREFILL_KEY = 'lume:prefill-search';
const SUGGESTIONS = [
  'sunset drive',
  'late night jazz',
  'study lofi',
  'house anthems',
  'morning ambient',
  'phonk gym',
  'indie pop',
  'r&b 2025',
];

async function fetchSearch(q: string, offset = 0): Promise<Track[]> {
  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}&offset=${offset}&limit=20`);
  const j = (await r.json()) as { tracks: Track[] };
  return j.tracks ?? [];
}

function readRecent(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) || '[]');
  } catch {
    return [];
  }
}
function pushRecent(q: string) {
  const cur = readRecent().filter((x) => x !== q);
  const next = [q, ...cur].slice(0, 8);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export function SearchView() {
  const [q, setQ] = useState('');
  const [debounced, setDebounced] = useState('');
  const [recent, setRecent] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setRecent(readRecent()), []);
  useEffect(() => {
    // Web Share Target prefill (set in app/page.tsx before navigating to this view)
    try {
      const v = sessionStorage.getItem(PREFILL_KEY);
      if (v) {
        setQ(v);
        sessionStorage.removeItem(PREFILL_KEY);
      }
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(q.trim()), 320);
    return () => clearTimeout(id);
  }, [q]);
  useEffect(() => {
    const k = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, []);

  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['search', debounced],
    queryFn: ({ pageParam = 0 }) => fetchSearch(debounced, pageParam),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < 20) return undefined;
      return allPages.length * 20;
    },
    enabled: debounced.length > 0,
    staleTime: 30_000,
  });

  const observerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = observerRef.current;
    if (!el) return;

    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { rootMargin: '300px' }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const tracks = data ? data.pages.flatMap((page) => page) : [];

  function commit(value: string) {
    if (!value) return;
    pushRecent(value);
    setRecent(readRecent());
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ type: 'spring', stiffness: 320, damping: 32 }}
      className="space-y-5"
    >
      <header>
        <div className="text-[10.5px] uppercase tracking-[0.2em] text-ink-400">Search</div>
        <h1 className="text-[28px] font-semibold leading-tight tracking-tight text-ink-50">
          Find your next loop
        </h1>
      </header>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          commit(q.trim());
        }}
        className="flex items-center gap-2 rounded-2xl px-3 py-3 glass-pill"
      >
        <Search size={18} className="text-ink-400" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Songs, artists, vibes…"
          className="flex-1 bg-transparent text-[15px] text-ink-50 placeholder:text-ink-500 focus:outline-none"
        />
        {q && (
          <button
            type="button"
            onClick={() => setQ('')}
            aria-label="Clear"
            className="grid size-7 place-items-center rounded-full text-ink-300 hover:bg-white/10"
          >
            <X size={14} />
          </button>
        )}
        <kbd className="hidden rounded-md bg-white/10 px-1.5 py-0.5 text-[10px] text-ink-300 sm:block">
          /
        </kbd>
      </form>

      <AnimatePresence mode="wait">
        {!debounced && (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-5"
          >
            {recent.length > 0 && (
              <div>
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-[13px] font-medium text-ink-300">Recent</h4>
                  <button
                    onClick={() => {
                      localStorage.removeItem(RECENT_KEY);
                      setRecent([]);
                    }}
                    className="text-[11.5px] text-ink-500 hover:text-ink-300"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {recent.map((r) => (
                    <button
                      key={r}
                      onClick={() => {
                        setQ(r);
                        commit(r);
                      }}
                      className="glass-pill rounded-full px-3 py-1.5 text-[12.5px] text-ink-200 hover:bg-white/10"
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div>
              <h4 className="mb-2 text-[13px] font-medium text-ink-300">Try a vibe</h4>
              <div className="flex flex-wrap gap-2">
                {SUGGESTIONS.map((s) => (
                  <button
                    key={s}
                    onClick={() => {
                      setQ(s);
                      commit(s);
                    }}
                    className="glass-pill rounded-full px-3 py-1.5 text-[12.5px] text-ink-200 hover:bg-white/10"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        )}

        {debounced && isLoading && (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <RowSkeletons rows={8} />
          </motion.div>
        )}

        {debounced && !isLoading && (
          <motion.div
            key={debounced}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {tracks.length > 0 ? (
              <>
                <div className="mb-2 text-[12px] text-ink-400">{tracks.length} results</div>
                <div className="flex flex-col">
                  {tracks.map((t, i) => (
                    <TrackRow
                      key={t.id}
                      track={t}
                      queue={tracks}
                      index={i}
                      onPlay={() => {
                        if (debounced) commit(debounced);
                      }}
                    />
                  ))}
                </div>
                {hasNextPage && (
                  <div ref={observerRef} className="py-6 flex justify-center">
                    {isFetchingNextPage ? (
                      <div className="size-5 animate-spin rounded-full border-2 border-white/40 border-t-transparent" />
                    ) : (
                      <span className="text-[12px] text-ink-400">Scroll down to load more</span>
                    )}
                  </div>
                )}
              </>
            ) : (
              <Empty q={debounced} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function Empty({ q }: { q: string }) {
  return (
    <div className="rounded-3xl px-5 py-10 text-center glass">
      <div className="text-[15px] text-ink-50">Nothing matched "{q}"</div>
      <div className="mt-1 text-[13px] text-ink-400">Try fewer words or a different mood.</div>
    </div>
  );
}
