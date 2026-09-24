-- 06_verify.sql — run after all chunks
SELECT 'topics_21_29' AS k, count(*) AS v FROM public.topics WHERE id BETWEEN 21 AND 29;
SELECT 'cases_new' AS k, count(*) AS v FROM public.cases WHERE id >= 100000;
SELECT 'comments_new' AS k, count(*) AS v FROM public.comments WHERE id >= 200000;
SELECT 'votes_total' AS k, count(*) AS v FROM public.votes;
SELECT topic_id, side, count(*) FROM public.cases WHERE id >= 100000 GROUP BY 1,2 ORDER BY 1,2;
SELECT stance, count(*) FROM public.comments WHERE id >= 200000 GROUP BY 1 ORDER BY 1;
SELECT min(created_at), max(created_at) FROM public.cases WHERE id >= 100000;
SELECT min(created_at), max(created_at) FROM public.comments WHERE id >= 200000;
