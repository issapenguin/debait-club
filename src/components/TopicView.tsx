'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import type { CaseRow, Topic } from '@/lib/types';
import { formatDate } from '@/lib/format';
import { CaseCard } from './CaseCard';
import { CaseComposer } from './CaseComposer';
import { SortControl, type SortMode } from './SortControl';

function sortCases(cases: CaseRow[], mode: SortMode): CaseRow[] {
  const copy = [...cases];
  if (mode === 'top') {
    copy.sort((a, b) => b.score - a.score || b.id - a.id);
  } else {
    copy.sort((a, b) => b.created_at.localeCompare(a.created_at) || b.id - a.id);
  }
  return copy;
}

/** Shared topic view used by the home page and /topic/[id]. */
export function TopicView({
  topic,
  cases,
  loggedIn,
  showArchiveLink = false,
}: {
  topic: Topic;
  cases: CaseRow[];
  loggedIn: boolean;
  showArchiveLink?: boolean;
}) {
  const [sort, setSort] = useState<SortMode>('top');

  const forCases = useMemo(
    () => sortCases(cases.filter((c) => c.side === 'for'), sort),
    [cases, sort]
  );
  const againstCases = useMemo(
    () => sortCases(cases.filter((c) => c.side === 'against'), sort),
    [cases, sort]
  );

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-neutral-900 px-3 py-1 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
          {topic.category}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">{formatDate(topic.topic_date)}</span>
        {showArchiveLink && (
          <Link href="/archive" className="ml-auto text-sky-600 hover:underline dark:text-sky-400">
            Browse the archive
          </Link>
        )}
      </div>

      <h1 className="font-display mt-4 text-3xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        {topic.proposition}
      </h1>

      {topic.context && (
        <p className="mt-3 text-[15px] italic leading-relaxed text-neutral-500 dark:text-neutral-400">
          {topic.context}
        </p>
      )}

      {topic.sources.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-neutral-400">
            Sources
          </p>
          <ul className="mt-1 space-y-1">
            {topic.sources.slice(0, 3).map((s, i) => (
              <li key={i}>
                <a
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-sky-600 underline decoration-sky-300 underline-offset-2 hover:text-sky-700 dark:text-sky-400 dark:hover:text-sky-300"
                >
                  {s.title || s.url}
                </a>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="mt-8 flex items-center justify-between">
        <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          The cases
        </h2>
        <SortControl value={sort} onChange={setSort} />
      </div>

      <div className="mt-4 grid gap-8 md:grid-cols-2">
        <section aria-label="Cases for the proposition">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
            For ({forCases.length})
          </h3>
          <div className="space-y-4">
            <CaseComposer topicId={topic.id} side="for" loggedIn={loggedIn} />
            {forCases.map((c) => (
              <CaseCard key={c.id} caseRow={c} loggedIn={loggedIn} />
            ))}
            {forCases.length === 0 && (
              <p className="text-sm italic text-neutral-400">
                No FOR cases yet — be the first to make one.
              </p>
            )}
          </div>
        </section>

        <section aria-label="Cases against the proposition">
          <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            <span className="inline-block h-2.5 w-2.5 rounded-full bg-rose-500" />
            Against ({againstCases.length})
          </h3>
          <div className="space-y-4">
            <CaseComposer topicId={topic.id} side="against" loggedIn={loggedIn} />
            {againstCases.map((c) => (
              <CaseCard key={c.id} caseRow={c} loggedIn={loggedIn} />
            ))}
            {againstCases.length === 0 && (
              <p className="text-sm italic text-neutral-400">
                No AGAINST cases yet — be the first to make one.
              </p>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
