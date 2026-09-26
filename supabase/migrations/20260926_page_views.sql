-- Debait Club — page view tracking (2026-09-26)
-- Lightweight impression log backing the "tell me when the site gets new
-- impressions" watcher. The client beacon POSTs to /api/pageview, which
-- inserts here via the anon key. Paths and referrers are not sensitive, so
-- anon select is allowed (the watcher script uses the anon key).

create table if not exists public.page_views (
  id bigint generated always as identity primary key,
  path text not null check (char_length(path) between 1 and 500),
  referrer text check (referrer is null or char_length(referrer) <= 1000),
  created_at timestamptz not null default now()
);

create index if not exists page_views_created_at_idx
  on public.page_views (created_at desc);

alter table public.page_views enable row level security;

drop policy if exists "anon insert page views" on public.page_views;
create policy "anon insert page views" on public.page_views
  for insert to anon with check (true);

drop policy if exists "anon read page views" on public.page_views;
create policy "anon read page views" on public.page_views
  for select to anon using (true);
