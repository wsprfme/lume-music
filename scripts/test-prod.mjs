const base = process.env.BASE || 'https://lume-music-plum.vercel.app';

async function head(url) {
  const r = await fetch(url, { headers: { range: 'bytes=0-1023' }, redirect: 'follow' });
  return { status: r.status, type: r.headers.get('content-type'), len: r.headers.get('content-length') };
}

console.log('--- discover ---');
const disc = await fetch(`${base}/api/discover`).then((r) => r.json());
const counts = {};
for (const t of disc.tracks) counts[t.source] = (counts[t.source] || 0) + 1;
console.log('total:', disc.tracks.length, 'breakdown:', counts);
if (disc.error) console.log('error:', disc.error);

const sc = disc.tracks.find((t) => t.source === 'soundcloud');

if (sc) {
  console.log('\nSoundCloud pick:', sc.title, '—', sc.artist);
  const r = await fetch(`${base}/api/stream`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'soundcloud', transcoding: sc.streamHint.url }),
  }).then((r) => r.json());
  console.log('  ↳ resolve kind:', r.kind);
  console.log('  ↳ stream check:', await head(r.url));
}

console.log('\n--- search ---');
const search = await fetch(`${base}/api/search?q=lofi`).then((r) => r.json());
const sCounts = {};
for (const t of search.tracks) sCounts[t.source] = (sCounts[t.source] || 0) + 1;
console.log('total:', search.tracks.length, 'breakdown:', sCounts);
