-- ── Golden Anchor — Intake submission status columns ──────────────────────
-- v0.29.0 — adds explicit lifecycle state to intake_submissions so the new
-- admin table can filter / mark Pending → Reviewed → Approved → (Archived).
--
-- Idempotent — uses IF NOT EXISTS guards. Safe to re-run.
--
-- HOW TO APPLY: paste into Supabase → SQL Editor → Run. The serverless
-- functions in api/*.js will start writing the new columns immediately.
-- Existing rows backfill to status='pending' automatically.

ALTER TABLE public.intake_submissions
  ADD COLUMN IF NOT EXISTS reviewed_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS approved_at   timestamptz NULL,
  ADD COLUMN IF NOT EXISTS archived_at   timestamptz NULL;

-- Note: `status` column already exists from earlier schema with values like
-- 'pending', 'reviewed', 'converted', 'rejected'. We're renormalizing to a
-- smaller set: pending → reviewed → approved → archived.
-- Backfill legacy values into the new vocabulary:
--   'converted' → 'approved'  (the submission was accepted; client was created)
--   'rejected'  → 'archived'  (the submission was dismissed)
UPDATE public.intake_submissions SET status = 'approved' WHERE status = 'converted';
UPDATE public.intake_submissions SET status = 'archived' WHERE status = 'rejected';

-- Enum-ish check constraint — allowed values + transitions:
--   pending → reviewed → approved
--   any state → archived (soft delete via the kebab menu)
DO $$
BEGIN
  -- Drop any old constraint that allowed legacy values
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'intake_submissions_status_check'
  ) THEN
    ALTER TABLE public.intake_submissions
      DROP CONSTRAINT intake_submissions_status_check;
  END IF;
  ALTER TABLE public.intake_submissions
    ADD CONSTRAINT intake_submissions_status_check
    CHECK (status IN ('pending', 'reviewed', 'approved', 'archived'));
END$$;

-- Index for the common "show pending first" filter on the advisor admin page
-- (NB: this table uses `advisor_id` + `created_at`, not user_id + submitted_at.)
CREATE INDEX IF NOT EXISTS intake_submissions_advisor_status_idx
  ON public.intake_submissions (advisor_id, status, created_at DESC);
