import { fetchTopics, fetchCaseCounts, fetchTopicLeanings } from '@/lib/data';
import { ArchiveBrowser, type ArchiveTopic } from '@/components/ArchiveBrowser';

export const dynamic = 'force-dynamic';

export default async function ArchivePage() {
  const topics = await fetchTopics();
  const counts = await fetchCaseCounts(topics.map((t) => t.id));
  const leanings = await fetchTopicLeanings(topics.map((t) => t.id));

  const browserTopics: ArchiveTopic[] = topics.map((t) => ({
    id: t.id,
    proposition: t.proposition,
    category: t.category,
    topic_date: t.topic_date,
    is_featured: t.is_featured,
  }));

  return (
    <div className="mx-auto max-w-3xl pt-10">
      <h1 className="font-display text-3xl font-semibold tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
        Archive
      </h1>
      <p className="mt-2 text-[15px] text-neutral-500 dark:text-neutral-400">
        Every past debate, newest first. Search by keyword or filter by flair.
        Archived topics stay fully interactive — you can still post cases,
        vote, and comment.
      </p>

      <ArchiveBrowser
        topics={browserTopics}
        counts={Object.fromEntries(counts)}
        leanings={Object.fromEntries(leanings)}
      />
    </div>
  );
}
