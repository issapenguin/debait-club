'use client';

import { STANCE_LABELS, type Stance } from '@/lib/types';

const STANCE_STYLES: Record<Stance, string> = {
  for: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  against: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
};

export function StanceTag({ stance }: { stance: Stance }) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${STANCE_STYLES[stance]}`}
    >
      {STANCE_LABELS[stance]}
    </span>
  );
}
