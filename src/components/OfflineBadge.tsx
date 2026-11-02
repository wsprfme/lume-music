'use client';
import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useEffect, useState } from 'react';

export function OfflineBadge() {
  const [online, setOnline] = useState(true);
  useEffect(() => {
    setOnline(navigator.onLine);
    const onOff = () => setOnline(navigator.onLine);
    window.addEventListener('online', onOff);
    window.addEventListener('offline', onOff);
    return () => {
      window.removeEventListener('online', onOff);
      window.removeEventListener('offline', onOff);
    };
  }, []);

  return (
    <AnimatePresence>
      {!online && (
        <motion.div
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -50, opacity: 0 }}
          className="safe-top pointer-events-none fixed inset-x-0 top-0 z-50 mx-auto flex max-w-md justify-center px-4"
        >
          <div className="pointer-events-auto mt-1 flex items-center gap-2 rounded-full bg-amber-500/15 px-3 py-1.5 text-[12px] text-amber-200 ring-1 ring-amber-500/25 backdrop-blur-md">
            <WifiOff size={13} /> You're offline. Already-played tracks may keep playing.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
