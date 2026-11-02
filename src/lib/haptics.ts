/** Tiny vibrate helper. No-ops on iOS Safari (which lacks Vibration API). */
type Kind = 'light' | 'medium' | 'heavy' | 'select';

export function tap(kind: Kind = 'light') {
  if (typeof navigator === 'undefined') return;
  if (typeof navigator.vibrate !== 'function') return;
  const pattern: Record<Kind, number | number[]> = {
    light: 8,
    medium: 14,
    heavy: 22,
    select: [4, 30, 4],
  };
  try {
    const p = pattern[kind];
    // navigator.vibrate accepts both `number` and `number[]`; cast for both DOM lib variants.
    (navigator.vibrate as (p: number | number[]) => boolean)(p);
  } catch {
    /* noop */
  }
}
