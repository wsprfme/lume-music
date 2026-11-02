import { NextResponse } from 'next/server';
import { soundcloudResolve } from '@/lib/sources/soundcloud';

export const runtime = 'nodejs';

/**
 * Resolves a track's playable URL.
 * Body: { source: 'soundcloud', transcoding?: string }
 *   - soundcloud: requires `transcoding` (passed from the client's streamHint.url),
 *                 returns { kind:'hls'|'mp3', url }
 */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as {
      source: 'soundcloud';
      nativeId?: string;
      transcoding?: string;
    };
    if (body.source === 'soundcloud') {
      if (!body.transcoding) return NextResponse.json({ error: 'transcoding required' }, { status: 400 });
      const r = await soundcloudResolve(body.transcoding);
      return NextResponse.json(r);
    }
    return NextResponse.json({ error: 'unknown source' }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
