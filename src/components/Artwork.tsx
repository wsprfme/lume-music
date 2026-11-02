'use client';
import { useState } from 'react';

/**
 * Defensive square artwork container.
 *  - aspect-ratio: 1/1 enforced even if the source image isn't square
 *  - object-fit: cover crops without distortion
 *  - isolation + contain prevents iOS Safari border-radius + transform clip leaks
 */
export function Artwork({
  src,
  alt,
  className = '',
  rounded = 'rounded-xl',
  square = true,
}: {
  src?: string;
  alt: string;
  className?: string;
  rounded?: string;
  square?: boolean;
}) {
  const [err, setErr] = useState(false);
  const aspect = square ? 'aspect-square' : '';
  const containCls = '[isolation:isolate] [contain:paint]';

  if (!src || err) {
    return (
      <div
        className={`block size-full ${aspect} ${rounded} ${containCls} ${className}`}
        style={{
          backgroundImage:
            'conic-gradient(from 200deg at 50% 50%, rgb(var(--tint-1) / .9), rgb(var(--tint-2) / .9), rgb(var(--tint-3) / .9), rgb(var(--tint-1) / .9))',
        }}
        aria-label={alt}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      width={300}
      height={300}
      loading="lazy"
      decoding="async"
      onError={() => setErr(true)}
      className={`block size-full ${aspect} object-cover ${rounded} ${containCls} ${className}`}
      crossOrigin="anonymous"
      referrerPolicy="no-referrer"
      style={{ background: 'rgb(var(--paper-2))', objectPosition: 'center' }}
    />
  );
}
