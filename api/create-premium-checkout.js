// api/create-premium-checkout.js — MD-A/B (v0.75)
// ============================================================================
// TRUE choose-your-price Premium (owner: "I want them to choose whatever they
// want starting from 3 bucks"). Stripe payment links can't do customer-chosen
// amounts on subscriptions, so: the app collects any whole-dollar amount >= $3,
// we find-or-create a monthly recurring price for that amount on the Premium
// product (lookup_key premium-m-<amount>, so prices are reused), and open a
// Checkout Session carrying client_reference_id = the account uid (the webhook
// auto-activates Premium on completion).
//
// Auth: client JWT in Authorization header — verified server-side.
// Env vars required:
//   STRIPE_SECRET_KEY         — sk_live_…
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service_role secret
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const PREMIUM_PRODUCT = "prod_UgX7bm2AANaxez";
const SITE = "https://finance.goldenanchor.life";

async function stripe(path, params) {
  const r = await fetch("https://api.stripe.com/v1/" + path, {
    method: "POST",
    headers: { Authorization: "Bearer " + STRIPE_KEY, "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams(params).toString(),
  });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || ("stripe " + r.status));
  return j;
}
async function stripeGet(path) {
  const r = await fetch("https://api.stripe.com/v1/" + path, { headers: { Authorization: "Bearer " + STRIPE_KEY } });
  const j = await r.json();
  if (!r.ok) throw new Error(j?.error?.message || ("stripe " + r.status));
  return j;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!STRIPE_KEY) return res.status(503).json({ ok: false, code: "no-stripe-key", error: "Stripe key not configured — using fallback links." });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "supabase env missing" });

  // verify the caller
  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const uid = userData.user.id;

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < 3 || amount > 500) {
    return res.status(400).json({ ok: false, error: "amount must be a whole number of dollars between 3 and 500" });
  }

  try {
    const lookup = "premium-m-" + amount;
    // reuse an existing price for this amount, else create one
    let priceId = null;
    const existing = await stripeGet("prices?lookup_keys[]=" + encodeURIComponent(lookup) + "&active=true&limit=1");
    if (existing.data && existing.data.length) priceId = existing.data[0].id;
    if (!priceId) {
      const p = await stripe("prices", {
        product: PREMIUM_PRODUCT,
        unit_amount: String(amount * 100),
        currency: "usd",
        "recurring[interval]": "month",
        lookup_key: lookup,
        nickname: "Premium choose-your-price $" + amount + "/mo",
      });
      priceId = p.id;
    }
    const session = await stripe("checkout/sessions", {
      mode: "subscription",
      "line_items[0][price]": priceId,
      "line_items[0][quantity]": "1",
      client_reference_id: uid,
      customer_email: userData.user.email || "",
      success_url: SITE + "/settings?premium=activated",
      cancel_url: SITE + "/settings?premium=cancelled",
      allow_promotion_codes: "false",
    });
    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    console.error("[GA premium-checkout] error", e);
    return res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
}
