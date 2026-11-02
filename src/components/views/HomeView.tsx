'use client';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Flame } from 'lucide-react';
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

const motionProps = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -10 },
  transition: { type: 'spring', stiffness: 320, damping: 32 },
} as const;

export function HomeView() {
  const { data, isLoading } = useQuery({ queryKey: ['discover'], queryFn: fetchDiscover });
  const tracks = data ?? [];
  const recents = usePlayer((s) => s.history);

  const featured = tracks[0];
  const trending = tracks.slice(0, 12);
  const focus = tracks.slice(1, 9);
  const more = tracks.slice(9);

  return (
    <motion.div {...motionProps} className="space-y-6 pb-2">
      <Greeting count={tracks.length} />

      {isLoading ? (
        <HeroSkeleton />
      ) : featured ? (
        <HeroTrack track={featured} queue={tracks} />
      ) : null}

      <Section eyebrow="SoundCloud · Trending" title="Hot right now">
        {isLoading ? <TileSkeletons /> : <TileCarousel tracks={trending} />}
      </Section>

      {recents.length > 0 && (
        <Section title="Recently played" eyebrow="Your rotation">
          <div className="flex flex-col gap-0.5">
            {recents.slice(0, 6).map((t, i) => (
              <TrackRow key={`${t.id}-${i}`} track={t} queue={recents} index={i} />
            ))}
          </div>
        </Section>
      )}

      <Section title="Fresh finds" eyebrow="Single source · SoundCloud">
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

      <Section title="Dig deeper">
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
    </motion.div>
  );
}

function Greeting({ count }: { count: number }) {
  const hour = new Date().getHours();
  const greet = hour < 5 ? 'Late night' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';
  return (
    <div className="rounded-[24px] glass p-5">
      <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.2em] text-[#ffb020]">
        <Flame size={13} />
        {count > 0 ? `${count} tracks loaded` : 'SoundCloud only'}
      </div>
      <h1 className="mt-2 text-[30px] font-bold leading-[1.05] tracking-tight text-white">
        {greet}.
        <span className="ml-2 bg-gradient-to-r from-[#ff5500] via-[#ffb020] to-[#ff2d55] bg-clip-text text-transparent">
          Feel the ember.
        </span>
      </h1>
      <p className="mt-1.5 text-[13.5px] leading-relaxed text-ink-400">
        One source, zero friction. Pure SoundCloud energy in a warm little player.
      </p>
    </div>
  );
}
