-- Soft delete for cases and comments. Deleted items keep their rows (and
-- their votes, replies, and saved-item references) so threads stay intact and
-- lifetime d-coin tallies are preserved; the app renders their body as
-- "archived" instead.
alter table public.cases
  add column if not exists is_deleted boolean not null default false;
alter table public.comments
  add column if not exists is_deleted boolean not null default false;

create index if not exists cases_is_deleted_idx on public.cases (is_deleted);
create index if not exists comments_is_deleted_idx on public.comments (is_deleted);
