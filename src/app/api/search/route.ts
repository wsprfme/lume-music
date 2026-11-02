import { NextResponse } from 'next/server';
import { search } from '@/lib/sources';

export const runtime = 'nodejs';

export async function GET(req: Request) {
  const url = new URL(req.url);
  const q = (url.searchParams.get('q') || '').trim();
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  if (!q) return NextResponse.json({ tracks: [] });
  try {
    const tracks = await search(q, limit, offset);
    return NextResponse.json({ tracks });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: (e as Error).message }, { status: 200 });
  }
}
