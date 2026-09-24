import Link from 'next/link';
import { SubmissionBoard } from '@/components/SubmissionBoard';
import { CoinIcon } from '@/components/CoinIcon';
import { fetchSubmissionLeaders, fetchSubmissions, getCurrentUserId } from '@/lib/data';
import { weekOf } from '@/lib/types';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Future Topics — Debait Club',
  description:
    'Vote on next week\u2019s debates with d-coins, or propose your own topic. The top-voted member submissions become next week\u2019s debates.',
};

const STEPS = [
  {
    title: 'Propose it',
    body: 'Submit a debate question with context and at least one link — all three required — and flair it with a category.',
  },
  {
    title: 'The club votes',
    body: 'Members vote all week. Every upvote is a d-coin, and the live ranking below shows who is winning.',
  },
  {
    title: 'Winners get debated',
    body: 'The top-voted submission is considered for next week\u2019s featured debate; the other leaders are considered for the category sections.',
  },
];

export default async function SubmitPage() {
  const userId = await getCurrentUserId();
  const week = weekOf();
  const [leaders, initial] = await Promise.all([
    fetchSubmissionLeaders(week, userId),
    fetchSubmissions({ week, sort: 'trending', limit: 200 }, userId),
  ]);

  const leaderCards: { label: string; question: string; score: number }[] = [];
  if (leaders.overall) {
    leaderCards.push({
      label: 'Overall leader — in the running for next week\u2019s featured debate',
      question: leaders.overall.question,
      score: leaders.overall.score,
    });
  }
  for (const cat of Object.keys(leaders.byCategory)) {
    const s = leaders.byCategory[cat];
    if (s && s.id !== leaders.overall?.id) {
      leaderCards.push({ label: `${cat} leader`, question: s.question, score: s.score });
    }
  }

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Future Topics
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Vote next week&apos;s debates into existence. Every upvote is a d-coin —
        spend yours on the questions you most want to argue about.
      </p>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        {STEPS.map((step, i) => (
          <div
            key={step.title}
            className="rounded-2xl border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-900"
          >
            <p className="font-display text-sm font-bold text-sky-600 dark:text-sky-400">
              {i + 1}
            </p>
            <h2 className="mt-1 font-semibold text-neutral-900 dark:text-neutral-50">
              {step.title}
            </h2>
            <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-300">{step.body}</p>
          </div>
        ))}
      </div>

      <section className="mt-10" aria-label="Vote on future topics">
        <div className="mb-4 flex items-center gap-3">
          <CoinIcon className="h-8 w-8" />
          <div>
            <h2 className="font-display text-2xl font-semibold text-neutral-900 dark:text-neutral-50">
              Vote for next week&apos;s debates
            </h2>
            <p className="text-sm text-neutral-500 dark:text-neutral-400">
              Tap the coin to upvote. Rankings update live.
            </p>
          </div>
        </div>
        <SubmissionBoard initialSubmissions={initial} initialWeek={week} loggedIn={userId !== null} />
      </section>

      {leaderCards.length > 0 && (
        <section className="mt-10" aria-label="This week's leaders">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
            This week&apos;s leaders
          </h2>
          <div className="space-y-2">
            {leaderCards.map((l) => (
              <div
                key={l.label}
                className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/20"
              >
                <CoinIcon className="h-6 w-6 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-bold uppercase tracking-wide text-amber-700 dark:text-amber-400">
                    {l.label}
                  </p>
                  <p className="truncate font-medium text-neutral-900 dark:text-neutral-50">
                    {l.question}
                  </p>
                </div>
                <span className="ml-auto shrink-0 text-sm font-semibold text-neutral-600 dark:text-neutral-300">
                  {l.score.toLocaleString()} d-coins
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      <section
        className="mt-10 rounded-2xl border-2 border-dashed border-sky-300 bg-sky-50 p-6 text-center sm:p-8 dark:border-sky-800 dark:bg-sky-950/20"
        aria-label="Submit your own topic"
      >
        <h2 className="font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Have a topic in mind?
        </h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-neutral-600 dark:text-neutral-300">
          Propose your own debate question. If the club likes it, you&apos;ll see
          it argued right here next week.
        </p>
        <Link
          href="/submit/new"
          className="mt-4 inline-block rounded-full bg-sky-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sky-500"
        >
          Propose a debate
        </Link>
      </section>
    </div>
  );
}
