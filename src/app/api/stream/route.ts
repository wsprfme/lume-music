import { NextResponse } from 'next/server';
import { soundcloudResolve } from '@/lib/sources/soundcloud';

export const runtime = 'nodejs';

const BASE = process.env.YT_ENGINE_BASE || 'https://lume-yt.byasaja.my.id';

/**
 * Resolves a track's playable URL.
 * Body: { source: 'soundcloud'|'youtube', nativeId?: string, transcoding?: string }
 *   - soundcloud: requires `transcoding`, returns { kind:'hls'|'mp3', url }
 *   - youtube: requires `nativeId` (videoId), returns { kind:'mp3', url: BE audio proxy (stable, range-capable) }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      source: 'soundcloud' | 'youtube';
      nativeId?: string;
      transcoding?: string;
    };
    if (body.source === 'soundcloud') {
      if (!body.transcoding) return NextResponse.json({ error: 'transcoding required' }, { status: 400 });
      const r = await soundcloudResolve(body.transcoding);
      return NextResponse.json(r);
    }
    if (body.source === 'youtube') {
      if (!body.nativeId || !/^[\w-]{11}$/.test(body.nativeId)) {
        return NextResponse.json({ error: 'nativeId (videoId) required' }, { status: 400 });
      }
      return NextResponse.json({ kind: 'mp3', url: `${BASE}/audio/${body.nativeId}` });
    }
    return NextResponse.json({ error: 'unknown source' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
