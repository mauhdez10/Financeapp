// api/send-intake-invite.js
// ============================================================================
// Server-side intake invite delivery — v0.10.0 (Chat 7)
//
// Sends an intake form invite via Resend (email) and/or Twilio (SMS, feature-
// flagged off until business profile verification completes).
//
// Auth: the caller must include the Supabase user's access token in the
//       Authorization header ("Bearer <jwt>"). We verify it server-side and
//       use the resulting user_id as the invite owner. The service-role key
//       is NEVER exposed to the client; it only lives in this function.
//
// Env vars required:
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service_role secret from Supabase dashboard
//   RESEND_API_KEY            — from Resend dashboard
//   RESEND_FROM               — verified sender, e.g. "Mauricio Hernandez <mauricio@finance.goldenanchor.life>"
//   RESEND_REPLY_TO           — optional, e.g. "mauricio@goldenanchor.life"
//   PUBLIC_INTAKE_BASE_URL    — e.g. "https://finance.goldenanchor.life/intake"
//   TWILIO_ENABLED            — "1" to enable SMS path; anything else disables
//   TWILIO_ACCOUNT_SID        — Twilio account SID (only required if enabled)
//   TWILIO_AUTH_TOKEN         — Twilio auth token (only required if enabled)
//   TWILIO_FROM_NUMBER        — purchased Twilio number, E.164 format
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "";
const PUBLIC_INTAKE_BASE_URL = process.env.PUBLIC_INTAKE_BASE_URL || "https://finance.goldenanchor.life/intake";
const TWILIO_ENABLED = process.env.TWILIO_ENABLED === "1";
const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM_NUMBER = process.env.TWILIO_FROM_NUMBER;

// ── helpers ────────────────────────────────────────────────────────────────
function sha256(str) {
  return crypto.createHash("sha256").update(String(str || "")).digest("hex");
}

function newToken() {
  // 24 random bytes → 32 chars base64url. Sufficient for unguessable invites.
  return crypto.randomBytes(24).toString("base64url");
}

function vEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

function vPhone(s) {
  // Loose check; we don't enforce E.164 here because Twilio will reject bad
  // numbers itself. Just sanity-check it's mostly digits with optional +.
  if (typeof s !== "string") return false;
  const cleaned = s.replace(/[^\d+]/g, "");
  return cleaned.length >= 10 && cleaned.length <= 16;
}

function htmlEscape(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}

// ── email body builders ────────────────────────────────────────────────────
function buildEmailBody(lang, prospectName, inviteUrl) {
  const greet = prospectName
    ? (lang === "es" ? `Hola ${prospectName},` : `Hi ${prospectName},`)
    : (lang === "es" ? "Hola," : "Hi,");

  if (lang === "es") {
    const text = `${greet}

Gracias por tu interés en Golden Anchor Financial Advisory. Por favor completa este formulario de admisión antes de nuestra primera llamada — toma unos 10-15 minutos y nos ayuda a preparar una estrategia útil para ti:

${inviteUrl}

Tu información está protegida y solo se usa para tu estrategia financiera. Si tienes preguntas, simplemente responde a este correo.

Mauricio Hernandez
Golden Anchor Financial Advisory
mauricio@goldenanchor.life`;

    const html = `
      <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;line-height:1.55">
        <div style="text-align:center;padding:24px 0 16px;border-bottom:1px solid #E2E8F0">
          <div style="font-size:36px">⚓</div>
          <div style="font-family:Georgia,serif;font-size:22px;color:#B8860B;font-weight:700;margin-top:4px">Golden Anchor</div>
          <div style="font-size:10px;color:#64748B;letter-spacing:0.18em;margin-top:4px;text-transform:uppercase">Financial Advisory</div>
        </div>
        <p>${htmlEscape(greet)}</p>
        <p>Gracias por tu interés en Golden Anchor Financial Advisory. Por favor completa este formulario de admisión antes de nuestra primera llamada — toma unos 10-15 minutos y nos ayuda a preparar una estrategia útil para ti:</p>
        <p style="text-align:center;margin:28px 0">
          <a href="${htmlEscape(inviteUrl)}" style="background:#B8860B;color:#FFFFFF;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Abrir formulario de admisión</a>
        </p>
        <p style="font-size:12px;color:#64748B">O copia este enlace: <span style="font-family:monospace;word-break:break-all">${htmlEscape(inviteUrl)}</span></p>
        <p style="font-size:12px;color:#64748B">Tu información está protegida y solo se usa para tu estrategia financiera. Si tienes preguntas, simplemente responde a este correo.</p>
        <p style="margin-top:24px"><strong>Mauricio Hernandez</strong><br>Golden Anchor Financial Advisory<br><a href="mailto:mauricio@goldenanchor.life" style="color:#B8860B">mauricio@goldenanchor.life</a></p>
        <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:12px;font-size:10px;color:#94A3B8;text-align:center">
          Este correo fue enviado a un prospecto que solicitó información sobre nuestros servicios. Si no esperabas este mensaje, puedes ignorarlo.
        </div>
      </div>`;
    return {
      subject: "Golden Anchor — Formulario de admisión",
      text,
      html
    };
  }

  // English (default)
  const text = `${greet}

Thanks for your interest in Golden Anchor Financial Advisory. Please fill out this intake form before our first call — it takes about 10-15 minutes and helps me prepare a useful strategy for your situation:

${inviteUrl}

Your information is protected and only used for your financial strategy. If you have questions, just reply to this email.

Mauricio Hernandez
Golden Anchor Financial Advisory
mauricio@goldenanchor.life`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;line-height:1.55">
      <div style="text-align:center;padding:24px 0 16px;border-bottom:1px solid #E2E8F0">
        <div style="font-size:36px">⚓</div>
        <div style="font-family:Georgia,serif;font-size:22px;color:#B8860B;font-weight:700;margin-top:4px">Golden Anchor</div>
        <div style="font-size:10px;color:#64748B;letter-spacing:0.18em;margin-top:4px;text-transform:uppercase">Financial Advisory</div>
      </div>
      <p>${htmlEscape(greet)}</p>
      <p>Thanks for your interest in Golden Anchor Financial Advisory. Please fill out this intake form before our first call — it takes about 10-15 minutes and helps me prepare a useful strategy for your situation:</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${htmlEscape(inviteUrl)}" style="background:#B8860B;color:#FFFFFF;padding:14px 28px;border-radius:8px;text-decoration:none;font-weight:700;display:inline-block">Open intake form</a>
      </p>
      <p style="font-size:12px;color:#64748B">Or copy this link: <span style="font-family:monospace;word-break:break-all">${htmlEscape(inviteUrl)}</span></p>
      <p style="font-size:12px;color:#64748B">Your information is protected and only used for your financial strategy. If you have questions, just reply to this email.</p>
      <p style="margin-top:24px"><strong>Mauricio Hernandez</strong><br>Golden Anchor Financial Advisory<br><a href="mailto:mauricio@goldenanchor.life" style="color:#B8860B">mauricio@goldenanchor.life</a></p>
      <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:12px;font-size:10px;color:#94A3B8;text-align:center">
        This email was sent to a prospect who requested information about our services. If you did not expect this message, you may ignore it.
      </div>
    </div>`;

  return {
    subject: "Golden Anchor — Intake form",
    text,
    html
  };
}

function buildSmsBody(lang, prospectName, inviteUrl) {
  const greet = prospectName
    ? (lang === "es" ? `Hola ${prospectName},` : `Hi ${prospectName},`)
    : (lang === "es" ? "Hola," : "Hi,");
  if (lang === "es") {
    return `${greet} aquí está tu formulario de admisión de Golden Anchor: ${inviteUrl} Responde STOP para no recibir más mensajes.`;
  }
  return `${greet} here is your Golden Anchor intake form: ${inviteUrl} Reply STOP to opt out. Msg & data rates may apply.`;
}

// ── Twilio SMS via REST (no SDK to keep bundle slim) ───────────────────────
async function sendTwilioSms(toPhone, body) {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    return { ok: false, error: "Twilio env vars not set" };
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");
  const form = new URLSearchParams({ To: toPhone, From: TWILIO_FROM_NUMBER, Body: body });
  try {
    const r = await fetch(url, {
      method: "POST",
      headers: { Authorization: `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString()
    });
    const j = await r.json();
    if (!r.ok) return { ok: false, error: j.message || `Twilio HTTP ${r.status}` };
    return { ok: true, sid: j.sid };
  } catch (e) {
    return { ok: false, error: String(e?.message || e) };
  }
}

// ── handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }

  // Env check
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Supabase env vars missing on server" });
  }
  if (!RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: "Resend env var missing on server" });
  }

  // Auth: verify the caller's JWT against Supabase auth.
  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) {
    return res.status(401).json({ ok: false, error: "Missing Authorization Bearer token" });
  }

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  let userId;
  try {
    const { data, error } = await admin.auth.getUser(jwt);
    if (error || !data?.user?.id) {
      return res.status(401).json({ ok: false, error: "Invalid or expired auth token" });
    }
    userId = data.user.id;
  } catch (e) {
    return res.status(401).json({ ok: false, error: "Auth verification failed" });
  }

  // Body parsing
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const prospectName = String(body.prospectName || "").trim().slice(0, 120);
  const prospectEmail = String(body.prospectEmail || "").trim().slice(0, 200);
  const prospectPhone = String(body.prospectPhone || "").trim().slice(0, 32);
  const lang = body.lang === "es" ? "es" : "en";
  const channelEmail = body.channelEmail === true || body.channelEmail === "true";
  const channelSms = body.channelSms === true || body.channelSms === "true";
  const smsConsent = body.smsConsent === true || body.smsConsent === "true";

  if (!channelEmail && !channelSms) {
    return res.status(400).json({ ok: false, error: "At least one channel must be selected" });
  }
  if (channelEmail && !vEmail(prospectEmail)) {
    return res.status(400).json({ ok: false, error: "Valid prospect email required for email channel" });
  }
  if (channelSms) {
    if (!TWILIO_ENABLED) {
      return res.status(400).json({ ok: false, error: "SMS is not yet enabled on this account" });
    }
    if (!vPhone(prospectPhone)) {
      return res.status(400).json({ ok: false, error: "Valid prospect phone required for SMS channel" });
    }
    if (!smsConsent) {
      return res.status(400).json({ ok: false, error: "TCPA consent attestation required for SMS" });
    }
  }

  // Token + URL
  const token = newToken();
  const inviteUrl = `${PUBLIC_INTAKE_BASE_URL}?advisor=${encodeURIComponent(userId)}&lang=${lang}&invite=${token}`;

  // Insert the invite row first (so we have a row to update with error / IDs)
  const { data: inserted, error: insertErr } = await admin
    .from("intake_invites")
    .insert({
      user_id: userId,
      token,
      prospect_name: prospectName || null,
      prospect_email: prospectEmail || null,
      prospect_phone: prospectPhone || null,
      lang,
      channel_email: channelEmail,
      channel_sms: channelSms,
      status: "sent"
    })
    .select("id")
    .single();

  if (insertErr || !inserted) {
    return res.status(500).json({ ok: false, error: `Failed to record invite: ${insertErr?.message || "unknown"}` });
  }
  const inviteId = inserted.id;

  // Log SMS consent attestation BEFORE sending the SMS
  if (channelSms && smsConsent) {
    await admin.from("sms_consent_log").insert({
      user_id: userId,
      prospect_name: prospectName || null,
      prospect_phone: prospectPhone,
      consent_method: "advisor_attestation",
      invite_id: inviteId,
      notes: "Advisor attested prior express consent via the send-intake-invite UI."
    });
  }

  const result = { ok: true, inviteId, inviteUrl, email: null, sms: null };
  let anyFail = false;

  // Email send
  if (channelEmail) {
    try {
      const { subject, text, html } = buildEmailBody(lang, prospectName, inviteUrl);
      const resend = new Resend(RESEND_API_KEY);
      const payload = {
        from: RESEND_FROM,
        to: [prospectEmail],
        subject,
        text,
        html
      };
      if (RESEND_REPLY_TO) payload.reply_to = RESEND_REPLY_TO;
      const r = await resend.emails.send(payload);
      if (r.error) {
        anyFail = true;
        result.email = { ok: false, error: r.error.message || "Resend error" };
        await admin.from("intake_invites").update({ send_error: result.email.error }).eq("id", inviteId);
      } else {
        result.email = { ok: true, messageId: r.data?.id || null };
        await admin.from("intake_invites").update({ resend_message_id: r.data?.id || null }).eq("id", inviteId);
      }
    } catch (e) {
      anyFail = true;
      result.email = { ok: false, error: String(e?.message || e) };
      await admin.from("intake_invites").update({ send_error: result.email.error }).eq("id", inviteId);
    }
  }

  // SMS send (only if TWILIO_ENABLED was checked above)
  if (channelSms) {
    const smsBody = buildSmsBody(lang, prospectName, inviteUrl);
    const r = await sendTwilioSms(prospectPhone, smsBody);
    if (!r.ok) {
      anyFail = true;
      result.sms = { ok: false, error: r.error };
      await admin.from("intake_invites").update({ send_error: r.error }).eq("id", inviteId);
    } else {
      result.sms = { ok: true, sid: r.sid };
      await admin.from("intake_invites").update({ twilio_sid: r.sid }).eq("id", inviteId);
    }
  }

  // If every selected channel failed, mark the invite as failed.
  if (anyFail) {
    const emailFail = channelEmail && !result.email?.ok;
    const smsFail = channelSms && !result.sms?.ok;
    if ((channelEmail && channelSms && emailFail && smsFail) ||
        (channelEmail && !channelSms && emailFail) ||
        (!channelEmail && channelSms && smsFail)) {
      await admin.from("intake_invites").update({ status: "failed" }).eq("id", inviteId);
      return res.status(502).json({ ok: false, ...result, error: "All selected channels failed" });
    }
  }

  return res.status(200).json(result);
}
