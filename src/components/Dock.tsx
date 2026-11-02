'use client';
import { Compass, Heart, Home, Search } from 'lucide-react';
import { MiniPlayer } from './MiniPlayer';
import { usePlayer } from '@/lib/player-store';

export type Tab = 'home' | 'discover' | 'search' | 'liked';

const ITEMS: { key: Tab; label: string; Icon: typeof Home }[] = [
  { key: 'home', label: 'Home', Icon: Home },
  { key: 'discover', label: 'Discover', Icon: Compass },
  { key: 'search', label: 'Search', Icon: Search },
  { key: 'liked', label: 'Liked', Icon: Heart },
];

export function Dock({ tab, onChange }: { tab: Tab; onChange: (t: Tab) => void }) {
  const current = usePlayer((s) => s.current);
  const setExpanded = usePlayer((s) => s.setExpanded);

  return (
    <div className="relative z-30 w-full">
      {current && (
        <div className="px-3 pb-2">
          <MiniPlayer onExpand={() => setExpanded(true)} />
        </div>
      )}
      <nav
        aria-label="Primary"
        className="flex w-full items-stretch border-t border-white/[0.08] bg-paper-2 px-2 pt-1"
        style={{ paddingBottom: 'max(env(safe-area-inset-bottom), 8px)' }}
      >
        {ITEMS.map(({ key, label, Icon }) => {
          const active = tab === key;
          return (
            <button
              key={key}
              onClick={() => onChange(key)}
              className="flex flex-1 flex-col items-center gap-1 py-2"
              aria-current={active ? 'page' : undefined}
            >
              <Icon
                size={21}
                strokeWidth={active ? 2.4 : 1.8}
                className={active ? 'text-white' : 'text-ink-500'}
              />
              <span
                className={`text-[10px] font-medium tracking-wide ${
                  active ? 'text-white' : 'text-ink-500'
                }`}
              >
                {label}
              </span>
              <span
                className={`h-1 w-1 rounded-full ${
                  active ? 'bg-[#ff5500]' : 'bg-transparent'
                }`}
              />
            </button>
          );
        })}
      </nav>
    </div>
  );
}

/** Bottom inset the scroll area should reserve so content never hides behind mini player + tab bar. */
export function useDockReserve() {
  const hasMini = usePlayer((s) => !!s.current);
  return hasMini ? 132 : 84;
}
