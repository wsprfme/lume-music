import { NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const revalidate = 120;

const BASE = process.env.YT_ENGINE_BASE || 'https://lume-yt.byasaja.my.id';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const ids = (url.searchParams.get('ids') || '').trim();
  if (!ids) return NextResponse.json({ results: [] });
  try {
    const r = await fetch(`${BASE}/api/check?ids=${encodeURIComponent(ids)}`, {
      next: { revalidate: 120 },
    });
    if (!r.ok) throw new Error(`engine ${r.status}`);
    const j = await r.json();
    return NextResponse.json({ results: j.results ?? [] });
  } catch (e) {
    return NextResponse.json({ results: [], error: (e as Error).message }, { status: 200 });
  }
}
