// api/link.js — MD-C Link-R consolidated (v0.76.2).
// ⚠️ Vercel Hobby allows 12 serverless functions per deploy (pitfall #20) — the three
// link endpoints live here behind {action}: "invite-email" | "accept" | "overview".
// Security notes per action are unchanged from the original files (see git history of
// send-link-invite.js / accept-link.js / linked-overview.js).
import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import { sanitizeClient } from "./_sanitize.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const SITE = "https://finance.goldenanchor.life";
const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "server env missing" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const user = userData.user;
  const role = user.user_metadata?.role || "advisor";

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
  const action = body?.action;

  /* ── invite-email (advisor): email the accept link for a row they own ─────── */
  if (action === "invite-email") {
    if (role === "client") return res.status(403).json({ ok: false, error: "advisors only" });
    if (!RESEND_API_KEY) return res.status(500).json({ ok: false, error: "email env missing" });
    const token = String(body?.token || "").trim();
    const lang = body?.lang === "es" ? "es" : "en";
    const clientName = String(body?.clientName || "").trim().slice(0, 120);
    const advisorName = String(body?.advisorName || "your advisor").trim().slice(0, 120);
    if (!token) return res.status(400).json({ ok: false, error: "token required" });
    const { data: rows, error } = await admin.from("client_links").select("*").eq("token", token).limit(1);
    if (error || !rows?.length) return res.status(404).json({ ok: false, error: "link not found" });
    const link = rows[0];
    if (link.advisor_uid !== user.id) return res.status(403).json({ ok: false, error: "not your link" });
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
      const { data, error: sendErr } = await resend.emails.send({ from: RESEND_FROM, to: link.invited_email, subject, html });
      if (sendErr) return res.status(502).json({ ok: false, error: sendErr.message || "send failed" });
      return res.status(200).json({ ok: true, messageId: data?.id || null });
    } catch (e) { return res.status(500).json({ ok: false, error: String(e?.message || e) }); }
  }

  /* ── accept (client): email hard-match, island snapshot, auto-revoke portals ─ */
  if (action === "accept") {
    if (role !== "client") return res.status(403).json({ ok: false, error: "client accounts only" });
    const token = String(body?.token || "").trim();
    if (!token) return res.status(400).json({ ok: false, error: "token required" });
    const { data: rows, error } = await admin.from("client_links").select("*").eq("token", token).limit(1);
    if (error || !rows?.length) return res.status(404).json({ ok: false, error: "invite not found" });
    const link = rows[0];
    if (link.status !== "pending") return res.status(400).json({ ok: false, error: "invite already " + link.status });
    if (new Date(link.expires_at) < new Date()) {
      await admin.from("client_links").update({ status: "expired" }).eq("id", link.id);
      return res.status(400).json({ ok: false, error: "invite expired — ask your advisor to re-send it" });
    }
    if ((user.email || "").toLowerCase() !== (link.invited_email || "").toLowerCase()) {
      return res.status(403).json({ ok: false, error: "this invite was sent to a different email address" });
    }
    let island = null;
    try {
      const { data: own } = await admin.from("clients").select("data").eq("user_id", user.id).limit(1);
      if (own && own.length) island = own[0].data || null;
    } catch {}
    const { error: e2 } = await admin.from("client_links").update({
      client_uid: user.id, status: "accepted", accepted_at: new Date().toISOString(), island_snapshot: island,
    }).eq("id", link.id);
    if (e2) {
      const msg = /unique|duplicate/i.test(e2.message || "") ? "this account is already linked to an advisor" : e2.message;
      return res.status(400).json({ ok: false, error: msg });
    }
    try {
      await admin.from("portal_links").update({ revoked: true })
        .eq("user_id", link.advisor_uid).eq("client_local_id", link.client_local_id).eq("revoked", false);
    } catch {}
    return res.status(200).json({ ok: true, advisorUid: link.advisor_uid });
  }

  /* ── overview (client): sanitized read-only mirror of the advisor's record ── */
  if (action === "overview") {
    const { data: links, error } = await admin.from("client_links").select("*")
      .eq("client_uid", user.id).eq("status", "accepted").limit(1);
    if (error) return res.status(500).json({ ok: false, error: error.message });
    if (!links?.length) return res.status(200).json({ ok: true, linked: false });
    const link = links[0];
    let crow = null;
    const a = await admin.from("clients").select("data").eq("user_id", link.advisor_uid).eq("local_id", link.client_local_id).limit(1);
    if (a.data && a.data.length) crow = a.data[0];
    if (!crow) {
      const b = await admin.from("clients").select("data").eq("user_id", link.advisor_uid).filter("data->>id", "eq", link.client_local_id).limit(1);
      if (b.data && b.data.length) crow = b.data[0];
    }
    if (!crow) return res.status(404).json({ ok: false, error: "advisor record not found (it may have been deleted)" });
    let advisor = null;
    try {
      const { data: srow } = await admin.from("settings").select("data").eq("user_id", link.advisor_uid).limit(1);
      const s = (srow && srow[0] && srow[0].data) || {};
      advisor = { name: s.advisorName || null, email: s.advisorEmail || null, phone: s.advisorPhone || null, companyName: s.companyName || null, logoLight: s.logoLight || null, logoDark: s.logoDark || null, referralContacts: Array.isArray(s.referralContacts) ? s.referralContacts : [] };
    } catch {}
    return res.status(200).json({ ok: true, linked: true, client: sanitizeClient(crow.data), advisor, linkedAt: link.accepted_at });
  }

  return res.status(400).json({ ok: false, error: "unknown action" });
}
