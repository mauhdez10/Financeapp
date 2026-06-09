-- ─── Golden Anchor — Client Portal links ───────────────────────────────
-- v0.68.0 — adds the public.portal_links table that powers the read-only
-- client portal. The advisor generates a token-based link for one client;
-- the client opens /portal?token=… and the api/resolve-portal.js serverless
-- function (service-role) returns a SANITIZED snapshot of that client's data
-- plus the advisor's branding. Sensitive fields (SSN, DOB, phone, address,
-- internal notes) are stripped server-side in resolve-portal.js.
--
-- Idempotent — safe to re-run. Paste into Supabase → SQL Editor → Run.

CREATE TABLE IF NOT EXISTS public.portal_links (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_local_id text NOT NULL,                 -- matches public.clients.local_id (the app's client.id)
  token           text NOT NULL UNIQUE,          -- 32-byte base64url, unguessable
  label           text,                          -- optional advisor note ("Sent 2026-06")
  created_at      timestamptz NOT NULL DEFAULT now(),
  expires_at      timestamptz,                   -- NULL = never expires
  revoked         boolean NOT NULL DEFAULT false,
  last_viewed_at  timestamptz,
  view_count      integer NOT NULL DEFAULT 0,
  viewer_ip_hash  text
);

CREATE INDEX IF NOT EXISTS portal_links_token_idx       ON public.portal_links(token);
CREATE INDEX IF NOT EXISTS portal_links_user_client_idx ON public.portal_links(user_id, client_local_id);

ALTER TABLE public.portal_links ENABLE ROW LEVEL SECURITY;

-- Advisors manage ONLY their own portal links. The advisor's browser is
-- authenticated with Supabase, so create/list/revoke happen client-side
-- through this policy — no extra serverless function needed for management.
DROP POLICY IF EXISTS portal_links_owner_all ON public.portal_links;
CREATE POLICY portal_links_owner_all ON public.portal_links
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- The public client view (api/resolve-portal.js) reads via the SERVICE-ROLE
-- key, which bypasses RLS. No anon/public policy is granted on purpose — the
-- anon role must never read portal_links or clients directly.
