-- Debait Club — RLS tightening (2026-09-24)
-- 1. reports and saved_items are private: users read only their own rows.
-- 2. cases/comments inserts must bind author_id to the authenticated user,
--    so nobody can post as someone else via the anon key.

-- saved_items: owners read only their own
drop policy if exists "public read" on public.saved_items;
drop policy if exists "users read own saved items" on public.saved_items;
create policy "users read own saved items" on public.saved_items
  for select using (user_id = auth.uid());

-- reports: reporters read only their own
drop policy if exists "public read" on public.reports;
drop policy if exists "reporters read own reports" on public.reports;
create policy "reporters read own reports" on public.reports
  for select using (reporter_id = auth.uid());

-- cases: insert must bind author_id to the authenticated user
drop policy if exists "authenticated post cases" on public.cases;
create policy "authenticated post cases" on public.cases
  for insert with check (auth.role() = 'authenticated' and author_id = auth.uid());

-- comments: same shape as cases
drop policy if exists "authenticated post comments" on public.comments;
create policy "authenticated post comments" on public.comments
  for insert with check (auth.role() = 'authenticated' and author_id = auth.uid());
