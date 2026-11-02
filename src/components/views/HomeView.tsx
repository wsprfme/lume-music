'use client';
import { useQuery } from '@tanstack/react-query';
import { HeroTrack } from '../HeroTrack';
import { HeroSkeleton, RowSkeletons, TileSkeletons } from '../Skeletons';
import { Section } from '../Section';
import { TileCarousel } from '../TileCarousel';
import { TrackRow } from '../TrackRow';
import type { Track } from '@/lib/types';
import { usePlayer } from '@/lib/player-store';

async function fetchDiscover(): Promise<Track[]> {
  const r = await fetch('/api/discover');
  const j = (await r.json()) as { tracks: Track[] };
  return j.tracks ?? [];
}

export function HomeView() {
  const { data, isLoading } = useQuery({ queryKey: ['discover'], queryFn: fetchDiscover });
  const tracks = data ?? [];
  const recents = usePlayer((s) => s.history);

  const featured = tracks[0];
  const trending = tracks.slice(0, 12);
  const focus = tracks.slice(1, 9);
  const more = tracks.slice(9);

  return (
    <div className="space-y-6 pb-2">
      <Greeting />

      {isLoading ? (
        <HeroSkeleton />
      ) : featured ? (
        <HeroTrack track={featured} queue={tracks} />
      ) : null}

      <Section title="Trending">
        {isLoading ? <TileSkeletons /> : <TileCarousel tracks={trending} />}
      </Section>

      {recents.length > 0 && (
        <Section title="Recently played">
          <div className="flex flex-col gap-0.5">
            {recents.slice(0, 6).map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} queue={recents} index={i} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Fresh finds">
        {isLoading ? (
          <RowSkeletons rows={6} />
        ) : (
          <div className="flex flex-col gap-0.5">
            {focus.map((t, i) => (
              <TrackRow key={t.id} track={t} queue={tracks} index={i + 1} />
            ))}
          </div>
        )}
      </Section>

      <Section title="More">
        {isLoading ? (
          <RowSkeletons rows={6} />
        ) : (
          <div className="flex flex-col gap-0.5">
            {more.slice(0, 14).map((t, i) => (
              <TrackRow key={t.id} track={t} queue={tracks} index={i + 9} />
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}

function Greeting() {
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="pt-1">
      <h1 className="text-[24px] font-bold tracking-tight text-white">{greet}</h1>
    </div>
  );
}
