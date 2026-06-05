// api/portal-stripe-webhook.js
// Stripe webhook — the ONLY writer of client access state. Verifies the
// signature, then syncs subscription/one-time payments into client_periods via
// the service-role RPCs (migration 03). A client can never grant themselves
// access; only verified Stripe events do.
//
// Vercel note: this route needs the RAW body for signature verification. Export
// config.api.bodyParser=false and read the raw stream.

export const config = { api: { bodyParser: false } };

import { getStripe, getAdmin } from "./_portal-common.js";

function readRaw(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(Buffer.from(c)));
    req.on("end", () => resolve(Buffer.concat(chunks)));
    req.on("error", reject);
  });
}

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const stripe = await getStripe();
  const admin = getAdmin();
  const whSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripe || !admin || !whSecret) {
    // Dry-run / unconfigured — acknowledge so Stripe doesn't retry forever.
    return res.status(200).json({ ok: true, skipped: "not-configured" });
  }

  let event;
  try {
    const raw = await readRaw(req);
    event = stripe.webhooks.constructEvent(raw, req.headers["stripe-signature"], whSecret);
  } catch (e) {
    return res.status(400).json({ ok: false, error: "Signature verification failed: " + (e?.message || e) });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        const acct = s.metadata?.client_account_id;
        const plan = s.metadata?.plan;
        if (acct && plan === "one_time") {
          // Look up advisor's one-time window length.
          const { data: a } = await admin.from("client_accounts").select("advisor_id").eq("id", acct).maybeSingle();
          let days = 90;
          if (a) {
            const { data: st } = await admin.from("settings").select("data").eq("user_id", a.advisor_id).maybeSingle();
            days = st?.data?.portal?.oneTimeDays || 90;
          }
          await admin.rpc("record_one_time_period", { p_account: acct, p_days: days, p_stripe_ref: s.id });
        }
        // subscription checkouts are handled via invoice.paid below.
        break;
      }
      case "invoice.paid": {
        const inv = event.data.object;
        const subId = inv.subscription;
        const periodEnd = inv.lines?.data?.[0]?.period?.end || inv.period_end;
        // Resolve account via the subscription's metadata.
        if (subId) {
          const sub = await stripe.subscriptions.retrieve(subId);
          const acct = sub.metadata?.client_account_id;
          if (acct && periodEnd) {
            await admin.rpc("record_subscription_period", {
              p_account: acct,
              p_ends_at: new Date(periodEnd * 1000).toISOString(),
              p_stripe_ref: subId,
            });
          }
        }
        break;
      }
      case "customer.subscription.deleted":
      case "customer.subscription.paused": {
        const sub = event.data.object;
        const acct = sub.metadata?.client_account_id;
        if (acct) await admin.rpc("expire_subscription", { p_account: acct, p_stripe_ref: sub.id });
        break;
      }
      default:
        break; // ignore other events
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
