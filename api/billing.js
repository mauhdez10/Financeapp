// api/billing.js — Stripe app endpoints consolidated (v0.76.2; Vercel 12-function
// limit, pitfall #20). GET → live promotion codes (public, cached). POST {action:
// "checkout", amount} → choose-your-price Premium Checkout Session (client JWT).
// Logic unchanged from stripe-promos.js / create-premium-checkout.js (git history).
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;
const PREMIUM_PRODUCT = "prod_UgX7bm2AANaxez";
const SITE = "https://finance.goldenanchor.life";

async function stripePost(path, params) {
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
  /* ── GET: public live promo codes (cached) ─────────────────────────────── */
  if (req.method === "GET") {
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    if (!STRIPE_KEY) return res.status(200).json({ ok: true, configured: false, promos: [] });
    try {
      const j = await stripeGet("promotion_codes?active=true&limit=20");
      const promos = (j.data || []).map(p => {
        const coupon = p.coupon || (p.promotion && p.promotion.coupon) || {};
        return {
          code: p.code,
          percentOff: coupon.percent_off || null,
          amountOff: coupon.amount_off != null ? coupon.amount_off / 100 : null,
          name: coupon.name || null,
          expiresAt: p.expires_at ? new Date(p.expires_at * 1000).toISOString().slice(0, 10) : null,
        };
      });
      return res.status(200).json({ ok: true, configured: true, promos });
    } catch (e) {
      return res.status(200).json({ ok: true, configured: false, promos: [], note: String(e?.message || e) });
    }
  }

  /* ── POST {action:"checkout", amount}: any-amount Premium subscription ──── */
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "GET or POST" });
  if (!STRIPE_KEY) return res.status(503).json({ ok: false, code: "no-stripe-key", error: "Stripe key not configured — using fallback links." });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "supabase env missing" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const uid = userData.user.id;

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  if (body?.action && body.action !== "checkout") return res.status(400).json({ ok: false, error: "unknown action" });
  const amount = Math.round(Number(body?.amount));
  if (!Number.isFinite(amount) || amount < 3 || amount > 500) {
    return res.status(400).json({ ok: false, error: "amount must be a whole number of dollars between 3 and 500" });
  }

  try {
    const lookup = "premium-m-" + amount;
    let priceId = null;
    const existing = await stripeGet("prices?lookup_keys[]=" + encodeURIComponent(lookup) + "&active=true&limit=1");
    if (existing.data && existing.data.length) priceId = existing.data[0].id;
    if (!priceId) {
      const p = await stripePost("prices", {
        product: PREMIUM_PRODUCT, unit_amount: String(amount * 100), currency: "usd",
        "recurring[interval]": "month", lookup_key: lookup,
        nickname: "Premium choose-your-price $" + amount + "/mo",
      });
      priceId = p.id;
    }
    const session = await stripePost("checkout/sessions", {
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
    console.error("[GA billing checkout] error", e);
    return res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
}
