'use client';

import { STANCE_LABELS, type Stance } from '@/lib/types';

const STANCE_STYLES: Record<Stance, string> = {
  strongly_agree:
    'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  agree: 'bg-teal-100 text-teal-800 dark:bg-teal-900/40 dark:text-teal-300',
  neutral: 'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  disagree: 'bg-orange-100 text-orange-800 dark:bg-orange-900/40 dark:text-orange-300',
  strongly_disagree: 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-300',
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
