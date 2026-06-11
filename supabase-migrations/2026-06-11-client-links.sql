-- 2026-06-11 — client_links (MD-C Link-R, per docs/ARCHITECTURE-PLAN.md §L1-L6).
-- Owner answers locked: frozen copy on revoke, advisor review screen for island data,
-- goals notes client-editable (Link-W), 1:1 for now, auto-revoke portal tokens on
-- accept, 14-day invite expiry with re-send.
create table if not exists public.client_links (
  id uuid primary key default gen_random_uuid(),
  advisor_uid uuid not null,
  client_local_id text not null,          -- String(client.id) in the advisor's blob
  invited_email text not null,
  client_uid uuid,                        -- set on accept
  token text not null unique,
  status text not null default 'pending', -- pending | accepted | revoked | expired
  island_snapshot jsonb,                  -- the client's self-entered island data (review screen)
  created_at timestamptz not null default now(),
  accepted_at timestamptz,
  expires_at timestamptz not null default (now() + interval '14 days')
);

-- 1:1 for now (owner answer 4): one accepted link per client account, and one per
-- advisor client record.
create unique index if not exists client_links_one_per_account
  on public.client_links (client_uid) where (status = 'accepted');
create unique index if not exists client_links_one_per_record
  on public.client_links (advisor_uid, client_local_id) where (status in ('pending','accepted'));

alter table public.client_links enable row level security;

-- Advisor manages own links (insert/select/update for revoke + re-send).
drop policy if exists client_links_advisor_all on public.client_links;
create policy client_links_advisor_all on public.client_links
  for all using (auth.uid() = advisor_uid) with check (auth.uid() = advisor_uid);

-- Linked client may see their own accepted link row (NOT the island snapshot path —
-- reads of advisor data go through the sanitizing service-role endpoint only).
drop policy if exists client_links_client_select on public.client_links;
create policy client_links_client_select on public.client_links
  for select using (auth.uid() = client_uid);

-- Acceptance is service-role-only (api/accept-link.js): no client-side insert/update
-- policy on purpose.
