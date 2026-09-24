-- Champion badges: weekly snapshots of the champions board plus a permanent
-- per-profile badge tier. Tiers: gold (has held #1), silver (has held #2),
-- bronze (has held #3), champion (has reached the top 100). Badges are never
-- revoked once earned; a higher tier replaces a lower one.

alter table public.profiles
  add column if not exists champion_badge text
  check (champion_badge in ('champion', 'bronze', 'silver', 'gold'));

create table if not exists public.champion_history (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  rank integer not null check (rank >= 1 and rank <= 100),
  points integer not null default 0,
  snapshot_at timestamptz not null default now()
);

create index if not exists champion_history_user_id_idx
  on public.champion_history (user_id);
create index if not exists champion_history_snapshot_at_idx
  on public.champion_history (snapshot_at desc);

alter table public.champion_history enable row level security;

-- Public read; writes happen only through the service role (weekly snapshot).
drop policy if exists "champion_history public read" on public.champion_history;
create policy "champion_history public read" on public.champion_history
  for select using (true);
