import type { Source } from '@/lib/types';

export function SourceBadge({ source, className = '' }: { source: Source; className?: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-1.5 py-[1px] text-[10px] font-medium tracking-wide ring-1 text-orange-200/90 bg-orange-500/10 ring-orange-400/20 ${className}`}
    >
      <span className="size-1 rounded-full bg-current" />
      SoundCloud
    </span>
  );
}
