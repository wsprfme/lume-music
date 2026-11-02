import { ArrowRight } from 'lucide-react';

export function Section({
  title,
  eyebrow,
  action,
  children,
}: {
  title: string;
  eyebrow?: string;
  action?: { label: string; onClick: () => void };
  children: React.ReactNode;
}) {
  return (
    <section className="mb-7">
      <div className="mb-3.5 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {eyebrow && (
            <div className="mb-1.5 flex items-center gap-1.5 text-[10.5px] font-bold uppercase tracking-[0.22em] text-[rgb(var(--tint-2))]">
              <span className="h-px w-4 bg-gradient-to-r from-[rgb(var(--tint-1))] to-transparent" />
              {eyebrow}
            </div>
          )}
          <h3 className="text-[21px] font-bold tracking-tight text-ink-50">{title}</h3>
        </div>
        {action && (
          <button
            onClick={action.onClick}
            className="inline-flex shrink-0 items-center gap-1 rounded-full glass-pill px-3 py-1.5 text-[12.5px] font-medium text-ink-300 hover:text-white hover:bg-white/10 transition"
          >
            {action.label} <ArrowRight size={13} />
          </button>
        )}
      </div>
      {children}
    </section>
  );
}
