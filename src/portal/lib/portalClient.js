// src/portal/lib/portalClient.js
// Supabase client + thin RPC wrappers for the client portal. Reuses the same
// Vite env as the advisor app (VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY).
// All data access is RLS-enforced server-side; this is just ergonomics.

import { createClient } from "@supabase/supabase-js";

const URL = import.meta.env.VITE_SUPABASE_URL;
const ANON = import.meta.env.VITE_SUPABASE_ANON_KEY;

// `null` when env is missing → the portal shows a "not configured" notice
// instead of crashing (mirrors the advisor app's defensive pattern).
export const portalSupabase = (URL && ANON)
  ? createClient(URL, ANON, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

export function portalConfigured() {
  return !!portalSupabase;
}

// --- auth -------------------------------------------------------------------
export async function getSession() {
  if (!portalSupabase) return null;
  const { data } = await portalSupabase.auth.getSession();
  return data?.session || null;
}

export async function signIn(email, password) {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const { data, error } = await portalSupabase.auth.signInWithPassword({ email, password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, session: data.session };
}

export async function setPassword(password) {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const { data, error } = await portalSupabase.auth.updateUser({ password });
  if (error) return { ok: false, error: error.message };
  return { ok: true, user: data.user };
}

export async function requestReset(email) {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const redirectTo = (typeof window !== "undefined") ? window.location.origin + "/portal" : undefined;
  const { error } = await portalSupabase.auth.resetPasswordForEmail(email, { redirectTo });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function signOut() {
  if (portalSupabase) { try { await portalSupabase.auth.signOut(); } catch { /* best-effort */ } }
}

// --- portal data (all RLS-gated; RPCs from migrations 01–03) -----------------

// Is the current user actually a portal client? (NULL session → false)
export async function loadClientAccount() {
  if (!portalSupabase) return null;
  const { data, error } = await portalSupabase
    .from("client_accounts")
    .select("id, client_id, advisor_id, email, status, stripe_customer_id")
    .maybeSingle();
  if (error) return null;
  return data || null;
}

export async function membershipStatus() {
  if (!portalSupabase) return { active: false };
  const { data, error } = await portalSupabase.rpc("client_membership_status");
  if (error) return { active: false, error: error.message };
  return data || { active: false };
}

export async function getOwnData() {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const { data, error } = await portalSupabase.rpc("client_get_own_data");
  if (error) return { ok: false, error: error.message };
  return { ok: true, data: data || {} };
}

export async function updateOwnData(patch) {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const { data, error } = await portalSupabase.rpc("client_update_own_data", { p_patch: patch });
  if (error) return { ok: false, error: error.message };
  return { ok: true, data };
}

export async function listMessages() {
  if (!portalSupabase) return [];
  const { data } = await portalSupabase
    .from("portal_messages")
    .select("id, sender, body, created_at, read_at")
    .order("created_at", { ascending: true });
  return data || [];
}

export async function sendMessage(accountId, advisorId, body) {
  if (!portalSupabase) return { ok: false, error: "Portal not configured." };
  const { error } = await portalSupabase.from("portal_messages").insert({
    client_account_id: accountId, advisor_id: advisorId, sender: "client", body,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

export async function listDocuments() {
  if (!portalSupabase) return [];
  const { data } = await portalSupabase
    .from("client_documents")
    .select("id, filename, content_type, size_bytes, uploaded_by, created_at, storage_path")
    .order("created_at", { ascending: false });
  return data || [];
}

// --- billing (calls the dry-run-capable serverless endpoints) ---------------
async function postJson(url, body) {
  const session = await getSession();
  const headers = { "Content-Type": "application/json" };
  if (session?.access_token) headers.Authorization = "Bearer " + session.access_token;
  const r = await fetch(url, { method: "POST", headers, body: JSON.stringify(body || {}) });
  const j = await r.json().catch(() => ({}));
  return { httpOk: r.ok, status: r.status, ...j };
}

export function startCheckout(plan) { return postJson("/api/portal-create-checkout", { plan }); }
export function openBillingPortal()  { return postJson("/api/portal-billing-portal", {}); }
