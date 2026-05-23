-- ─── Golden Anchor — Engagement copy email idempotency column ────────────
-- v0.31.0 — adds engagement_emailed_at so api/send-engagement-copy.js can
-- skip duplicate sends when called more than once for the same submission.
--
-- Idempotent — safe to re-run. Paste into Supabase → SQL Editor → Run.

ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS engagement_emailed_at timestamptz NULL;

-- Optional index — only useful if you want to query "submissions awaiting
-- engagement-copy resend" quickly. Cheap, keep it.
CREATE INDEX IF NOT EXISTS intake_submissions_engagement_emailed_idx
  ON public.intake_submissions (engagement_emailed_at)
  WHERE engagement_emailed_at IS NULL;
