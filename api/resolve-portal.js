// api/resolve-portal.js
// ============================================================================
// Resolves a CLIENT PORTAL token to a SANITIZED, read-only snapshot of one
// client's financial data plus the advisor's public branding. Called
// anonymously from the public /portal page when ?token=<token> is present.
//
// Security model:
//   - Reads via the SERVICE-ROLE key (bypasses RLS) so the anon browser never
//     touches portal_links or clients directly.
//   - Sensitive fields (SSN/social, DOB, phone, address, internal notes,
//     recommendedBy) are stripped here, server-side, via an explicit allow-list.
//   - Token is single-purpose, revocable, and optionally expiring.
//
// Env vars required:
//   SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import crypto from "node:crypto";
import { checkRateLimit } from "./_ratelimit.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

function sha256(s) {
  return crypto.createHash("sha256").update(String(s || "")).digest("hex");
}

// Allow-list: only these top-level client fields ever reach the browser.
// Everything else (social/p1Social/p2Social, dob/p1Dob/p2Dob, phone/p1Phone,
// address, recommendedBy, raw notes, etc.) is dropped.
// v0.76 (MD-C): the allow-list moved to api/_sanitize.js — ONE security boundary
// shared with linked-overview.js. Comment above documents what gets dropped.
import { sanitizeClient } from "./_sanitize.js";

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
  if (!token || token.length > 128) {
    return res.status(400).json({ ok: false, error: "Invalid token" });
  }

  // Rate-limit per IP (fail-open if Upstash unconfigured) — blocks token enumeration.
  const rl = await checkRateLimit(req, "resolve-portal", { max: 40, window: "10 m" });
  if (!rl.ok) {
    return res.status(429).json({ ok: false, error: "Too many requests — please try again shortly." });
  }

  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim()
    || (req.socket?.remoteAddress || "");
  const ipHash = sha256(ip);

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });

  try {
    // 1) Look up the link by token.
    const { data: link, error: lerr } = await admin
      .from("portal_links")
      .select("id,user_id,client_local_id,revoked,expires_at,view_count,modules")
      .eq("token", token)
      .maybeSingle();
    if (lerr) return res.status(500).json({ ok: false, error: lerr.message || "Lookup failed" });
    if (!link) return res.status(404).json({ ok: false, error: "Portal link not found" });
    if (link.revoked) return res.status(410).json({ ok: false, error: "This portal link has been revoked." });
    if (link.expires_at && new Date(link.expires_at).getTime() < Date.now()) {
      return res.status(410).json({ ok: false, error: "This portal link has expired." });
    }

    // 2) Fetch the client. Match local_id, then fall back to data->>id (same as gaSaveClient).
    let crow = null;
    {
      const { data: byLocal } = await admin
        .from("clients").select("data")
        .eq("user_id", link.user_id).eq("local_id", link.client_local_id)
        .is("deleted_at", null).limit(1);
      crow = byLocal && byLocal[0];
      if (!crow) {
        const { data: byBlob } = await admin
          .from("clients").select("data")
          .eq("user_id", link.user_id).eq("data->>id", link.client_local_id)
          .is("deleted_at", null).limit(1);
        crow = byBlob && byBlob[0];
      }
    }
    if (!crow || !crow.data) {
      return res.status(404).json({ ok: false, error: "Client record not found." });
    }
    const client = sanitizeClient(crow.data);

    // 3) Advisor branding (curated whitelist).
    let advisor = null;
    let lang = "en";
    try {
      const { data: srow } = await admin.from("settings").select("data").eq("user_id", link.user_id).maybeSingle();
      const sd = (srow && srow.data) || {};
      lang = sd.lang === "es" ? "es" : "en";
      advisor = {
        advisorName:  sd.advisorName  || "",
        companyName:  sd.companyName  || "",
        advisorEmail: sd.advisorEmail || "",
        website:      sd.website      || "",
        ig:           sd.ig           || "",
        logoLight:    sd.logoLight    || "",
        logoDark:     sd.logoDark     || "",
        lightAccent:  sd.lightAccent  || "",
        darkAccent:   sd.darkAccent   || ""
      };
    } catch { advisor = null; }

    // 4) Best-effort view bookkeeping (never blocks the response).
    admin.from("portal_links").update({
      last_viewed_at: new Date().toISOString(),
      view_count: (link.view_count || 0) + 1,
      viewer_ip_hash: ipHash
    }).eq("id", link.id).then(() => {}, () => {});

    return res.status(200).json({ ok: true, client, advisor, lang, modules: link.modules || null });
  } catch (e) {
    return res.status(500).json({ ok: false, error: String(e?.message || e) });
  }
}
