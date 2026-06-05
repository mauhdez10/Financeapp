// api/portal-billing-portal.js
// Returns a Stripe Customer Portal URL so a client can manage their card /
// cancel. DRY-RUN: friendly error if Stripe isn't configured or the client has
// no Stripe customer yet.

import { getStripe, authedClientAccount } from "./_portal-common.js";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });

  const auth = await authedClientAccount(req);
  if (auth.error) return res.status(auth.status).json({ ok: false, error: auth.error });
  const { account } = auth;

  const stripe = await getStripe();
  if (!stripe) return res.status(200).json({ ok: false, error: "Billing isn’t configured yet." });
  if (!account.stripe_customer_id) return res.status(200).json({ ok: false, error: "No billing account yet — start a membership first." });

  const origin = (req.headers.origin || ("https://" + (req.headers.host || "finance.goldenanchor.life")));
  try {
    const session = await stripe.billingPortal.sessions.create({
      customer: account.stripe_customer_id,
      return_url: origin + "/portal",
    });
    return res.status(200).json({ ok: true, url: session.url });
  } catch (e) {
    return res.status(502).json({ ok: false, error: String(e?.message || e) });
  }
}
