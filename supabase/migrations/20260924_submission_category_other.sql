-- Allow the "Other" flair on member-submitted topics.
alter table public.topic_submissions
  drop constraint if exists topic_submissions_category_check;
alter table public.topic_submissions
  add constraint topic_submissions_category_check
  check (category in ('Business', 'Entertainment', 'Lifestyle', 'Politics', 'Sports', 'Other'));
