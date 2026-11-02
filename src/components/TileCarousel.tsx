'use client';
import { useRef } from 'react';
import { TrackTile } from './TrackTile';
import type { Track } from '@/lib/types';

export function TileCarousel({ tracks }: { tracks: Track[] }) {
  const ref = useRef<HTMLDivElement | null>(null);
  return (
    <div className="-mx-4 px-4">
      <div
        ref={ref}
        className="snap-x-list flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]"
      >
        {tracks.map((t) => (
          <TrackTile key={t.id} track={t} queue={tracks} />
        ))}
        <div className="shrink-0 pr-2" />
      </div>
    </div>
  );
}
