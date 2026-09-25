import { LEANING_LABELS, type Leaning } from '@/lib/leaning';

const LEANING_STYLES: Record<Leaning, string> = {
  strongly_for:
    'bg-emerald-600 text-white dark:bg-emerald-500 dark:text-emerald-950',
  for: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300',
  neutral:
    'bg-neutral-100 text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300',
  against: 'bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300',
  strongly_against: 'bg-rose-600 text-white dark:bg-rose-500 dark:text-rose-950',
};

export function LeaningTag({
  leaning,
  size = 'sm',
}: {
  leaning: Leaning;
  size?: 'sm' | 'lg';
}) {
  const label = LEANING_LABELS[leaning];
  return (
    <span
      title={`The club is leaning: ${label}`}
      className={`inline-flex items-center whitespace-nowrap rounded-full font-semibold ${LEANING_STYLES[leaning]} ${
        size === 'lg' ? 'px-3.5 py-1.5 text-sm' : 'px-2.5 py-0.5 text-xs'
      }`}
    >
      {label}
    </span>
  );
}
