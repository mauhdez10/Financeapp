// api/accept-link.js — MD-C Link-R (v0.76). Service-role-only acceptance.
// A logged-in CLIENT accepts an advisor's link invite:
//   1. token must be pending + unexpired
//   2. HARD REJECT unless the caller's auth email equals invited_email (design §L2)
//   3. the client's island (self-entered) data is snapshotted into the link row —
//      the advisor gets a review screen (owner answer 2); advisor row = source of truth
//   4. the link flips to accepted (client_uid set)
//   5. the advisor's portal tokens for this client record are auto-revoked (answer 5)
// Env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY.
import { createClient } from "@supabase/supabase-js";

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
  if ((user.user_metadata?.role || "") !== "client") return res.status(403).json({ ok: false, error: "client accounts only" });

  let body = req.body;
  if (typeof body === "string") { try { body = JSON.parse(body); } catch { body = {}; } }
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

  // snapshot the island self-profile for the advisor's review screen
  let island = null;
  try {
    const { data: own } = await admin.from("clients").select("data").eq("user_id", user.id).limit(1);
    if (own && own.length) island = own[0].data || null;
  } catch {}

  const { error: e2 } = await admin.from("client_links").update({
    client_uid: user.id, status: "accepted", accepted_at: new Date().toISOString(),
    island_snapshot: island,
  }).eq("id", link.id);
  if (e2) {
    // unique index trips when this account is already linked elsewhere (1:1 rule)
    const msg = /unique|duplicate/i.test(e2.message || "") ? "this account is already linked to an advisor" : e2.message;
    return res.status(400).json({ ok: false, error: msg });
  }

  // auto-revoke the advisor's share-portal tokens for this client record (answer 5)
  try {
    await admin.from("portal_links").update({ revoked: true })
      .eq("user_id", link.advisor_uid).eq("client_local_id", link.client_local_id).eq("revoked", false);
  } catch {}

  return res.status(200).json({ ok: true, advisorUid: link.advisor_uid });
}
