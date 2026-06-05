-- ============================================================================
-- Client Portal — migration 03: provisioning + access-period functions.
-- DRAFT — NOT YET APPLIED. Depends on migrations 01–02.
--
-- These are called by the Stripe webhook + onboarding (service role). They are
-- the ONLY sanctioned writers of access state (`client_periods`) and of new
-- `client_accounts`. Advisor portal config (prices, one-time window length,
-- editable sections) is stored in the existing `settings.data.portal` jsonb —
-- no new table needed.
-- ============================================================================

-- Create or fetch a client_accounts row for a freshly-provisioned portal client.
-- Called after the Auth user exists (onboarding webhook / invite acceptance).
create or replace function public.provision_client_account(
  p_advisor       uuid,
  p_client_id     uuid,
  p_auth_user     uuid,
  p_email         text,
  p_stripe_customer text default null
) returns uuid
language plpgsql security definer set search_path = public
as $$
declare v_id uuid;
begin
  insert into public.client_accounts (auth_user_id, client_id, advisor_id, email, status, stripe_customer_id)
  values (p_auth_user, p_client_id, p_advisor, p_email, 'active', p_stripe_customer)
  on conflict (auth_user_id) do update
    set client_id = excluded.client_id,
        advisor_id = excluded.advisor_id,
        email = excluded.email,
        stripe_customer_id = coalesce(excluded.stripe_customer_id, public.client_accounts.stripe_customer_id),
        status = 'active'
  returning id into v_id;
  return v_id;
end;
$$;

-- Record/extend a SUBSCRIPTION period. Idempotent on (account, stripe_ref):
-- rolls ends_at forward to the new period end on each renewal.
create or replace function public.record_subscription_period(
  p_account   uuid,
  p_ends_at   timestamptz,
  p_stripe_ref text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.client_periods
     set ends_at = greatest(ends_at, p_ends_at), status = 'active'
   where client_account_id = p_account and kind = 'subscription' and stripe_ref = p_stripe_ref;
  if not found then
    insert into public.client_periods (client_account_id, kind, starts_at, ends_at, status, source, stripe_ref)
    values (p_account, 'subscription', now(), p_ends_at, 'active', 'stripe', p_stripe_ref);
  end if;
end;
$$;

-- Record a ONE-TIME paid session: a fixed window of view access. p_days from the
-- advisor's portal config (default 90 if null).
create or replace function public.record_one_time_period(
  p_account   uuid,
  p_days      int,
  p_stripe_ref text
) returns void
language plpgsql security definer set search_path = public
as $$
declare v_days int := coalesce(p_days, 90);
begin
  insert into public.client_periods (client_account_id, kind, starts_at, ends_at, status, source, stripe_ref)
  values (p_account, 'one_time', now(), now() + (v_days || ' days')::interval, 'active', 'stripe', p_stripe_ref);
end;
$$;

-- Expire a subscription's periods (Stripe subscription canceled / unpaid).
create or replace function public.expire_subscription(
  p_account   uuid,
  p_stripe_ref text
) returns void
language plpgsql security definer set search_path = public
as $$
begin
  update public.client_periods
     set status = 'canceled'
   where client_account_id = p_account and kind = 'subscription' and stripe_ref = p_stripe_ref;
end;
$$;

-- Lock these down: only service_role (webhook) may execute provisioning + period
-- writes. authenticated clients can NOT call them (they can't grant themselves
-- access).
revoke all on function public.provision_client_account(uuid,uuid,uuid,text,text) from public, anon, authenticated;
revoke all on function public.record_subscription_period(uuid,timestamptz,text)   from public, anon, authenticated;
revoke all on function public.record_one_time_period(uuid,int,text)               from public, anon, authenticated;
revoke all on function public.expire_subscription(uuid,text)                      from public, anon, authenticated;
grant execute on function public.provision_client_account(uuid,uuid,uuid,text,text) to service_role;
grant execute on function public.record_subscription_period(uuid,timestamptz,text)   to service_role;
grant execute on function public.record_one_time_period(uuid,int,text)               to service_role;
grant execute on function public.expire_subscription(uuid,text)                      to service_role;

-- ============================================================================
-- A helper the CLIENT may call (authenticated) to read their own membership
-- status for the Billing screen — no access state is writable by the client.
-- ============================================================================
create or replace function public.client_membership_status()
returns jsonb
language plpgsql stable security definer set search_path = public
as $$
declare v_account uuid; v_active boolean; v_period public.client_periods%rowtype;
begin
  v_account := public.current_client_account_id();
  if v_account is null then raise exception 'not a portal client'; end if;
  v_active := public.client_has_active_access(v_account);
  select * into v_period from public.client_periods
   where client_account_id = v_account and status='active' and now() < ends_at
   order by ends_at desc limit 1;
  return jsonb_build_object(
    'active', v_active,
    'kind', v_period.kind,
    'ends_at', v_period.ends_at
  );
end;
$$;
revoke all on function public.client_membership_status() from public, anon;
grant execute on function public.client_membership_status() to authenticated;
