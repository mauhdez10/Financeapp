-- ─── Golden Anchor — Portal link modules ────────────────────────────────
-- v0.71 — adds `modules jsonb` to public.portal_links. The advisor picks which
-- sections a shared read-only portal shows (cashflow / assets / trend /
-- emergency fund / goals). NULL = all sections (back-compat for older links).
-- api/resolve-portal.js returns it; PublicPortal hides sections accordingly.
--
-- APPLIED to production via supabase-finance MCP on 2026-06-10 (pre-authorized
-- for the v0.70 sprint). Idempotent — safe to re-run.

ALTER TABLE public.portal_links ADD COLUMN IF NOT EXISTS modules jsonb;
