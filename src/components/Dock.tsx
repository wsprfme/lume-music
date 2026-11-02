'use client';
import { motion } from 'framer-motion';
import { Compass, Heart, Home, Search } from 'lucide-react';
import { MiniPlayer } from './MiniPlayer';
import { usePlayer } from '@/lib/player-store';

export type Tab = 'home' | 'discover' | 'search' | 'liked';

const ITEMS: { key: Tab; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'Listen', Icon: Home },
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'search', label: 'Search', Icon: Search },
  { key: 'liked', label: 'Liked', Icon: Heart },
];

export function Dock({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const current = usePlayer((s) => s.current);
  const setExpanded = usePlayer((s) => s.setExpanded);

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 flex justify-center px-4">
      <div className="flex w-full max-w-xl flex-col items-center">
        {current && (
          <div className="pointer-events-auto w-full px-1 pb-2.5">
            <MiniPlayer onExpand={() => setExpanded(true)} />
          </div>
        )}
        <nav
          aria-label="Primary"
          className="pointer-events-auto mb-[max(env(safe-area-inset-bottom),12px)] flex w-auto items-center gap-1 rounded-full glass-2 px-2 py-2 shadow-[0_18px_44px_rgba(0,0,0,0.55)] ring-1 ring-white/10"
        >
          {ITEMS.map(({ key, label, Icon }) => {
            const active = tab === key;
            return (
              <button
                key={key}
                onClick={() => onChange(key)}
                className={`relative flex items-center gap-2 rounded-full px-4 py-2.5 transition-all duration-300 ${
                  active ? 'bg-white text-stone-950 shadow-glow' : 'text-ink-400 hover:text-ink-50 hover:bg-white/5'
                }`}
                aria-current={active ? 'page' : undefined}
              >
                <Icon size={17} strokeWidth={active ? 2.5 : 2} />
                <span className={`text-[12px] font-semibold tracking-wide ${active ? 'text-stone-950' : ''}`}>
                  {label}
                </span>
                {active && (
                  <motion.span
                    layoutId="dock-dot"
                    transition={{ type: 'spring', stiffness: 500, damping: 32 }}
                    className="absolute -bottom-[3px] left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-[rgb(var(--tint-1))]"
                  />
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

/** Computes the bottom inset the main scroll area should reserve so the dock + mini player never overlap content. */
export function useDockReserve() {
  const hasMini = usePlayer((s) => !!s.current);
  return hasMini ? 168 : 92;
}
