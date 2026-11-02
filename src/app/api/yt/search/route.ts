import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 600;

const BASE = process.env.YT_ENGINE_BASE || 'https://lume-yt.byasaja.my.id';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = url.searchParams.get('limit') || '20';
  if (!q) return NextResponse.json({ tracks: [] });
  try {
    const r = await fetch(`${BASE}/api/search?q=${encodeURIComponent(q)}&limit=${limit}`, {
      next: { revalidate: 600 },
    });
    if (!r.ok) throw new Error(`engine ${r.status}`);
    const j = await r.json();
    return NextResponse.json({ tracks: j.tracks ?? [] });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: (e as Error).message }, { status: 200 });
  }
}
