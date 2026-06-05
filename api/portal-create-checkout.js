// api/portal-create-checkout.js
// Creates a Stripe Checkout Session for the logged-in portal client (subscription
// or one-time). DRY-RUN: returns a friendly error if Stripe/prices aren't set —
// the portal UI shows "billing not configured", nothing breaks.

import { getStripe, authedClientAccount, getPortalConfig, readJsonBody } from "./_portal-common.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const auth = await authedClientAccount(req);
  if (auth.error) return res.status(auth.status).json({ ok: false, error: auth.error });
  const { account, admin } = auth;

  const stripe = await getStripe();
  if (!stripe) return res.status(200).json({ ok: false, error: "Billing isn’t configured yet." });

  const body = readJsonBody(req);
  const plan = body.plan === "yearly" ? "yearly" : body.plan === "one_time" ? "one_time" : "monthly";

  const cfg = await getPortalConfig(admin, account.advisor_id);
  const priceId = plan === "yearly" ? cfg.priceYearly : plan === "one_time" ? cfg.priceOneTime : cfg.priceMonthly;
  if (!priceId) return res.status(200).json({ ok: false, error: "This plan isn’t set up yet. Please contact your advisor." });

  const origin = (req.headers.origin || ("https://" + (req.headers.host || "finance.goldenanchor.life")));
  try {
    // Reuse or create a Stripe customer for this client.
    let customerId = account.stripe_customer_id;
    if (!customerId) {
      const customer = await stripe.customers.create({ email: account.email, metadata: { client_account_id: account.id, advisor_id: account.advisor_id } });
      customerId = customer.id;
      await admin.from("client_accounts").update({ stripe_customer_id: customerId }).eq("id", account.id);
    }

    const session = await stripe.checkout.sessions.create({
      mode: plan === "one_time" ? "payment" : "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: origin + "/portal?checkout=success",
      cancel_url: origin + "/portal?checkout=cancel",
      // The webhook reads these to provision access.
      metadata: { client_account_id: account.id, advisor_id: account.advisor_id, plan },
      ...(plan !== "one_time" ? { subscription_data: { metadata: { client_account_id: account.id, plan } } } : {}),
    });

    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
}
