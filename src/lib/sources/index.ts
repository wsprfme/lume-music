import type { Track } from '../types';
import { soundcloudSearch, soundcloudTrending } from './soundcloud';

export async function discover(limit = 20): Promise<Track[]> {
  const s = await soundcloudTrending(limit).catch(() => [] as Track[]);
  return s.slice(0, limit);
}

export async function search(q: string, limit = 20, offset = 0): Promise<Track[]> {
  return soundcloudSearch(q, limit, offset).catch(() => [] as Track[]);
}
