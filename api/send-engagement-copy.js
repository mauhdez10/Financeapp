// api/send-engagement-copy.js
// ============================================================================
// Sends a copy of the signed engagement letter + intake summary to the prospect
// (with the advisor CC'd). Fires from the public intake right after submission.
//
// This is an UN-authenticated endpoint — anyone with a valid submissionId can
// trigger it once. We rate-limit by checking that the engagement-copy hasn't
// already been sent for this submission (via the submissions.engagement_emailed_at
// column added in the same migration). If it has, return 200 with a no-op.
//
// Env vars required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
//   RESEND_API_KEY
//   RESEND_FROM
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";

function htmlEscape(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
}

function fmtSig(sig) {
  if (!sig) return "—";
  if (typeof sig === "string") return sig.startsWith("data:") ? '<img src="' + sig + '" alt="signature" style="height:50px;max-width:240px"/>' : htmlEscape(sig);
  if (sig.kind === "typed" && sig.text) return '<span style="font-family:\'Brush Script MT\',cursive,serif;font-size:24px;font-style:italic;color:#0F172A">' + htmlEscape(sig.text) + '</span>';
  if (sig.kind === "drawn" && sig.dataUrl) return '<img src="' + sig.dataUrl + '" alt="signature" style="height:50px;max-width:240px"/>';
  return "—";
}

function fmtDate(iso, lang) {
  try {
    const d = iso ? new Date(iso) : new Date();
    return d.toLocaleDateString(lang === "es" ? "es-US" : "en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
  } catch { return ""; }
}

function buildHtml({ advisor, submission, lang }) {
  const data = submission.data || {};
  const fullName = [data.firstName, data.lastName].filter(Boolean).join(" ");
  const partnerName = data.householdType === "couple" ? [data.partnerFirst, data.partnerLast].filter(Boolean).join(" ") : "";
  const serviceName = data.selectedServiceId || "—";
  const engagement = data.engagementLetter || {};
  const sig1 = engagement.signature1;
  const sig2 = engagement.signature2;
  const signedAt = engagement.signedAt || submission.created_at;
  const today = fmtDate(signedAt, lang);
  const advisorName = advisor.advisorName || "Mauricio Hernandez";
  const advisorEmail = advisor.advisorEmail || "mauricio@goldenanchor.life";
  const firmName = advisor.companyName || "Golden Anchor Financial Planning & Wealth Management";

  const heading = lang === "es" ? "Copia de tu Carta de Compromiso" : "Your Engagement Letter — Copy";
  const intro = lang === "es"
    ? "Adjuntamos una copia de la carta de compromiso firmada. Tu asesor te contactará pronto."
    : "Below is a copy of your signed engagement letter. Your advisor will be in touch shortly.";
  const sincerely = lang === "es" ? "Atentamente," : "Sincerely,";

  return `<!doctype html>
<html><head><meta charset="utf-8"><title>${htmlEscape(heading)}</title></head>
<body style="margin:0;font-family:Georgia,serif;background:#F8FAFC;padding:24px 12px;color:#0F172A">
  <div style="max-width:640px;margin:0 auto;background:#FFFFFF;border:1px solid #E2E8F0;border-radius:12px;padding:32px 28px">
    <div style="text-align:center;margin-bottom:14px">
      <div style="font-size:36px;color:#C9A84C">⚓</div>
      <div style="font-family:'Newsreader',Georgia,serif;font-size:18px;color:#C9A84C;font-weight:500;letter-spacing:0.14em;text-transform:uppercase">${htmlEscape((advisor.companyName || "Golden Anchor"))}</div>
    </div>
    <div style="height:1px;width:60px;background:#C9A84C;margin:12px auto 18px"></div>
    <h1 style="font-family:'Newsreader',Georgia,serif;font-size:24px;font-style:italic;font-weight:500;color:#0D1B2A;text-align:center;margin:0 0 10px">${htmlEscape(heading)}</h1>
    <p style="text-align:center;font-size:13px;color:#475569;margin:0 0 22px">${htmlEscape(intro)}</p>
    <div style="font-size:13px;line-height:1.7;color:#0F172A">
      <p style="margin:0 0 6px;font-size:11px;color:#64748B;text-transform:uppercase;letter-spacing:0.04em">${htmlEscape(today)}</p>
      <p style="margin:0 0 14px"><strong>${lang === "es" ? "Estimado/a" : "Dear"} ${htmlEscape(fullName || "_______")}${partnerName ? " & " + htmlEscape(partnerName) : ""},</strong></p>
      <p style="margin:0 0 12px">${lang === "es"
        ? "Gracias por elegir " + htmlEscape(firmName) + ". Esta carta confirma los términos bajo los cuales le brindaremos servicios de coaching financiero educativo."
        : "Thank you for choosing " + htmlEscape(firmName) + ". This letter confirms the terms under which we will provide educational financial coaching services."}</p>
      <p style="margin:0 0 12px"><strong>${lang === "es" ? "Servicio seleccionado" : "Selected service"}:</strong> ${htmlEscape(serviceName)}</p>
      <p style="margin:0 0 12px">${lang === "es"
        ? "Le proporcionaremos orientación general sobre presupuestos, deudas, ahorros, metas y seguros. No proporcionamos asesoría de inversión, fiduciaria, fiscal o legal."
        : "We will provide general guidance on budgeting, debt, savings, goals, and insurance. We do not provide investment, fiduciary, tax, or legal advice."}</p>
      <p style="margin:0 0 12px">${lang === "es"
        ? "Su información permanece encriptada y solo es accedida por su asesor asignado. No la compartimos con terceros sin su consentimiento, excepto según lo exija la ley."
        : "Your information stays encrypted and is only accessed by your assigned advisor. We do not share it with third parties without your consent, except as required by law."}</p>
      <p style="margin:0 0 18px">${htmlEscape(sincerely)}</p>
    </div>
    <table style="width:100%;border-collapse:collapse;margin-top:20px;font-size:12px;border-top:2px solid #C9A84C;padding-top:14px">
      <tr>
        <td style="padding:12px 8px;vertical-align:top;border-bottom:1px solid #E2E8F0">
          <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;font-weight:700">${lang === "es" ? "Asesor" : "Advisor"}</div>
          <div style="margin-top:8px">${fmtSig({ kind: "typed", text: advisorName })}</div>
          <div style="margin-top:6px;font-size:11px;color:#475569">${htmlEscape(advisorName)} · ${htmlEscape(advisorEmail)}</div>
        </td>
        <td style="padding:12px 8px;vertical-align:top;border-bottom:1px solid #E2E8F0">
          <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;font-weight:700">${lang === "es" ? "Cliente" : "Client"}</div>
          <div style="margin-top:8px">${fmtSig(sig1)}</div>
          <div style="margin-top:6px;font-size:11px;color:#475569">${htmlEscape(fullName || "—")}</div>
        </td>
      </tr>
      ${partnerName ? `<tr><td colspan="2" style="padding:12px 8px;border-bottom:1px solid #E2E8F0">
        <div style="font-size:10px;color:#64748B;text-transform:uppercase;letter-spacing:0.04em;font-weight:700">${lang === "es" ? "Co-cliente" : "Co-client"}</div>
        <div style="margin-top:8px">${fmtSig(sig2)}</div>
        <div style="margin-top:6px;font-size:11px;color:#475569">${htmlEscape(partnerName)}</div>
      </td></tr>` : ""}
    </table>
  </div>
</body></html>`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE || !RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: "Missing server env vars" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const submissionId = body.submissionId ? String(body.submissionId).trim() : null;
  const inviteToken = body.inviteToken ? String(body.inviteToken).trim() : null;
  const lang = body.lang === "es" ? "es" : "en";

  // SECURITY: advisorId is intentionally NOT taken from the request body. A
  // caller who knows a submissionId could otherwise pass a *different*
  // advisor's id and cause that advisor to be CC'd + used for branding/reply-to
  // on a submission they don't own (cross-tenant PII leak). The authoritative
  // advisor is the submission row's own advisor_id, resolved after we load it.
  if (!submissionId && !inviteToken) return res.status(400).json({ ok: false, error: "submissionId or inviteToken required" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    // Find the submission. Prefer submissionId; fall back to looking up by invite_token.
    let submission;
    if (submissionId) {
      const r = await admin.from("intake_submissions").select("*").eq("id", submissionId).maybeSingle();
      submission = r.data;
    }
    if (!submission && inviteToken) {
      const r = await admin.from("intake_submissions").select("*").eq("invite_token", inviteToken).order("created_at", { ascending: false }).limit(1).maybeSingle();
      submission = r.data;
    }
    if (!submission) {
      return res.status(404).json({ ok: false, error: "Submission not found" });
    }
    // Authoritative advisor = the submission's owner, never a caller-supplied
    // value. This is the cross-tenant guard (see note above).
    const advisorId = submission.advisor_id ? String(submission.advisor_id) : null;
    if (!advisorId) {
      return res.status(422).json({ ok: false, error: "Submission has no owning advisor" });
    }
    // Idempotency — don't send twice.
    if (submission.engagement_emailed_at) {
      return res.status(200).json({ ok: true, skipped: "already-sent" });
    }

    // Fetch advisor settings for branding + reply-to.
    const sRow = await admin.from("settings").select("data").eq("user_id", advisorId).maybeSingle();
    const advisor = (sRow.data && sRow.data.data) || {};

    const data = submission.data || {};
    const prospectEmail = data.email;
    if (!prospectEmail) return res.status(400).json({ ok: false, error: "Submission has no prospect email" });

    const html = buildHtml({ advisor, submission, lang });
    const subject = lang === "es"
      ? "Tu carta de compromiso — Golden Anchor"
      : "Your engagement letter — Golden Anchor";

    const resend = new Resend(RESEND_API_KEY);
    const payload = {
      from: RESEND_FROM,
      to: [prospectEmail],
      subject,
      html
    };
    if (advisor.advisorEmail) {
      payload.cc = [advisor.advisorEmail];
      payload.reply_to = advisor.advisorEmail;
    }

    const r = await resend.emails.send(payload);
    if (r.error) {
      return res.status(502).json({ ok: false, error: r.error.message || "Resend error" });
    }

    // Mark as sent so we don't double-email.
    await admin.from("intake_submissions").update({ engagement_emailed_at: new Date().toISOString() }).eq("id", submission.id).catch(()=>{});

    return res.status(200).json({ ok: true, messageId: r.data?.id || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
