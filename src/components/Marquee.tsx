'use client';
import { useEffect, useRef, useState } from 'react';

/** Auto-scrolling text only when content overflows AND only while `active` (e.g. playing). */
export function Marquee({
  text,
  active = true,
  className = '',
}: {
  text: string;
  active?: boolean;
  className?: string;
}) {
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const innerRef = useRef<HTMLSpanElement | null>(null);
  const [overflow, setOverflow] = useState(false);

  useEffect(() => {
    const w = wrapRef.current;
    const i = innerRef.current;
    if (!w || !i) return;
    setOverflow(i.scrollWidth - 4 > w.clientWidth);
  }, [text]);

  if (!overflow) return <div className={`truncate ${className}`}>{text}</div>;

  return (
    <div ref={wrapRef} className={`marquee overflow-hidden ${className}`} data-active={active}>
      <div className="marquee-track">
        <span ref={innerRef}>{text}</span>
        <span aria-hidden>{text}</span>
      </div>
    </div>
  );
}
