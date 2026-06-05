-- ============================================================================
-- Client Portal — migration 01: schema + RLS + access helpers
-- Branch: feature/client-portal   Spec: docs/superpowers/specs/2026-06-05-client-portal-design.md
--
-- DRAFT — NOT YET APPLIED. Review carefully, then apply to the FINANCE Supabase
-- project (Supabase Dashboard → SQL editor, or `supabase db push`). This file is
-- security-critical: it defines the isolation boundary between clients.
--
-- Model: the advisor (existing single Auth user) owns `clients`/`settings` as
-- today. Portal clients are NEW Auth users, each linked to exactly one `clients`
-- row via `client_accounts`. RLS guarantees a client can only ever touch rows
-- tied to their own auth.uid(). Access is time-boxed via `client_periods`, whose
-- state is written ONLY by the Stripe webhook (service role) — a client can never
-- grant themselves access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. client_accounts — one row per portal client (auth user ↔ clients row)
-- ---------------------------------------------------------------------------
create table if not exists public.client_accounts (
  id              uuid primary key default gen_random_uuid(),
  auth_user_id    uuid not null unique references auth.users(id) on delete cascade,
  client_id       uuid not null references public.clients(id) on delete cascade,
  advisor_id      uuid not null,                 -- = clients.user_id (the advisor)
  email           text not null,
  status          text not null default 'invited'
                    check (status in ('invited','active','suspended')),
  stripe_customer_id text,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),
  unique (client_id)                              -- one portal account per client row
);
create index if not exists client_accounts_advisor_idx on public.client_accounts(advisor_id);
create index if not exists client_accounts_client_idx   on public.client_accounts(client_id);

-- ---------------------------------------------------------------------------
-- 2. client_periods — the time-boxed access ledger (service-role-written only)
-- ---------------------------------------------------------------------------
create table if not exists public.client_periods (
  id                 uuid primary key default gen_random_uuid(),
  client_account_id  uuid not null references public.client_accounts(id) on delete cascade,
  kind               text not null check (kind in ('subscription','one_time')),
  starts_at          timestamptz not null default now(),
  ends_at            timestamptz not null,
  status             text not null default 'active'
                       check (status in ('active','expired','canceled')),
  source             text not null default 'stripe',
  stripe_ref         text,                        -- subscription id or checkout session id
  created_at         timestamptz not null default now()
);
create index if not exists client_periods_account_idx on public.client_periods(client_account_id);
create index if not exists client_periods_window_idx  on public.client_periods(client_account_id, status, ends_at);

-- ---------------------------------------------------------------------------
-- 3. client_documents — uploads + advisor-shared files (Storage-backed)
-- ---------------------------------------------------------------------------
create table if not exists public.client_documents (
  id                 uuid primary key default gen_random_uuid(),
  client_account_id  uuid not null references public.client_accounts(id) on delete cascade,
  advisor_id         uuid not null,
  storage_path       text not null,               -- path in the private 'client-docs' bucket
  filename           text not null,
  content_type       text,
  size_bytes         bigint,
  uploaded_by        text not null check (uploaded_by in ('client','advisor')),
  created_at         timestamptz not null default now()
);
create index if not exists client_documents_account_idx on public.client_documents(client_account_id);
create index if not exists client_documents_advisor_idx on public.client_documents(advisor_id);

-- ---------------------------------------------------------------------------
-- 4. portal_messages — advisor ⇄ client thread
-- ---------------------------------------------------------------------------
create table if not exists public.portal_messages (
  id                 uuid primary key default gen_random_uuid(),
  client_account_id  uuid not null references public.client_accounts(id) on delete cascade,
  advisor_id         uuid not null,
  sender             text not null check (sender in ('client','advisor')),
  body               text not null check (length(body) between 1 and 5000),
  read_at            timestamptz,
  created_at         timestamptz not null default now()
);
create index if not exists portal_messages_account_idx on public.portal_messages(client_account_id, created_at desc);

-- ---------------------------------------------------------------------------
-- 5. Helper functions (SECURITY DEFINER, search_path pinned)
-- ---------------------------------------------------------------------------

-- The client_accounts row id for the current auth user (NULL if not a client).
create or replace function public.current_client_account_id()
returns uuid
language sql stable security definer set search_path = public
as $$
  select id from public.client_accounts where auth_user_id = auth.uid() limit 1;
$$;

-- TRUE if the current auth user is a portal client.
create or replace function public.is_portal_client()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.client_accounts where auth_user_id = auth.uid());
$$;

-- TRUE if the given client_account currently has an active paid period.
-- This is the time-boxed access gate. It does NOT itself check ownership — RLS
-- and callers must combine it with an ownership predicate.
create or replace function public.client_has_active_access(p_account uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.client_periods
    where client_account_id = p_account
      and status = 'active'
      and now() >= starts_at
      and now() <  ends_at
  );
$$;

-- Convenience: does the CURRENT client have access right now?
create or replace function public.current_client_has_access()
returns boolean
language sql stable security definer set search_path = public
as $$
  select public.client_has_active_access(public.current_client_account_id());
$$;

-- ---------------------------------------------------------------------------
-- 6. RLS — enable + policies
-- ---------------------------------------------------------------------------
alter table public.client_accounts  enable row level security;
alter table public.client_periods   enable row level security;
alter table public.client_documents enable row level security;
alter table public.portal_messages  enable row level security;

-- client_accounts: client reads only own; advisor reads/manages own clients'.
drop policy if exists ca_client_read on public.client_accounts;
create policy ca_client_read on public.client_accounts
  for select using (auth_user_id = auth.uid());

drop policy if exists ca_advisor_all on public.client_accounts;
create policy ca_advisor_all on public.client_accounts
  for all using (advisor_id = auth.uid()) with check (advisor_id = auth.uid());

-- client_periods: client reads only own (to render status); NO client writes
-- (access state is service-role only — the webhook). Advisor reads own clients'.
drop policy if exists cp_client_read on public.client_periods;
create policy cp_client_read on public.client_periods
  for select using (
    client_account_id = public.current_client_account_id()
  );

drop policy if exists cp_advisor_read on public.client_periods;
create policy cp_advisor_read on public.client_periods
  for select using (
    exists (select 1 from public.client_accounts a
            where a.id = client_periods.client_account_id and a.advisor_id = auth.uid())
  );
-- (no INSERT/UPDATE/DELETE policy → only service_role can write periods)

-- client_documents: client reads/inserts OWN, ONLY while access is active.
-- Advisor reads/manages own clients' docs (always).
drop policy if exists cd_client_read on public.client_documents;
create policy cd_client_read on public.client_documents
  for select using (
    client_account_id = public.current_client_account_id()
    and public.current_client_has_access()
  );

drop policy if exists cd_client_insert on public.client_documents;
create policy cd_client_insert on public.client_documents
  for insert with check (
    client_account_id = public.current_client_account_id()
    and uploaded_by = 'client'
    and public.current_client_has_access()
  );

drop policy if exists cd_advisor_all on public.client_documents;
create policy cd_advisor_all on public.client_documents
  for all using (advisor_id = auth.uid()) with check (advisor_id = auth.uid());

-- portal_messages: client reads/sends OWN while access active. Advisor reads/
-- sends to own clients (always).
drop policy if exists pm_client_read on public.portal_messages;
create policy pm_client_read on public.portal_messages
  for select using (
    client_account_id = public.current_client_account_id()
    and public.current_client_has_access()
  );

drop policy if exists pm_client_insert on public.portal_messages;
create policy pm_client_insert on public.portal_messages
  for insert with check (
    client_account_id = public.current_client_account_id()
    and sender = 'client'
    and public.current_client_has_access()
  );

drop policy if exists pm_advisor_all on public.portal_messages;
create policy pm_advisor_all on public.portal_messages
  for all using (advisor_id = auth.uid()) with check (advisor_id = auth.uid());

-- ---------------------------------------------------------------------------
-- 7. updated_at trigger for client_accounts
-- ---------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists client_accounts_touch on public.client_accounts;
create trigger client_accounts_touch before update on public.client_accounts
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- NOTE: the client's ability to READ and EDIT their own `clients` row (their
-- financial data) is handled in migration 02 via a field-whitelisted
-- SECURITY DEFINER RPC — NOT a broad UPDATE policy — because RLS cannot restrict
-- which JSONB fields a client may change. See 2026-06-05-client-portal-02-*.sql.
-- ============================================================================
