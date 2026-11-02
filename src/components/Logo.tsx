export function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg" aria-label="Lume">
      <defs>
        <linearGradient id="lume-grad" x1="0" y1="0" x2="32" y2="32" gradientUnits="userSpaceOnUse">
          <stop stopColor="rgb(var(--tint-1))" />
          <stop offset="0.55" stopColor="rgb(var(--tint-2))" />
          <stop offset="1" stopColor="rgb(var(--tint-3))" />
        </linearGradient>
        <filter id="lume-soft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation=".4" />
        </filter>
      </defs>
      <rect x="2" y="2" width="28" height="28" rx="9" fill="url(#lume-grad)" />
      <g filter="url(#lume-soft)" fill="none" stroke="white" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round" opacity=".95">
        <path d="M11 9.5v9.6c0 1.7 1.4 3 3.1 3 1.7 0 3.1-1.3 3.1-3 0-1.7-1.4-3-3.1-3-.5 0-1 .1-1.4.3" />
        <path d="M12.7 16.4 21.1 14V7.4l-8.4 2.1" />
      </g>
    </svg>
  );
}

export function LogoMark({ size = 36 }: { size?: number }) {
  return (
    <span
      className="grid place-items-center rounded-2xl ring-soft"
      style={{
        width: size,
        height: size,
        background:
          'conic-gradient(from 220deg, rgb(var(--tint-1)), rgb(var(--tint-2)), rgb(var(--tint-3)), rgb(var(--tint-1)))',
      }}
    >
      <Logo size={Math.round(size * 0.7)} />
    </span>
  );
}
