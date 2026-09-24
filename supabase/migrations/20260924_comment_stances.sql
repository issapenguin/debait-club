-- Comment stances move from the 5-point agree/disagree scale to a simple
-- for / neutral / against position on the topic. Backfill existing rows first.
update public.comments set stance = case
  when stance in ('strongly_agree', 'agree') then 'for'
  when stance in ('strongly_disagree', 'disagree') then 'against'
  else 'neutral'
end;

alter table public.comments drop constraint if exists comments_stance_check;
alter table public.comments
  add constraint comments_stance_check check (stance in ('for', 'neutral', 'against'));
