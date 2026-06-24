-- 2026-06-24 — Scalable data layer (spec: docs/superpowers/specs/2026-06-24-scalable-data-layer-design.md)
-- Applied to live Supabase via MCP apply_migration in 3 parts (main + harden + revoke-anon), combined here.
-- Idempotent / additive: old code ignores the new columns, so nothing in production breaks.

-- ── Layer 1: summary columns on clients (derived from the blob on every save) ──
ALTER TABLE public.clients
  ADD COLUMN IF NOT EXISTS first_name      text,
  ADD COLUMN IF NOT EXISTS last_name       text,
  ADD COLUMN IF NOT EXISTS partner_first   text,
  ADD COLUMN IF NOT EXISTS email           text,
  ADD COLUMN IF NOT EXISTS client_type     text,
  ADD COLUMN IF NOT EXISTS net_worth       numeric,
  ADD COLUMN IF NOT EXISTS total_debt      numeric,
  ADD COLUMN IF NOT EXISTS monthly_income  numeric,
  ADD COLUMN IF NOT EXISTS liquid_assets   numeric,
  ADD COLUMN IF NOT EXISTS snapshot_count  int,
  ADD COLUMN IF NOT EXISTS last_activity   timestamptz,
  ADD COLUMN IF NOT EXISTS archived        boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS search_tsv      tsvector;

CREATE INDEX IF NOT EXISTS clients_list_idx   ON public.clients (user_id, archived, last_activity DESC);
CREATE INDEX IF NOT EXISTS clients_search_idx ON public.clients USING GIN (search_tsv);
CREATE UNIQUE INDEX IF NOT EXISTS clients_user_local_ux
  ON public.clients (user_id, local_id) WHERE local_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.clients_tsv() RETURNS trigger
LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  NEW.search_tsv := to_tsvector('simple',
    coalesce(NEW.first_name,'')||' '||coalesce(NEW.last_name,'')||' '||
    coalesce(NEW.partner_first,'')||' '||coalesce(NEW.email,''));
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS clients_tsv_trg ON public.clients;
CREATE TRIGGER clients_tsv_trg BEFORE INSERT OR UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.clients_tsv();

-- ── Layer 2: normalized time-series ──
CREATE TABLE IF NOT EXISTS public.client_monthly_summary (
  user_id          uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  client_local_id  text NOT NULL,
  month_key        text NOT NULL,
  debt numeric, savings numeric, income numeric, spending numeric, net_worth numeric,
  PRIMARY KEY (user_id, client_local_id, month_key)
);
CREATE INDEX IF NOT EXISTS cms_user_month_idx ON public.client_monthly_summary (user_id, month_key);
ALTER TABLE public.client_monthly_summary ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS cms_owner_all ON public.client_monthly_summary;
CREATE POLICY cms_owner_all ON public.client_monthly_summary
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- ── Dashboard RPCs (computed in Postgres, scoped to caller, authenticated-only) ──
CREATE OR REPLACE FUNCTION public.ga_dashboard_summary()
RETURNS json LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT json_build_object(
    'client_count',   count(*) FILTER (WHERE NOT coalesce(archived,false)),
    'total_debt',     coalesce(sum(total_debt)     FILTER (WHERE NOT coalesce(archived,false)),0),
    'total_income',   coalesce(sum(monthly_income) FILTER (WHERE NOT coalesce(archived,false)),0),
    'liquid',         coalesce(sum(liquid_assets)  FILTER (WHERE NOT coalesce(archived,false)),0),
    'finance_only',   count(*) FILTER (WHERE NOT coalesce(archived,false) AND client_type='financeOnly'),
    'finance_health', count(*) FILTER (WHERE NOT coalesce(archived,false) AND client_type='financeAndHealth')
  ) FROM public.clients WHERE user_id = auth.uid() AND deleted_at IS NULL;
$$;
CREATE OR REPLACE FUNCTION public.ga_dashboard_trend()
RETURNS TABLE(month_key text, debt numeric, savings numeric, income numeric, spending numeric)
LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  SELECT month_key, sum(debt), sum(savings), sum(income), sum(spending)
  FROM public.client_monthly_summary WHERE user_id = auth.uid()
  GROUP BY month_key ORDER BY month_key;
$$;
-- harden: dashboard RPCs are advisor-only (no anon execute)
REVOKE EXECUTE ON FUNCTION public.ga_dashboard_summary() FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.ga_dashboard_trend()   FROM PUBLIC, anon;
GRANT  EXECUTE ON FUNCTION public.ga_dashboard_summary() TO authenticated;
GRANT  EXECUTE ON FUNCTION public.ga_dashboard_trend()   TO authenticated;
