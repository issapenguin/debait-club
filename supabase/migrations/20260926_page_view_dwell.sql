-- Debait Club — page view dwell time (2026-09-26)
-- Adds dwell_ms (time spent on the view, in milliseconds) to page_views and a
-- SECURITY DEFINER function so the anon key can record it without getting
-- UPDATE rights on the table. First write wins: dwell can be set once.

alter table public.page_views
  add column if not exists dwell_ms integer
  check (dwell_ms is null or dwell_ms >= 0);

create or replace function public.record_dwell(p_id bigint, p_ms integer)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if p_ms is null or p_ms < 0 or p_ms > 43200000 then
    return;
  end if;
  update public.page_views
     set dwell_ms = p_ms
   where id = p_id
     and dwell_ms is null;
end;
$$;

revoke all on function public.record_dwell(bigint, integer) from public;
grant execute on function public.record_dwell(bigint, integer) to anon;
