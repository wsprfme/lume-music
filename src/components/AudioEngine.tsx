'use client';
import { useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/player-store';
import type Hls from 'hls.js';
import type { Track } from '@/lib/types';

async function resolveStream(track: Track) {
  const r = await fetch('/api/stream', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ source: 'soundcloud', transcoding: track.streamHint.url }),
  });
  return (await r.json()) as { kind: 'hls' | 'mp3'; url: string };
}

export function AudioEngine() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const hlsRef = useRef<Hls | null>(null);
  const lastSeekRef = useRef<number>(0);

  // Pre-resolved next track cache
  const nextTrackResolvedRef = useRef<{ id: string; kind: 'hls' | 'mp3'; url: string } | null>(null);

  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);

  // create audio element once — direct HTML5 audio, no Web Audio graph (low power)
  useEffect(() => {
    const a = new Audio();
    a.preload = 'metadata';
    a.crossOrigin = 'anonymous';
    a.setAttribute('playsinline', 'true');
    (a as HTMLAudioElement & { disableRemotePlayback?: boolean }).disableRemotePlayback = true;
    audioRef.current = a;

    const { setPosition, setDuration, setBuffering, setIsPlaying, next } = usePlayer.getState();
    let lastUiUpdate = 0;
    const onTime = () => {
      const t = a.currentTime || 0;
      const now = performance.now();
      // Throttle UI to ~2 Hz — enough for progress bar, minimal re-render.
      if (now - lastUiUpdate > 500) {
        setPosition(t);
        lastUiUpdate = now;
      }
    };
    const onMeta = () => setDuration(a.duration || 0);
    const onWaiting = () => setBuffering(true);
    const onPlaying = () => {
      setBuffering(false);
      setIsPlaying(true);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    };
    const onPause = () => {
      setIsPlaying(false);
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    };
    const onEnded = () => next();
    const onError = () => setBuffering(false);

    a.addEventListener('timeupdate', onTime);
    a.addEventListener('loadedmetadata', onMeta);
    a.addEventListener('waiting', onWaiting);
    a.addEventListener('playing', onPlaying);
    a.addEventListener('pause', onPause);
    a.addEventListener('ended', onEnded);
    a.addEventListener('error', onError);

    return () => {
      a.pause();
      a.src = '';
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      hlsRef.current?.destroy();
      hlsRef.current = null;
    };
  }, []);

  // Pre-resolve next track
  useEffect(() => {
    if (!current) return;
    const { queue, index, repeat } = usePlayer.getState();
    if (queue.length <= 1) return;

    let ni = index + 1;
    if (ni >= queue.length) {
      if (repeat === 'all') ni = 0;
      else return;
    }
    const nextTrack = queue[ni];
    if (!nextTrack || nextTrack.id === current.id) return;

    resolveStream(nextTrack)
      .then((res) => {
        nextTrackResolvedRef.current = {
          id: nextTrack.id,
          kind: res.kind,
          url: res.url,
        };
      })
      .catch(() => {});
  }, [current?.id]);

  // on track change: load + media session (no palette extraction — keep static theme, low power)
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    let cancelled = false;
    usePlayer.getState().setBuffering(true);

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: 'Lume',
        artwork: current.artwork
          ? [{ src: current.artwork, sizes: '512x512', type: 'image/jpeg' }]
          : undefined,
      });
      const ms = navigator.mediaSession;
      ms.setActionHandler('play', () => usePlayer.getState().setIsPlaying(true));
      ms.setActionHandler('pause', () => usePlayer.getState().setIsPlaying(false));
      ms.setActionHandler('previoustrack', () => usePlayer.getState().prev());
      ms.setActionHandler('nexttrack', () => usePlayer.getState().next());
    }

    (async () => {
      try {
        const cached = nextTrackResolvedRef.current;
        let kind: 'hls' | 'mp3';
        let url: string;

        if (cached && cached.id === current.id) {
          kind = cached.kind;
          url = cached.url;
        } else {
          const res = await resolveStream(current);
          kind = res.kind;
          url = res.url;
        }

        if (cancelled) return;
        hlsRef.current?.destroy();
        hlsRef.current = null;
        if (kind === 'hls') {
          const HlsMod = (await import('hls.js')).default;
          if (cancelled) return;
          if (HlsMod.isSupported()) {
            // Low-power HLS config: no worker, small buffer, no low-latency polling
            const hls = new HlsMod({
              enableWorker: false,
              lowLatencyMode: false,
              maxBufferLength: 20,
              maxMaxBufferLength: 40,
              fragLoadingMaxRetry: 2,
              manifestLoadingMaxRetry: 2,
            });
            hls.loadSource(url);
            hls.attachMedia(a);
            hlsRef.current = hls;
          } else if (a.canPlayType('application/vnd.apple.mpegurl')) {
            a.src = url; // native HLS on iOS Safari — most efficient
          } else {
            a.src = url;
          }
        } else {
          a.src = url;
        }
        if (usePlayer.getState().isPlaying) {
          await a.play().catch(() => {});
        }
      } catch {
        usePlayer.getState().setBuffering(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [current?.id]);

  // play/pause
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    if (isPlaying) {
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [isPlaying]);

  // volume — direct, no Web Audio
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    a.volume = muted ? 0 : Math.min(1.0, volume);
    a.muted = muted;
  }, [volume, muted]);

  // seek bridge
  useEffect(() => {
    const unsub = usePlayer.subscribe((state) => {
      const a = audioRef.current;
      if (!a) return;
      if (
        Math.abs((a.currentTime || 0) - state.position) > 1.2 &&
        Math.abs(state.position - lastSeekRef.current) > 0.1
      ) {
        a.currentTime = state.position;
        lastSeekRef.current = state.position;
      }
    });
    return unsub;
  }, []);

  // global keyboard shortcuts (desktop)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tg = (e.target as HTMLElement)?.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA') return;
      const s = usePlayer.getState();
      if (e.code === 'Space') {
        e.preventDefault();
        s.toggle();
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        s.next();
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        s.prev();
      } else if (e.code === 'ArrowRight') {
        s.seek(Math.min(s.duration, s.position + 5));
      } else if (e.code === 'ArrowLeft') {
        s.seek(Math.max(0, s.position - 5));
      } else if (e.key === 'm') {
        s.toggleMute();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Android back button behavior: close expanded sheet first.
  useEffect(() => {
    const onPop = () => {
      const s = usePlayer.getState();
      if (s.expanded) {
        s.setExpanded(false);
        history.pushState(null, '', location.href);
      }
    };
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return null;
}
