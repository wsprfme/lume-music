import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Plus_Jakarta_Sans } from 'next/font/google';
import { Toaster } from 'sonner';
import { QueryProvider } from '@/lib/query';

const plusJakartaSans = Plus_Jakarta_Sans({ subsets: ['latin'], variable: '--font-plus-jakarta', display: 'swap' });

const SITE = process.env.VERCEL_PROJECT_PRODUCTION_URL
  ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
  : 'https://lume-music-plum.vercel.app';

export const metadata: Metadata = {
  title: 'Lume — Ember SoundCloud player',
  description: 'A warm, ember-glow music player powered by SoundCloud.',
  applicationName: 'Lume',
  metadataBase: new URL(SITE),
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'Lume',
    startupImage: [
      // iPhone 14 Pro Max
      { url: '/splash-1290x2796.png', media: '(device-width: 430px) and (device-height: 932px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 14 Pro / 15 Pro
      { url: '/splash-1179x2556.png', media: '(device-width: 393px) and (device-height: 852px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 13 Pro Max
      { url: '/splash-1284x2778.png', media: '(device-width: 428px) and (device-height: 926px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone 13 / 14
      { url: '/splash-1170x2532.png', media: '(device-width: 390px) and (device-height: 844px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone X / XS / 11 Pro / 13 mini
      { url: '/splash-1125x2436.png', media: '(device-width: 375px) and (device-height: 812px) and (-webkit-device-pixel-ratio: 3)' },
      // iPhone XR / 11
      { url: '/splash-828x1792.png', media: '(device-width: 414px) and (device-height: 896px) and (-webkit-device-pixel-ratio: 2)' },
      // iPhone SE 2/3
      { url: '/splash-750x1334.png', media: '(device-width: 375px) and (device-height: 667px) and (-webkit-device-pixel-ratio: 2)' },
    ],
  },
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [
      { url: '/icon-apple-120.png', sizes: '120x120', type: 'image/png' },
      { url: '/icon-apple-152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icon-apple-167.png', sizes: '167x167', type: 'image/png' },
      { url: '/icon-apple-180.png', sizes: '180x180', type: 'image/png' },
    ],
    shortcut: '/icon-192.png',
  },
  formatDetection: { telephone: false, email: false, address: false },
  openGraph: {
    type: 'website',
    siteName: 'Lume',
    title: 'Lume — Ember SoundCloud player',
    description: 'Warm glass player for SoundCloud.',
    images: ['/icon-512.png'],
  },
  other: {
    'mobile-web-app-capable': 'yes',
    'msapplication-TileColor': '#06070b',
    'msapplication-TileImage': '/icon-144.png',
    'msapplication-config': 'none',
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: dark)', color: '#06070b' },
    { media: '(prefers-color-scheme: light)', color: '#06070b' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: 'cover',
  colorScheme: 'dark',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={plusJakartaSans.variable}>
      <body className="min-h-[100dvh] bg-paper text-ink-50 font-body selection:bg-tint-1/30">
        <QueryProvider>
          {children}
          <Toaster
            position="top-center"
            theme="dark"
            visibleToasts={3}
            offset={20}
            toastOptions={{
              classNames: {
                toast: 'rounded-2xl ring-1 ring-white/10 backdrop-blur-xl',
              },
            }}
          />
        </QueryProvider>
        {/* SW registration with controlled update */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((reg) => {
      if (reg.waiting) reg.waiting.postMessage({ type: 'SKIP_WAITING' });
      reg.addEventListener('updatefound', () => {
        const nw = reg.installing;
        if (!nw) return;
        nw.addEventListener('statechange', () => {
          if (nw.state === 'installed' && navigator.serviceWorker.controller) {
            nw.postMessage({ type: 'SKIP_WAITING' });
          }
        });
      });
    }).catch(() => {});
    let refreshing = false;
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (refreshing) return;
      refreshing = true;
      // Don't auto-reload mid-session unless we've been idle for a bit.
      if (document.visibilityState === 'hidden') location.reload();
    });
  });
}
            `,
          }}
        />
      </body>
    </html>
  );
}
