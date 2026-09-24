'use client';

import { useState } from 'react';
import { CATEGORIES, type CaseRow, type Topic } from '@/lib/types';
import { TopicView } from './TopicView';

export interface TabData {
  topic: Topic;
  cases: CaseRow[];
}

/** Home-page topic tabs. Exactly one topic per tab, switched client-side. */
export function HomeTabs({
  tabs,
  loggedIn,
}: {
  tabs: Partial<Record<(typeof CATEGORIES)[number], TabData | null>>;
  loggedIn: boolean;
}) {
  const available = CATEGORIES.filter((c) => tabs[c]);
  const [active, setActive] = useState<(typeof CATEGORIES)[number]>(
    tabs['Featured'] ? 'Featured' : (available[0] ?? 'Featured')
  );
  const current = tabs[active];

  return (
    <div>
      <div
        className="flex gap-1 overflow-x-auto border-b border-neutral-200 pb-px dark:border-neutral-800"
        role="tablist"
        aria-label="Debate topics by category"
      >
        {CATEGORIES.map((cat) => {
          const data = tabs[cat];
          const isActive = active === cat;
          return (
            <button
              key={cat}
              type="button"
              role="tab"
              aria-selected={isActive}
              disabled={!data}
              onClick={() => setActive(cat)}
              className={`whitespace-nowrap px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'border-b-2 border-sky-600 text-sky-700 dark:border-sky-400 dark:text-sky-300'
                  : data
                    ? 'text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-neutral-100'
                    : 'cursor-not-allowed text-neutral-300 dark:text-neutral-700'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>
      <div className="pt-6" role="tabpanel">
        {current ? (
          <TopicView topic={current.topic} cases={current.cases} loggedIn={loggedIn} showArchiveLink />
        ) : (
          <p className="py-12 text-center text-sm italic text-neutral-400">
            No debate posted in this category yet. Check back tomorrow.
          </p>
        )}
      </div>
    </div>
  );
}
