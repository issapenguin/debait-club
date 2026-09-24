'use client';

import { useState } from 'react';
import { SubmissionCard } from './SubmissionCard';
import {
  SUBMISSION_CATEGORIES,
  shiftWeek,
  weekOf,
  type SubmissionSort,
  type TopicSubmission,
} from '@/lib/types';

const SORTS: { key: SubmissionSort; label: string }[] = [
  { key: 'trending', label: 'Trending' },
  { key: 'top', label: 'Top' },
  { key: 'new', label: 'New' },
];

function weekLabel(week: string): string {
  const dt = new Date(`${week}T00:00:00Z`);
  return dt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    timeZone: 'UTC',
  });
}

export function SubmissionBoard({
  initialSubmissions,
  initialWeek,
  loggedIn,
}: {
  initialSubmissions: TopicSubmission[];
  initialWeek: string;
  loggedIn: boolean;
}) {
  const [submissions, setSubmissions] = useState<TopicSubmission[]>(initialSubmissions);
  const [week, setWeek] = useState(initialWeek);
  const [sort, setSort] = useState<SubmissionSort>('trending');
  const [category, setCategory] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const load = async (next: { week: string; sort: SubmissionSort; category: string }) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ week: next.week, sort: next.sort });
      if (next.category) params.set('category', next.category);
      const res = await fetch(`/api/submissions?${params.toString()}`);
      const json = await res.json();
      if (res.ok) setSubmissions(json.submissions ?? []);
    } finally {
      setLoading(false);
    }
  };

  const changeSort = (s: SubmissionSort) => {
    setSort(s);
    load({ week, sort: s, category });
  };
  const changeCategory = (c: string) => {
    setCategory(c);
    load({ week, sort, category: c });
  };
  const changeWeek = (w: string) => {
    setWeek(w);
    load({ week: w, sort, category });
  };

  const currentWeek = weekOf();
  const isCurrentWeek = week === currentWeek;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex rounded-full border border-neutral-200 p-1 dark:border-neutral-700">
          {SORTS.map((s) => (
            <button
              key={s.key}
              type="button"
              onClick={() => changeSort(s.key)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                sort === s.key
                  ? 'bg-neutral-900 text-white dark:bg-neutral-100 dark:text-neutral-900'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-1 text-sm">
          <button
            type="button"
            onClick={() => changeWeek(shiftWeek(week, -1))}
            className="rounded-full px-3 py-1.5 font-medium text-neutral-500 hover:bg-neutral-100 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Previous week"
          >
            ←
          </button>
          <span className="font-semibold text-neutral-700 dark:text-neutral-300">
            Week of {weekLabel(week)}
          </span>
          <button
            type="button"
            onClick={() => changeWeek(shiftWeek(week, 1))}
            disabled={isCurrentWeek}
            className="rounded-full px-3 py-1.5 font-medium text-neutral-500 hover:bg-neutral-100 disabled:opacity-30 dark:text-neutral-400 dark:hover:bg-neutral-800"
            aria-label="Next week"
          >
            →
          </button>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <button
          type="button"
          onClick={() => changeCategory('')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            category === ''
              ? 'bg-sky-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
          }`}
        >
          All
        </button>
        {SUBMISSION_CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => changeCategory(c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              category === c
                ? 'bg-sky-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="mt-8 text-center text-sm italic text-neutral-400">Loading…</p>
      ) : submissions.length === 0 ? (
        <p className="mt-8 text-center text-sm italic text-neutral-400">
          {isCurrentWeek
            ? 'No submissions yet this week. Yours could be first.'
            : 'No submissions this week.'}
        </p>
      ) : (
        <ol className="mt-4 space-y-3">
          {submissions.map((s, i) => (
            <SubmissionCard key={s.id} submission={s} rank={i + 1} loggedIn={loggedIn} />
          ))}
        </ol>
      )}
    </div>
  );
}
