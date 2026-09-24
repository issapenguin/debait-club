import { notFound } from 'next/navigation';
import { getServerClient } from '@/lib/supabase/server';
import { fetchCasesForTopic, getCurrentUserId } from '@/lib/data';
import { TopicView } from '@/components/TopicView';
import type { Topic } from '@/lib/types';

export const dynamic = 'force-dynamic';

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
