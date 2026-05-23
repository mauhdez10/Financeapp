-- ─── Golden Anchor — Invite partner fields ─────────────────────────────
-- v0.32.0 — adds partner_name / partner_email / partner_phone /
-- household_type columns to intake_invites, then rewrites the
-- resolve_invite_token RPC to return them alongside the existing
-- prospect fields. The PublicIntake form uses these to prefill
-- both members of a couple from the New Invite modal.
--
-- Idempotent — safe to re-run. Paste into Supabase → SQL Editor → Run.

ALTER TABLE public.intake_invites
  ADD COLUMN IF NOT EXISTS household_type text NULL CHECK (household_type IS NULL OR household_type IN ('single','couple')),
  ADD COLUMN IF NOT EXISTS partner_name   text NULL,
  ADD COLUMN IF NOT EXISTS partner_email  text NULL,
  ADD COLUMN IF NOT EXISTS partner_phone  text NULL;

-- Rewrite resolve_invite_token to surface the new columns. The function
-- ALSO marks the invite as 'opened' on first read (preserves existing
-- behavior). Drop the old signature first so RETURNS TABLE can change
-- without conflict.
DROP FUNCTION IF EXISTS public.resolve_invite_token(text, text);

CREATE OR REPLACE FUNCTION public.resolve_invite_token(
  p_token   text,
  p_ip_hash text
)
RETURNS TABLE (
  user_id         uuid,
  prospect_name   text,
  prospect_email  text,
  prospect_phone  text,
  household_type  text,
  partner_name    text,
  partner_email   text,
  partner_phone   text,
  lang            text,
  status          text,
  expired         boolean
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.intake_invites%ROWTYPE;
  v_expired boolean;
BEGIN
  SELECT * INTO v_row FROM public.intake_invites WHERE token = p_token LIMIT 1;
  IF v_row.id IS NULL THEN
    RETURN;
  END IF;

  -- Expiry: invites are valid for 60 days from created_at.
  v_expired := (v_row.created_at < (now() - interval '60 days'));

  -- Mark opened on first non-submitted read.
  IF v_row.status = 'sent' AND NOT v_expired THEN
    UPDATE public.intake_invites
       SET status = 'opened',
           opened_at = COALESCE(opened_at, now()),
           opened_ip_hash = COALESCE(opened_ip_hash, p_ip_hash)
     WHERE id = v_row.id;
  END IF;

  RETURN QUERY
    SELECT v_row.user_id,
           v_row.prospect_name,
           v_row.prospect_email,
           v_row.prospect_phone,
           v_row.household_type,
           v_row.partner_name,
           v_row.partner_email,
           v_row.partner_phone,
           v_row.lang,
           v_row.status,
           v_expired;
END;
$$;

-- Allow the public (anon) role to call the RPC. PublicIntake fires it
-- unauthenticated, but the api/resolve-intake-invite.js route also calls it
-- via the service-role key, so both paths work.
GRANT EXECUTE ON FUNCTION public.resolve_invite_token(text, text) TO anon, authenticated, service_role;
