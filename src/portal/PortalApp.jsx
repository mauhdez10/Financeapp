// src/portal/PortalApp.jsx
// Client-facing portal. Mounted by main.jsx only on the /portal path, so the
// advisor app boot path is byte-for-byte unchanged. All data is RLS-gated; this
// UI is a foundation (v1 scope: view + edit own data + upload + message), to be
// refined visually after the owner reviews the spec.
//
// Brand: navy + gold editorial, via the existing colors_and_type.css variables.

import { useState, useEffect, useCallback } from "react";
import {
  portalConfigured, getSession, signIn, setPassword, requestReset, signOut,
  loadClientAccount, membershipStatus, getOwnData, updateOwnData,
  listMessages, sendMessage, listDocuments, startCheckout, openBillingPortal,
} from "./lib/portalClient.js";

const NAVY = "#0D1B2A", GOLD = "#C9A84C", CREAM = "#F1F5F9", INK = "#0D1B2A";
const card = { background: "#fff", border: "1px solid #e2dccb", borderRadius: 8, padding: 24 };
const btn = { background: GOLD, color: NAVY, border: "none", borderRadius: 6, padding: "10px 18px", fontWeight: 700, cursor: "pointer", minHeight: 44 };
const ghost = { background: "transparent", color: CREAM, border: "1px solid rgba(255,255,255,0.2)", borderRadius: 6, padding: "8px 14px", cursor: "pointer" };

export default function PortalApp() {
  const [booting, setBooting] = useState(true);
  const [session, setSession] = useState(null);
  const [account, setAccount] = useState(null);   // client_accounts row, or null
  const [status, setStatus] = useState({ active: false });
  const [tab, setTab] = useState("dashboard");

  const refresh = useCallback(async () => {
    const s = await getSession();
    setSession(s);
    if (s) {
      const a = await loadClientAccount();
      setAccount(a);
      if (a) setStatus(await membershipStatus());
    }
    setBooting(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  if (!portalConfigured()) return <Centered><NotConfigured /></Centered>;
  if (booting) return <Centered><div style={{ color: CREAM }}>Loading…</div></Centered>;

  // Not signed in → login / set-password / reset.
  if (!session) return <Centered><AuthCard onDone={refresh} /></Centered>;

  // Signed in but not a portal client (e.g. the advisor hit /portal).
  if (!account) return <Centered><NotAClient onSignOut={async () => { await signOut(); refresh(); }} /></Centered>;

  // Signed-in client without an active paid period → renew gate.
  const gated = !status.active;

  return (
    <div style={{ minHeight: "100vh", background: NAVY, color: CREAM, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>
      <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "18px 28px", borderBottom: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 22, color: GOLD }}>Golden Anchor</div>
        <button style={ghost} onClick={async () => { await signOut(); refresh(); }}>Sign out</button>
      </header>

      {gated
        ? <Centered><RenewGate /></Centered>
        : (
          <div style={{ display: "flex", gap: 0, maxWidth: 1100, margin: "0 auto", padding: "28px 20px" }}>
            <nav style={{ width: 200, flexShrink: 0, display: "flex", flexDirection: "column", gap: 4 }}>
              {[["dashboard", "Dashboard"], ["info", "My Info"], ["documents", "Documents"], ["messages", "Messages"], ["billing", "Billing"]].map(([k, label]) => (
                <button key={k} onClick={() => setTab(k)} style={{
                  textAlign: "left", padding: "10px 14px", borderRadius: 6, cursor: "pointer", border: "none",
                  background: tab === k ? "rgba(201,168,76,0.15)" : "transparent",
                  color: tab === k ? GOLD : "rgba(241,245,249,0.75)", fontWeight: tab === k ? 700 : 500,
                }}>{label}</button>
              ))}
            </nav>
            <main style={{ flex: 1, paddingLeft: 28 }}>
              {tab === "dashboard" && <Dashboard status={status} />}
              {tab === "info" && <MyInfo />}
              {tab === "documents" && <Documents />}
              {tab === "messages" && <Messages account={account} />}
              {tab === "billing" && <Billing status={status} />}
            </main>
          </div>
        )}
    </div>
  );
}

// --- shells ----------------------------------------------------------------
function Centered({ children }) {
  return <div style={{ minHeight: "100vh", background: NAVY, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif" }}>{children}</div>;
}
function NotConfigured() {
  return <div style={{ ...card, maxWidth: 440 }}>
    <h2 style={{ margin: 0, color: INK, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}>Portal not configured</h2>
    <p style={{ color: "#475569", fontSize: 14 }}>Supabase env vars are not set for this deployment. The advisor must configure the portal before clients can sign in.</p>
  </div>;
}
function NotAClient({ onSignOut }) {
  return <div style={{ ...card, maxWidth: 440 }}>
    <h2 style={{ margin: 0, color: INK, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}>No client portal access</h2>
    <p style={{ color: "#475569", fontSize: 14 }}>This account isn’t set up as a portal client. If you think this is a mistake, contact your advisor.</p>
    <button style={btn} onClick={onSignOut}>Sign out</button>
  </div>;
}

// --- auth ------------------------------------------------------------------
function AuthCard({ onDone }) {
  // signin | reset | setpw — init from the recovery hash without an effect.
  const [mode, setMode] = useState(() =>
    (typeof window !== "undefined" && window.location.hash.includes("type=recovery")) ? "setpw" : "signin");
  const [em, setEm] = useState(""); const [pw, setPw] = useState("");
  const [err, setErr] = useState(""); const [info, setInfo] = useState(""); const [busy, setBusy] = useState(false);

  const go = async () => {
    setErr(""); setInfo(""); setBusy(true);
    try {
      if (mode === "signin") {
        const r = await signIn(em, pw); if (!r.ok) { setErr(r.error); setBusy(false); return; } onDone();
      } else if (mode === "reset") {
        if (!em) { setErr("Email required."); setBusy(false); return; }
        const r = await requestReset(em); if (!r.ok) { setErr(r.error); setBusy(false); return; }
        setInfo("If that email has a portal account, a reset link is on its way."); setBusy(false);
      } else if (mode === "setpw") {
        if (!pw || pw.length < 8) { setErr("Password must be at least 8 characters."); setBusy(false); return; }
        const r = await setPassword(pw); if (!r.ok) { setErr(r.error); setBusy(false); return; }
        setInfo("Password set. Signing you in…"); setTimeout(onDone, 700);
      }
    } catch (e) { setErr(String(e?.message || e)); setBusy(false); }
  };

  const label = { display: "block", fontSize: 12, fontWeight: 600, color: "#475569", marginBottom: 6, textTransform: "uppercase", letterSpacing: "0.08em" };
  const input = { width: "100%", padding: "11px 13px", border: "1px solid #94a3b8", borderRadius: 6, fontSize: 15, marginBottom: 14, boxSizing: "border-box" };

  return <div style={{ ...card, maxWidth: 400, width: "100%" }}>
    <div style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 28, color: GOLD, marginBottom: 4 }}>Golden Anchor</div>
    <p style={{ color: "#475569", fontSize: 13, marginTop: 0, marginBottom: 20 }}>Client portal</p>
    {mode !== "setpw" && (<><label style={label}>Email</label><input style={input} type="email" value={em} onChange={e => setEm(e.target.value)} /></>)}
    {mode !== "reset" && (<><label style={label}>Password</label><input style={input} type="password" value={pw} onChange={e => setPw(e.target.value)} /></>)}
    {err && <div style={{ color: "#b91c1c", fontSize: 13, marginBottom: 12 }}>{err}</div>}
    {info && <div style={{ color: "#166534", fontSize: 13, marginBottom: 12 }}>{info}</div>}
    <button style={{ ...btn, width: "100%" }} disabled={busy} onClick={go}>
      {busy ? "…" : mode === "signin" ? "Sign in" : mode === "reset" ? "Send reset link" : "Set password"}
    </button>
    <div style={{ marginTop: 14, fontSize: 13 }}>
      {mode === "signin"
        ? <button onClick={() => setMode("reset")} style={linkBtn}>Forgot password?</button>
        : <button onClick={() => setMode("signin")} style={linkBtn}>← Back to sign in</button>}
    </div>
  </div>;
}
const linkBtn = { background: "none", border: "none", color: "#8a6d2e", cursor: "pointer", padding: 0, fontSize: 13, textDecoration: "underline" };

// --- gated screens ---------------------------------------------------------
function RenewGate() {
  const [busy, setBusy] = useState(false); const [err, setErr] = useState("");
  const checkout = async (plan) => {
    setBusy(true); setErr("");
    const r = await startCheckout(plan);
    if (r.url) { window.location.href = r.url; return; }
    setErr(r.error || "Billing isn’t configured yet. Please contact your advisor."); setBusy(false);
  };
  return <div style={{ ...card, maxWidth: 460 }}>
    <h2 style={{ margin: "0 0 6px", color: INK, fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic" }}>Your access has paused</h2>
    <p style={{ color: "#475569", fontSize: 14 }}>Your information is safe. To view your plan, upload documents, and message your advisor again, renew below.</p>
    {err && <div style={{ color: "#b91c1c", fontSize: 13, margin: "8px 0" }}>{err}</div>}
    <div style={{ display: "flex", gap: 10, marginTop: 10, flexWrap: "wrap" }}>
      <button style={btn} disabled={busy} onClick={() => checkout("monthly")}>Renew membership</button>
      <button style={{ ...btn, background: "transparent", color: "#8a6d2e", border: "1px solid #c9bfa4" }} disabled={busy} onClick={() => checkout("one_time")}>One-time session</button>
    </div>
  </div>;
}

function Dashboard({ status }) {
  const [data, setData] = useState(null);
  useEffect(() => { getOwnData().then(r => r.ok && setData(r.data)); }, []);
  return <div style={{ display: "grid", gap: 16 }}>
    <SectionTitle>Dashboard</SectionTitle>
    <div style={{ ...cardDark }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(241,245,249,0.6)" }}>Membership</div>
      <div style={{ fontSize: 18, fontWeight: 700, color: GOLD, marginTop: 4 }}>
        {status.active ? "Active" : "Paused"}{status.ends_at ? ` · renews/expires ${new Date(status.ends_at).toLocaleDateString()}` : ""}
      </div>
    </div>
    <div style={{ ...cardDark }}>
      <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.1em", color: "rgba(241,245,249,0.6)" }}>Your plan</div>
      <p style={{ color: "rgba(241,245,249,0.8)", fontSize: 14 }}>
        {data ? "Your latest plan and reports appear here. (Report rendering reuses the advisor report engine — wired in a later phase.)" : "Loading your information…"}
      </p>
    </div>
  </div>;
}

function MyInfo() {
  const [data, setData] = useState(null); const [saving, setSaving] = useState(false); const [msg, setMsg] = useState("");
  useEffect(() => { getOwnData().then(r => r.ok && setData(r.data || {})); }, []);
  const field = (k, label) => (
    <div style={{ marginBottom: 12 }}>
      <label style={{ display: "block", fontSize: 12, color: "rgba(241,245,249,0.6)", marginBottom: 4 }}>{label}</label>
      <input value={data?.[k] ?? ""} onChange={e => setData(d => ({ ...d, [k]: e.target.value }))}
        style={{ width: "100%", padding: "9px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: CREAM, boxSizing: "border-box" }} />
    </div>
  );
  const save = async () => {
    setSaving(true); setMsg("");
    const patch = {}; for (const k of ["firstName", "lastName", "email", "phone", "address", "city", "state", "zip"]) if (data?.[k] !== undefined) patch[k] = data[k];
    const r = await updateOwnData(patch);
    setMsg(r.ok ? "Saved." : (r.error || "Save failed.")); setSaving(false);
  };
  if (!data) return <Loading />;
  return <div>
    <SectionTitle>My Info</SectionTitle>
    <div style={{ ...cardDark, maxWidth: 520 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {field("firstName", "First name")}{field("lastName", "Last name")}
      </div>
      {field("email", "Email")}{field("phone", "Phone")}{field("address", "Address")}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: 12 }}>
        {field("city", "City")}{field("state", "State")}{field("zip", "ZIP")}
      </div>
      {msg && <div style={{ fontSize: 13, color: msg === "Saved." ? "#4ade80" : "#f87171", marginBottom: 10 }}>{msg}</div>}
      <button style={btn} disabled={saving} onClick={save}>{saving ? "Saving…" : "Save changes"}</button>
    </div>
  </div>;
}

function Documents() {
  const [docs, setDocs] = useState(null);
  useEffect(() => { listDocuments().then(setDocs); }, []);
  return <div>
    <SectionTitle>Documents</SectionTitle>
    <div style={{ ...cardDark }}>
      <p style={{ color: "rgba(241,245,249,0.8)", fontSize: 14, marginTop: 0 }}>Upload files to your advisor and download anything they’ve shared. (Upload + signed-URL download wired with the private Storage bucket in a later phase.)</p>
      {docs === null ? <Loading /> : docs.length === 0
        ? <p style={{ color: "rgba(241,245,249,0.5)", fontSize: 13 }}>No documents yet.</p>
        : <ul style={{ paddingLeft: 18, color: CREAM }}>{docs.map(d => <li key={d.id}>{d.filename} <span style={{ color: "rgba(241,245,249,0.5)" }}>· {d.uploaded_by}</span></li>)}</ul>}
    </div>
  </div>;
}

function Messages({ account }) {
  const [msgs, setMsgs] = useState(null); const [body, setBody] = useState("");
  const load = useCallback(() => listMessages().then(setMsgs), []);
  useEffect(() => { load(); }, [load]);
  const send = async () => {
    if (!body.trim() || !account) return;
    const r = await sendMessage(account.id, account.advisor_id, body.trim());
    if (r.ok) { setBody(""); load(); }
  };
  return <div>
    <SectionTitle>Messages</SectionTitle>
    <div style={{ ...cardDark }}>
      <div style={{ minHeight: 200, maxHeight: 360, overflowY: "auto", marginBottom: 12 }}>
        {msgs === null ? <Loading /> : msgs.length === 0
          ? <p style={{ color: "rgba(241,245,249,0.5)", fontSize: 13 }}>No messages yet. Say hello to your advisor.</p>
          : msgs.map(m => <div key={m.id} style={{ margin: "8px 0", textAlign: m.sender === "client" ? "right" : "left" }}>
            <span style={{ display: "inline-block", padding: "8px 12px", borderRadius: 10, fontSize: 14, background: m.sender === "client" ? "rgba(201,168,76,0.18)" : "rgba(255,255,255,0.06)", color: CREAM }}>{m.body}</span>
          </div>)}
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <input value={body} onChange={e => setBody(e.target.value)} onKeyDown={e => e.key === "Enter" && send()} placeholder="Write a message…"
          style={{ flex: 1, padding: "10px 12px", borderRadius: 6, border: "1px solid rgba(255,255,255,0.15)", background: "rgba(255,255,255,0.04)", color: CREAM }} />
        <button style={btn} onClick={send}>Send</button>
      </div>
    </div>
  </div>;
}

function Billing({ status }) {
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const manage = async () => {
    setBusy(true); setErr("");
    const r = await openBillingPortal();
    if (r.url) { window.location.href = r.url; return; }
    setErr(r.error || "Billing isn’t configured yet."); setBusy(false);
  };
  return <div>
    <SectionTitle>Billing</SectionTitle>
    <div style={{ ...cardDark, maxWidth: 460 }}>
      <div style={{ fontSize: 18, fontWeight: 700, color: GOLD }}>{status.active ? "Active membership" : "No active membership"}</div>
      {status.ends_at && <p style={{ color: "rgba(241,245,249,0.7)", fontSize: 14 }}>Current period ends {new Date(status.ends_at).toLocaleDateString()}.</p>}
      {err && <div style={{ color: "#f87171", fontSize: 13, margin: "8px 0" }}>{err}</div>}
      <button style={btn} disabled={busy} onClick={manage}>{busy ? "…" : "Manage billing"}</button>
    </div>
  </div>;
}

// --- bits ------------------------------------------------------------------
const cardDark = { background: "#1a2436", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 20 };
function SectionTitle({ children }) { return <h2 style={{ fontFamily: "'Newsreader', Georgia, serif", fontStyle: "italic", fontSize: 26, color: CREAM, margin: "0 0 16px" }}>{children}</h2>; }
function Loading() { return <div style={{ color: "rgba(241,245,249,0.5)", fontSize: 13 }}>Loading…</div>; }
