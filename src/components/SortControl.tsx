'use client';

export type SortMode = 'top' | 'new';

export function SortControl({
  value,
  onChange,
}: {
  value: SortMode;
  onChange: (mode: SortMode) => void;
}) {
  return (
    <div
      className="inline-flex rounded-full border border-neutral-200 bg-white p-0.5 text-sm dark:border-neutral-800 dark:bg-neutral-900"
      role="group"
      aria-label="Sort cases"
    >
      {(['top', 'new'] as SortMode[]).map((mode) => (
        <button
          key={mode}
          type="button"
          onClick={() => onChange(mode)}
          aria-pressed={value === mode}
          className={`rounded-full px-3 py-1 font-medium capitalize transition ${
            value === mode
              ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
              : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
          }`}
        >
          {mode}
        </button>
      ))}
    </div>
  );
}
