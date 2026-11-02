'use client';
import { Download, Plus, Share, X } from 'lucide-react';
import { useEffect, useState } from 'react';
import { isAndroid, isIOS, isSafari, isStandalone } from '@/lib/platform';
import { LogoMark } from './Logo';

interface BIPEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const DISMISS_KEY = 'lume:install-dismissed';

export function InstallPrompt() {
  const [bip, setBip] = useState<BIPEvent | null>(null);
  const [showIos, setShowIos] = useState(false);
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    if (isStandalone()) return;
    if (localStorage.getItem(DISMISS_KEY)) return;

    setDismissed(false);

    const onBip = (e: Event) => {
      e.preventDefault();
      setBip(e as BIPEvent);
    };
    window.addEventListener('beforeinstallprompt', onBip);

    if (isIOS() && isSafari()) {
      const id = setTimeout(() => setShowIos(true), 1200);
      return () => {
        clearTimeout(id);
        window.removeEventListener('beforeinstallprompt', onBip);
      };
    }
    return () => window.removeEventListener('beforeinstallprompt', onBip);
  }, []);

  function dismiss() {
    setBip(null);
    setShowIos(false);
    setDismissed(true);
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      /* noop */
    }
  }

  async function install() {
    if (!bip) return;
    await bip.prompt();
    await bip.userChoice;
    dismiss();
  }

  if (dismissed) return null;
  if (!bip && !showIos) return null;

  return (
    <div className="pointer-events-auto fixed inset-x-3 bottom-32 z-40 mx-auto max-w-md rounded-2xl border border-white/10 bg-paper-2">
      <div className="flex items-start gap-3 p-3">
        <LogoMark size={38} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-medium text-white">Add Lume to home screen</div>
          {showIos ? (
            <div className="mt-0.5 text-[12.5px] leading-snug text-ink-400">
              Tap <Share size={12} className="inline -mt-0.5 align-middle" /> in Safari, then{' '}
              <span className="inline-flex items-center gap-0.5 rounded-md bg-white/10 px-1 py-[1px] text-[11px]">
                <Plus size={10} /> Add to Home Screen
              </span>
              .
            </div>
          ) : (
            <div className="mt-0.5 text-[12.5px] text-ink-400">
              Faster launches{isAndroid() ? ' and offline art.' : '.'}
            </div>
          )}
        </div>
        <div className="flex shrink-0 flex-col items-end gap-1">
          {bip && (
            <button
              onClick={install}
              className="inline-flex items-center gap-1 rounded-full bg-white px-3 py-1.5 text-[12px] font-semibold text-black"
            >
              <Download size={12} /> Install
            </button>
          )}
          <button
            onClick={dismiss}
            aria-label="Dismiss"
            className="grid size-7 place-items-center rounded-full text-ink-400"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
}
