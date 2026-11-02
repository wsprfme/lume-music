import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 3600;

const BASE = process.env.YT_ENGINE_BASE || 'https://lume-yt.byasaja.my.id';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const raw = (url.searchParams.get('url') || url.searchParams.get('id') || '').trim();
  const limit = url.searchParams.get('limit') || '50';
  if (!raw) return NextResponse.json({ error: 'missing ?url=' }, { status: 400 });
  try {
    const r = await fetch(
      `${BASE}/api/playlist?url=${encodeURIComponent(raw)}&limit=${limit}`,
      { next: { revalidate: 3600 } }
    );
    if (!r.ok) throw new Error(`engine ${r.status}`);
    const j = await r.json();
    return NextResponse.json({ id: j.id ?? null, title: j.title ?? 'YouTube playlist', tracks: j.tracks ?? [] });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: (e as Error).message }, { status: 200 });
  }
}
