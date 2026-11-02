import { NextResponse } from 'next/server';
import { discover } from '@/lib/sources';

export const runtime = 'nodejs';
export const revalidate = 120;

export async function GET() {
  try {
    const tracks = await discover(20);
    return NextResponse.json({ tracks });
  } catch (e) {
    return NextResponse.json({ tracks: [], error: (e as Error).message }, { status: 200 });
  }
}
