// api/stripe-webhook.js — MD-H (v0.75)
// ============================================================================
// Auto-activates Premium when a client pays (owner: "make sure once the client
// pays they get the features activated") and downgrades on cancellation.
//
// Flow: Stripe checkout links/sessions carry client_reference_id = the client
// account's auth uid (set by the app). On checkout.session.completed we patch
// that account's self-profile row: accountPlan="premium" (+ stripe ids). On
// customer.subscription.deleted we revert to free (matched by stored customer id).
//
// Signature verification is implemented manually (Stripe v1 scheme: HMAC-SHA256
// of "<timestamp>.<rawBody>") so we don't need the stripe npm package.
//
// Env vars required:
//   STRIPE_WEBHOOK_SECRET     — whsec_… (Stripe → Developers → Webhooks)
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service_role secret
// ============================================================================

import crypto from "node:crypto";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const WH_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

async function rawBody(req) {
  const chunks = [];
  for await (const c of req) chunks.push(typeof c === "string" ? Buffer.from(c) : c);
  return Buffer.concat(chunks);
}

function verifySig(raw, sigHeader, secret) {
  if (!sigHeader || !secret) return false;
  const parts = Object.fromEntries(sigHeader.split(",").map(p => p.split("=")));
  const t = parts.t, v1 = parts.v1;
  if (!t || !v1) return false;
  // 5-minute tolerance window
  if (Math.abs(Date.now() / 1000 - Number(t)) > 300) return false;
  const expected = crypto.createHmac("sha256", secret).update(`${t}.${raw.toString("utf8")}`).digest("hex");
  try {
    return crypto.timingSafeEqual(Buffer.from(expected, "hex"), Buffer.from(v1, "hex"));
  } catch { return false; }
}

async function patchClientPlan(admin, userId, patch) {
  const { data: rows, error } = await admin.from("clients").select("id,data").eq("user_id", userId).limit(1);
  if (error || !rows || !rows.length) return { ok: false, error: error?.message || "no client row" };
  const row = rows[0];
  const newData = { ...row.data, ...patch };
  const { error: e2 } = await admin.from("clients").update({ data: newData }).eq("id", row.id);
  return e2 ? { ok: false, error: e2.message } : { ok: true };
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!WH_SECRET) return res.status(503).json({ ok: false, error: "STRIPE_WEBHOOK_SECRET not configured" });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "supabase env missing" });

  let raw;
  try { raw = await rawBody(req); } catch { return res.status(400).json({ ok: false, error: "body read failed" }); }
  if (!verifySig(raw, req.headers["stripe-signature"], WH_SECRET)) {
    return res.status(400).json({ ok: false, error: "bad signature" });
  }

  let event;
  try { event = JSON.parse(raw.toString("utf8")); } catch { return res.status(400).json({ ok: false, error: "bad json" }); }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const today = new Date().toISOString().slice(0, 10);

  try {
    if (event.type === "checkout.session.completed") {
      const s = event.data.object || {};
      const uid = s.client_reference_id;
      if (uid) {
        const r = await patchClientPlan(admin, uid, {
          accountPlan: "premium",
          premiumActivatedAt: today,
          premiumSource: "stripe-webhook",
          stripeCustomerId: s.customer || null,
          stripeSubscriptionId: s.subscription || null,
        });
        console.log("[GA webhook] checkout.completed uid=%s ok=%s", uid, r.ok, r.error || "");
      } else {
        console.log("[GA webhook] checkout.completed WITHOUT client_reference_id — manual reconcile (customer %s)", s.customer);
      }
    } else if (event.type === "customer.subscription.deleted") {
      const sub = event.data.object || {};
      const cust = sub.customer;
      if (cust) {
        // find the client account by stored customer id and downgrade
        const { data: rows } = await admin.from("clients").select("id,data").filter("data->>stripeCustomerId", "eq", cust).limit(1);
        if (rows && rows.length) {
          const row = rows[0];
          await admin.from("clients").update({ data: { ...row.data, accountPlan: "free", premiumEndedAt: today } }).eq("id", row.id);
          console.log("[GA webhook] subscription.deleted -> free (customer %s)", cust);
        }
      }
    }
    // Always 200 fast — Stripe retries on non-2xx.
    return res.status(200).json({ received: true });
  } catch (e) {
    console.error("[GA webhook] handler error", e);
    return res.status(200).json({ received: true, note: "logged" });
  }
}
