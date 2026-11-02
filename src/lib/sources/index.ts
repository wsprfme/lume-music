import type { Track } from '../types';
import { soundcloudSearch, soundcloudTrending } from './soundcloud';
import { youtubeSearch, youtubeTrending } from './youtube';

function interleave<T>(...lists: T[][]): T[] {
  const out: T[] = [];
  const max = Math.max(0, ...lists.map((l) => l.length));
  for (let i = 0; i < max; i++) for (const l of lists) if (l[i]) out.push(l[i]);
  return out;
}

export async function discover(limit = 20): Promise<Track[]> {
  const [s, y] = await Promise.allSettled([
    soundcloudTrending(limit),
    youtubeTrending(limit),
  ]);
  const ss = s.status === 'fulfilled' ? s.value : [];
  const yy = y.status === 'fulfilled' ? y.value : [];
  return interleave(ss, yy).slice(0, limit * 2);
}

export async function search(q: string, limit = 20, offset = 0): Promise<Track[]> {
  const [s, y] = await Promise.allSettled([
    soundcloudSearch(q, limit, offset),
    youtubeSearch(q, limit),
  ]);
  const ss = s.status === 'fulfilled' ? s.value : [];
  const yy = y.status === 'fulfilled' ? y.value : [];
  return interleave(ss, yy);
}
