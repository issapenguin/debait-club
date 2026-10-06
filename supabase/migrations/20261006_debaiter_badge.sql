-- Badges now track the current board: top 3 hold gold/silver/bronze
-- trophies, ranks 4-50 are 'debaiter' (Top Debaiter). Legacy 'champion'
-- (ex top-100) stays allowed until the weekly snapshot rewrites it.
alter table public.profiles
  drop constraint if exists profiles_champion_badge_check;

alter table public.profiles
  add constraint profiles_champion_badge_check
  check (champion_badge in ('champion', 'debaiter', 'bronze', 'silver', 'gold'));
