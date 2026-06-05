-- ============================================================================
-- Client Portal — migration 02: client read + field-whitelisted edit of their
-- own `clients` row.
-- DRAFT — NOT YET APPLIED. Depends on migration 01.
--
-- WHY an RPC instead of a broad UPDATE policy: the client's financial data lives
-- in `clients.data` (jsonb). RLS can gate WHICH ROW a client touches, but it
-- cannot restrict WHICH JSONB KEYS they change. A naive "client can update their
-- own clients row" policy would let a client rewrite advisor-only fields
-- (internal notes, status, fees, etc.). So edits go through a SECURITY DEFINER
-- RPC that merges ONLY an explicit allow-list of keys. Reads are gated by a
-- narrow SELECT policy + active access.
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1. Client may READ their own clients row (data) while access is active.
--    (The existing advisor policy `user_id = auth.uid()` is untouched.)
-- ---------------------------------------------------------------------------
drop policy if exists clients_portal_client_read on public.clients;
create policy clients_portal_client_read on public.clients
  for select using (
    deleted_at is null
    and exists (
      select 1 from public.client_accounts a
      where a.client_id = clients.id
        and a.auth_user_id = auth.uid()
    )
    and public.current_client_has_access()
  );

-- ---------------------------------------------------------------------------
-- 2. Field-whitelisted edit RPC. The client passes a JSON patch; only keys in
--    the allow-list are merged into clients.data. Everything else is ignored.
--
--    ALLOW-LIST (review/adjust with the owner): the self-service fields a client
--    may change about themselves. Deliberately EXCLUDES advisor-only fields
--    (notes, status, onboarding flags, fees, anything the advisor computes).
-- ---------------------------------------------------------------------------
create or replace function public.client_update_own_data(p_patch jsonb)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_account  public.client_accounts%rowtype;
  v_client   public.clients%rowtype;
  v_allowed  text[] := array[
    -- contact / profile
    'firstName','lastName','email','phone','address','city','state','zip','dob',
    -- household
    'householdType','partnerFirst','partnerLast','partnerEmail','partnerPhone',
    -- self-reported financials (the inputs a client maintains about themselves)
    'income','bills','cards','accounts','loans','customAssets','savings',
    'monthlyIncome','monthlyExpenses','goals'
  ];
  v_key      text;
  v_newdata  jsonb;
begin
  -- Resolve caller's account.
  select * into v_account from public.client_accounts where auth_user_id = auth.uid() limit 1;
  if v_account.id is null then
    raise exception 'not a portal client';
  end if;

  -- Time-boxed gate.
  if not public.client_has_active_access(v_account.id) then
    raise exception 'no active access';
  end if;

  -- Load the linked client row.
  select * into v_client from public.clients
   where id = v_account.client_id and deleted_at is null;
  if v_client.id is null then
    raise exception 'client row not found';
  end if;

  -- Merge ONLY allow-listed keys from the patch.
  v_newdata := coalesce(v_client.data, '{}'::jsonb);
  foreach v_key in array v_allowed loop
    if p_patch ? v_key then
      v_newdata := jsonb_set(v_newdata, array[v_key], p_patch -> v_key, true);
    end if;
  end loop;

  -- Stamp who/when for the advisor's awareness.
  v_newdata := jsonb_set(v_newdata, array['_portalEditedAt'], to_jsonb(now()::text), true);

  update public.clients
     set data = v_newdata
   where id = v_client.id;

  return v_newdata;
end;
$$;

revoke all on function public.client_update_own_data(jsonb) from public, anon;
grant execute on function public.client_update_own_data(jsonb) to authenticated;

-- ---------------------------------------------------------------------------
-- 3. Read-only RPC for the client's own data (convenience; respects the gate).
-- ---------------------------------------------------------------------------
create or replace function public.client_get_own_data()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_account public.client_accounts%rowtype; v_data jsonb;
begin
  select * into v_account from public.client_accounts where auth_user_id = auth.uid() limit 1;
  if v_account.id is null then raise exception 'not a portal client'; end if;
  if not public.client_has_active_access(v_account.id) then raise exception 'no active access'; end if;
  select data into v_data from public.clients where id = v_account.client_id and deleted_at is null;
  return coalesce(v_data, '{}'::jsonb);
end;
$$;
revoke all on function public.client_get_own_data() from public, anon;
grant execute on function public.client_get_own_data() to authenticated;

-- ============================================================================
-- REVIEW NOTES (owner):
--  • Confirm the allow-list in client_update_own_data matches your client `data`
--    shape and which fields you actually want clients to self-edit. When in
--    doubt, REMOVE a field — you can always add later.
--  • Consider a per-section advisor toggle (portal_settings) gating edits; v1
--    ships with the static allow-list above.
--  • The adversarial isolation test (spec §12) MUST verify: client A's JWT
--    cannot read or edit client B's clients row via these policies/RPCs.
-- ============================================================================
