// api/stripe-promos.js — MD-H (v0.76.1). "Make the website auto-update with Stripe
// if possible" (owner): returns the LIVE active promotion codes + their coupons so
// the Promotions page reflects Stripe without manual editing. Public + cached (the
// data is promotional by nature; nothing sensitive). Graceful 200 {configured:false}
// until STRIPE_SECRET_KEY is set in Vercel.
const STRIPE_KEY = process.env.STRIPE_SECRET_KEY;

export default async function handler(req, res) {
  res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
  if (!STRIPE_KEY) return res.status(200).json({ ok: true, configured: false, promos: [] });
  try {
    const r = await fetch("https://api.stripe.com/v1/promotion_codes?active=true&limit=20&expand[]=data.promotion.coupon", {
      headers: { Authorization: "Bearer " + STRIPE_KEY },
    });
    const j = await r.json();
    if (!r.ok) return res.status(200).json({ ok: true, configured: true, promos: [], note: j?.error?.message });
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
