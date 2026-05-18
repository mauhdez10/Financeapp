// api/resolve-intake-invite.js
// ============================================================================
// Resolves an invite token to prefill data for the PublicIntake form.
// Called anonymously from the public /intake page when ?invite=<token> is
// present in the URL. Marks the invite as opened on first read.
//
// We do NOT expose advisor identity, full invite row, or any internal data —
// only what the form needs to prefill.
//
// Env vars required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sha256(s) {
  return crypto.createHash("sha256").update(String(s || "")).digest("hex");
}

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Supabase env vars missing on server" });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const token = String(body.token || "").trim();
  if (!token || token.length > 64) {
    return res.status(400).json({ ok: false, error: "Invalid token" });
  }

  // Hash the requester IP for opened_ip_hash. Vercel sets x-forwarded-for.
  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim()
    || (req.socket?.remoteAddress || "");
  const ipHash = sha256(ip);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  try {
    const { data, error } = await admin.rpc("resolve_invite_token", { p_token: token, p_ip_hash: ipHash });
    if (error) {
      return res.status(500).json({ ok: false, error: error.message || "RPC failed" });
    }
    const row = Array.isArray(data) ? data[0] : data;
    if (!row) {
      return res.status(404).json({ ok: false, error: "Invite not found" });
    }
    if (row.expired) {
      return res.status(410).json({ ok: false, error: "Invite expired" });
    }
    if (row.status === "submitted") {
      return res.status(409).json({ ok: false, error: "Invite already submitted" });
    }
    return res.status(200).json({
      ok: true,
      advisorId: row.user_id,
      prospectName: row.prospect_name || "",
      prospectEmail: row.prospect_email || "",
      prospectPhone: row.prospect_phone || "",
      lang: row.lang || "en"
    });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
