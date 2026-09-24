import type { MetadataRoute } from 'next';
import { getServerClient } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

const BASE = 'https://www.debait.club';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const entries: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: now, changeFrequency: 'weekly', priority: 1 },
    { url: `${BASE}/archive`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/champions`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/submit`, lastModified: now, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${BASE}/rules`, lastModified: now, changeFrequency: 'monthly', priority: 0.5 },
    { url: `${BASE}/contact`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${BASE}/signup`, lastModified: now, changeFrequency: 'monthly', priority: 0.6 },
  ];

  const supabase = await getServerClient();
  if (supabase) {
    const { data: topics } = await supabase
      .from('topics')
      .select('id, topic_date')
      .order('topic_date', { ascending: false })
      .limit(200);
    for (const t of (topics ?? []) as { id: number; topic_date: string }[]) {
      entries.push({
        url: `${BASE}/topic/${t.id}`,
        lastModified: new Date(t.topic_date),
        changeFrequency: 'weekly',
        priority: 0.9,
      });
    }
    const { data: cases } = await supabase
      .from('cases')
      .select('id, created_at')
      .order('created_at', { ascending: false })
      .limit(500);
    for (const c of (cases ?? []) as { id: number; created_at: string }[]) {
      entries.push({
        url: `${BASE}/case/${c.id}`,
        lastModified: new Date(c.created_at),
        changeFrequency: 'weekly',
        priority: 0.6,
      });
    }
  }

  return entries;
}
