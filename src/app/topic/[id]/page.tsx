import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { getServerClient } from '@/lib/supabase/server';
import { fetchCasesForTopic, getCurrentUserId } from '@/lib/data';
import { TopicView } from '@/components/TopicView';
import type { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const supabase = await getServerClient();
  if (!supabase) return {};
  const { data } = await supabase
    .from('topics')
    .select('proposition, category, context')
    .eq('id', Number(id))
    .maybeSingle();
  if (!data) return {};
  const topic = data as Pick<Topic, 'proposition' | 'category' | 'context'>;
  const description =
    topic.context ??
    `Debate: ${topic.proposition} — read the FOR and AGAINST cases, vote, and join the discussion on Debait Club.`;
  return {
    title: topic.proposition,
    description,
    openGraph: {
      title: `${topic.proposition} — Debait Club`,
      description,
      url: `https://www.debait.club/topic/${id}`,
    },
  };
}

export default async function TopicPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const topicId = Number(id);
  if (!Number.isFinite(topicId)) notFound();

  const supabase = await getServerClient();
  let topic: Topic | null = null;
  if (supabase) {
    const { data } = await supabase.from('topics').select('*').eq('id', topicId).single();
    topic = (data as Topic | null) ?? null;
  }
  if (!topic) notFound();

  const userId = await getCurrentUserId();
  const cases = await fetchCasesForTopic(topicId, userId);

  return (
    <div className="pt-8">
      <TopicView topic={topic} cases={cases} loggedIn={userId !== null} showArchiveLink />
    </div>
  );
}
