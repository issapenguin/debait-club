-- Debait Club — admin users (2026-09-24)
-- Separate table (not a column on profiles) so the permissive
-- "users manage own profile" policy can never be used to self-grant admin.
-- Only the service role can write here; users can read only their own row
-- so the app can check admin status under RLS.

create table if not exists public.admin_users (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz default now()
);

alter table public.admin_users enable row level security;

drop policy if exists "users read own admin row" on public.admin_users;
create policy "users read own admin row" on public.admin_users
  for select using (user_id = auth.uid());
