# Debait Club

A daily-debate web app. One debate topic per category (Featured, Business,
Entertainment, Lifestyle, Politics, Sports) every day. Members post FOR/AGAINST
cases, upvote, discuss in stance-tagged threads, save bookmarks, and climb the
Champions leaderboard.

## Stack

- Next.js 16 (App Router) + TypeScript + Tailwind CSS v4
- Supabase (Postgres + Auth): `@supabase/supabase-js` + `@supabase/ssr`
- Fonts: Fraunces (display) + Inter (body) via `next/font/google`

## Setup

1. Copy `.env.example` to `.env.local` and fill in:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY` (server-only; used by API routes for score
     updates and by the seed script)
2. In the Supabase SQL editor, run `supabase/schema.sql` (idempotent).
3. Seed sample data (replace `seed/*.json` with the real files first):
   `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed`
4. In the Supabase dashboard → Authentication → Providers, enable **Google**
   and **Apple** and add the redirect URL `<your-origin>/auth/callback`.
   The sign-in buttons already point at `/auth/callback` and just work once
   the provider keys are configured.
5. `npm run dev`

## Notes

- `npm run build` passes with no Supabase env set: Supabase clients are lazy
  factories and all data pages are `force-dynamic`, so nothing fetches at
  build time.
- Auth session refresh lives in `src/proxy.ts` (Next 16 renamed
  `middleware.ts` → `proxy.ts`; same behavior).
- There is no downvoting anywhere by design. User-facing copy always says
  "cases", never "arguments".
- Content moderation keyword list: `src/lib/moderation.ts` (private to the file).
