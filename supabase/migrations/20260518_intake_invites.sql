-- ============================================================================
-- v0.10.0 — Server-side intake delivery (Chat 7)
-- Adds two tables:
--   1. intake_invites      — tracks each invite sent (email/SMS), the token,
--                            and whether the prospect opened/converted.
--   2. sms_consent_log     — TCPA attestation log. One row per advisor-asserted
--                            consent event before sending SMS.
--
-- Both tables are scoped per advisor via user_id = auth.uid().
-- The public intake URL accepts ?invite=<token>; the PublicIntake component
-- reads the token, calls a SECURITY DEFINER function to fetch prefill data,
-- and marks the invite as opened on first load.
--
-- Run this against the Finance Supabase project (NOT the Health CRM project).
-- ============================================================================

-- ─── intake_invites ─────────────────────────────────────────────────────────
create table if not exists public.intake_invites (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  token               text not null unique,
  prospect_name       text,
  prospect_email      text,
  prospect_phone      text,
  lang                text not null default 'en' check (lang in ('en','es')),
  channel_email       boolean not null default false,
  channel_sms         boolean not null default false,
  status              text not null default 'sent' check (status in ('sent','opened','submitted','expired','failed')),
  send_error          text,                  -- last delivery error if status='failed'
  resend_message_id   text,                  -- Resend's message id for tracing
  twilio_sid          text,                  -- Twilio message SID for tracing
  opened_at           timestamptz,
  opened_ip_hash      text,                  -- SHA-256 of opener IP (D-28 pattern)
  submission_id       uuid references public.intake_submissions(id) on delete set null,
  created_at          timestamptz not null default now(),
  expires_at          timestamptz not null default (now() + interval '30 days')
);

create index if not exists intake_invites_user_idx on public.intake_invites(user_id, created_at desc);
create index if not exists intake_invites_token_idx on public.intake_invites(token);
create index if not exists intake_invites_status_idx on public.intake_invites(user_id, status);

alter table public.intake_invites enable row level security;

-- Advisor can read/update/delete their own invites
drop policy if exists invites_select_own on public.intake_invites;
create policy invites_select_own on public.intake_invites
  for select to authenticated using (user_id = auth.uid());

drop policy if exists invites_update_own on public.intake_invites;
create policy invites_update_own on public.intake_invites
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

drop policy if exists invites_delete_own on public.intake_invites;
create policy invites_delete_own on public.intake_invites
  for delete to authenticated using (user_id = auth.uid());

-- INSERT happens via the Vercel function using the service-role key, which
-- bypasses RLS. No anon/authenticated INSERT policy on purpose.

-- ─── sms_consent_log ────────────────────────────────────────────────────────
create table if not exists public.sms_consent_log (
  id                          uuid primary key default gen_random_uuid(),
  user_id                     uuid not null references auth.users(id) on delete cascade,
  prospect_name               text,
  prospect_phone              text not null,
  consent_method              text not null default 'advisor_attestation'
                              check (consent_method in ('advisor_attestation','prospect_initiated','written')),
  consented_at                timestamptz not null default now(),  -- advisor asserts the consent moment
  advisor_attestation_at      timestamptz not null default now(),  -- when the checkbox was clicked
  invite_id                   uuid references public.intake_invites(id) on delete set null,
  notes                       text
);

create index if not exists sms_consent_user_idx on public.sms_consent_log(user_id, consented_at desc);
create index if not exists sms_consent_phone_idx on public.sms_consent_log(user_id, prospect_phone);

alter table public.sms_consent_log enable row level security;

drop policy if exists sms_consent_select_own on public.sms_consent_log;
create policy sms_consent_select_own on public.sms_consent_log
  for select to authenticated using (user_id = auth.uid());

drop policy if exists sms_consent_delete_own on public.sms_consent_log;
create policy sms_consent_delete_own on public.sms_consent_log
  for delete to authenticated using (user_id = auth.uid());

-- INSERT happens via Vercel function with service-role.

-- ─── SECURITY DEFINER: resolve_invite_token ─────────────────────────────────
-- Public intake form needs to read an invite by token to prefill the form
-- and mark opened_at. The submitter is anonymous (no auth). This function
-- runs with elevated privileges and exposes ONLY the fields needed for prefill.
create or replace function public.resolve_invite_token(p_token text, p_ip_hash text)
returns table(
  id                uuid,
  user_id           uuid,
  prospect_name     text,
  prospect_email    text,
  prospect_phone    text,
  lang              text,
  status            text,
  expired           boolean
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.intake_invites%rowtype;
begin
  select * into v_row from public.intake_invites where token = p_token;
  if not found then
    return;
  end if;

  -- Mark opened on first view
  if v_row.opened_at is null then
    update public.intake_invites
      set opened_at = now(),
          opened_ip_hash = p_ip_hash,
          status = case when status = 'sent' then 'opened' else status end
      where id = v_row.id
      returning * into v_row;
  end if;

  return query select
    v_row.id,
    v_row.user_id,
    v_row.prospect_name,
    v_row.prospect_email,
    v_row.prospect_phone,
    v_row.lang,
    v_row.status,
    (now() > v_row.expires_at) as expired;
end;
$$;

revoke all on function public.resolve_invite_token(text, text) from public;
grant execute on function public.resolve_invite_token(text, text) to anon, authenticated;

-- ─── SECURITY DEFINER: mark_invite_submitted ────────────────────────────────
-- Called after a successful intake submission to link the new submission row
-- back to the invite and flip status to 'submitted'.
create or replace function public.mark_invite_submitted(p_token text, p_submission_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count int;
begin
  update public.intake_invites
    set status = 'submitted',
        submission_id = p_submission_id
    where token = p_token
      and status in ('sent','opened');
  get diagnostics v_count = row_count;
  return v_count > 0;
end;
$$;

revoke all on function public.mark_invite_submitted(text, uuid) from public;
grant execute on function public.mark_invite_submitted(text, uuid) to anon, authenticated;

-- ─── Done. ───────────────────────────────────────────────────────────────────
-- Verify after applying:
--   select count(*) from public.intake_invites;            -- expect 0
--   select count(*) from public.sms_consent_log;           -- expect 0
--   \df+ public.resolve_invite_token
--   \df+ public.mark_invite_submitted
