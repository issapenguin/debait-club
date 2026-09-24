import Link from 'next/link';
import { fetchTopics, fetchCaseCounts, fetchTopicLeanings } from '@/lib/data';
import { formatDate } from '@/lib/format';
import { LeaningTag } from '@/components/LeaningTag';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const topics = await fetchTopics();
  const counts = await fetchCaseCounts(topics.map((t) => t.id));
  const leanings = await fetchTopicLeanings(topics.map((t) => t.id));

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Archive
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Every past debate, newest first. Archived topics stay fully interactive —
        you can still post cases, vote, and comment.
      </p>

      {topics.length === 0 ? (
        <p className="mt-10 text-center text-sm italic text-neutral-400">
          No debates yet. Check back soon.
        </p>
      ) : (
        <div className="mt-8 space-y-3">
          {topics.map((t) => (
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
                <LeaningTag leaning={leanings.get(t.id) ?? 'neutral'} />
                <span className="ml-auto text-neutral-400">
                  {(counts.get(t.id) ?? 0)} {(counts.get(t.id) ?? 0) === 1 ? 'case' : 'cases'}
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
