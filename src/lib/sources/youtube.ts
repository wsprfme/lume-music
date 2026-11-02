import type { Track } from '../types';

export function parseYouTube(input = ''): { videoId: string | null; playlistId: string | null } {
  const s = String(input).trim();
  if (!s) return { videoId: null, playlistId: null };
  if (/^[\w-]{11}$/.test(s)) return { videoId: s, playlistId: null };
  let u: URL;
  try {
    u = new URL(s.startsWith('http') ? s : `https://${s}`);
  } catch {
    return { videoId: null, playlistId: null };
  }
  let videoId = u.searchParams.get('v');
  const mPath =
    u.pathname.match(/^\/(shorts|embed|live|watch)\/([\w-]{11})/) ||
    u.pathname.match(/^\/([\w-]{11})$/);
  if (!videoId && mPath) videoId = mPath[mPath.length - 1];
  if (videoId && !/^[\w-]{11}$/.test(videoId)) videoId = null;
  const playlistId = u.searchParams.get('list');
  if (u.hostname.replace(/^www\.|^m\.|^music\./, '') === 'youtu.be' && !videoId) {
    const m = u.pathname.match(/^\/([\w-]{11})/);
    if (m) videoId = m[1];
  }
  return { videoId, playlistId };
}

export function isPlaylistUrl(q: string): boolean {
  const s = q.trim();
  if (!s) return false;
  if (/^(PL|RD|OL|UU|FL|LL)[\w-]{10,}$/.test(s)) return true;
  if (!/youtu\.?be|youtube\.com|list=/.test(s)) return false;
  const { playlistId, videoId } = parseYouTube(s);
  return !!(playlistId || videoId);
}

async function ytGet<T>(path: string): Promise<T> {
  // Server (Route Handler) can't fetch relative URLs — hit engine directly.
  // Client uses /api/yt/* handlers (cached proxy).
  const ENGINE = process.env.YT_ENGINE_BASE || 'https://lume-yt.byasaja.my.id';
  const url =
    typeof window === 'undefined'
      ? `${ENGINE}${path.replace(/^\/api\/yt/, '/api')}`
      : path;
  const r = await fetch(url, { cache: 'no-store' });
  if (!r.ok) throw new Error(`yt ${r.status}`);
  return r.json() as Promise<T>;
}

export async function youtubeSearch(q: string, limit = 20): Promise<Track[]> {
  const j = await ytGet<{ tracks: Track[] }>(
    `/api/yt/search?q=${encodeURIComponent(q)}&limit=${limit}`
  );
  return j.tracks ?? [];
}

export async function youtubeTrending(limit = 20): Promise<Track[]> {
  const j = await ytGet<{ tracks: Track[] }>(`/api/yt/discover?limit=${limit}`);
  return j.tracks ?? [];
}

export async function youtubePlaylist(
  urlOrId: string,
  limit = 50
): Promise<{ id: string | null; title: string; tracks: Track[] }> {
  const j = await ytGet<{ id: string | null; title: string; tracks: Track[] }>(
    `/api/yt/playlist?url=${encodeURIComponent(urlOrId)}&limit=${limit}`
  );
  return j;
}

/** Probe which videoIds are actually playable (parallel, cached). Returns ok ids in order. */
export async function checkPlayable(ids: string[]): Promise<{ id: string; ok: boolean }[]> {
  if (!ids.length) return [];
  const j = await ytGet<{ results: { id: string; ok: boolean }[] }>(
    `/api/yt/check?ids=${encodeURIComponent(ids.slice(0, 10).join(','))}`
  );
  return j.results ?? [];
}
