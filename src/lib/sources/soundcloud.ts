import type { Track } from '../types';

/**
 * SoundCloud doesn't accept new API registrations. We obtain a public web client_id
 * by scraping the latest JS bundle that the soundcloud.com landing page imports.
 * The id rotates ~weekly, so we cache it in memory and re-scrape on 401/403.
 *
 * This module is server-only.
 */

const UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const SCRIPT_RE = /https:\/\/a-v2\.sndcdn\.com\/assets\/[A-Za-z0-9_\-./]+\.js/g;
// Multiple shapes seen across bundles: `,client_id:"..."`, `{client_id:"..."}`,
// `client_id:"..."` at column 0, or `client_id="..."` (rare). Also case where
// the value is followed by `&` in a query template literal.
const CLIENT_ID_RES = [
  /client_id\s*:\s*"([A-Za-z0-9]{20,})"/,
  /client_id\s*=\s*"([A-Za-z0-9]{20,})"/,
];

let cached: { id: string; ts: number } | null = null;
let inflight: Promise<string> | null = null;
const TTL_MS = 1000 * 60 * 60 * 12; // 12h

async function fetchText(url: string): Promise<string | null> {
  try {
    const r = await fetch(url, {
      headers: {
        'user-agent': UA,
        accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'accept-language': 'en-US,en;q=0.9',
      },
      cache: 'no-store',
    });
    if (!r.ok) return null;
    return await r.text();
  } catch {
    return null;
  }
}

function findId(js: string): string | null {
  for (const re of CLIENT_ID_RES) {
    const m = js.match(re);
    if (m) return m[1];
  }
  return null;
}

async function scrapeClientId(): Promise<string> {
  const html = await fetchText('https://soundcloud.com');
  if (!html) throw new Error('SC: failed to load soundcloud.com');

  const scripts = Array.from(new Set(html.match(SCRIPT_RE) ?? []));
  if (scripts.length === 0) throw new Error('SC: no script tags found');

  // Try last → first sequentially (last bundle most often holds it),
  // but if not found within first 4 attempts, fan out parallel.
  for (let i = scripts.length - 1; i >= 0; i--) {
    const js = await fetchText(scripts[i]);
    if (js) {
      const id = findId(js);
      if (id) return id;
    }
    if (scripts.length - i >= 4) break; // fall back to parallel
  }

  const fetched = await Promise.all(scripts.map(fetchText));
  for (const js of fetched) {
    if (!js) continue;
    const id = findId(js);
    if (id) return id;
  }
  throw new Error('SC: client_id not found in any bundle');
}

export async function getClientId(force = false): Promise<string> {
  if (!force && cached && Date.now() - cached.ts < TTL_MS) return cached.id;
  if (inflight) return inflight;
  inflight = (async () => {
    try {
      const id = await scrapeClientId();
      cached = { id, ts: Date.now() };
      return id;
    } finally {
      inflight = null;
    }
  })();
  return inflight;
}

async function scFetch(path: string, params: Record<string, string | number> = {}, retry = true): Promise<unknown> {
  const id = await getClientId();
  const qs = new URLSearchParams({ ...Object.fromEntries(Object.entries(params).map(([k, v]) => [k, String(v)])), client_id: id });
  const url = `https://api-v2.soundcloud.com${path}?${qs}`;
  const r = await fetch(url, { headers: { 'user-agent': UA }, cache: 'no-store' });
  if ((r.status === 401 || r.status === 403) && retry) {
    await getClientId(true);
    return scFetch(path, params, false);
  }
  if (!r.ok) throw new Error(`SC ${r.status} ${path}`);
  return r.json();
}

interface SCUser { id: number; username: string; permalink_url?: string }
interface SCTranscoding { url: string; format?: { protocol?: string; mime_type?: string } }
interface SCTrack {
  id: number;
  title: string;
  duration: number; // ms
  artwork_url?: string | null;
  permalink_url?: string;
  playback_count?: number;
  user: SCUser;
  media: { transcodings: SCTranscoding[] };
}
interface SCSearch { collection: SCTrack[] }

function pickHls(t: SCTrack): SCTranscoding | null {
  const list = t.media?.transcodings ?? [];
  // Prefer progressive (mp3) if present (rare for new uploads). Otherwise hls aac.
  const progressive = list.find((x) => x.format?.protocol === 'progressive');
  if (progressive) return progressive;
  return list.find((x) => x.format?.protocol === 'hls') ?? list[0] ?? null;
}

function mapTrack(t: SCTrack): Track | null {
  const tr = pickHls(t);
  if (!tr) return null;
  const isHls = tr.format?.protocol !== 'progressive';
  // Use t300x300 (smaller payload, faster decode on mobile) instead of t500x500.
  const art = (t.artwork_url || '').replace('-large.', '-t300x300.');
  return {
    id: `soundcloud:${t.id}`,
    source: 'soundcloud',
    nativeId: String(t.id),
    title: t.title,
    artist: t.user?.username || 'Unknown',
    artistId: t.user?.id != null ? String(t.user.id) : undefined,
    artwork: art || undefined,
    durationSec: Math.round((t.duration || 0) / 1000),
    streamHint: { kind: isHls ? 'resolve' : 'mp3', url: tr.url },
    permalink: t.permalink_url,
    playCount: t.playback_count,
  };
}

export async function soundcloudSearch(q: string, limit = 20, offset = 0): Promise<Track[]> {
  const j = (await scFetch('/search/tracks', { q, limit, offset })) as SCSearch;
  return (j.collection ?? []).map(mapTrack).filter((x): x is Track => !!x);
}

export async function soundcloudTrending(limit = 20): Promise<Track[]> {
  // The /charts endpoint sometimes 404s for non-logged-in clients; fall back
  // to a broad search across popular genres which is uniformly available.
  try {
    const j = (await scFetch('/charts', {
      kind: 'trending',
      genre: 'soundcloud:genres:all-music',
      limit,
    })) as { collection: { track: SCTrack }[] };
    const out = (j.collection ?? []).map((c) => mapTrack(c.track)).filter((x): x is Track => !!x);
    if (out.length) return out;
  } catch {
    /* fall through to search-based trending */
  }
  return soundcloudSearch('top hits 2025', limit);
}

/**
 * Resolve a SoundCloud transcoding URL to an actual playable URL.
 * For HLS, returns { kind: 'hls', url: m3u8 }. For progressive, { kind: 'mp3', url }.
 */
export async function soundcloudResolve(transcodingUrl: string): Promise<{ kind: 'hls' | 'mp3'; url: string }> {
  const id = await getClientId();
  const sep = transcodingUrl.includes('?') ? '&' : '?';
  const r = await fetch(`${transcodingUrl}${sep}client_id=${id}`, {
    headers: { 'user-agent': UA },
    cache: 'no-store',
  });
  if (r.status === 401 || r.status === 403) {
    await getClientId(true);
    return soundcloudResolve(transcodingUrl);
  }
  if (!r.ok) throw new Error(`SC resolve ${r.status}`);
  const { url } = (await r.json()) as { url: string };
  const kind: 'hls' | 'mp3' = url.includes('.m3u8') ? 'hls' : 'mp3';
  return { kind, url };
}
