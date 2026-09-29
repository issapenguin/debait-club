-- Debait Club — user agent on page views (2026-09-29)
-- Adds user_agent to page_views so bot/crawler traffic can be identified.
-- The column is deliberately NOT readable with the anon key: public reads go
-- through page_views_public, a view that exposes every column except
-- user_agent. Consumers (the pageview watcher) must query the view, not the
-- table. Requires Postgres 15+ for security_invoker = false.

alter table public.page_views
  add column if not exists user_agent text
  check (user_agent is null or char_length(user_agent) <= 2000);

create or replace view public.page_views_public as
select id, path, referrer, created_at, dwell_ms
from public.page_views;

-- Run the view as its owner (definer) so it keeps working after the
-- table-level anon SELECT policy is dropped below.
alter view public.page_views_public set (security_invoker = false);

-- Remove public read access to the raw table; user_agent lives there.
-- The "anon insert page views" policy is intentionally left untouched.
drop policy if exists "anon read page views" on public.page_views;

grant select on public.page_views_public to anon;
