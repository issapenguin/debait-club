import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import Link from 'next/link';
import { fetchCaseDetail, getCurrentUserId } from '@/lib/data';
import { formatDate, renderRichText } from '@/lib/format';
import { CaseCard } from '@/components/CaseCard';
import { CommentThread } from '@/components/CommentThread';
import { JsonLd } from '@/components/JsonLd';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const userId = await getCurrentUserId();
  const detail = await fetchCaseDetail(Number(id), userId);
  if (!detail) return {};
  const { caseRow, topic } = detail;
  const snippet = caseRow.is_deleted
    ? 'archived'
    : caseRow.body.slice(0, 160).replace(/\s+/g, ' ').trim();
  const description = `${caseRow.side === 'for' ? 'FOR' : 'AGAINST'}: ${snippet}… Debate "${topic.proposition}" on Debait Club.`;
  return {
    title: topic.proposition,
    description,
    alternates: {
      canonical: `https://www.debait.club/case/${id}`,
    },
    openGraph: {
      title: `${topic.proposition} — Debait Club`,
      description,
      url: `https://www.debait.club/case/${id}`,
    },
  };
}

export default async function CasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const caseId = Number(id);
  if (!Number.isFinite(caseId)) notFound();

  const userId = await getCurrentUserId();
  const detail = await fetchCaseDetail(caseId, userId);
  if (!detail) notFound();

  const { caseRow, topic, comments } = detail;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'DiscussionForumPosting',
    headline: `${topic.proposition} — ${caseRow.side === 'for' ? 'FOR' : 'AGAINST'} case`,
    articleBody: caseRow.is_deleted ? 'This case was archived.' : caseRow.body,
    url: `https://www.debait.club/case/${caseId}`,
    datePublished: caseRow.created_at,
    author: {
      '@type': 'Organization',
      name: 'Debait Club',
      url: 'https://www.debait.club',
    },
    interactionStatistic: {
      '@type': 'InteractionCounter',
      interactionType: 'https://schema.org/CommentAction',
      userInteractionCount: comments.length,
    },
  };

  return (
    <div className="mx-auto max-w-3xl pt-8">
      <JsonLd data={jsonLd} />
      <Link
        href={`/topic/${topic.id}`}
        className="text-sm text-sky-600 hover:underline dark:text-sky-400"
      >
        ← Back to the debate
      </Link>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="rounded-full bg-neutral-900 px-3 py-1 font-semibold text-white dark:bg-neutral-100 dark:text-neutral-900">
          {topic.category}
        </span>
        <span className="text-neutral-500 dark:text-neutral-400">{formatDate(topic.topic_date)}</span>
      </div>
      <h1 className="font-display mt-3 text-2xl font-semibold leading-tight tracking-tight text-neutral-900 sm:text-3xl dark:text-neutral-50">
        {topic.proposition}
      </h1>
      <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
        One {caseRow.side === 'for' ? 'FOR' : 'AGAINST'} case in this debate
      </p>

      <div className="mt-6">
        <CaseCard caseRow={caseRow} loggedIn={userId !== null} currentUserId={userId} />
      </div>

      <CommentThread caseId={caseRow.id} comments={comments} loggedIn={userId !== null} currentUserId={userId} />
    </div>
  );
}
