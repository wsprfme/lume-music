// End-to-end check: pick one SoundCloud track from /api/discover,
// resolve its playable URL via /api/stream, then range-GET to confirm
// the bytes are reachable.

const base = process.env.BASE || 'http://localhost:3000';

async function head(url) {
  // Most CDNs don't support HEAD; do a tiny range GET instead.
  const r = await fetch(url, { headers: { range: 'bytes=0-1023' }, redirect: 'follow' });
  return { status: r.status, type: r.headers.get('content-type'), len: r.headers.get('content-length') };
}

const disc = await fetch(`${base}/api/discover`).then((r) => r.json());
const sc = disc.tracks.find((t) => t.source === 'soundcloud');

console.log('SoundCloud pick:', sc?.title, '—', sc?.artist);

if (sc) {
  const r = await fetch(`${base}/api/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'soundcloud', transcoding: sc.streamHint.url }),
  }).then((r) => r.json());
  console.log('  ↳ soundcloud resolve:', r);
  const h = await head(r.url);
  console.log('  ↳ soundcloud stream check:', h);
}
