'use client';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { Section } from '../Section';
import { RowSkeletons, TileSkeletons } from '../Skeletons';
import { TileCarousel } from '../TileCarousel';
import { TrackRow } from '../TrackRow';
import type { Track } from '@/lib/types';

const MOODS = [
  { key: 'lofi', label: 'Lofi' },
  { key: 'house', label: 'House' },
  { key: 'phonk', label: 'Phonk' },
  { key: 'jazz', label: 'Jazz' },
  { key: 'ambient', label: 'Ambient' },
  { key: 'rnb', label: 'R&B' },
  { key: 'rock', label: 'Rock' },
  { key: 'electronic', label: 'Electronic' },
] as const;

async function fetchSearch(q: string): Promise<Track[]> {
  const r = await fetch(`/api/search?q=${encodeURIComponent(q)}`);
  const j = (await r.json()) as { tracks: Track[] };
  return j.tracks ?? [];
}

export function DiscoverView() {
  const [mood, setMood] = useState<(typeof MOODS)[number]['key']>('lofi');
  const { data: trending } = useQuery({ queryKey: ['discover'], queryFn: () =>
    fetch('/api/discover').then((r) => r.json()).then((j: { tracks: Track[] }) => j.tracks),
  });
  const { data, isLoading } = useQuery({
    queryKey: ['mood', mood],
    queryFn: () => fetchSearch(mood),
  });

  const t = data ?? [];
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-[24px] font-bold tracking-tight text-white">
          Discover
        </h1>
      </header>

      <div className="-mx-4 px-4">
        <div className="snap-x-list flex gap-2 overflow-x-auto pb-1">
          {MOODS.map((m) => {
            const active = m.key === mood;
            return (
              <button
                key={m.key}
                onClick={() => setMood(m.key)}
                className={`shrink-0 rounded-full px-3.5 py-1.5 text-[13px] transition ${
                  active
                    ? 'bg-white text-paper'
                    : 'glass-pill text-ink-200 hover:bg-white/10'
                }`}
              >
                {m.label}
              </button>
            );
          })}
        </div>
      </div>

      <Section title="Moods">
        {isLoading ? <TileSkeletons /> : <TileCarousel tracks={t.slice(0, 12)} />}
      </Section>

      <Section title="Tracks">
        {isLoading ? (
          <RowSkeletons rows={8} />
        ) : (
          <div className="flex flex-col">
            {t.map((track, i) => (
              <TrackRow key={track.id} track={track} queue={t} index={i} showIndex />
            ))}
          </div>
        )}
      </Section>

      {trending && (
        <Section title="Trending">
          <TileCarousel tracks={trending.slice(0, 12)} />
        </Section>
      )}
    </div>
  );
}
