export function Equalizer({ playing = true, className = '' }: { playing?: boolean; className?: string }) {
  return (
    <span className={`eq ${className}`} data-paused={!playing}>
      <span />
      <span />
      <span />
    </span>
  );
}
