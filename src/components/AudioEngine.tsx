'use client';
import { useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/player-store';
import type Hls from 'hls.js';
import type { Track } from '@/lib/types';

async function resolveStream(track: Track) {
  if (track.source === 'youtube') {
    const r = await fetch('/api/stream', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ source: 'youtube', nativeId: track.nativeId }),
    });
    return (await r.json()) as { kind: 'hls' | 'mp3'; url: string };
  }
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

  // Boost graph (>100%) — created lazily, only when user pushes volume past 1.0.
  // ≤100% stays on direct HTML5 audio (bit-perfect, low power).
  const ctxRef = useRef<AudioContext | null>(null);
  const gainRef = useRef<GainNode | null>(null);
  const compRef = useRef<DynamicsCompressorNode | null>(null);
  const srcRef = useRef<MediaElementAudioSourceNode | null>(null);

  // Pre-resolved next track cache
  const nextTrackResolvedRef = useRef<{ id: string; kind: 'hls' | 'mp3'; url: string } | null>(null);

  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);

  function ensureBoostGraph(): boolean {
    try {
      const a = audioRef.current;
      if (!a) return false;
      if (!ctxRef.current) {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return false;
        const ctx = new AC();
        // Source can only be created once per <audio> — keep it for the session.
        const src = ctx.createMediaElementSource(a);
        const gain = ctx.createGain();
        const comp = ctx.createDynamicsCompressor();
        // Transparent limiter: only catches peaks when boosting past 0 dBFS,
        // preserves dynamics at normal levels. Tuned for up to +6 dB (200%).
        comp.threshold.setValueAtTime(-6.0, ctx.currentTime);
        comp.knee.setValueAtTime(10.0, ctx.currentTime);
        comp.ratio.setValueAtTime(20.0, ctx.currentTime);
        comp.attack.setValueAtTime(0.003, ctx.currentTime);
        comp.release.setValueAtTime(0.12, ctx.currentTime);
        src.connect(gain);
        gain.connect(comp);
        comp.connect(ctx.destination);
        ctxRef.current = ctx;
        gainRef.current = gain;
        compRef.current = comp;
        srcRef.current = src;
      }
      if (ctxRef.current.state === 'suspended') void ctxRef.current.resume().catch(() => {});
      return true;
    } catch {
      return false;
    }
  }

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
      // Don't close AudioContext here — source node is tied to this <audio> for the
      // session. It will be GC'd with the page. Closing early would break replay.
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
            // Best-audio HLS: worker off main thread, generous buffer for stable
            // playback, no low-latency tuning (we want full segments, not speed).
            const hls = new HlsMod({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 30,
              maxMaxBufferLength: 60,
              backBufferLength: 30,
              fragLoadingMaxRetry: 3,
              manifestLoadingMaxRetry: 3,
            });
            hls.loadSource(url);
            hls.attachMedia(a);
            hlsRef.current = hls;
          } else if (a.canPlayType('application/vnd.apple.mpegurl')) {
            a.src = url; // native HLS on iOS Safari — most efficient, full quality
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
      if (ctxRef.current && ctxRef.current.state === 'suspended') {
        void ctxRef.current.resume().catch(() => {});
      }
      a.play().catch(() => {});
    } else {
      a.pause();
    }
  }, [isPlaying]);

  // volume — direct ≤100% (bit-perfect), boost graph >100% (gain + transparent limiter)
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;
    const v = muted ? 0 : volume;
    if (v > 1.0) {
      // Need gain > 1 — HTMLAudioElement.volume caps at 1.0, so route via Web Audio.
      if (ensureBoostGraph() && ctxRef.current && gainRef.current) {
        a.volume = 1.0;
        a.muted = false;
        // Smooth ramp to avoid clicks when dragging the slider.
        gainRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.02);
        return;
      }
      // Fallback if Web Audio unavailable (e.g. blocked): cap at 100%.
      a.volume = 1.0;
      a.muted = muted;
      return;
    }
    if (gainRef.current && ctxRef.current) {
      // Graph already exists from an earlier boost — keep using it for consistency
      // (source node can't be un-created), just set gain ≤ 1.
      a.volume = 1.0;
      a.muted = false;
      gainRef.current.gain.setTargetAtTime(v, ctxRef.current.currentTime, 0.02);
      return;
    }
    // Never boosted this session — direct path, lowest power, no processing.
    a.volume = v;
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
