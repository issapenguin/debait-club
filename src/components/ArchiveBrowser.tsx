'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { CATEGORIES } from '@/lib/types';
import type { Leaning } from '@/lib/leaning';
import { formatDate } from '@/lib/format';
import { LeaningTag } from '@/components/LeaningTag';

export interface ArchiveTopic {
  id: number;
  proposition: string;
  category: string;
  topic_date: string;
  is_featured: boolean;
}

/** Searchable, flair-filterable archive of past debates. */
export function ArchiveBrowser({
  topics,
  counts,
  leanings,
}: {
  topics: ArchiveTopic[];
  counts: Record<number, number>;
  leanings: Record<number, string>;
}) {
  const [query, setQuery] = useState('');
  const [flair, setFlair] = useState('');

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return topics.filter((t) => {
      if (flair && t.category !== flair) return false;
      if (q && !t.proposition.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [topics, query, flair]);

  return (
    <div>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search past debates…"
            aria-label="Search past debates"
            className="w-full rounded-full border border-neutral-200 bg-white px-4 py-2.5 pl-10 text-sm text-neutral-900 outline-none placeholder:text-neutral-400 focus:border-sky-500 dark:border-neutral-700 dark:bg-neutral-900 dark:text-neutral-100"
          />
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400"
            aria-hidden="true"
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" strokeLinecap="round" />
          </svg>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Filter by flair">
        <button
          type="button"
          onClick={() => setFlair('')}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
            flair === ''
              ? 'bg-sky-600 text-white'
              : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
          }`}
        >
          All flairs
        </button>
        {CATEGORIES.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setFlair(flair === c ? '' : c)}
            className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
              flair === c
                ? 'bg-sky-600 text-white'
                : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 dark:bg-neutral-800 dark:text-neutral-400 dark:hover:bg-neutral-700'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      {(query.trim() || flair) && (
        <p className="mt-4 text-sm text-neutral-500 dark:text-neutral-400">
          {filtered.length === 0
            ? 'No debates match your search.'
            : `${filtered.length} ${filtered.length === 1 ? 'debate' : 'debates'} found.`}
          <button
            type="button"
            onClick={() => {
              setQuery('');
              setFlair('');
            }}
            className="ml-2 font-semibold text-sky-600 hover:underline dark:text-sky-400"
          >
            Clear
          </button>
        </p>
      )}

      {filtered.length === 0 && !query.trim() && !flair ? (
        <p className="mt-10 text-center text-sm italic text-neutral-400">
          No debates yet. Check back soon.
        </p>
      ) : (
        <div className="mt-6 space-y-3">
          {filtered.map((t) => (
            <Link
              key={t.id}
              href={`/topic/${t.id}`}
              className="block rounded-2xl border border-neutral-200 bg-white p-4 transition hover:border-neutral-300 hover:shadow-sm sm:p-5 dark:border-neutral-800 dark:bg-neutral-900 dark:hover:border-neutral-700"
            >
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="rounded-full bg-neutral-100 px-2.5 py-0.5 font-bold text-neutral-700 dark:bg-neutral-800 dark:text-neutral-300">
                  {t.category}
                </span>
                <span className="text-neutral-400">{formatDate(t.topic_date)}</span>
                {t.is_featured && (
                  <span className="rounded-full bg-sky-100 px-2.5 py-0.5 font-bold text-sky-700 dark:bg-sky-900/50 dark:text-sky-300">
                    Featured
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <span className="text-neutral-400">Club Leaning:</span>
                  <LeaningTag leaning={(leanings[t.id] ?? 'neutral') as Leaning} />
                </span>
                <span className="ml-auto text-neutral-400">
                  {(counts[t.id] ?? 0)} {(counts[t.id] ?? 0) === 1 ? 'case' : 'cases'}
                </span>
              </div>
              <p className="font-display mt-2 text-lg font-semibold leading-snug text-neutral-900 dark:text-neutral-50">
                {t.proposition}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
