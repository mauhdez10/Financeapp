// api/send-link-invite.js — MD-C Link-R (v0.76)
// Advisor invites a client to LINK their account to the advisor's client record.
// Verifies the advisor JWT + that the link row belongs to them (the row is created
// client-side through RLS, like portal links), then emails a branded bilingual
// invite with the accept URL. Re-send = rotate token client-side, call again.
//
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, RESEND_API_KEY, RESEND_FROM.
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const SITE = "https://finance.goldenanchor.life";

const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_API_KEY) return res.status(500).json({ ok: false, error: "server env missing" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const advisor = userData.user;
  if ((advisor.user_metadata?.role || "") === "client") return res.status(403).json({ ok: false, error: "advisors only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const token = String(body?.token || "").trim();
  const lang = body?.lang === "es" ? "es" : "en";
  const clientName = String(body?.clientName || "").trim().slice(0, 120);
  const advisorName = String(body?.advisorName || "your advisor").trim().slice(0, 120);
  if (!token) return res.status(400).json({ ok: false, error: "token required" });

  const { data: rows, error } = await admin.from("client_links").select("*").eq("token", token).limit(1);
  if (error || !rows?.length) return res.status(404).json({ ok: false, error: "link not found" });
  const link = rows[0];
  if (link.advisor_uid !== advisor.id) return res.status(403).json({ ok: false, error: "not your link" });
  if (link.status !== "pending") return res.status(400).json({ ok: false, error: "link is " + link.status });

  const url = `${SITE}/link?token=${encodeURIComponent(token)}`;
  const es = lang === "es";
  const subject = es ? `${advisorName} te invita a conectar tu cuenta de Golden Anchor` : `${advisorName} invited you to connect your Golden Anchor account`;
  const html = `
  <div style="font-family:system-ui,Segoe UI,sans-serif;max-width:520px;margin:0 auto;padding:24px;color:#16181C">
    <div style="font-size:13px;letter-spacing:.14em;text-transform:uppercase;color:#B8901E;font-weight:600;margin-bottom:14px">Golden Anchor</div>
    <h2 style="font-size:20px;margin:0 0 12px">${es ? "Conecta tu cuenta" : "Connect your account"}</h2>
    <p style="font-size:14px;line-height:1.65;color:#444">
      ${es
        ? `Hola${clientName ? " " + esc(clientName) : ""}, ${esc(advisorName)} preparó tu perfil financiero en Golden Anchor. Conéctalo a tu propia cuenta para ver tus números, reportes y avances en cualquier momento.`
        : `Hi${clientName ? " " + esc(clientName) : ""}, ${esc(advisorName)} prepared your financial profile in Golden Anchor. Connect it to your own account to see your numbers, reports, and progress anytime.`}
    </p>
    <p style="margin:22px 0"><a href="${url}" style="background:#C9A84C;color:#16120A;text-decoration:none;font-weight:700;padding:12px 22px;border-radius:9px;display:inline-block">${es ? "Conectar mi cuenta" : "Connect my account"}</a></p>
    <p style="font-size:12px;color:#777;line-height:1.6">
      ${es
        ? `Este enlace vence en 14 días y solo funciona con una cuenta registrada con ESTE correo (${esc(link.invited_email)}). Si no esperabas esta invitación, ignórala.`
        : `This link expires in 14 days and only works with an account registered to THIS email (${esc(link.invited_email)}). If you weren't expecting this invite, you can ignore it.`}
    </p>
  </div>`;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error: sendErr } = await resend.emails.send({
      from: RESEND_FROM, to: link.invited_email, subject, html,
    });
    if (sendErr) return res.status(502).json({ ok: false, error: sendErr.message || "send failed" });
    return res.status(200).json({ ok: true, messageId: data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
