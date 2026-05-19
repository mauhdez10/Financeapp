// api/render-report-pdf.js
// ============================================================================
// Render Complete Report → PDF → email as attachment via Resend.
// v0.12.0 (Chat 10). Per WORKPLAN §3 Chat 10 + O-11 → approach (a) Puppeteer.
//
// Auth: same pattern as send-intake-invite.js (D-30). Caller passes the
//       advisor's Supabase JWT in Authorization: Bearer <token>. We verify
//       server-side, then use the service-role key to load that advisor's
//       one client row by local_id (or data->>id fallback) — RLS would also
//       allow it via the user's JWT but the service-role keeps the path
//       symmetric with send-intake-invite.js.
//
// Rendering: we build a self-contained printable HTML document from the
//       client's data (D-1 carve-out — no SPA, no React on the server),
//       Puppeteer that to PDF, and attach to a Resend email. Charts are
//       hand-rolled inline SVG (donut + bars). See O-11 — print HTML path.
//
// Env vars required:
//   SUPABASE_URL              — same as VITE_SUPABASE_URL
//   SUPABASE_SERVICE_ROLE_KEY — service_role secret
//   RESEND_API_KEY            — from Resend dashboard
//   RESEND_FROM               — verified sender, default
//                               "Golden Anchor <noreply@finance.goldenanchor.life>"
//   RESEND_REPLY_TO           — optional override for reply-to
//
// Vercel function config (vercel.json): maxDuration 30s, memory 1024MB.
//   Cold start with @sparticuz/chromium is ~2–4s, warm renders ~1s.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import chromium from "@sparticuz/chromium";
import puppeteer from "puppeteer-core";

export const config = {
  maxDuration: 30
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "";

// ── helpers ────────────────────────────────────────────────────────────────
function vEmail(s) {
  return typeof s === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}
function htmlEscape(s) {
  return String(s == null ? "" : s).replace(/[&<>"']/g, c => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[c]);
}
function fmtUSD(n) {
  const v = Number(n) || 0;
  const sign = v < 0 ? "-" : "";
  const abs = Math.abs(v);
  return sign + "$" + abs.toLocaleString("en-US", { maximumFractionDigits: 0 });
}
function sumStreams(arr) {
  if (!Array.isArray(arr)) return 0;
  return arr.reduce((s, x) => s + (Number(x?.amount) || 0), 0);
}
function safeArr(x) { return Array.isArray(x) ? x : []; }

// ── financial aggregates ───────────────────────────────────────────────────
// Mirrors the math the live App.jsx uses for Complete Report headers.
// We aim for the same numbers, not the same JSX.
function computeAggregates(client) {
  const income = sumStreams(client.incomeStreams);
  const bills = safeArr(client.bills).reduce((s, b) => s + (Number(b.amount) || 0), 0);
  const debt = safeArr(client.debts).reduce((s, d) => s + (Number(d.balance) || 0), 0);
  const debtMinPay = safeArr(client.debts).reduce((s, d) => s + (Number(d.minPayment) || 0), 0);
  // Assets: combine accounts + custom assets + savings + investments where present
  const accounts = safeArr(client.accounts).reduce((s, a) => s + (Number(a.balance) || 0), 0);
  const customAssets = safeArr(client.customAssets).reduce((s, a) => s + (Number(a.value) || 0), 0);
  const totalAssets = accounts + customAssets;
  const netWorth = totalAssets - debt;
  const netMonthly = income - bills - debtMinPay;
  return { income, bills, debt, debtMinPay, accounts, customAssets, totalAssets, netWorth, netMonthly };
}

// ── inline SVG charts ──────────────────────────────────────────────────────
// Hand-rolled, lightweight, no library. Match Golden Anchor palette.
const GOLD = "#C9A84C";
const POS = "#10B981";
const NEG = "#EF4444";
const BLUE = "#3B82F6";
const WARN = "#F59E0B";
const TEXT = "#0F172A";
const MUTED = "#64748B";
const BORDER = "#E2E8F0";

function donutSVG(parts, title) {
  // parts: [{label, value, color}]
  const total = parts.reduce((s, p) => s + Math.max(0, p.value), 0);
  if (total <= 0) return '';
  const cx = 90, cy = 90, r = 70, ir = 44;
  let angle = -Math.PI / 2;
  const arcs = [];
  parts.forEach(p => {
    const v = Math.max(0, p.value);
    if (v <= 0) return;
    const a2 = angle + (v / total) * Math.PI * 2;
    const large = (a2 - angle) > Math.PI ? 1 : 0;
    const x1 = cx + r * Math.cos(angle), y1 = cy + r * Math.sin(angle);
    const x2 = cx + r * Math.cos(a2), y2 = cy + r * Math.sin(a2);
    const xi1 = cx + ir * Math.cos(a2), yi1 = cy + ir * Math.sin(a2);
    const xi2 = cx + ir * Math.cos(angle), yi2 = cy + ir * Math.sin(angle);
    arcs.push(
      `<path d="M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} L ${xi1} ${yi1} A ${ir} ${ir} 0 ${large} 0 ${xi2} ${yi2} Z" fill="${p.color}" stroke="#fff" stroke-width="1.5"/>`
    );
    angle = a2;
  });
  const legend = parts.map(p => {
    const pct = total > 0 ? Math.round((Math.max(0, p.value) / total) * 100) : 0;
    return `<div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;font-size:10px;color:${MUTED}"><span style="width:10px;height:10px;background:${p.color};border-radius:2px;display:inline-block"></span><span style="flex:1">${htmlEscape(p.label)}</span><span style="color:${TEXT};font-weight:600">${pct}%</span></div>`;
  }).join("");
  return `
  <div style="display:flex;gap:18px;align-items:center;margin:14px 0">
    <svg width="180" height="180" viewBox="0 0 180 180" xmlns="http://www.w3.org/2000/svg">${arcs.join("")}</svg>
    <div style="flex:1;min-width:0">
      <div style="font-size:11px;font-weight:700;color:${TEXT};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${htmlEscape(title)}</div>
      ${legend}
    </div>
  </div>`;
}

function barCompareSVG(title, items) {
  // items: [{label, value, color}], drawn horizontally so labels fit
  if (!items.length) return '';
  const maxV = Math.max(1, ...items.map(i => Math.max(0, i.value)));
  const rowH = 24, pad = 4, w = 380;
  const rows = items.map((it, i) => {
    const y = i * rowH + pad;
    const bw = Math.max(2, (Math.max(0, it.value) / maxV) * (w - 130));
    return `
      <text x="0" y="${y + 14}" fill="${MUTED}" font-size="10">${htmlEscape(it.label)}</text>
      <rect x="110" y="${y + 4}" width="${bw}" height="14" fill="${it.color}" rx="3"/>
      <text x="${110 + bw + 6}" y="${y + 14}" fill="${TEXT}" font-size="10" font-weight="600">${fmtUSD(it.value)}</text>`;
  }).join("");
  const h = items.length * rowH + pad * 2;
  return `
  <div style="margin:14px 0">
    <div style="font-size:11px;font-weight:700;color:${TEXT};text-transform:uppercase;letter-spacing:0.06em;margin-bottom:8px">${htmlEscape(title)}</div>
    <svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${rows}</svg>
  </div>`;
}

// ── print HTML builder ─────────────────────────────────────────────────────
function buildPrintHTML(client, lang, advisor) {
  const isEs = lang === "es";
  const L = isEs ? {
    title: "Reporte Financiero Completo",
    preparedFor: "Preparado para",
    asOf: "Al",
    advisor: "Asesor",
    kpiIncome: "Ingreso/mes",
    kpiBills: "Gastos/mes",
    kpiDebt: "Deuda total",
    kpiNetWorth: "Patrimonio neto",
    kpiNetMonthly: "Flujo neto/mes",
    incomeHdr: "Ingresos",
    billsHdr: "Gastos mensuales",
    debtHdr: "Deudas",
    assetsHdr: "Activos",
    notesHdr: "Notas y metas",
    item: "Concepto",
    amount: "Monto",
    type: "Tipo",
    balance: "Saldo",
    minPay: "Pago mín.",
    interest: "Tasa",
    value: "Valor",
    incomeDist: "Distribución de ingresos",
    billsDist: "Distribución de gastos",
    debtBreakdown: "Resumen de deudas",
    snapshot: "Resumen financiero",
    goals: "Metas",
    shortTerm: "Corto plazo",
    midTerm: "Mediano plazo",
    longTerm: "Largo plazo",
    setbacks: "Obstáculos",
    general: "General",
    none: "—",
    disclaimer: "Este reporte es solo para fines educativos y de planeación. No constituye asesoría de inversión, fiscal o legal. Golden Anchor Financial Advisory — Mauricio Hernandez, MBA, FPWMP, FL0215.",
    pageOf: "Página"
  } : {
    title: "Complete Financial Report",
    preparedFor: "Prepared for",
    asOf: "As of",
    advisor: "Advisor",
    kpiIncome: "Income/mo",
    kpiBills: "Bills/mo",
    kpiDebt: "Total Debt",
    kpiNetWorth: "Net Worth",
    kpiNetMonthly: "Net/mo",
    incomeHdr: "Income",
    billsHdr: "Monthly Bills",
    debtHdr: "Debts",
    assetsHdr: "Assets",
    notesHdr: "Notes & Goals",
    item: "Item",
    amount: "Amount",
    type: "Type",
    balance: "Balance",
    minPay: "Min Pay",
    interest: "Rate",
    value: "Value",
    incomeDist: "Income breakdown",
    billsDist: "Bills breakdown",
    debtBreakdown: "Debt summary",
    snapshot: "Financial snapshot",
    goals: "Goals",
    shortTerm: "Short-term",
    midTerm: "Mid-term",
    longTerm: "Long-term",
    setbacks: "Setbacks",
    general: "General",
    none: "—",
    disclaimer: "This report is for educational and planning purposes only. It does not constitute investment, tax, or legal advice. Golden Anchor Financial Advisory — Mauricio Hernandez, MBA, FPWMP, FL0215.",
    pageOf: "Page"
  };

  const agg = computeAggregates(client);
  const today = new Date().toISOString().slice(0, 10);
  const advName = (advisor && advisor.name) ? String(advisor.name).slice(0, 120) : "Mauricio Hernandez";
  const advEmail = (advisor && advisor.email) ? String(advisor.email).slice(0, 200) : "mauricio@goldenanchor.life";
  const clientName = `${client.firstName || ""} ${client.lastName || ""}`.trim() + (client.partnerFirst ? ` & ${client.partnerFirst} ${client.partnerLast || ""}`.trim() : "");

  // ── Income table + donut
  const incomeRows = safeArr(client.incomeStreams).filter(s => Number(s.amount) > 0);
  const incomeColors = [GOLD, POS, BLUE, WARN, "#8B5CF6", "#EC4899", "#14B8A6"];
  const incomeChart = donutSVG(
    incomeRows.map((s, i) => ({ label: s.source || s.name || ("Source " + (i + 1)), value: Number(s.amount) || 0, color: incomeColors[i % incomeColors.length] })),
    L.incomeDist
  );
  const incomeTable = incomeRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:#F8FAFC;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.amount}</th></tr></thead>
      <tbody>${incomeRows.map(s => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(s.source || s.name || L.none)}</td><td style="padding:5px 8px;text-align:right;color:${POS};font-weight:600">${fmtUSD(s.amount)}</td></tr>`).join("")}
      <tr style="background:#F0FDF4"><td style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiIncome}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${POS}">${fmtUSD(agg.income)}</td></tr></tbody>
    </table>` : `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>`;

  // ── Bills table + donut
  const billRows = safeArr(client.bills).filter(b => Number(b.amount) > 0);
  const billColors = [NEG, WARN, BLUE, "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];
  const billsChart = donutSVG(
    billRows.map((b, i) => ({ label: b.name || b.category || ("Bill " + (i + 1)), value: Number(b.amount) || 0, color: billColors[i % billColors.length] })),
    L.billsDist
  );
  const billsTable = billRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:#F8FAFC;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.type}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.amount}</th></tr></thead>
      <tbody>${billRows.map(b => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(b.name || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${htmlEscape(b.category || b.type || "")}</td><td style="padding:5px 8px;text-align:right;color:${NEG};font-weight:600">${fmtUSD(b.amount)}</td></tr>`).join("")}
      <tr style="background:#FEF2F2"><td colspan="2" style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiBills}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${NEG}">${fmtUSD(agg.bills)}</td></tr></tbody>
    </table>` : `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>`;

  // ── Debts table + bar
  const debtRows = safeArr(client.debts).filter(d => Number(d.balance) > 0);
  const debtBar = debtRows.length ? barCompareSVG(L.debtBreakdown, debtRows.map((d, i) => ({
    label: d.name || ("Debt " + (i + 1)), value: Number(d.balance) || 0, color: NEG
  }))) : '';
  const debtsTable = debtRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:#F8FAFC;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.balance}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.minPay}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.interest}</th></tr></thead>
      <tbody>${debtRows.map(d => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(d.name || L.none)}</td><td style="padding:5px 8px;text-align:right;color:${NEG};font-weight:600">${fmtUSD(d.balance)}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${fmtUSD(d.minPayment)}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${d.interestRate != null ? (Number(d.interestRate).toFixed(2) + "%") : L.none}</td></tr>`).join("")}
      <tr style="background:#FEF2F2"><td style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiDebt}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${NEG}">${fmtUSD(agg.debt)}</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:${MUTED}">${fmtUSD(agg.debtMinPay)}</td><td></td></tr></tbody>
    </table>` : `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>`;

  // ── Assets summary
  const accountsRows = safeArr(client.accounts);
  const customRows = safeArr(client.customAssets);
  const assetsTable = (accountsRows.length || customRows.length) ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:#F8FAFC;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.type}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.value}</th></tr></thead>
      <tbody>
      ${accountsRows.map(a => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(a.name || a.label || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${htmlEscape(a.type || a.kind || "")}</td><td style="padding:5px 8px;text-align:right;color:${BLUE};font-weight:600">${fmtUSD(a.balance)}</td></tr>`).join("")}
      ${customRows.map(a => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(a.name || a.label || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${htmlEscape(a.type || a.kind || "")}</td><td style="padding:5px 8px;text-align:right;color:${BLUE};font-weight:600">${fmtUSD(a.value)}</td></tr>`).join("")}
      <tr style="background:#EFF6FF"><td colspan="2" style="padding:6px 8px;font-weight:700;color:${TEXT}">Total</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${BLUE}">${fmtUSD(agg.totalAssets)}</td></tr></tbody>
    </table>` : `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>`;

  // ── Notes
  const n = client.notes || {};
  const notesBlocks = [
    [L.goals, n.goals], [L.shortTerm, n.shortTerm], [L.midTerm, n.midTerm],
    [L.longTerm, n.longTerm], [L.setbacks, n.setbacks], [L.general, n.general]
  ].filter(([_, v]) => v && String(v).trim());
  const notesHTML = notesBlocks.length ? notesBlocks.map(([k, v]) =>
    `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${htmlEscape(k)}</div><div style="font-size:11px;color:${TEXT};line-height:1.55;white-space:pre-wrap">${htmlEscape(v)}</div></div>`
  ).join("") : `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>`;

  // ── KPI strip (Page 1 lead)
  const kpis = [
    { label: L.kpiIncome, value: fmtUSD(agg.income), color: POS },
    { label: L.kpiBills, value: fmtUSD(agg.bills), color: NEG },
    { label: L.kpiDebt, value: fmtUSD(agg.debt), color: NEG },
    { label: L.kpiNetWorth, value: fmtUSD(agg.netWorth), color: agg.netWorth >= 0 ? POS : NEG },
    { label: L.kpiNetMonthly, value: fmtUSD(agg.netMonthly), color: agg.netMonthly >= 0 ? POS : NEG }
  ];
  const kpiHTML = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:8px;margin:14px 0 6px">
      ${kpis.map(k => `
        <div style="background:#F8FAFC;border:1px solid ${BORDER};border-radius:6px;padding:8px 10px;text-align:left">
          <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${htmlEscape(k.label)}</div>
          <div style="font-size:14px;color:${k.color};font-weight:700">${k.value}</div>
        </div>`).join("")}
    </div>`;

  // ── Final HTML document
  return `<!DOCTYPE html><html lang="${isEs ? 'es' : 'en'}"><head><meta charset="utf-8"><title>${htmlEscape(L.title)}</title>
<style>
  @page { size: Letter; margin: 0.5in; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif; color: ${TEXT}; margin: 0; padding: 0; }
  h1, h2, h3, h4 { margin: 0; }
  .section { page-break-inside: avoid; margin-top: 18px; }
  .section-hdr { font-size: 13px; font-weight: 700; color: ${TEXT}; text-transform: uppercase; letter-spacing: 0.06em; padding-bottom: 6px; border-bottom: 2px solid ${GOLD}; margin-bottom: 8px; }
  .header-bar { display: flex; align-items: center; justify-content: space-between; padding-bottom: 12px; border-bottom: 1px solid ${BORDER}; }
  .brand { display:flex; align-items:center; gap:10px; }
  .brand-mark { font-size:28px; }
  .brand-name { font-family: Georgia, serif; font-size: 18px; color: ${GOLD}; font-weight: 700; }
  .brand-sub { font-size: 8px; color: ${MUTED}; letter-spacing: 0.2em; text-transform: uppercase; }
  .meta { font-size: 10px; color: ${MUTED}; text-align: right; line-height: 1.5; }
  .disclaimer { font-size: 8px; color: ${MUTED}; line-height: 1.5; border-top: 1px solid ${BORDER}; padding-top: 8px; margin-top: 20px; font-style: italic; }
  table { border-collapse: collapse; }
</style></head><body>

<div class="header-bar">
  <div class="brand">
    <div class="brand-mark">⚓</div>
    <div>
      <div class="brand-name">Golden Anchor</div>
      <div class="brand-sub">${isEs ? 'Asesoría Financiera' : 'Financial Advisory'}</div>
    </div>
  </div>
  <div class="meta">
    <div><strong>${htmlEscape(L.preparedFor)}:</strong> ${htmlEscape(clientName || L.none)}</div>
    <div><strong>${htmlEscape(L.asOf)}:</strong> ${today}</div>
    <div><strong>${htmlEscape(L.advisor)}:</strong> ${htmlEscape(advName)}</div>
  </div>
</div>

<div style="margin:14px 0 0">
  <div style="font-size:18px;font-weight:800;color:${TEXT}">${htmlEscape(L.title)}</div>
  <div style="font-size:11px;color:${MUTED};margin-top:2px">${htmlEscape(L.snapshot)}</div>
</div>

${kpiHTML}

<div class="section">
  <div class="section-hdr">💼 ${htmlEscape(L.incomeHdr)}</div>
  ${incomeChart}
  ${incomeTable}
</div>

<div class="section">
  <div class="section-hdr">💳 ${htmlEscape(L.billsHdr)}</div>
  ${billsChart}
  ${billsTable}
</div>

<div class="section">
  <div class="section-hdr">🏦 ${htmlEscape(L.debtHdr)}</div>
  ${debtBar}
  ${debtsTable}
</div>

<div class="section">
  <div class="section-hdr">📊 ${htmlEscape(L.assetsHdr)}</div>
  ${assetsTable}
</div>

<div class="section">
  <div class="section-hdr">📝 ${htmlEscape(L.notesHdr)}</div>
  ${notesHTML}
</div>

<div class="disclaimer">${htmlEscape(L.disclaimer)}<br>${htmlEscape(advName)} · <a href="mailto:${htmlEscape(advEmail)}" style="color:${GOLD}">${htmlEscape(advEmail)}</a></div>

</body></html>`;
}

// ── email body for the cover message (not the PDF) ─────────────────────────
function buildEmailBody(lang, message, advisor) {
  const advName = (advisor && advisor.name) ? String(advisor.name).slice(0, 120) : "Mauricio Hernandez";
  const advEmail = (advisor && advisor.email) ? String(advisor.email).slice(0, 200) : "mauricio@goldenanchor.life";
  const safeMsg = String(message || "").trim();
  const escMsg = htmlEscape(safeMsg).replace(/\n/g, "<br>");
  const isEs = lang === "es";
  const sigLine = isEs ? "Saludos," : "Best,";
  const subTxt = isEs ? "Asesoría Financiera" : "Financial Advisory";

  const text = `${safeMsg}

${sigLine}
${advName}
Golden Anchor Financial Advisory
${advEmail}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;line-height:1.55">
      <div style="text-align:center;padding:24px 0 16px;border-bottom:1px solid #E2E8F0">
        <div style="font-size:36px">⚓</div>
        <div style="font-family:Georgia,serif;font-size:22px;color:#B8860B;font-weight:700;margin-top:4px">Golden Anchor</div>
        <div style="font-size:10px;color:#64748B;letter-spacing:0.18em;margin-top:4px;text-transform:uppercase">${subTxt}</div>
      </div>
      <p>${escMsg}</p>
      <p style="margin-top:24px">${htmlEscape(sigLine)}<br><strong>${htmlEscape(advName)}</strong><br>Golden Anchor Financial Advisory<br><a href="mailto:${htmlEscape(advEmail)}" style="color:#B8860B">${htmlEscape(advEmail)}</a></p>
      <div style="border-top:1px solid #E2E8F0;margin-top:24px;padding-top:12px;font-size:10px;color:#94A3B8;text-align:center">
        ${isEs ? 'Adjunto: PDF del Reporte Completo.' : 'Attached: Complete Report PDF.'}
      </div>
    </div>`;
  return { text, html };
}

// ── Puppeteer launcher ─────────────────────────────────────────────────────
async function renderPDF(html) {
  const executablePath = await chromium.executablePath();
  const browser = await puppeteer.launch({
    args: chromium.args,
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: chromium.headless
  });
  try {
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: "networkidle0", timeout: 20000 });
    const pdf = await page.pdf({
      format: "Letter",
      printBackground: true,
      margin: { top: "0.5in", right: "0.5in", bottom: "0.5in", left: "0.5in" }
    });
    return pdf;
  } finally {
    await browser.close();
  }
}

// ── handler ────────────────────────────────────────────────────────────────
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ ok: false, error: "Method not allowed" });
  }
  if (!SUPABASE_URL || !SERVICE_ROLE) {
    return res.status(500).json({ ok: false, error: "Supabase env vars missing on server" });
  }
  if (!RESEND_API_KEY) {
    return res.status(500).json({ ok: false, error: "Resend env var missing on server" });
  }

  // Auth
  const authHeader = req.headers.authorization || "";
  const jwt = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : "";
  if (!jwt) return res.status(401).json({ ok: false, error: "Missing Authorization Bearer token" });

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

  // Body parse
  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  body = body || {};

  const clientId = String(body.clientId || "").trim();
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim().slice(0, 200) || "Your financial report";
  const message = String(body.message || "").slice(0, 4000);
  const lang = body.lang === "es" ? "es" : "en";
  const advisorName = String(body.advisorName || "").trim().slice(0, 120);
  const advisorEmail = String(body.advisorEmail || "").trim().slice(0, 200);

  if (!clientId) return res.status(400).json({ ok: false, error: "clientId required" });
  if (!vEmail(to)) return res.status(400).json({ ok: false, error: "Valid recipient email required" });

  // Load the client row owned by this advisor. Match local_id first, fallback to data->>id.
  let clientRow = null;
  try {
    const r1 = await admin.from("clients")
      .select("data")
      .eq("user_id", userId)
      .eq("local_id", clientId)
      .is("deleted_at", null)
      .limit(1);
    if (r1.error) {
      console.error("[render-pdf] client lookup error (local_id)", r1.error);
    } else if (r1.data && r1.data[0]) {
      clientRow = r1.data[0].data;
    }
    if (!clientRow) {
      const r2 = await admin.from("clients")
        .select("data")
        .eq("user_id", userId)
        .eq("data->>id", clientId)
        .is("deleted_at", null)
        .limit(1);
      if (r2.error) {
        console.error("[render-pdf] client lookup error (blob id)", r2.error);
      } else if (r2.data && r2.data[0]) {
        clientRow = r2.data[0].data;
      }
    }
  } catch (e) {
    console.error("[render-pdf] client lookup exception", e);
    return res.status(500).json({ ok: false, error: "Failed to load client" });
  }

  if (!clientRow) {
    return res.status(404).json({ ok: false, error: "Client not found" });
  }

  // Build HTML
  const advisor = { name: advisorName, email: advisorEmail };
  const html = buildPrintHTML(clientRow, lang, advisor);

  // Render PDF
  let pdfBuffer;
  try {
    pdfBuffer = await renderPDF(html);
  } catch (e) {
    console.error("[render-pdf] puppeteer error", e);
    return res.status(500).json({ ok: false, error: "PDF render failed: " + (e?.message || String(e)) });
  }

  // Filename
  const safeName = String((clientRow.firstName || "") + "-" + (clientRow.lastName || "")).replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 60) || "client";
  const today = new Date().toISOString().slice(0, 10);
  const filename = `golden-anchor-report-${safeName}-${today}.pdf`;

  // Send via Resend
  const { text, html: bodyHTML } = buildEmailBody(lang, message, advisor);
  try {
    const resend = new Resend(RESEND_API_KEY);
    const payload = {
      from: RESEND_FROM,
      to: [to],
      subject,
      text,
      html: bodyHTML,
      attachments: [{
        filename,
        content: Buffer.from(pdfBuffer).toString("base64")
      }]
    };
    if (RESEND_REPLY_TO) payload.reply_to = RESEND_REPLY_TO;
    // Also let the advisor's signature email be a fallback reply_to if RESEND_REPLY_TO isn't set
    if (!RESEND_REPLY_TO && advisorEmail && vEmail(advisorEmail)) {
      payload.reply_to = advisorEmail;
    }
    const r = await resend.emails.send(payload);
    if (r.error) {
      console.error("[render-pdf] resend error", r.error);
      return res.status(502).json({ ok: false, error: r.error.message || "Resend error" });
    }
    return res.status(200).json({
      ok: true,
      messageId: r.data?.id || null,
      filename,
      pdfBytes: pdfBuffer.length
    });
  } catch (e) {
    console.error("[render-pdf] send exception", e);
    return res.status(500).json({ ok: false, error: "Send failed: " + (e?.message || String(e)) });
  }
}
