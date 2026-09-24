#!/usr/bin/env python3
"""
Builds production SQL for the Debait Club content expansion.

Reads seed/new_content/agent_{a,b,c,d}.json (actual writer-agent format):
  topics:   {id, proposition, category, context, sources[{title,url}], topic_date, is_featured}
  cases:    {id, topic_id, side, author_demo_id, body}
  comments: {id, case_id, author_demo_id, parent_id, body, stance(snake_case)}

Validates everything, then emits chunked SQL into seed/new_content/sql/:
  01_topics_new.sql        INSERT topics 21-29
  02_topics_repurpose.sql  UPDATE topics 1-5 (proposition/context/sources only; keeps date)
  03_cases_*.sql           INSERT cases (chunked)
  04_comments_*.sql        INSERT comments (chunked)
  05_votes_*.sql           INSERT votes (chunked)
  06_verify.sql            verification queries to run after each chunk

Id mapping (deterministic):
  case local id C    -> real case id    = 100000 + C
  comment local id M -> real comment id = 200000 + M
"""
import json
import random
import re
import sys
from datetime import datetime, timedelta
from pathlib import Path
from uuid import uuid5, UUID
from zoneinfo import ZoneInfo

random.seed(20260924)
ET = ZoneInfo("America/New_York")
NOW_ET = datetime(2026, 9, 24, 10, 5, tzinfo=ET)  # "now" cap for timestamps

BASE = Path("/home/hatch/workspace/debait-club/seed/new_content")
OUT = BASE / "sql"
NAMESPACE = UUID("3f6a9c2e-1b4d-4f8a-9c1e-7a5b2d8e0f42")

CATEGORIES = {"Featured", "Business", "Entertainment", "Lifestyle", "Politics", "Sports"}
NEW_TOPIC_IDS = set(range(21, 30))
REPURPOSED_IDS = {1, 2, 3, 4, 5}
TOPUP_IDS = set(range(6, 21))
SIDES = {"for", "against"}
STANCES = {"strongly_agree", "agree", "neutral", "disagree", "strongly_disagree"}
EMDASH = "—"
BANNED = [
    "fuck", "shit", "bitch", "asshole", "dick", "pussy", "cunt", "whore",
    "slut", "bastard", "motherfucker", "nigger", "nigga", "faggot", "retard",
    "kike", "spic", "chink", "gook", "tranny", "dyke",
]

errors = []

def err(msg):
    errors.append(msg)

def demo_uuid(demo_id):
    return str(uuid5(NAMESPACE, demo_id))

# ---------------------------------------------------------------- load & merge
blobs = {}
for agent in "abcd":
    p = BASE / f"agent_{agent}.json"
    blobs[agent] = json.loads(p.read_text())

topics, cases, comments = [], [], []
for agent, b in blobs.items():
    topics += b.get("topics", [])
    cases += b.get("cases", [])
    comments += b.get("comments", [])

# ---------------------------------------------------------------- validate topics
topic_ids = [t["id"] for t in topics]
if len(topic_ids) != len(set(topic_ids)):
    err("duplicate topic ids")
if set(topic_ids) != (NEW_TOPIC_IDS | REPURPOSED_IDS):
    err(f"topic ids mismatch: got {sorted(topic_ids)}")
featured = [t for t in topics if t.get("is_featured")]
if len(featured) != 1 or featured[0]["id"] != 21:
    err(f"featured topic must be exactly id 21, got {[t['id'] for t in featured]}")
for t in topics:
    if t["category"] not in CATEGORIES:
        err(f"topic {t['id']}: bad category {t['category']}")
    if not t.get("proposition", "").strip().endswith("?"):
        err(f"topic {t['id']}: proposition must end with '?'")
    for s in t.get("sources", []):
        if not (s.get("title") and s.get("url", "").startswith("https://")):
            err(f"topic {t['id']}: bad source entry {s}")

# ---------------------------------------------------------------- validate cases
case_ids = [c["id"] for c in cases]
if len(case_ids) != len(set(case_ids)):
    err("duplicate case ids")
if len(cases) != 114:
    err(f"expected 114 cases, got {len(cases)}")
from collections import Counter, defaultdict
by_topic = defaultdict(list)
for c in cases:
    if c["topic_id"] not in set(topic_ids) | TOPUP_IDS:
        err(f"case {c['id']}: bad topic_id {c['topic_id']}")
    if c["side"] not in SIDES:
        err(f"case {c['id']}: bad side {c['side']}")
    if not re.fullmatch(r"demo-(0[0-9]{2}|1[0-9]{2}|2[0-3][0-9]|240)", c["author_demo_id"]):
        err(f"case {c['id']}: bad author {c['author_demo_id']}")
    if len(c["body"]) > 1680:
        err(f"case {c['id']}: body {len(c['body'])} chars > 1680")
    if EMDASH in c["body"]:
        err(f"case {c['id']}: contains em dash")
    low = c["body"].lower()
    for b in BANNED:
        if re.search(rf"\b{re.escape(b)}\b", low):
            err(f"case {c['id']}: banned term '{b}'")
    if not re.search(r"https?://", c["body"]):
        err(f"case {c['id']}: missing link")
    by_topic[c["topic_id"]].append(c)
for tid in NEW_TOPIC_IDS | REPURPOSED_IDS:
    n = len(by_topic[tid])
    if n != 6:
        err(f"topic {tid}: expected 6 cases, got {n}")
    else:
        s = Counter(c["side"] for c in by_topic[tid])
        if s["for"] != 3 or s["against"] != 3:
            err(f"topic {tid}: unbalanced sides {dict(s)}")
for tid in TOPUP_IDS:
    n = len(by_topic[tid])
    if n != 2:
        err(f"topic {tid}: expected 2 top-up cases, got {n}")
    else:
        s = Counter(c["side"] for c in by_topic[tid])
        if s["for"] != 1 or s["against"] != 1:
            err(f"topic {tid}: top-up sides unbalanced {dict(s)}")

# ---------------------------------------------------------------- validate comments
comment_ids = [m["id"] for m in comments]
if len(comment_ids) != len(set(comment_ids)):
    err("duplicate comment ids")
if len(comments) != 269:
    err(f"expected 269 comments, got {len(comments)}")
case_id_set = set(case_ids)
comment_map = {m["id"]: m for m in comments}
by_case = defaultdict(list)
for m in comments:
    if m["case_id"] not in case_id_set:
        err(f"comment {m['id']}: bad case_id {m['case_id']}")
    if m["stance"] not in STANCES:
        err(f"comment {m['id']}: bad stance {m['stance']}")
    if not re.fullmatch(r"demo-(0[0-9]{2}|1[0-9]{2}|2[0-3][0-9]|240)", m["author_demo_id"]):
        err(f"comment {m['id']}: bad author {m['author_demo_id']}")
    if len(m["body"]) > 1200:
        err(f"comment {m['id']}: body too long ({len(m['body'])})")
    if EMDASH in m["body"]:
        err(f"comment {m['id']}: contains em dash")
    low = m["body"].lower()
    for b in BANNED:
        if re.search(rf"\b{re.escape(b)}\b", low):
            err(f"comment {m['id']}: banned term '{b}'")
    pid = m.get("parent_id")
    if pid is not None:
        if pid not in comment_map:
            err(f"comment {m['id']}: bad parent_id {pid}")
        elif comment_map[pid]["case_id"] != m["case_id"]:
            err(f"comment {m['id']}: parent on different case")
    by_case[m["case_id"]].append(m)
# every new/repurposed topic case should have comments; top-up cases too
cases_no_comments = [cid for cid in case_ids if not by_case[cid]]
if cases_no_comments:
    err(f"cases with no comments: {cases_no_comments[:10]} (total {len(cases_no_comments)})")

if errors:
    print(f"VALIDATION FAILED ({len(errors)} errors):")
    for e in errors[:60]:
        print("  -", e)
    sys.exit(1)
print(f"validation OK: {len(topics)} topics, {len(cases)} cases, {len(comments)} comments")

# ---------------------------------------------------------------- timestamps
def topic_date_for(tid):
    # topic date as date object in ET
    if tid in NEW_TOPIC_IDS:
        return datetime(2026, 9, 24, tzinfo=ET)
    return datetime(2026, 9, 23, tzinfo=ET)

def spread(dt, start_h, end_h):
    """Random ET datetime on dt's date between start_h and end_h (floats), capped at NOW_ET."""
    base = dt.replace(hour=0, minute=0, second=0, microsecond=0)
    span = (end_h - start_h) * 3600
    t = base + timedelta(seconds=start_h * 3600 + random.random() * span)
    return min(t, NOW_ET)

case_time = {}
case_real = {c["id"]: 100000 + c["id"] for c in cases}
comment_real = {m["id"]: 200000 + m["id"] for m in comments}
for c in cases:
    d = topic_date_for(c["topic_id"])
    if d.date() == datetime(2026, 9, 24).date():
        case_time[c["id"]] = spread(d, 6.0, 9.7)
    else:
        case_time[c["id"]] = spread(d, 8.0, 23.5)

comment_time = {}
for m in comments:
    ct = case_time[m["case_id"]]
    t = ct + timedelta(minutes=random.randint(20, 300))
    comment_time[m["id"]] = min(t, NOW_ET)

# ---------------------------------------------------------------- votes
def rand_voters(n, exclude):
    pool = [f"demo-{i:03d}" for i in range(1, 241) if f"demo-{i:03d}" != exclude]
    n = min(n, len(pool))
    return random.sample(pool, n)

vote_rows = []  # (target_type, target_real_id, voter_uuid, created_at)
case_voters = {}
for c in cases:
    n = random.randint(4, 26)
    voters = rand_voters(n, c["author_demo_id"])
    case_voters[c["id"]] = voters
    ct = case_time[c["id"]]
    for v in voters:
        vt = min(ct + timedelta(minutes=random.randint(10, 900)), NOW_ET)
        vote_rows.append(("case", case_real[c["id"]], demo_uuid(v), vt))

comment_voters = {}
for m in comments:
    n = random.randint(0, 8)
    voters = rand_voters(n, m["author_demo_id"])
    comment_voters[m["id"]] = voters
    ct = comment_time[m["id"]]
    for v in voters:
        vt = min(ct + timedelta(minutes=random.randint(10, 900)), NOW_ET)
        vote_rows.append(("comment", comment_real[m["id"]], demo_uuid(v), vt))

case_score = {c["id"]: len(case_voters[c["id"]]) for c in cases}
comment_score = {m["id"]: len(comment_voters[m["id"]]) for m in comments}
print(f"votes: {len(vote_rows)} total "
      f"({sum(case_score.values())} on cases, {sum(comment_score.values())} on comments)")

# ---------------------------------------------------------------- SQL helpers
def q(s):
    return "'" + s.replace("'", "''") + "'"

def ts(dt):
    return dt.astimezone(ZoneInfo("UTC")).strftime("%Y-%m-%d %H:%M:%S+00")

OUT.mkdir(exist_ok=True)
for f in OUT.glob("*.sql"):
    f.unlink()

def write_chunk(name, stmts):
    p = OUT / name
    p.write_text("\n".join(stmts) + "\n")
    return p

topic_by_id = {t["id"]: t for t in topics}

# 01: new topics
stmts = [
    "-- 01_topics_new.sql — INSERT topics 21-29 (idempotent)",
]
for t in sorted([t for t in topics if t["id"] in NEW_TOPIC_IDS], key=lambda x: x["id"]):
    src = json.dumps(t.get("sources", []), ensure_ascii=False)
    stmts.append(
        "INSERT INTO public.topics (id, proposition, category, context, sources, topic_date, is_featured) VALUES "
        f"({t['id']}, {q(t['proposition'])}, {q(t['category'])}, {q(t.get('context',''))}, {q(src)}::jsonb, "
        f"'{t['topic_date']}', {'true' if t.get('is_featured') else 'false'}) "
        "ON CONFLICT (id) DO UPDATE SET proposition=EXCLUDED.proposition, category=EXCLUDED.category, "
        "context=EXCLUDED.context, sources=EXCLUDED.sources, topic_date=EXCLUDED.topic_date, "
        "is_featured=EXCLUDED.is_featured;"
    )
stmts.append("SELECT count(*) AS new_topics FROM public.topics WHERE id BETWEEN 21 AND 29;")
write_chunk("01_topics_new.sql", stmts)

# 02: repurpose topics 1-5 (keep existing topic_date)
stmts = ["-- 02_topics_repurpose.sql — UPDATE topics 1-5 (title/context/sources only)"]
for t in sorted([t for t in topics if t["id"] in REPURPOSED_IDS], key=lambda x: x["id"]):
    src = json.dumps(t.get("sources", []), ensure_ascii=False)
    stmts.append(
        f"UPDATE public.topics SET proposition={q(t['proposition'])}, category={q(t['category'])}, "
        f"context={q(t.get('context',''))}, sources={q(src)}::jsonb, is_featured=false WHERE id={t['id']};"
    )
stmts.append("SELECT id, proposition, category FROM public.topics WHERE id BETWEEN 1 AND 5 ORDER BY id;")
write_chunk("02_topics_repurpose.sql", stmts)

# 03: cases (chunked 30 per file)
case_list = sorted(cases, key=lambda c: c["id"])
chunks = [case_list[i:i+30] for i in range(0, len(case_list), 30)]
for i, ch in enumerate(chunks, 1):
    stmts = [f"-- 03_cases_{i:02d}.sql — INSERT cases (chunk {i}/{len(chunks)})"]
    for c in ch:
        stmts.append(
            "INSERT INTO public.cases (id, topic_id, side, author_id, body, score, created_at) VALUES "
            f"({case_real[c['id']]}, {c['topic_id']}, {q(c['side'])}, {q(demo_uuid(c['author_demo_id']))}, "
            f"{q(c['body'])}, {case_score[c['id']]}, '{ts(case_time[c['id']])}') "
            "ON CONFLICT (id) DO UPDATE SET topic_id=EXCLUDED.topic_id, side=EXCLUDED.side, "
            "author_id=EXCLUDED.author_id, body=EXCLUDED.body, score=EXCLUDED.score, created_at=EXCLUDED.created_at;"
        )
    stmts.append(f"SELECT count(*) AS cases_so_far FROM public.cases WHERE id >= 100000;")
    write_chunk(f"03_cases_{i:02d}.sql", stmts)

# 04: comments (chunked 60 per file; parents before children)
def depth(m):
    d, cur = 0, m
    while cur.get("parent_id") is not None:
        d += 1
        cur = comment_map[cur["parent_id"]]
    return d
comment_list = sorted(comments, key=lambda m: (depth(m), m["id"]))
chunks = [comment_list[i:i+60] for i in range(0, len(comment_list), 60)]
for i, ch in enumerate(chunks, 1):
    stmts = [f"-- 04_comments_{i:02d}.sql — INSERT comments (chunk {i}/{len(chunks)})"]
    for m in ch:
        pid = comment_real[m["parent_id"]] if m.get("parent_id") is not None else "NULL"
        stmts.append(
            "INSERT INTO public.comments (id, case_id, author_id, parent_id, body, stance, score, created_at) VALUES "
            f"({comment_real[m['id']]}, {case_real[m['case_id']]}, {q(demo_uuid(m['author_demo_id']))}, {pid}, "
            f"{q(m['body'])}, {q(m['stance'])}, {comment_score[m['id']]}, '{ts(comment_time[m['id']])}') "
            "ON CONFLICT (id) DO UPDATE SET case_id=EXCLUDED.case_id, author_id=EXCLUDED.author_id, "
            "parent_id=EXCLUDED.parent_id, body=EXCLUDED.body, stance=EXCLUDED.stance, "
            "score=EXCLUDED.score, created_at=EXCLUDED.created_at;"
        )
    stmts.append("SELECT count(*) AS comments_so_far FROM public.comments WHERE id >= 200000;")
    write_chunk(f"04_comments_{i:02d}.sql", stmts)

# 05: votes (chunked 400 per file)
chunks = [vote_rows[i:i+400] for i in range(0, len(vote_rows), 400)]
for i, ch in enumerate(chunks, 1):
    stmts = [f"-- 05_votes_{i:02d}.sql — INSERT votes (chunk {i}/{len(chunks)})"]
    for (tt, tid, voter, vt) in ch:
        stmts.append(
            "INSERT INTO public.votes (voter_id, target_type, target_id, created_at) VALUES "
            f"({q(voter)}, {q(tt)}, {tid}, '{ts(vt)}') ON CONFLICT (voter_id, target_type, target_id) DO NOTHING;"
        )
    stmts.append("SELECT count(*) AS votes_so_far FROM public.votes;")
    write_chunk(f"05_votes_{i:02d}.sql", stmts)

# 06: verification
verify = [
    "-- 06_verify.sql — run after all chunks",
    "SELECT 'topics_21_29' AS k, count(*) AS v FROM public.topics WHERE id BETWEEN 21 AND 29;",
    "SELECT 'cases_new' AS k, count(*) AS v FROM public.cases WHERE id >= 100000;",
    "SELECT 'comments_new' AS k, count(*) AS v FROM public.comments WHERE id >= 200000;",
    "SELECT 'votes_total' AS k, count(*) AS v FROM public.votes;",
    "SELECT topic_id, side, count(*) FROM public.cases WHERE id >= 100000 GROUP BY 1,2 ORDER BY 1,2;",
    "SELECT stance, count(*) FROM public.comments WHERE id >= 200000 GROUP BY 1 ORDER BY 1;",
    "SELECT min(created_at), max(created_at) FROM public.cases WHERE id >= 100000;",
    "SELECT min(created_at), max(created_at) FROM public.comments WHERE id >= 200000;",
]
write_chunk("06_verify.sql", verify)

print(f"SQL written to {OUT}: {len(list(OUT.glob('*.sql')))} files")
