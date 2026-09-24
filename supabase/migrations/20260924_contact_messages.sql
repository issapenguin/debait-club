-- Contact form submissions. Anyone (logged in or not) may insert a row;
-- there is no select/update/delete policy, so only the service role can read
-- them (surfaced on the private admin page). The sender's email address is
-- never exposed to clients.
create table if not exists public.contact_messages (
  id bigint generated always as identity primary key,
  user_id uuid references public.profiles(id) on delete set null,
  email text not null,
  display_name text,
  username text,
  subject text not null,
  message text not null,
  email_sent boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.contact_messages enable row level security;

drop policy if exists "anyone can submit contact" on public.contact_messages;
create policy "anyone can submit contact"
  on public.contact_messages for insert
  with check (true);
