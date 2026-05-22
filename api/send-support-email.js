// api/send-support-email.js
// ============================================================================
// In-app support request — v0.20.0
//
// Sends a support message from the authenticated advisor to
// finance@goldenanchor.life via Resend. Reply-to is set to the
// advisor's own email so we can respond directly.
//
// Auth: caller must include the Supabase user's access token in the
//       Authorization header ("Bearer <jwt>"). We verify it server-side.
//
// Env vars required:
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service_role secret
//   RESEND_API_KEY            — from Resend dashboard
//   RESEND_FROM               — verified sender, e.g. "Golden Anchor <noreply@finance.goldenanchor.life>"
//   SUPPORT_INBOX             — optional override; defaults to "finance@goldenanchor.life"
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const SUPPORT_INBOX = process.env.SUPPORT_INBOX || "finance@goldenanchor.life";

function vEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function escapeHtml(s) {
  return String(s || "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Supabase env vars missing on server" });
  }
  if (!RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: "Resend env vars missing on server" });
  }

  // Verify Bearer JWT
  const auth = req.headers.authorization || "";
  const m = auth.match(/^Bearer\s+(.+)$/);
  if (!m) return res.status(401).json({ ok: false, error: "Missing bearer token" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userResp, error: authErr } = await admin.auth.getUser(m[1]);
  if (authErr || !userResp?.user) {
    return res.status(401).json({ ok: false, error: "Invalid session" });
  }
  const user = userResp.user;

  // Parse body
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const subject = String(body.subject || "Golden Anchor app — support request").trim().slice(0, 200);
  const message = String(body.message || "").trim();
  const advisorName = String(body.advisorName || "").trim().slice(0, 120);
  const advisorEmail = String(body.advisorEmail || user.email || "").trim().slice(0, 200);
  const buildMarker = String(body.buildMarker || "—").trim().slice(0, 120);

  if (message.length < 5) {
    return res.status(400).json({ ok: false, error: "Message is empty" });
  }
  if (!vEmail(advisorEmail)) {
    return res.status(400).json({ ok: false, error: "Reply-to email is invalid" });
  }

  // Build email
  const textBody = [
    message,
    "",
    "---",
    `Sent from the Golden Anchor app`,
    `Advisor: ${advisorName || "—"}`,
    `Account email: ${advisorEmail}`,
    `User ID: ${user.id}`,
    `Build: ${buildMarker}`,
  ].join("\n");

  const htmlBody = `
    <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;color:#0F172A;line-height:1.6;max-width:640px;">
      <div style="white-space:pre-wrap;font-size:14px;">${escapeHtml(message)}</div>
      <hr style="border:none;border-top:1px solid #E2E8F0;margin:18px 0;"/>
      <div style="font-size:11px;color:#64748B;line-height:1.7;">
        Sent from the <b>Golden Anchor app</b><br/>
        Advisor: <b>${escapeHtml(advisorName || "—")}</b><br/>
        Account email: <a href="mailto:${escapeHtml(advisorEmail)}" style="color:#C9A84C;">${escapeHtml(advisorEmail)}</a><br/>
        User ID: <code style="font-family:'JetBrains Mono',monospace;font-size:10px;">${escapeHtml(user.id)}</code><br/>
        Build: <code style="font-family:'JetBrains Mono',monospace;font-size:10px;">${escapeHtml(buildMarker)}</code>
      </div>
    </div>
  `;

  try {
    const resend = new Resend(RESEND_API_KEY);
    const { data, error } = await resend.emails.send({
      from: RESEND_FROM,
      to: [SUPPORT_INBOX],
      reply_to: advisorEmail,
      subject: `[Support] ${subject}`,
      text: textBody,
      html: htmlBody,
    });
    if (error) {
      return res.status(502).json({ ok: false, error: error.message || "Resend send failed" });
    }
    return res.status(200).json({ ok: true, messageId: data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
