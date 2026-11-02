export function RowSkeletons({ rows = 6 }: { rows?: number }) {
  return (
    <div className="flex flex-col">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl px-2 py-2">
          <div className="shimmer size-12 rounded-xl" />
          <div className="flex-1">
            <div className="shimmer h-3 w-2/3 rounded" />
            <div className="shimmer mt-2 h-2 w-1/3 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TileSkeletons({ count = 6 }: { count?: number }) {
  return (
    <div className="-mx-4 px-4">
      <div className="snap-x-list flex gap-3 overflow-x-auto pb-1">
        {Array.from({ length: count }).map((_, i) => (
          <div key={i} className="w-[148px] shrink-0">
            <div className="shimmer aspect-square w-full rounded-2xl" />
            <div className="shimmer mt-2 h-3 w-3/4 rounded" />
            <div className="shimmer mt-1.5 h-2 w-1/2 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function HeroSkeleton() {
  return (
    <div className="relative overflow-hidden rounded-sheet ring-1 ring-white/10">
      <div className="flex items-end gap-4 p-5">
        <div className="shimmer size-32 rounded-2xl sm:size-40" />
        <div className="flex-1 pb-1">
          <div className="shimmer h-3 w-24 rounded" />
          <div className="shimmer mt-3 h-5 w-3/4 rounded" />
          <div className="shimmer mt-2 h-3 w-1/2 rounded" />
          <div className="shimmer mt-4 h-9 w-28 rounded-full" />
        </div>
      </div>
    </div>
  );
}
