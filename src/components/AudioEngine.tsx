'use client';
import { useEffect, useRef } from 'react';
import { usePlayer } from '@/lib/player-store';
import type Hls from 'hls.js';
import { applyPalette, extractPalette } from '@/lib/palette';
import { tap } from '@/lib/haptics';
import type { Track } from '@/lib/types';
import { isIOS } from '@/lib/platform';

const hasMseSupport = typeof window !== 'undefined' && (
  !!window.MediaSource || !!(window as any).ManagedMediaSource
);

const shouldBypassWebAudio = isIOS() && !hasMseSupport;

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

  // Web Audio Nodes (only used on non-iOS platforms, and iOS 17.1+ with workaround)
  const audioContextRef = useRef<AudioContext | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);
  const compressorNodeRef = useRef<DynamicsCompressorNode | null>(null);
  const sourceNodeRef = useRef<MediaElementAudioSourceNode | null>(null);
  const outputAudioRef = useRef<HTMLAudioElement | null>(null);

  // Pre-resolved next track cache to allow synchronous playback start in iOS background
  const nextTrackResolvedRef = useRef<{ id: string; kind: 'hls' | 'mp3'; url: string } | null>(null);

  const current = usePlayer((s) => s.current);
  const isPlaying = usePlayer((s) => s.isPlaying);
  const volume = usePlayer((s) => s.volume);
  const muted = usePlayer((s) => s.muted);

  // Lazy initializer for Web Audio context
  const initAudioContext = () => {
    if (shouldBypassWebAudio) return null;
    if (audioContextRef.current) return audioContextRef.current;

    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const gain = ctx.createGain();
    const compressor = ctx.createDynamicsCompressor();

    // Configure compressor as a soft limiter to prevent clipping/distortion
    compressor.threshold.setValueAtTime(-1.0, ctx.currentTime); // compression begins 1dB below peak
    compressor.knee.setValueAtTime(8.0, ctx.currentTime);       // soft knee for transparent transition
    compressor.ratio.setValueAtTime(20.0, ctx.currentTime);      // high ratio acting as a limiter
    compressor.attack.setValueAtTime(0.003, ctx.currentTime);    // fast attack (3ms) to catch peaks
    compressor.release.setValueAtTime(0.1, ctx.currentTime);     // fast release (100ms)

    const a = audioRef.current;
    if (a) {
      const source = ctx.createMediaElementSource(a);
      source.connect(gain);
      sourceNodeRef.current = source;
    }

    gain.connect(compressor);
    if (isIOS()) {
      const dest = ctx.createMediaStreamDestination();
      compressor.connect(dest);

      const out = new Audio();
      out.preload = 'metadata';
      out.crossOrigin = 'anonymous';
      out.setAttribute('playsinline', 'true');
      out.disableRemotePlayback = true;
      out.srcObject = dest.stream;
      out.play().catch(() => {});
      outputAudioRef.current = out;
    } else {
      compressor.connect(ctx.destination);
    }

    // Sync current volume
    const state = usePlayer.getState();
    const initialVol = state.muted ? 0 : state.volume;
    gain.gain.setValueAtTime(initialVol, ctx.currentTime);

    audioContextRef.current = ctx;
    gainNodeRef.current = gain;
    compressorNodeRef.current = compressor;

    return ctx;
  };

  // create audio element once
  useEffect(() => {
    const a = new Audio();
    a.preload = 'metadata';
    a.crossOrigin = 'anonymous';
    a.setAttribute('playsinline', 'true');
    a.disableRemotePlayback = true;
    audioRef.current = a;

    const { setPosition, setDuration, setBuffering, setIsPlaying, next } = usePlayer.getState();
    let lastUiUpdate = 0;
    let lastMsUpdate = 0;
    const onTime = () => {
      const t = a.currentTime || 0;
      const now = performance.now();
      // Throttle UI to ~4 Hz — visually smooth, ~10x less work than 30+ Hz default.
      if (now - lastUiUpdate > 240) {
        setPosition(t);
        lastUiUpdate = now;
      }
      // Media session position state every ~1s is plenty for lockscreen scrubber.
      if (
        now - lastMsUpdate > 1000 &&
        'mediaSession' in navigator &&
        'setPositionState' in navigator.mediaSession
      ) {
        try {
          navigator.mediaSession.setPositionState?.({
            duration: Number.isFinite(a.duration) ? a.duration : 0,
            position: t,
            playbackRate: a.playbackRate,
          });
        } catch {
          /* noop */
        }
        lastMsUpdate = now;
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

    const unbindVis = () => {};

    return () => {
      a.pause();
      a.src = '';
      if (outputAudioRef.current) {
        outputAudioRef.current.pause();
        outputAudioRef.current.srcObject = null;
        outputAudioRef.current = null;
      }
      a.removeEventListener('timeupdate', onTime);
      a.removeEventListener('loadedmetadata', onMeta);
      a.removeEventListener('waiting', onWaiting);
      a.removeEventListener('playing', onPlaying);
      a.removeEventListener('pause', onPause);
      a.removeEventListener('ended', onEnded);
      a.removeEventListener('error', onError);
      unbindVis();
      hlsRef.current?.destroy();
      hlsRef.current = null;
      if (audioContextRef.current) {
        audioContextRef.current.close().catch(() => {});
        audioContextRef.current = null;
      }
      gainNodeRef.current = null;
      compressorNodeRef.current = null;
      sourceNodeRef.current = null;
    };
  }, []);

  // Pre-resolve the next track's stream URL in the background while playing
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

  // on track change: load + extract palette + media session
  useEffect(() => {
    const a = audioRef.current;
    if (!a || !current) return;
    let cancelled = false;
    usePlayer.getState().setBuffering(true);

    extractPalette(current.artwork).then((p) => {
      if (cancelled) return;
      applyPalette(p);
      // Sync Android system theme-color to the dominant tint, so the system bar matches.
      const meta = document.querySelector('meta[name="theme-color"]');
      if (meta) {
        const [r, g, b] = p.t1.split(' ').map(Number);
        // dim it down so the bar still looks dark
        const dr = Math.round(r * 0.18);
        const dg = Math.round(g * 0.18);
        const db = Math.round(b * 0.18);
        (meta as HTMLMetaElement).setAttribute('content', `rgb(${dr}, ${dg}, ${db})`);
      }
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: current.title,
        artist: current.artist,
        album: 'SoundCloud',
        artwork: current.artwork
          ? [
              { src: current.artwork, sizes: '512x512', type: 'image/jpeg' },
              { src: current.artwork, sizes: '256x256', type: 'image/jpeg' },
              { src: current.artwork, sizes: '96x96', type: 'image/jpeg' },
            ]
          : undefined,
      });
      const ms = navigator.mediaSession;
      ms.setActionHandler('play', () => usePlayer.getState().setIsPlaying(true));
      ms.setActionHandler('pause', () => usePlayer.getState().setIsPlaying(false));
      ms.setActionHandler('previoustrack', () => usePlayer.getState().prev());
      ms.setActionHandler('nexttrack', () => usePlayer.getState().next());
      try {
        ms.setActionHandler('seekbackward', (e) => {
          const s = usePlayer.getState();
          s.seek(Math.max(0, s.position - (e.seekOffset ?? 10)));
        });
        ms.setActionHandler('seekforward', (e) => {
          const s = usePlayer.getState();
          s.seek(Math.min(s.duration, s.position + (e.seekOffset ?? 10)));
        });
        ms.setActionHandler('seekto', (d) => {
          if (d.seekTime != null) usePlayer.getState().seek(d.seekTime);
        });
        ms.setActionHandler('stop', () => {
          usePlayer.getState().setIsPlaying(false);
        });
      } catch {
        /* not all browsers support every handler */
      }
    }

    (async () => {
      try {
        // Check if next URL is already pre-resolved. If so, play synchronously to bypass iOS background lock.
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
        if (kind === 'hls' && !shouldBypassWebAudio) {
          const HlsMod = (await import('hls.js')).default;
          if (cancelled) return;
          if (HlsMod.isSupported()) {
            const hls = new HlsMod({ enableWorker: true, lowLatencyMode: false });
            hls.loadSource(url);
            hls.attachMedia(a);
            hlsRef.current = hls;
          } else {
            a.src = url;
          }
        } else {
          a.src = url;
        }
        if (usePlayer.getState().isPlaying) {
          if (!shouldBypassWebAudio) {
            const ctx = initAudioContext();
            if (ctx && ctx.state === 'suspended') {
              await ctx.resume().catch(() => {});
            }
            if (outputAudioRef.current) {
              await outputAudioRef.current.play().catch(() => {});
            }
          }
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
      if (!shouldBypassWebAudio) {
        const ctx = initAudioContext();
        if (ctx && ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
      }
      a.play().catch(() => {});
      if (outputAudioRef.current) {
        outputAudioRef.current.play().catch(() => {});
      }
    } else {
      a.pause();
      if (outputAudioRef.current) {
        outputAudioRef.current.pause();
      }
    }
  }, [isPlaying]);

  // volume
  useEffect(() => {
    const a = audioRef.current;
    if (!a) return;

    if (shouldBypassWebAudio) {
      // Direct HTML5 audio volume clamped to 1.0
      a.volume = muted ? 0 : Math.min(1.0, volume);
      a.muted = muted;
    } else {
      a.volume = muted ? 0 : 1.0;
      a.muted = muted;
      if (gainNodeRef.current && audioContextRef.current) {
        const targetVol = muted ? 0 : volume;
        gainNodeRef.current.gain.setValueAtTime(targetVol, audioContextRef.current.currentTime);
      }
      if (outputAudioRef.current) {
        outputAudioRef.current.muted = muted;
      }
    }
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
        tap('light');
      } else if (e.code === 'ArrowRight' && e.shiftKey) {
        e.preventDefault();
        s.next();
        tap('medium');
      } else if (e.code === 'ArrowLeft' && e.shiftKey) {
        e.preventDefault();
        s.prev();
        tap('medium');
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

  // Pause expensive CSS animations / dim aurora while the tab is hidden (saves battery during background play).
  useEffect(() => {
    const onVis = () => {
      document.documentElement.classList.toggle('is-hidden', document.visibilityState !== 'visible');
    };
    onVis();
    document.addEventListener('visibilitychange', onVis);
    return () => document.removeEventListener('visibilitychange', onVis);
  }, []);

  // Android back button behavior: close expanded sheet first.
  useEffect(() => {
    const onPop = () => {
      const s = usePlayer.getState();
      if (s.expanded) {
        s.setExpanded(false);
        history.pushState(null, '', location.href); // re-trap
      }
    };
    history.pushState(null, '', location.href);
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  return null;
}
