import Link from 'next/link';
import { SubmissionForm } from '@/components/SubmissionForm';
import { getCurrentUserId } from '@/lib/data';
import type { Metadata } from 'next';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Propose a debate — Debait Club',
  description:
    'Propose a debate question with context and links, flair it with a category, and let the club vote with d-coins.',
};

export default async function SubmitNewPage() {
  const userId = await getCurrentUserId();

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <Link
        href="/submit"
        className="text-sm font-medium text-sky-600 hover:underline dark:text-sky-400"
      >
        ← Back to Future Topics
      </Link>
      <h1 className="font-display mt-4 text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Propose a debate
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Submit a debate question with context and at least one link — all three
        required — and flair it with a category. Members vote all week; the
        top-voted submissions are considered for next week&apos;s debates.
      </p>

      <section
        className="mt-8 rounded-2xl border border-neutral-200 bg-white p-5 dark:border-neutral-800 dark:bg-neutral-900"
        aria-label="Submission form"
      >
        {userId ? (
          <SubmissionForm redirectTo="/submit" />
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
    </div>
  );
}
