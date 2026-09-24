import Link from 'next/link';
import { SubmissionBoard } from '@/components/SubmissionBoard';
import { SubmissionForm } from '@/components/SubmissionForm';
import { CoinIcon } from '@/components/CoinIcon';
import { fetchSubmissionLeaders, fetchSubmissions, getCurrentUserId } from '@/lib/data';
import { weekOf } from '@/lib/types';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Submit a topic — Debait Club',
  description:
    'Propose next week\u2019s debates. Submit a question with context and links, flair it, and let the club vote with d-coins.',
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
        Submit a topic
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Shape next week\u2019s debates. The best member-submitted questions, as voted
        by the club, become next week\u2019s featured and category topics.
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

      {leaderCards.length > 0 && (
        <section className="mt-8" aria-label="This week's leaders">
          <h2 className="mb-3 text-sm font-bold uppercase tracking-wider text-neutral-500">
            This week\u2019s leaders
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

      <section className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900" aria-label="Submission form">
        <h2 className="mb-4 font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Propose a debate
        </h2>
        {userId ? (
          <SubmissionForm />
        ) : (
          <div className="text-center">
            <p className="text-sm text-neutral-600 dark:text-neutral-300">
              Join the club to submit topics and vote with d-coins.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Join the club
            </Link>
          </div>
        )}
      </section>

      <section className="mt-10" aria-label="Member-submitted topics">
        <h2 className="mb-4 font-display text-xl font-semibold text-neutral-900 dark:text-neutral-50">
          Live ranking
        </h2>
        <SubmissionBoard initialSubmissions={initial} initialWeek={week} loggedIn={userId !== null} />
      </section>
    </div>
  );
}
