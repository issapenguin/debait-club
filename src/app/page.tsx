import { CATEGORIES } from '@/lib/types';
import {
  fetchTopics,
  fetchCaseCounts,
  fetchCasesForTopic,
  pickTabTopics,
  getCurrentUserId,
} from '@/lib/data';
import { HomeTabs, type TabData } from '@/components/HomeTabs';
import { isSupabaseConfigured } from '@/lib/supabase/config';

export const dynamic = 'force-dynamic';

export default async function HomePage() {
  const userId = await getCurrentUserId();

  const tabs: Partial<Record<(typeof CATEGORIES)[number], TabData | null>> = {};
  if (isSupabaseConfigured()) {
    const topics = await fetchTopics();
    const counts = await fetchCaseCounts(topics.map((t) => t.id));
    const { featured, byCategory } = pickTabTopics(topics, counts);

    const wanted: { tab: (typeof CATEGORIES)[number]; topicId: number }[] = [];
    if (featured) wanted.push({ tab: 'Featured', topicId: featured.id });
    for (const cat of Object.keys(byCategory)) {
      const t = byCategory[cat];
      if (t) wanted.push({ tab: cat as (typeof CATEGORIES)[number], topicId: t.id });
    }

    const fetched = await Promise.all(
      wanted.map(async ({ tab, topicId }) => {
        const topic = topics.find((t) => t.id === topicId)!;
        const cases = await fetchCasesForTopic(topicId, userId);
        return { tab, data: { topic, cases } as TabData };
      })
    );
    for (const { tab, data } of fetched) {
      if (!tabs[tab]) tabs[tab] = data;
    }
  }

  return (
    <div>
      <section className="mx-auto max-w-3xl py-12 text-center sm:py-16">
        <blockquote className="font-display text-3xl font-medium leading-snug tracking-tight text-neutral-900 sm:text-4xl dark:text-neutral-50">
          “You have your views. We accept that. You should be open to changing
          them. We expect that.”
        </blockquote>
        <p className="mt-6 text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">
          One topic per category. Every day.
        </p>
      </section>
      <HomeTabs tabs={tabs} loggedIn={userId !== null} />
    </div>
  );
}
