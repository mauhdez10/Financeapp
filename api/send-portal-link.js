// api/send-portal-link.js
// ============================================================================
// Emails a client their read-only portal link — v0.71.
//
// The authenticated ADVISOR triggers this from the Share-portal modal. We
// verify the JWT, confirm the portal token actually belongs to that advisor
// (so the endpoint can't be used to send arbitrary links), then send a
// branded bilingual email via Resend.
//
// Env vars required:
//   SUPABASE_URL / SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   RESEND_FROM — verified sender, e.g. "Golden Anchor <noreply@finance.goldenanchor.life>"
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";

const vEmail = (s) => typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
const esc = (s) => String(s || "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "Method not allowed" });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "Supabase env vars missing on server" });
  if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "Resend env vars missing on server" });

  const m = (req.headers.authorization || "").match(/^Bearer\s+(.+)$/);
  if (!m) return res.status(401).json({ ok: false, error: "Missing bearer token" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userResp, error: authErr } = await admin.auth.getUser(m[1]);
  if (authErr || !userResp?.user) return res.status(401).json({ ok: false, error: "Invalid session" });
  const user = userResp.user;

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const to = String(body.to || "").trim().slice(0, 200);
  const token = String(body.token || "").trim().slice(0, 128);
  const clientName = String(body.clientName || "").trim().slice(0, 120);
  const advisorName = String(body.advisorName || "").trim().slice(0, 120) || "Your advisor";
  const lang = body.lang === "es" ? "es" : "en";

  if (!vEmail(to)) return res.status(400).json({ ok: false, error: "Recipient email is invalid" });
  if (!token) return res.status(400).json({ ok: false, error: "Missing portal token" });

  // The token must be an ACTIVE link owned by the calling advisor.
  const { data: link, error: lerr } = await admin
    .from("portal_links")
    .select("id,user_id,revoked,expires_at")
    .eq("token", token).maybeSingle();
  if (lerr) return res.status(500).json({ ok: false, error: lerr.message || "Lookup failed" });
  if (!link || link.user_id !== user.id) return res.status(403).json({ ok: false, error: "Portal link not found for this account" });
  if (link.revoked) return res.status(410).json({ ok: false, error: "This link is revoked — generate a new one first." });
  if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
    return res.status(410).json({ ok: false, error: "This link is expired — generate a new one first." });
  }

  const url = `https://finance.goldenanchor.life/portal?token=${encodeURIComponent(token)}`;
  const L = lang === "es" ? {
    subject: `${advisorName} compartió tu resumen financiero`,
    hi: clientName ? `Hola ${clientName},` : "Hola,",
    body: `${advisorName} preparó un resumen privado de tus finanzas en Golden Anchor. Ábrelo con el botón — no necesitas contraseña.`,
    cta: "Ver mi resumen",
    foot: "Este enlace es personal — no lo compartas. Coaching financiero educativo; no es asesoría de inversión, legal ni fiscal.",
  } : {
    subject: `${advisorName} shared your financial overview`,
    hi: clientName ? `Hi ${clientName},` : "Hi,",
    body: `${advisorName} prepared a private overview of your finances on Golden Anchor. Open it with the button below — no password needed.`,
    cta: "View my overview",
    foot: "This link is personal — please don't share it. Educational financial coaching only; not investment, legal, or tax advice.",
  };

  const html = `
  <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;background:#FAFAF7;padding:32px 16px;">
    <div style="max-width:520px;margin:0 auto;background:#FFFFFF;border:1px solid #ECEAE3;border-radius:12px;padding:28px;">
      <div style="font-family:Georgia,'Newsreader',serif;font-style:italic;letter-spacing:0.1em;color:#B8901E;font-size:15px;margin-bottom:18px;">GOLDEN ANCHOR</div>
      <div style="font-size:14px;color:#16181C;line-height:1.7;margin-bottom:6px;">${esc(L.hi)}</div>
      <div style="font-size:14px;color:#5A6270;line-height:1.7;margin-bottom:22px;">${esc(L.body)}</div>
      <a href="${esc(url)}" style="display:inline-block;background:#C9A84C;color:#1A1405;font-weight:700;font-size:14px;padding:12px 22px;border-radius:8px;text-decoration:none;">${esc(L.cta)}</a>
      <div style="font-size:11px;color:#9AA0A8;line-height:1.7;margin-top:24px;border-top:1px solid #ECEAE3;padding-top:14px;">${esc(L.foot)}</div>
    </div>
  </div>`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [to],
      subject: L.subject,
      text: `${L.hi}\n\n${L.body}\n\n${L.cta}: ${url}\n\n${L.foot}`,
      html,
    });
    if (error) return res.status(502).json({ ok: false, error: error.message || "Resend send failed" });
    return res.status(200).json({ ok: true, messageId: data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
