// Debait Club seed script.
// Idempotent: upserts profiles/topics/cases/comments on their primary keys and
// inserts votes while skipping ones that already exist.
// Usage: SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... npm run db:seed
import { readFileSync } from 'node:fs';
import { createClient } from '@supabase/supabase-js';
import { v5 as uuidv5 } from 'uuid';

// Fixed namespace so demo ids map to deterministic UUIDs on every run.
const NAMESPACE = '3f6a9c2e-1b4d-4f8a-9c1e-7a5b2d8e0f42';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error('Missing env: set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const db = createClient(SUPABASE_URL, SERVICE_KEY);
const demoIdToUuid = (demoId) => uuidv5(demoId, NAMESPACE);

function load(name) {
  const raw = readFileSync(new URL(`./${name}`, import.meta.url), 'utf8');
  return JSON.parse(raw);
}

async function upsert(table, rows, onConflict) {
  if (rows.length === 0) return;
  const { error } = await db.from(table).upsert(rows, { onConflict });
  if (error) throw new Error(`upsert ${table}: ${error.message}`);
}

async function main() {
  const { profiles } = load('profiles.json');
  const { topics } = load('topics.json');
  const { comments } = load('comments.json');
  const { case_votes, comment_votes } = load('votes.json');

  // 1. Profiles (demo_id -> deterministic uuid).
  const demoToUuid = new Map();
  await upsert(
    'profiles',
    profiles.map((p) => {
      const id = demoIdToUuid(p.demo_id);
      demoToUuid.set(p.demo_id, id);
      return { id, username: p.username, display_name: p.display_name ?? null };
    }),
    'id'
  );

  // 2. Topics (cases are nested in topics.json per the seed contract).
  await upsert(
    'topics',
    topics.map((t) => ({
      id: t.id,
      proposition: t.proposition,
      category: t.category,
      context: t.context ?? null,
      sources: t.sources ?? [],
      topic_date: t.topic_date,
      is_featured: t.is_featured ?? false,
    })),
    'id'
  );

  // 3. Cases.
  const caseRows = [];
  for (const t of topics) {
    for (const c of t.cases ?? []) {
      const authorId = demoToUuid.get(c.author_demo_id);
      if (!authorId) throw new Error(`unknown author demo id ${c.author_demo_id}`);
      caseRows.push({
        id: c.id,
        topic_id: t.id,
        side: c.side,
        author_id: authorId,
        body: c.body,
        score: c.score ?? 0,
      });
    }
  }
  await upsert('cases', caseRows, 'id');

  // 4. Comments (parent ids are literal comment ids per the seed contract).
  await upsert(
    'comments',
    comments.map((c) => {
      const authorId = demoToUuid.get(c.author_demo_id);
      if (!authorId) throw new Error(`unknown author demo id ${c.author_demo_id}`);
      return {
        id: c.id,
        case_id: c.case_id,
        author_id: authorId,
        parent_id: c.parent_id ?? null,
        body: c.body,
        stance: c.stance,
        score: c.score ?? 0,
      };
    }),
    'id'
  );

  // 5. Votes — insert, skipping conflicts so re-runs are no-ops.
  const voteRows = [
    ...(case_votes ?? []).map((v) => ({
      voter_id: demoToUuid.get(v.voter_demo_id),
      target_type: 'case',
      target_id: v.case_id,
    })),
    ...(comment_votes ?? []).map((v) => ({
      voter_id: demoToUuid.get(v.voter_demo_id),
      target_type: 'comment',
      target_id: v.comment_id,
    })),
  ].filter((v) => v.voter_id);
  if (voteRows.length > 0) {
    const { error } = await db
      .from('votes')
      .upsert(voteRows, { onConflict: 'voter_id,target_type,target_id', ignoreDuplicates: true });
    if (error) throw new Error(`upsert votes: ${error.message}`);
  }

  console.log(
    `Seeded ${profiles.length} profiles, ${topics.length} topics, ${caseRows.length} cases, ${comments.length} comments, ${voteRows.length} votes.`
  );
}

main().catch((err) => {
  console.error(err.message ?? err);
  process.exit(1);
});
