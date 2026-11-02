# Lume — Ember Edition

A warm, ember-glow PWA music player powered by a single **credential-free** source:

- **SoundCloud** — `api-v2.soundcloud.com` with a `client_id` scraped on the server from the latest SoundCloud JS bundle. Cached 12h, auto-refreshed on 401/403.

Ember redesign: warm paper tones, orange/amber/rose tints, floating pill dock, featured-drop hero with artwork echo, glass cards.

## Stack

- Next.js 16 App Router · TypeScript · Tailwind CSS v4
- Zustand for player state
- framer-motion for shared-layout transitions and spring physics
- hls.js fallback for SoundCloud HLS transcodings
- PWA: manifest + service worker (network-first API, cache-first static)

## Run locally

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Routes

- `GET /api/discover` → trending from SoundCloud
- `GET /api/search?q=...` → SoundCloud search results
- `POST /api/stream` → resolves a track's playable URL
  ```json
  // SoundCloud
  { "source": "soundcloud", "transcoding": "<streamHint.url>" }
  ```

## Notes on legality

The SoundCloud path uses an undocumented endpoint and a public web client_id obtained by scraping. SoundCloud's terms permit fair use but the strategy can break if they rotate keys or change bundle layout. For commercial use, get an official Spotify/SoundCloud partnership.

## Deploy

```bash
npx vercel --prod
```

No environment variables required.
