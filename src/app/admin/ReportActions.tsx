'use client';

import { useState, useTransition } from 'react';
import { dismissReport, removeReportedContent } from './actions';

export function ReportActions({ reportId }: { reportId: number }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function run(action: (id: number) => Promise<void>, confirmMessage: string) {
    if (!window.confirm(confirmMessage)) return;
    setError(null);
    startTransition(async () => {
      try {
        await action(reportId);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.');
      }
    });
  }

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={pending}
        onClick={() => run(dismissReport, 'Dismiss this report? The content stays up.')}
        className="rounded-full border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-600 hover:bg-neutral-100 disabled:opacity-50 dark:border-neutral-700 dark:text-neutral-300 dark:hover:bg-neutral-800"
      >
        {pending ? 'Working…' : 'Dismiss'}
      </button>
      <button
        type="button"
        disabled={pending}
        onClick={() =>
          run(
            removeReportedContent,
            'Remove the reported case or comment? This cannot be undone.'
          )
        }
        className="rounded-full bg-red-600 px-3 py-1 text-xs font-semibold text-white hover:bg-red-700 disabled:opacity-50"
      >
        {pending ? 'Working…' : 'Remove content'}
      </button>
      {error && <span className="text-xs text-red-600 dark:text-red-400">{error}</span>}
    </div>
  );
}
