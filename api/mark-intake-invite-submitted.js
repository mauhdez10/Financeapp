// api/mark-intake-invite-submitted.js
// ============================================================================
// Called by PublicIntake after a successful gaSubmitIntake() to link the
// invite to the new intake_submissions row and flip status to 'submitted'.
//
// Anonymous — the submitter has no auth context. RPC enforces token validity.
// ============================================================================

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

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
  const submissionId = String(body.submissionId || "").trim();
  if (!token || token.length > 64) return res.status(400).json({ ok: false, error: "Invalid token" });
  if (!submissionId) return res.status(400).json({ ok: false, error: "Missing submissionId" });

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  try {
    const { data, error } = await admin.rpc("mark_invite_submitted", { p_token: token, p_submission_id: submissionId });
    if (error) return res.status(500).json({ ok: false, error: error.message });
    return res.status(200).json({ ok: true, updated: data === true });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
