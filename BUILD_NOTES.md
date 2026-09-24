# Debait Club — Build Notes

Production codebase for **Debait Club** (`debait.club`), a daily-debate web app:
one debate topic per category per day, FOR/AGAINST cases, stance-tagged threaded
comments, upvotes only, Champions leaderboard, archive, saved items, reports.

## Stack

- **Next.js 16 (App Router) + TypeScript + Tailwind CSS v4**, scaffolded with
  `create-next-app` (layout in `src/`).
- **Supabase Postgres + Auth** (`@supabase/supabase-js`, `@supabase/ssr`).
  Privileged writes go through a service-role client inside API routes; the
  browser never sees the service key.
- **Next 16 convention:** session refresh lives in `src/proxy.ts` (Next 16
  renamed `middleware.ts` → `proxy.ts`; same behavior).
- **Fonts:** Fraunces (editorial display) for the quote/headlines + system UI
  stack for body. No external image assets — the logo is an inline SVG.

## What was ported from the private prototype

- **Content (faithful, 1:1):** 20 topics, 60 cases, 8 threaded comments, source
  links, contexts, authors, and vote scores — transcribed from the private
  artifact export. Case/comment bodies are byte-identical to the original.
- **Profiles:** 240 demo profiles. 100 handles are the originals (60 case
  authors + 8 comment authors + 32 champions-list handles). The remaining 140
  handles are tasteful originals in the same style (the artifact's full
  zero-activity profile list was not recoverable through read-only APIs) —
  see "Assumptions" below.
- **Votes:** expanded deterministically (seeded RNG `20260923`) from each
  case/comment score into individual vote rows — **6,098 case votes + 292
  comment votes**, exactly matching the artifact's totals. No voter appears
  twice on the same target; authors never vote on their own content.
- **Seed shape:** `seed/topics.json` (cases nested per topic), `seed/comments.json`,
  `seed/profiles.json`, `seed/votes.json`. `seed/seed.mjs` (`npm run db:seed`)
  maps `demo_id` → deterministic UUID v5, upserts everything idempotently, and
  skips existing votes on re-run.

## Auth

- **Email/password** through Supabase Auth. Signup heading: "Join the club."
- Signup requires **display name, username, email, password, birth date**;
  accounts **under 13 are rejected server-side** (`/api/auth/signup`).
- No bio field at signup; bio is editable later on the owner's profile.
- **Google and Apple OAuth** are fully wired (`signInWithOAuth` +
  `/auth/callback`) but **pending provider credentials**: configure the OAuth
  client IDs/secrets in the Supabase dashboard (Authentication → Providers),
  then add the site URL + `/auth/callback` to the provider redirect allowlists.

## Moderation

- `src/lib/moderation.ts` — server-side censor: slur/hate-term keyword list plus
  common obfuscations (leetspeak, separators). The list itself is private (not
  exposed to the client).
- Rules page (`/rules`) states the PG-13 policy including
  "You only get 1 f-bomb, so choose wisely."
- Reports are stored in `reports` (status `open` by default) for out-of-band
  review/removal; report targets resolve through the moderation layer.

## Product rules enforced

- Public reading; login required to post, vote, save, report.
- **Upvotes only** — no downvote exists anywhere in the UI or API.
- Cases: **1,680-character limit**, live counter client-side + `CHECK
  (char_length(body) <= 1680)` in Postgres.
- Comment stance labels: Strongly agree / Agree / Neutral / Disagree /
  Strongly disagree.
- Case "…" menu: Save, Share, Report. Comment "…" menu: Save, Report.
- Share uses the stable public URL `/case/[id]` (`navigator.share` → clipboard).
- Sort controls (Top / New) exist **only** inside case/comment areas.
- The word "arguments" appears nowhere in user-facing copy; the product term is
  **"cases"**.
- Theme toggle is a crescent-moon icon, persisted in localStorage, honoring
  `prefers-color-scheme`.
- Follow/follower functionality was deliberately **not** ported (legacy storage
  only in the prototype).

## Environment variables

Copy `.env.example` → `.env.local`:

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (browser-safe) |
| `SUPABASE_SERVICE_ROLE_KEY` | Service role key — server only, used by API routes + `db:seed` |

The app **builds with no env set** (lazy client factories, `force-dynamic` on
data pages). Email sending is **stubbed**: there is no outbound mail yet —
Supabase Auth emails (confirmations, resets) use Supabase's built-in sender
until a custom SMTP provider is configured in the dashboard.

## Supabase setup (one time)

1. Create a project at supabase.com (do **not** commit keys).
2. Run `supabase/schema.sql` in the SQL editor (idempotent; enables RLS).
3. `SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed`.
4. Enable Google/Apple providers (see Auth above) and set Site URL.

## Vercel deployment

1. Import this repo in Vercel; framework preset: Next.js.
2. Set the three env vars above in the project settings.
3. Deploy. Then add the production URL as Supabase Site URL and to OAuth
   redirect allowlists.

## Porkbun DNS for debait.club

In Porkbun → Domain Management → `debait.club` → DNS:

- **Root (`@`):** `A` record → `76.76.21.21` (Vercel)
- **`www`:** `CNAME` → `cname.vercel-dns.com`
- Then add `debait.club` (+ `www.debait.club`) in the Vercel project Domains tab
  and let Vercel issue the certificate.

## Assumptions

1. **140 of 240 profile handles are original creations**, not recovered originals.
   All 68 content authors and 32 ranked champions keep their exact handles;
   only zero-activity filler profiles are synthetic. Documented here per the
   "no fake-looking usernames" requirement.
2. **Vote rows are synthetic-but-faithful:** totals and per-case/per-comment
   scores match the prototype exactly; individual voter identities are a
   deterministic shuffle (no original per-voter mapping was recoverable).
3. **Seed profiles have no passwords or emails** — they are leaderboard/content
   attribution fixtures, not login accounts. Real users sign up fresh.
4. **Daily topic refresh** (new topic per tab each day) is not yet automated —
   there is no cron/edge job; topics are seeded and the archive accumulates
   manually for now.
5. Comments are capped at 2,000 characters server-side (spec only capped cases).
6. `/saved` case cards show comment count 0 (counts not fetched on that page) —
   cosmetic, easy follow-up.
