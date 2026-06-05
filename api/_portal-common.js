// api/_portal-common.js
// Shared helpers for the client-portal serverless endpoints. DRY-RUN aware:
// every getter returns null when its env is unset so callers can degrade
// gracefully ("billing not configured") instead of crashing — same philosophy
// as the email + rate-limit layers. Files starting with "_" are not routes.

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export function getAdmin() {
  if (!SUPABASE_URL || !SERVICE_ROLE) return null;
  return createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
}

export async function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;                         // dry-run when unconfigured
  try {
    const Stripe = (await import("stripe")).default;
    return new Stripe(key, { apiVersion: "2024-06-20" });
  } catch {
    return null;
  }
}

// Verify the caller's Supabase JWT and return their client_accounts row (service
// role). Returns { account } or { error, status }.
export async function authedClientAccount(req) {
  const admin = getAdmin();
  if (!admin) return { error: "Server not configured", status: 500 };
  const auth = req.headers.authorization || req.headers.Authorization || "";
  const token = auth.startsWith("Bearer ") ? auth.slice(7) : "";
  if (!token) return { error: "Not signed in", status: 401 };
  const { data: u, error: uErr } = await admin.auth.getUser(token);
  if (uErr || !u?.user) return { error: "Invalid session", status: 401 };
  const { data: acct } = await admin
    .from("client_accounts")
    .select("id, client_id, advisor_id, email, stripe_customer_id")
    .eq("auth_user_id", u.user.id)
    .maybeSingle();
  if (!acct) return { error: "Not a portal client", status: 403 };
  return { account: acct, admin, userId: u.user.id };
}

// Resolve the advisor's portal pricing config from settings.data.portal.
export async function getPortalConfig(admin, advisorId) {
  const { data } = await admin.from("settings").select("data").eq("user_id", advisorId).maybeSingle();
  const portal = (data?.data?.portal) || {};
  return {
    priceMonthly: portal.priceMonthly || process.env.STRIPE_PRICE_MONTHLY || null,
    priceYearly: portal.priceYearly || process.env.STRIPE_PRICE_YEARLY || null,
    priceOneTime: portal.priceOneTime || process.env.STRIPE_PRICE_ONE_TIME || null,
    oneTimeDays: portal.oneTimeDays || 90,
  };
}

export function readJsonBody(req) {
  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  return body || {};
}
