-- Fix page-view tracking (broken 2026-09-29): /api/pageview inserted
-- into page_views with Prefer: return=representation, but page_views has
-- no anon SELECT policy and PostgREST applies SELECT policies to
-- RETURNING rows, so every insert was rejected (42501) and no views were
-- recorded after 2026-09-29. This RPC (SECURITY DEFINER, same pattern as
-- record_dwell) inserts and returns the new id without table SELECT
-- rights. Applied live 2026-10-07; route.ts now calls this RPC.
create or replace function public.log_page_view(p_path text, p_referrer text, p_user_agent text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  insert into public.page_views (path, referrer, user_agent)
  values (p_path, p_referrer, p_user_agent)
  returning id into new_id;
  return new_id;
end;
$$;

grant execute on function public.log_page_view(text, text, text) to anon;
