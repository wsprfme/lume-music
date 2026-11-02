'use client';
import { AnimatePresence } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { AudioEngine } from '@/components/AudioEngine';
import { Dock, useDockReserve, type Tab } from '@/components/Dock';
import { InstallPrompt } from '@/components/InstallPrompt';
import { LogoMark } from '@/components/Logo';
import { NowPlayingSheet } from '@/components/NowPlayingSheet';
import { OfflineBadge } from '@/components/OfflineBadge';
import { DiscoverView } from '@/components/views/DiscoverView';
import { HomeView } from '@/components/views/HomeView';
import { LikedView } from '@/components/views/LikedView';
import { SearchView } from '@/components/views/SearchView';
import { tap } from '@/lib/haptics';
import { usePlayer } from '@/lib/player-store';

const VALID_TABS: Tab[] = ['home', 'discover', 'search', 'liked'];

export default function Page() {
  return (
    <Suspense fallback={null}>
      <PageInner />
    </Suspense>
  );
}

function PageInner() {
  const params = useSearchParams();
  const lastTab = usePlayer((s) => s.lastTab) ?? 'home';
  const setLastTab = usePlayer((s) => s.setLastTab);

  const initialFromUrl = params.get('tab') as Tab | null;
  const initial: Tab = initialFromUrl && VALID_TABS.includes(initialFromUrl) ? initialFromUrl : lastTab;
  const [tab, setTab] = useState<Tab>(initial);
  const reserve = useDockReserve();

  // Web Share Target handler — if launched with shared_title or shared_url, jump to search prefilled.
  useEffect(() => {
    const sharedText = params.get('shared_text') || params.get('shared_title') || params.get('shared_url');
    if (sharedText) {
      try {
        const k = 'lume:prefill-search';
        sessionStorage.setItem(k, sharedText);
        setTab('search');
        // Clean the URL so refresh doesn't re-trigger.
        const u = new URL(window.location.href);
        ['shared_text', 'shared_title', 'shared_url'].forEach((p) => u.searchParams.delete(p));
        history.replaceState(null, '', u.toString());
      } catch {
        /* noop */
      }
    }
  }, [params]);

  // Persist tab so the cold launch resumes where you were.
  useEffect(() => {
    setLastTab(tab);
  }, [tab, setLastTab]);

  function handleTab(t: Tab) {
    setTab(t);
    tap('light');
  }

  return (
    <main className="relative mx-auto w-full max-w-xl h-[100dvh] flex flex-col overflow-hidden bg-paper select-none sm:px-2">
      <Aurora />
      <AudioEngine />
      <NowPlayingSheet />
      <OfflineBadge />
      <InstallPrompt />

      <header className="relative z-10 flex items-center justify-between px-5 pt-5 pb-1">
        <div className="flex items-center gap-2.5">
          <LogoMark size={32} />
          <div className="leading-none">
            <div className="text-[16px] font-bold tracking-tight text-ink-50">Lume</div>
            <div className="mt-0.5 text-[10.5px] uppercase tracking-[0.22em] text-ink-500">Ember Edition</div>
          </div>
        </div>
        <div className="flex items-center gap-1.5 rounded-full glass-pill px-3 py-1.5">
          <span className="relative flex size-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex size-1.5 rounded-full bg-emerald-400" />
          </span>
          <span className="text-[11px] font-medium text-ink-300">SoundCloud live</span>
        </div>
      </header>

      <div 
        className="relative z-10 flex-1 overflow-y-auto overflow-x-hidden px-4 pt-2 scroll-smooth"
        style={{ paddingBottom: reserve + 16 }}
      >
        <AnimatePresence mode="wait">
          {tab === 'home' && <HomeView key="home" />}
          {tab === 'discover' && <DiscoverView key="discover" />}
          {tab === 'search' && <SearchView key="search" />}
          {tab === 'liked' && <LikedView key="liked" />}
        </AnimatePresence>
      </div>

      <Dock tab={tab} onChange={handleTab} />
    </main>
  );
}

function Aurora() {
  return (
    <div aria-hidden className="aurora">
      <b />
      <i />
      <u />
    </div>
  );
}

