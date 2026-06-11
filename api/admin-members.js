// api/admin-members.js — master account view + complimentary Premium (v0.75)
// ============================================================================
// Owner ask: "a master account where I can check how many members subscribed,
// what plan they have, manage issues, the income I'm getting, and the permission
// to give the premium features to clients as complimentary."
//
// Actions (POST {action,...}, advisor JWT required):
//   list                 — ADMIN ONLY: every client account (email, name, plan,
//                          joined, onboarded, insurance interests) + counts.
//                          Includes Stripe MRR/income when STRIPE_SECRET_KEY is set.
//   grant {email, plan}  — any ADVISOR: comp a client account ("premium" default).
//   revoke {email}       — any ADVISOR: set a client account back to "free".
// Grants are stamped (compedBy, compedAt) and logged.
//
// ADMIN allowlist for "list": the firm's own addresses.
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY (already set); STRIPE_SECRET_KEY optional.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const ADMIN_EMAILS = (process.env.GA_ADMIN_EMAILS || "ap@goldenanchor.life,mauricio@goldenanchor.life,finance@goldenanchor.life,test@goldenanchor.life")
  .split(",").map(s => s.trim().toLowerCase()).filter(Boolean);

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "supabase env missing" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const caller = userData.user;
  const callerRole = caller.user_metadata?.role || "advisor";
  if (callerRole === "client") return res.status(403).json({ ok: false, error: "advisors only" });
  const isAdmin = ADMIN_EMAILS.includes((caller.email || "").toLowerCase());

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const action = body?.action;

  // all client-role accounts (auth) joined to their self-profile rows
  async function loadClients() {
    const out = [];
    let page = 1;
    for (;;) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) throw new Error(error.message);
      const users = data?.users || [];
      out.push(...users.filter(u => (u.user_metadata?.role || "") === "client"));
      if (users.length < 200) break;
      page++;
    }
    const ids = out.map(u => u.id);
    const profiles = {};
    if (ids.length) {
      const { data: rows } = await admin.from("clients").select("user_id,data").in("user_id", ids);
      (rows || []).forEach(r => { profiles[r.user_id] = r.data || {}; });
    }
    return out.map(u => {
      const p = profiles[u.id] || {};
      return {
        uid: u.id, email: u.email, joined: (u.created_at || "").slice(0, 10),
        confirmed: !!u.email_confirmed_at,
        name: ((p.firstName || "") + " " + (p.lastName || "")).trim() || null,
        plan: p.accountPlan || "free",
        onboarded: !!p.onboardedAt,
        insurance: p.insuranceInterests || null,
        premiumSince: p.premiumActivatedAt || p.premiumClaimedAt || p.compedAt || null,
        comped: !!p.compedBy,
      };
    });
  }

  async function patchByEmail(email, patch) {
    const { data, error } = await admin.auth.admin.listUsers({ page: 1, perPage: 200 });
    if (error) throw new Error(error.message);
    const u = (data?.users || []).find(x => (x.email || "").toLowerCase() === email.toLowerCase() && (x.user_metadata?.role || "") === "client");
    if (!u) throw new Error("no client account with that email");
    const { data: rows, error: e1 } = await admin.from("clients").select("id,data").eq("user_id", u.id).limit(1);
    if (e1 || !rows?.length) throw new Error("client profile row not found");
    const row = rows[0];
    const { error: e2 } = await admin.from("clients").update({ data: { ...row.data, ...patch } }).eq("id", row.id);
    if (e2) throw new Error(e2.message);
    return u.email;
  }

  try {
    if (action === "list") {
      if (!isAdmin) return res.status(403).json({ ok: false, error: "admin only" });
      const members = await loadClients();
      const counts = { total: members.length, premium: members.filter(m => m.plan !== "free").length, free: members.filter(m => m.plan === "free").length, comped: members.filter(m => m.comped).length, unconfirmed: members.filter(m => !m.confirmed).length };
      let income = null;
      if (STRIPE_KEY) {
        try {
          const r = await fetch("https://api.stripe.com/v1/subscriptions?status=active&limit=100", { headers: { Authorization: "Bearer " + STRIPE_KEY } });
          const j = await r.json();
          if (r.ok) {
            const subs = j.data || [];
            const mrr = subs.reduce((s, sub) => s + (sub.items?.data || []).reduce((a, it) => {
              const amt = (it.price?.unit_amount || 0) * (it.quantity || 1);
              const iv = it.price?.recurring?.interval;
              return a + (iv === "year" ? amt / 12 : amt);
            }, 0), 0);
            income = { activeSubscriptions: subs.length, mrrUsd: Math.round(mrr) / 100 };
          }
        } catch (e) { income = { error: "stripe unreachable" }; }
      }
      return res.status(200).json({ ok: true, counts, income, members, stripeConfigured: !!STRIPE_KEY });
    }
    if (action === "grant") {
      const email = String(body?.email || "").trim();
      const plan = ["premium", "lite", "lite-plus", "annual"].includes(body?.plan) ? body.plan : "premium";
      if (!email) return res.status(400).json({ ok: false, error: "email required" });
      const today = new Date().toISOString().slice(0, 10);
      const granted = await patchByEmail(email, { accountPlan: plan, compedBy: caller.email, compedAt: today });
      console.log("[GA admin] %s comped %s -> %s", caller.email, granted, plan);
      return res.status(200).json({ ok: true, email: granted, plan });
    }
    if (action === "revoke") {
      const email = String(body?.email || "").trim();
      if (!email) return res.status(400).json({ ok: false, error: "email required" });
      const today = new Date().toISOString().slice(0, 10);
      const revoked = await patchByEmail(email, { accountPlan: "free", compedBy: null, compRevokedBy: caller.email, compRevokedAt: today });
      console.log("[GA admin] %s revoked comp for %s", caller.email, revoked);
      return res.status(200).json({ ok: true, email: revoked, plan: "free" });
    }
    return res.status(400).json({ ok: false, error: "unknown action" });
  } catch (e) {
    console.error("[GA admin-members] error", e);
    return res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
}
