// api/linked-overview.js — MD-C Link-R (v0.76). The ONLY read path for a linked
// client into their advisor's record. Never a direct RLS SELECT (the advisor blob
// holds SSN/DOB/internal notes): the row is loaded service-role and passed through
// the SAME sanitize allow-list as the token portal (api/_sanitize.js).
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";
import { sanitizeClient } from "./_sanitize.js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).json({ ok: false, error: "POST only" });
  if (!SUPABASE_URL || !SERVICE_ROLE) return res.status(500).json({ ok: false, error: "server env missing" });

  const jwt = (req.headers.authorization || "").replace(/^Bearer\s+/i, "");
  if (!jwt) return res.status(401).json({ ok: false, error: "auth required" });
  const admin = createClient(SUPABASE_URL, SERVICE_ROLE, { auth: { persistSession: false } });
  const { data: userData, error: uErr } = await admin.auth.getUser(jwt);
  if (uErr || !userData?.user) return res.status(401).json({ ok: false, error: "invalid session" });
  const user = userData.user;

  const { data: links, error } = await admin.from("client_links").select("*")
    .eq("client_uid", user.id).eq("status", "accepted").limit(1);
  if (error) return res.status(500).json({ ok: false, error: error.message });
  if (!links?.length) return res.status(200).json({ ok: true, linked: false });
  const link = links[0];

  // the advisor's client row (clients.local_id with data->>id fallback, same as portal)
  let crow = null;
  const a = await admin.from("clients").select("data").eq("user_id", link.advisor_uid).eq("local_id", link.client_local_id).limit(1);
  if (a.data && a.data.length) crow = a.data[0];
  if (!crow) {
    const b = await admin.from("clients").select("data").eq("user_id", link.advisor_uid).filter("data->>id", "eq", link.client_local_id).limit(1);
    if (b.data && b.data.length) crow = b.data[0];
  }
  if (!crow) return res.status(404).json({ ok: false, error: "advisor record not found (it may have been deleted)" });

  // advisor branding (subset, same as resolve-portal)
  let advisor = null;
  try {
    const { data: srow } = await admin.from("settings").select("data").eq("user_id", link.advisor_uid).limit(1);
    const s = (srow && srow[0] && srow[0].data) || {};
    advisor = { name: s.advisorName || null, email: s.advisorEmail || null, phone: s.advisorPhone || null, companyName: s.companyName || null, logoLight: s.logoLight || null, logoDark: s.logoDark || null, referralContacts: Array.isArray(s.referralContacts) ? s.referralContacts : [] };
  } catch {}

  return res.status(200).json({ ok: true, linked: true, client: sanitizeClient(crow.data), advisor, linkedAt: link.accepted_at });
}
