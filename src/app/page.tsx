import { CATEGORIES } from '@/lib/types';
import Link from 'next/link';
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
      <section className="mx-auto max-w-3xl py-8 text-center sm:py-10">
        <blockquote className="font-display text-sm font-medium leading-relaxed tracking-tight text-neutral-900 md:whitespace-nowrap dark:text-neutral-50">
          “You have your views. We accept that. You should be open to changing
          them. We expect that.”
        </blockquote>
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.2em] text-neutral-400">
          One topic per category. Every week.
        </p>
      </section>
      <HomeTabs tabs={tabs} loggedIn={userId !== null} />
      {!userId && (
        <section className="mx-auto mt-10 max-w-3xl text-center">
          <div className="rounded-2xl border border-sky-200 bg-sky-50 px-6 py-6 dark:border-sky-900/60 dark:bg-sky-950/30">
            <p className="font-display text-xl font-semibold tracking-tight text-neutral-900 dark:text-neutral-50">
              Reading is free. Debating is better.
            </p>
            <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-300">
              Join the club to vote on cases, make your own case, and save your
              favorites. It takes a minute.
            </p>
            <Link
              href="/signup"
              className="mt-4 inline-block rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-neutral-700 dark:bg-neutral-100 dark:text-neutral-900 dark:hover:bg-neutral-300"
            >
              Join the club
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
