-- Topic submissions: members propose debate questions for weekly curation.
-- Each submission belongs to the UTC week (Monday) it was created in.
-- Votes are upvotes only, consistent with the rest of the club.

create table if not exists public.topic_submissions (
  id bigint generated always as identity primary key,
  author_id uuid references public.profiles (id) on delete cascade,
  question text not null,
  context text not null,
  links text[] not null default '{}',
  category text not null check (category in ('Business', 'Entertainment', 'Lifestyle', 'Politics', 'Sports')),
  week_of date not null,
  score integer not null default 0,
  view_count integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists public.submission_votes (
  id bigint generated always as identity primary key,
  voter_id uuid references public.profiles (id) on delete cascade,
  submission_id bigint references public.topic_submissions (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (voter_id, submission_id)
);

create index if not exists topic_submissions_week_idx on public.topic_submissions (week_of desc, id desc);
create index if not exists topic_submissions_author_idx on public.topic_submissions (author_id);
create index if not exists topic_submissions_category_idx on public.topic_submissions (category);
create index if not exists submission_votes_submission_idx on public.submission_votes (submission_id);
create index if not exists submission_votes_voter_idx on public.submission_votes (voter_id);

alter table public.topic_submissions enable row level security;
alter table public.submission_votes enable row level security;

drop policy if exists "public read" on public.topic_submissions;
create policy "public read" on public.topic_submissions for select using (true);

drop policy if exists "authenticated submit topics" on public.topic_submissions;
create policy "authenticated submit topics" on public.topic_submissions
  for insert with check (auth.uid() = author_id);

drop policy if exists "authors manage own submissions" on public.topic_submissions;
create policy "authors manage own submissions" on public.topic_submissions
  for update using (auth.uid() = author_id) with check (auth.uid() = author_id);

drop policy if exists "authors delete own submissions" on public.topic_submissions;
create policy "authors delete own submissions" on public.topic_submissions
  for delete using (auth.uid() = author_id);

drop policy if exists "public read" on public.submission_votes;
create policy "public read" on public.submission_votes for select using (true);

drop policy if exists "authenticated vote on submissions" on public.submission_votes;
create policy "authenticated vote on submissions" on public.submission_votes
  for insert with check (auth.uid() = voter_id);

drop policy if exists "voters retract own submission votes" on public.submission_votes;
create policy "voters retract own submission votes" on public.submission_votes
  for delete using (auth.uid() = voter_id);
