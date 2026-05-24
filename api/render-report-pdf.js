// api/render-report-pdf.js
// ============================================================================
// Render Complete Report → PDF → email as attachment via Resend.
// v0.12.2 (Chat 10 follow-up γ — full section parity + grey background).
// Per WORKPLAN §3 Chat 10 + O-11 → approach (a) Puppeteer (D-34).
//
// Auth: same pattern as send-intake-invite.js (D-30). Caller passes the
//       advisor's Supabase JWT in Authorization: Bearer <token>. We verify
//       server-side, then use the service-role key to load that advisor's
//       one client row by local_id (or data->>id fallback).
//
// Rendering: we build a self-contained printable HTML document from the
//       client's data (D-1 carve-out — no SPA, no React on the server),
//       Puppeteer that to PDF, and attach to a Resend email. Charts are
//       hand-rolled inline SVG (donut + bars). See O-11 — print HTML path.
//
// Chromium runtime (v0.12.1 spec — uses chromium-min for runtime download):
//   Uses @sparticuz/chromium-min instead of @sparticuz/chromium.
//   The chromium tarball is downloaded at runtime from the official GitHub
//   release URL (cached in /tmp between warm invocations). This keeps the
//   deployed function bundle small (~5MB) and avoids Vercel tracing issues.
//   First cold start downloads ~50MB once; warm starts use /tmp cache.
//
// v0.12.2 changes (Chat 10 follow-up γ):
//   - Fixed data extraction: income now reads .netMo + .amount fallback,
//     bills read both .name and .label, debts use .apr not .interestRate,
//     accounts/assets aggregates corrected to match App.jsx math.
//   - Added 5 missing sections: Investment Allocation, Financial Ratios,
//     Cash Flow Statement, Strategy Plan (Debt Payoff + Financial Roadmap +
//     Investment Projection), bringing email PDF to ~feature parity with the
//     on-screen print/save.
//   - Respects client.reportInclude toggle map — sections turned off in the
//     Complete Report UI won't appear in the PDF.
//   - Background changed from white to #F1F5F9 (matches app light-mode bg).
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
//   Cold start ~5-8s (tarball download), warm ~1s.
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { Resend } from "resend";
import chromium from "@sparticuz/chromium-min";
import puppeteer from "puppeteer-core";

// Pinned to match the chromium-min major. When bumping the npm package,
// bump this URL too — they must match. Sourced from the Sparticuz/chromium
// GitHub releases page; the URL is stable and CDN-fronted via GitHub's
// release assets.
const CHROMIUM_PACK_URL =
  "https://github.com/Sparticuz/chromium/releases/download/v140.0.0/chromium-v140.0.0-pack.x64.tar";

export const config = {
  maxDuration: 30
};

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;
const RESEND_API_KEY = process.env.RESEND_API_KEY;
const RESEND_FROM = process.env.RESEND_FROM || "Golden Anchor <noreply@finance.goldenanchor.life>";
const RESEND_REPLY_TO = process.env.RESEND_REPLY_TO || "";

// ── helpers (MIRROR App.jsx field names exactly, v0.12.5 data-extraction fix) ──
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
function fmtPct(n) {
  const v = Number(n) || 0;
  return v.toFixed(1) + "%";
}
function safeArr(x) { return Array.isArray(x) ? x : []; }

// ── Frequency table — MIRRORS App.jsx FREQ object exactly (line 121).
//    weekly: 52/12, biweekly: 26/12, semimonthly: 2/mo, monthly2: 1, annual: 1/12
const FREQ = { weekly: 52/12, biweekly: 26/12, semimonthly: 2, monthly2: 1, annual: 1/12 };
const toM = (a, f) => (Number(a) || 0) * (FREQ[f] ?? 1);

// ── Bills filter — only active bills count for monthly total. MIRRORS actB. ──
function actB(bills) {
  const t = new Date();
  return safeArr(bills).filter(b => {
    if (b.type === "temporary") return !b.maturity || new Date(b.maturity) > t;
    if (b.type === "annual") return b.dueMonth === t.getMonth() + 1;
    return true;
  });
}

// ── Card interest (mirrors cardMoInt) — used by effectiveMin ──
function cardMoInt(c) {
  const ps = safeArr(c.promos);
  const pb = ps.reduce((s, p) => s + (Number(p.balance) || 0), 0);
  const rb = Math.max(0, (Number(c.balance) || 0) - pb);
  return rb * (Number(c.apr) || 0) / 100 / 12 +
    ps.reduce((s, p) => s + (Number(p.balance) || 0) * (Number(p.rate) || 0) / 100 / 12, 0);
}

// ── Effective minimum payment per card (mirrors effectiveMin). ──
//    If c.min explicitly set → use it. Otherwise: max(25, balance*0.01 + monthly interest).
function effectiveMin(c) {
  const bal = Number(c.balance) || 0;
  if (bal <= 0) return 0;
  const minSet = Number(c.min) || 0;
  if (minSet > 0) return Math.min(bal, minSet);
  return Math.min(bal, Math.max(25, Math.round(bal * 0.01 + cardMoInt(c))));
}

// ── Account types considered "liquid" (mirrors ACCT_META.liquid). ──
const LIQUID_TYPES = new Set(["checking", "savings", "money_market"]);
const ACCT_LABELS = {
  checking: "Checking", savings: "Savings", money_market: "Money Market",
  retirement: "Retirement / 401k", ira: "IRA", brokerage: "Brokerage / Investment",
  other: "Other"
};
const ACCT_ICONS = {
  checking: "🏦", savings: "💵", money_market: "💰",
  retirement: "🎯", ira: "📊", brokerage: "📈", other: "💼"
};

// ── Financial aggregates — every formula mirrors the live App.jsx. ──
function computeAggregates(client) {
  // Income (net monthly): sum of toM(stream.net, stream.freq) across all streams
  const income = safeArr(client.incomeStreams).reduce((s, x) => s + toM(x.net, x.freq), 0);
  const grossIncome = safeArr(client.incomeStreams).reduce((s, x) => s + toM(x.gross, x.freq), 0);

  // Bills (monthly): sum of toM(bill.cost, bill.freq) across ACTIVE bills only
  const bills = actB(client.bills).reduce((s, b) => s + toM(b.cost, b.freq), 0);

  // Debt: cards + loans
  const cards = safeArr(client.cards);
  const loans = safeArr(client.loans);
  const cardsBal = cards.reduce((s, c) => s + (Number(c.balance) || 0), 0);
  const loansBal = loans.reduce((s, l) => s + (Number(l.balance) || 0), 0);
  const debt = cardsBal + loansBal;

  // Min payments (cards use effectiveMin; loans use their nominal min if set)
  const cardsMin = cards.reduce((s, c) => s + effectiveMin(c), 0);
  const loansMin = loans.reduce((s, l) => s + (Number(l.min) || 0), 0);
  const debtMinPay = cardsMin + loansMin;

  // Assets: accounts + (properties OR customAssets) + marketInvestments
  const accountsVal = safeArr(client.accounts).reduce((s, a) => s + (Number(a.value) || 0), 0);
  const properties = (client.properties && client.properties.length)
    ? client.properties
    : safeArr(client.customAssets);
  const propertiesVal = properties.reduce((s, a) => s + (Number(a.value) || 0), 0);
  const investmentsVal = safeArr(client.marketInvestments).reduce((s, i) => s + (Number(i.value) || 0), 0);
  const totalAssets = accountsVal + propertiesVal + investmentsVal;

  // Cash (liquid) accounts only — for emergency-fund calc
  const cashAccounts = safeArr(client.accounts)
    .filter(a => LIQUID_TYPES.has(a.type))
    .reduce((s, a) => s + (Number(a.value) || 0), 0);

  const netWorth = totalAssets - debt;
  const netMonthly = income - bills - debtMinPay;

  return {
    income, grossIncome, bills, debt, debtMinPay,
    cardsBal, loansBal, cardsMin, loansMin,
    accountsVal, propertiesVal, investmentsVal, totalAssets,
    cashAccounts, netWorth, netMonthly,
    cards, loans, properties
  };
}

// ── inline SVG charts ──────────────────────────────────────────────────────
// v0.50.0 — warm linen palette ported from preview/18-pdf-reports.html and
// the v0.45 in-app print stylesheet. Section headers use the deep-amber
// `#B8901E` instead of slate; page bg is warm linen `#FAFAF7`; pos/neg are
// the warmer variants (`#047857` / `#B91C1C`) seen on the design template.
const GOLD = "#C9A84C";       // brand gold — page rules, brand name underline
const GOLD_DEEP = "#B8901E";  // warm amber — section headers + KPI gold values
const POS = "#047857";        // deeper warm green (was #10B981)
const NEG = "#B91C1C";        // deeper warm red (was #EF4444)
const BLUE = "#3B82F6";
const WARN = "#B8901E";       // collapse warn into gold deep for warm palette
const TEXT = "#0F172A";
const MUTED = "#475569";      // slight warm-shift (was #64748B)
const BORDER = "#E2E8F0";
const PAGE_BG = "#FAFAF7";    // warm linen (was #F1F5F9)
const CARD_BG = "#FFFFFF";
const CHART_BG = "#F8F6EF";   // mini-chart cream wash
const CHART_BORDER = "#E8E2D0";

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
  // items: [{label, value, color}], drawn horizontally
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

// ── v0.40.0 — Account / loan color maps (mirror ACCT_META.c + LOAN_META.c) ──
const ACCT_COLORS = {
  checking: "#3B82F6", savings: "#06B6D4", money_market: "#14B8A6",
  retirement: "#8B5CF6", ira: "#7C3AED", brokerage: "#10B981", other: "#94A3B8"
};
const LOAN_COLORS = {
  vehicle: "#F97316", student: "#3B82F6", personal: "#8B5CF6",
  mortgage: "#059669", business: "#06B6D4", other: "#94A3B8"
};

// ── v0.40.0 — Waterfall: stepped Income → −Bills → −Debt Min → Net. ────────
function waterfallSVG(segments, w = 540, h = 180) {
  const segs = (segments || []).filter(s => s);
  if (!segs.length) return '';
  let cum = 0;
  const items = segs.map(s => {
    if (s.kind === 'total') {
      const v = s.value != null ? +s.value : cum;
      return { ...s, start: 0, end: v, delta: v, isTotal: true };
    }
    const v = +s.value || 0, start = cum, end = cum + v;
    cum = end;
    return { ...s, start, end, delta: v, isTotal: false };
  });
  const minV = Math.min(0, ...items.map(it => Math.min(it.start, it.end)));
  const maxV = Math.max(...items.map(it => Math.max(it.start, it.end)), 0);
  const range = Math.max(1, maxV - minV);
  const padT = 16, padB = 36, padL = 12, padR = 12;
  const innerW = w - padL - padR, innerH = h - padT - padB;
  const barW = Math.min(48, (innerW - (items.length - 1) * 8) / items.length);
  const yAt = v => padT + innerH * (1 - (v - minV) / range);
  const xAt = i => padL + (innerW - items.length * barW - (items.length - 1) * 8) / 2 + i * (barW + 8);
  const fmtDelta = d => (d >= 0 ? '+' : '') + (d >= 1000 || d <= -1000 ? Math.round(d / 1000) + 'K' : Math.round(d));
  const bars = items.map((it, i) => {
    const color = it.isTotal ? GOLD : (it.delta >= 0 ? (it.color || GOLD) : (it.color || "#ED7D31"));
    const y = it.isTotal ? yAt(Math.max(it.end, 0)) : Math.min(yAt(it.start), yAt(it.end));
    const ht = it.isTotal ? Math.abs(yAt(it.end) - yAt(0)) : Math.abs(yAt(it.end) - yAt(it.start));
    return `<rect x="${xAt(i)}" y="${y}" width="${barW}" height="${Math.max(1, ht)}" fill="${color}" rx="3"/><text x="${xAt(i) + barW / 2}" y="${h - 22}" text-anchor="middle" font-size="9" font-weight="600" fill="${MUTED}">${htmlEscape(it.label || '')}</text><text x="${xAt(i) + barW / 2}" y="${h - 9}" text-anchor="middle" font-size="9" fill="${MUTED}">${fmtDelta(it.delta)}</text>`;
  }).join('');
  const connectors = items.map((it, i) => {
    if (i === items.length - 1) return '';
    const x1 = xAt(i) + barW, x2 = xAt(i + 1);
    const yEnd = it.isTotal ? yAt(0) : yAt(it.end);
    return `<line x1="${x1}" y1="${yEnd}" x2="${x2}" y2="${yEnd}" stroke="${MUTED}" stroke-opacity="0.45" stroke-dasharray="2 3"/>`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg"><line x1="${padL}" y1="${yAt(0)}" x2="${w - padR}" y2="${yAt(0)}" stroke="${MUTED}" stroke-opacity="0.3" stroke-dasharray="3 3"/>${connectors}${bars}</svg>`;
}

// ── v0.40.0 — Treemap (squarified). Tiles sized by value, labels inside. ──
function treemapSVG(data, w = 420, h = 200) {
  const items = (data || []).filter(d => d && (+d.value || 0) > 0);
  if (items.length === 0) return '';
  const sorted = items.slice().sort((a, b) => (+b.value || 0) - (+a.value || 0));
  const total = sorted.reduce((s, d) => s + (+d.value || 0), 0) || 1;
  const scale = (w * h) / total;
  const worst = (row, short) => {
    if (!row.length) return Infinity;
    const sum = row.reduce((s, r) => s + r._a, 0);
    const ma = Math.max(...row.map(r => r._a));
    const mi = Math.min(...row.map(r => r._a));
    return Math.max((short * short * ma) / (sum * sum), (sum * sum) / (short * short * mi));
  };
  const layout = (rows, x, y, wd, ht) => {
    const out = []; let remaining = rows.slice();
    let cx = x, cy = y, cw = wd, ch = ht;
    while (remaining.length) {
      const short = Math.min(cw, ch);
      const row = [remaining.shift()];
      while (remaining.length) {
        const test = row.concat(remaining[0]);
        if (worst(test, short) >= worst(row, short)) break;
        row.push(remaining.shift());
      }
      const rowTotal = row.reduce((s, r) => s + r._a, 0);
      const rowLen = rowTotal / Math.max(1, short);
      if (cw >= ch) {
        let yy = cy;
        for (const r of row) { const hh = r._a / Math.max(1, rowLen); out.push({ ...r, x: cx, y: yy, w: rowLen, h: hh }); yy += hh; }
        cx += rowLen; cw -= rowLen;
      } else {
        let xx = cx;
        for (const r of row) { const ww = r._a / Math.max(1, rowLen); out.push({ ...r, x: xx, y: cy, w: ww, h: rowLen }); xx += ww; }
        cy += rowLen; ch -= rowLen;
      }
    }
    return out;
  };
  const tiles = layout(sorted.map(d => ({ ...d, _a: (+d.value || 0) * scale })), 0, 0, w, h);
  const fmtV = v => v >= 1e6 ? (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M' : v >= 1000 ? Math.round(v / 100) / 10 + 'K' : Math.round(v);
  const rects = tiles.map(t => {
    const color = t.color || GOLD;
    const labelFits = t.w > 56 && t.h > 28;
    const valFits = t.w > 56 && t.h > 44;
    const maxChars = Math.max(4, Math.floor(t.w / 7));
    const lbl = htmlEscape(String(t.label || t.name || '').slice(0, maxChars));
    return `<rect x="${t.x + 1}" y="${t.y + 1}" width="${Math.max(0, t.w - 2)}" height="${Math.max(0, t.h - 2)}" fill="${color}" fill-opacity="0.55" stroke="${color}" stroke-opacity="0.25" rx="3"/>${labelFits ? `<text x="${t.x + 8}" y="${t.y + 18}" font-size="11" font-weight="600" fill="#fff">${lbl}</text>` : ''}${valFits ? `<text x="${t.x + 8}" y="${t.y + 32}" font-size="10" fill="rgba(255,255,255,0.78)">$${fmtV(+t.value || 0)}</text>` : ''}`;
  }).join('');
  return `<svg width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" xmlns="http://www.w3.org/2000/svg">${rects}</svg>`;
}

// ── v0.40.0 — RadialGauge: 270° arc with target marker + threshold color. ──
function radialGaugeSVG(value, max, target, label, subLabel, color, size = 124, direction = 'higher', thresholds) {
  const v = +value || 0, mx = (+max) || 100;
  const pct = Math.max(0, Math.min(1, v / mx));
  const r = size / 2 - 10, cx = size / 2, cy = size / 2;
  const startA = Math.PI * 0.75, endA = Math.PI * 2.25;
  const arcPath = (a0, a1) => {
    const x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0);
    const x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    const large = a1 - a0 > Math.PI ? 1 : 0;
    return `M${x0} ${y0} A${r} ${r} 0 ${large} 1 ${x1} ${y1}`;
  };
  const fillA = startA + (endA - startA) * pct;
  const tgt = target != null ? Math.max(0, Math.min(1, (+target) / mx)) : null;
  let strokeColor = color;
  if (!strokeColor && thresholds) {
    const [good, warn] = thresholds;
    if (direction === 'higher') strokeColor = pct >= good ? POS : pct >= warn ? WARN : NEG;
    else strokeColor = pct <= good ? POS : pct <= warn ? WARN : NEG;
  }
  strokeColor = strokeColor || GOLD;
  let tickElem = '';
  if (tgt != null) {
    const a = startA + (endA - startA) * tgt;
    tickElem = `<line x1="${cx + (r - 9) * Math.cos(a)}" y1="${cy + (r - 9) * Math.sin(a)}" x2="${cx + (r + 9) * Math.cos(a)}" y2="${cy + (r + 9) * Math.sin(a)}" stroke="${TEXT}" stroke-width="1.5" stroke-opacity="0.5"/>`;
  }
  const valStr = direction === 'lower' ? v.toFixed(0) + '%' : (v >= 10 ? v.toFixed(0) + '%' : v.toFixed(1));
  return `<div style="position:relative;width:${size}px;height:${size}px;display:inline-block">
<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg"><path d="${arcPath(startA, endA)}" fill="none" stroke="${BORDER}" stroke-width="6" stroke-linecap="round" stroke-opacity="0.55"/><path d="${arcPath(startA, fillA)}" fill="none" stroke="${strokeColor}" stroke-width="6" stroke-linecap="round"/>${tickElem}</svg>
<div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;flex-direction:column;text-align:center"><div style="font-size:8px;color:${MUTED};letter-spacing:0.04em;text-transform:uppercase;font-weight:600;margin-bottom:2px">${htmlEscape(label || '')}</div><div style="font-size:${size <= 120 ? 14 : 17}px;color:${strokeColor};font-weight:700;font-family:'JetBrains Mono',monospace;line-height:1">${valStr}</div>${subLabel ? `<div style="font-size:8px;color:${MUTED};margin-top:3px">${htmlEscape(subLabel)}</div>` : ''}</div>
</div>`;
}

// ── v0.40.0 — Radar5: 5-axis polygon with rings + optional target overlay. ──
function radarSVG(axes, values, target, size = 220) {
  const safeAxes = (axes || []).slice(0, 5);
  if (safeAxes.length < 3) return '';
  const safeValues = (values || []).slice(0, safeAxes.length).map(v => Math.max(0, Math.min(1, +v || 0)));
  const cx = size / 2, cy = size / 2, r = size / 2 - 30;
  const angleAt = i => (-Math.PI / 2) + (2 * Math.PI * i / safeAxes.length);
  const pt = (val, i) => { const a = angleAt(i); return { x: cx + r * val * Math.cos(a), y: cy + r * val * Math.sin(a) }; };
  const ringLvls = [0.25, 0.5, 0.75, 1];
  const rings = ringLvls.map(lv => {
    const points = safeAxes.map((_, j) => { const p = pt(lv, j); return `${p.x},${p.y}`; }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="${BORDER}" stroke-opacity="${lv === 1 ? 0.6 : 0.3}" stroke-width="1" ${lv === 1 ? '' : 'stroke-dasharray="2 3"'}/>`;
  }).join('');
  const spokes = safeAxes.map((_, i) => { const p = pt(1, i); return `<line x1="${cx}" y1="${cy}" x2="${p.x}" y2="${p.y}" stroke="${BORDER}" stroke-opacity="0.3"/>`; }).join('');
  const targetPoly = target ? (() => {
    const points = safeAxes.map((_, i) => { const p = pt(target, i); return `${p.x},${p.y}`; }).join(' ');
    return `<polygon points="${points}" fill="none" stroke="${TEXT}" stroke-opacity="0.45" stroke-width="1.5" stroke-dasharray="3 3"/>`;
  })() : '';
  const valuePoly = (() => {
    const points = safeValues.map((v, i) => { const p = pt(v, i); return `${p.x},${p.y}`; }).join(' ');
    return `<polygon points="${points}" fill="${GOLD}" fill-opacity="0.18" stroke="${GOLD}" stroke-opacity="0.8" stroke-width="1.5"/>`;
  })();
  const dots = safeValues.map((v, i) => { const p = pt(v, i); return `<circle cx="${p.x}" cy="${p.y}" r="3" fill="${GOLD}"/>`; }).join('');
  const labels = safeAxes.map((ax, i) => {
    const p = pt(1.18, i);
    const isRight = p.x > cx + 5, isLeft = p.x < cx - 5;
    const anchor = isRight ? 'start' : isLeft ? 'end' : 'middle';
    return `<text x="${p.x}" y="${p.y + 3}" text-anchor="${anchor}" font-size="10" font-weight="600" fill="${MUTED}">${htmlEscape(ax)}</text>`;
  }).join('');
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" xmlns="http://www.w3.org/2000/svg" style="overflow:visible">${rings}${spokes}${targetPoly}${valuePoly}${dots}${labels}</svg>`;
}

// ── print HTML builder (extended with all sections) ────────────────────────
function buildPrintHTML(client, lang, advisor, include, reportType = "complete") {
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
    investAllocationHdr: "Asignación de inversión",
    financialRatiosHdr: "Ratios financieros",
    cashFlowHdr: "Estado de flujo de efectivo",
    strategyPlanHdr: "Plan estratégico",
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
    available: "Disponible",
    allocated: "Asignado",
    totalAssets: "Total activos",
    totalLiab: "Total pasivos",
    netWorth: "Patrimonio neto",
    liquidityRatio: "Liquidez",
    debtToAsset: "Deuda/Activos",
    emergencyFund: "Fondo emergencia",
    benchmark: "Objetivo",
    good: "Bueno",
    attention: "Atención",
    inflows: "Entradas",
    outflows: "Salidas",
    debtService: "Servicio deuda",
    operatingCF: "Flujo operativo",
    netCF: "Flujo neto",
    debtPayoffOrder: "Orden pago deudas",
    financialRoadmap: "Hoja de ruta financiera",
    investmentProjection: "Proyección inversión",
    phase1: "Fase 1 — Pagar deudas",
    phase2: "Fase 2 — Invertir y acumular",
    years: "años",
    growth: "crecimiento",
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
    investAllocationHdr: "Investment Allocation",
    financialRatiosHdr: "Financial Ratios",
    cashFlowHdr: "Cash Flow Statement",
    strategyPlanHdr: "Strategy Plan",
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
    available: "Available",
    allocated: "Allocated",
    totalAssets: "Total Assets",
    totalLiab: "Total Liabilities",
    netWorth: "Net Worth",
    liquidityRatio: "Liquidity Ratio",
    debtToAsset: "Debt-to-Asset",
    emergencyFund: "Emergency Fund Ratio",
    benchmark: "Benchmark",
    good: "Good",
    attention: "Attention",
    inflows: "Inflows",
    outflows: "Outflows",
    debtService: "Debt Service",
    operatingCF: "Operating Cash Flow",
    netCF: "Net Cash Flow",
    debtPayoffOrder: "Debt Payoff Order",
    financialRoadmap: "Financial Roadmap",
    investmentProjection: "Investment Projection",
    phase1: "Phase 1 — Pay Off All Debt",
    phase2: "Phase 2 — Invest & Build Wealth",
    years: "years",
    growth: "growth",
    disclaimer: "This report is for educational and planning purposes only. It does not constitute investment, tax, or legal advice. Golden Anchor Financial Advisory — Mauricio Hernandez, MBA, FPWMP, FL0215.",
    pageOf: "Page"
  };

  // reportInclude toggles (if not provided, show everything)
  const inc = include || {
    income: true, bills: true, debt: true, assets: true, notes: true,
    investAllocation: true, financialRatios: true, cashFlow: true, strategyPlan: true
  };

  // ── reportType routes which sections appear (v0.12.6). ───────────────────
  //    "complete"  → everything from inc (default)
  //    "monthly"   → cash-flow-style (income / bills / debt / accounts / notes)
  //    "financial" → balance-sheet-style (assets / financial ratios / cash-flow stmt / notes)
  // The L.title is also overridden so the document banner matches what the
  // advisor clicked from.
  if (reportType === "monthly") {
    inc.income = true; inc.bills = true; inc.debt = true; inc.assets = true; inc.notes = true;
    inc.investAllocation = false; inc.financialRatios = false; inc.cashFlow = false; inc.strategyPlan = false;
    L.title = isEs ? "Reporte Mensual" : "Monthly Report";
    L.snapshot = isEs ? "Resumen del mes" : "Monthly snapshot";
  } else if (reportType === "financial") {
    inc.income = false; inc.bills = false; inc.debt = false; inc.assets = true; inc.notes = true;
    inc.investAllocation = false; inc.financialRatios = true; inc.cashFlow = true; inc.strategyPlan = false;
    L.title = isEs ? "Estados Financieros" : "Financial Statements";
    L.snapshot = isEs ? "Balance, ingresos y flujo de efectivo" : "Balance sheet, income & cash flow";
  }
  // else: "complete" — keep defaults (L.title = "Complete Financial Report")

  const agg = computeAggregates(client);
  const today = new Date().toISOString().slice(0, 10);
  const advName = (advisor && advisor.name) ? String(advisor.name).slice(0, 120) : "Mauricio Hernandez";
  const advEmail = (advisor && advisor.email) ? String(advisor.email).slice(0, 200) : "mauricio@goldenanchor.life";
  const clientName = `${client.firstName || ""} ${client.lastName || ""}`.trim() + (client.partnerFirst ? ` & ${client.partnerFirst} ${client.partnerLast || ""}`.trim() : "");

  // ── Income table + donut
  const incomeRows = safeArr(client.incomeStreams).filter(s => toM(s.net, s.freq) > 0);
  const incomeColors = [GOLD, POS, BLUE, WARN, "#8B5CF6", "#EC4899", "#14B8A6"];
  const incomeChart = inc.income ? donutSVG(
    incomeRows.map((s, i) => ({ 
      label: s.label || s.source || s.name || ("Source " + (i + 1)), 
      value: toM(s.net, s.freq), 
      color: incomeColors[i % incomeColors.length] 
    })),
    L.incomeDist
  ) : '';
  const incomeTable = inc.income && incomeRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.amount}</th></tr></thead>
      <tbody>${incomeRows.map(s => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(s.label || s.source || s.name || L.none)}</td><td style="padding:5px 8px;text-align:right;color:${POS};font-weight:600">${fmtUSD(toM(s.net, s.freq))}</td></tr>`).join("")}
      <tr style="background:#F8F6EF"><td style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiIncome}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${POS}">${fmtUSD(agg.income)}</td></tr></tbody>
    </table>` : (inc.income ? `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>` : '');

  // ── Bills table + donut
  const billRows = actB(client.bills).filter(b => Number(b.cost) > 0);
  const billColors = [NEG, WARN, BLUE, "#8B5CF6", "#06B6D4", "#84CC16", "#F97316"];
  const billsChart = inc.bills ? donutSVG(
    billRows.map((b, i) => ({ 
      label: b.name || b.label || b.category || ("Bill " + (i + 1)), 
      value: toM(b.cost, b.freq), 
      color: billColors[i % billColors.length] 
    })),
    L.billsDist
  ) : '';
  const billsTable = inc.bills && billRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.type}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.amount}</th></tr></thead>
      <tbody>${billRows.map(b => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(b.name || b.label || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${b.dueDay ? ("Day " + b.dueDay) : htmlEscape(b.type || "")}</td><td style="padding:5px 8px;text-align:right;color:${NEG};font-weight:600">${fmtUSD(toM(b.cost, b.freq))}</td></tr>`).join("")}
      <tr style="background:#F8F6EF"><td colspan="2" style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiBills}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${NEG}">${fmtUSD(agg.bills)}</td></tr></tbody>
    </table>` : (inc.bills ? `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>` : '');

  // ── Debts table + bar
  const debtRows = [
    ...safeArr(client.cards).map(c => ({ ...c, _isCard: true })),
    ...safeArr(client.loans).map(l => ({ ...l, _isCard: false }))
  ].filter(d => Number(d.balance) > 0);
  const debtBar = inc.debt && debtRows.length ? barCompareSVG(L.debtBreakdown, debtRows.map((d, i) => ({
    label: d.name || d.label || ("Debt " + (i + 1)), value: Number(d.balance) || 0, color: NEG
  }))) : '';
  const debtsTable = inc.debt && debtRows.length ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.balance}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.minPay}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.interest}</th></tr></thead>
      <tbody>${debtRows.map(d => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(d.name || d.label || L.none)}</td><td style="padding:5px 8px;text-align:right;color:${NEG};font-weight:600">${fmtUSD(d.balance)}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${fmtUSD(d._isCard ? effectiveMin(d) : (Number(d.min) || 0))}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${d.apr != null ? fmtPct(d.apr) : L.none}</td></tr>`).join("")}
      <tr style="background:#F8F6EF"><td style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.kpiDebt}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${NEG}">${fmtUSD(agg.debt)}</td><td style="padding:6px 8px;text-align:right;font-weight:600;color:${MUTED}">${fmtUSD(agg.debtMinPay)}</td><td></td></tr></tbody>
    </table>` : (inc.debt ? `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>` : '');

  // ── Assets summary (v0.40.0 — paired Asset/Liability Treemap above the tables)
  const accountsRows = safeArr(client.accounts);
  const customRows = safeArr(client.customAssets);
  const miRows = safeArr(client.marketInvestments);
  const assetTM = [
    ...accountsRows.map(a => ({ label: (ACCT_ICONS[a.type] || "💼") + " " + (a.name || ""), value: +a.value || 0, color: ACCT_COLORS[a.type] || "#94A3B8" })),
    ...customRows.map(a => ({ label: "🏛️ " + (a.name || ""), value: +a.value || 0, color: "#059669" })),
    ...miRows.map(a => ({ label: "📈 " + (a.ticker || a.name || ""), value: +a.value || 0, color: "#10B981" })),
  ].filter(d => d.value > 0);
  const liabTM = [
    ...safeArr(client.cards).map(c => ({ label: "💳 " + (c.name || ""), value: +c.balance || 0, color: "#EF4444" })),
    ...safeArr(client.loans).map(l => ({ label: "🏦 " + (l.name || ""), value: +l.balance || 0, color: LOAN_COLORS[l.type] || "#F97316" })),
  ].filter(d => d.value > 0);
  const balanceTreemapsHTML = inc.assets && (assetTM.length || liabTM.length) ? `
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:12px">
      <div style="background:#fff;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:9px;color:${POS};text-transform:uppercase;letter-spacing:0.05em;font-weight:700">🗺️ ${isEs?'Mapa de Activos':'Asset Map'}</div>
          <div style="font-size:10px;color:${MUTED};font-family:'JetBrains Mono',monospace">${fmtUSD(agg.totalAssets)}</div>
        </div>
        ${assetTM.length ? treemapSVG(assetTM, 280, 180) : `<div style="padding:24px;font-size:10px;color:${MUTED};font-style:italic;text-align:center">${isEs?'Sin activos':'No assets'}</div>`}
      </div>
      <div style="background:#fff;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px">
          <div style="font-size:9px;color:${NEG};text-transform:uppercase;letter-spacing:0.05em;font-weight:700">🗺️ ${isEs?'Mapa de Pasivos':'Liability Map'}</div>
          <div style="font-size:10px;color:${MUTED};font-family:'JetBrains Mono',monospace">${fmtUSD(agg.debt)}</div>
        </div>
        ${liabTM.length ? treemapSVG(liabTM, 280, 180) : `<div style="padding:24px;font-size:10px;color:${MUTED};font-style:italic;text-align:center">${isEs?'Sin deudas':'Debt-free.'}</div>`}
      </div>
    </div>` : '';
  const assetsTable = inc.assets && (accountsRows.length || customRows.length) ? `
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:6px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.type}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.value}</th></tr></thead>
      <tbody>
      ${accountsRows.map(a => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${(ACCT_ICONS[a.type] || "💼") + " " + htmlEscape(a.name || a.label || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${htmlEscape(ACCT_LABELS[a.type] || a.type || "")}</td><td style="padding:5px 8px;text-align:right;color:${BLUE};font-weight:600">${fmtUSD(a.value)}</td></tr>`).join("")}
      ${customRows.map(a => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(a.name || a.label || L.none)}</td><td style="padding:5px 8px;color:${MUTED}">${htmlEscape(a.type || a.kind || "")}</td><td style="padding:5px 8px;text-align:right;color:${BLUE};font-weight:600">${fmtUSD(a.value)}</td></tr>`).join("")}
      <tr style="background:#F8F6EF"><td colspan="2" style="padding:6px 8px;font-weight:700;color:${TEXT}">Total</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${BLUE}">${fmtUSD(agg.totalAssets)}</td></tr></tbody>
    </table>` : (inc.assets ? `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>` : '');

  // ── Notes
  const n = client.notes || {};
  const notesBlocks = [
    [L.goals, n.goals], [L.shortTerm, n.shortTerm], [L.midTerm, n.midTerm],
    [L.longTerm, n.longTerm], [L.setbacks, n.setbacks], [L.general, n.general]
  ].filter(([_, v]) => v && String(v).trim());
  const notesHTML = inc.notes && notesBlocks.length ? notesBlocks.map(([k, v]) =>
    `<div style="margin-bottom:10px"><div style="font-size:10px;font-weight:700;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${htmlEscape(k)}</div><div style="font-size:11px;color:${TEXT};line-height:1.55;white-space:pre-wrap">${htmlEscape(v)}</div></div>`
  ).join("") : (inc.notes ? `<div style="font-size:10px;color:${MUTED};font-style:italic">${L.none}</div>` : '');

  // ── Investment Allocation (mirrors client.alloc + client.committed structure)
  const ALLOC_LABELS = { stocks: "📈 Stocks", retirement: "🎯 Retirement", realEstate: "🏠 Real Estate", savings: "🏦 Savings", vacation: "✈️ Vacation", other: "💡 Other", debtRepayment: "💳 Debt Repayment" };
  const ALLOC_LABELS_ES = { stocks: "📈 Acciones", retirement: "🎯 Jubilación", realEstate: "🏠 Bienes Raíces", savings: "🏦 Ahorros", vacation: "✈️ Vacaciones", other: "💡 Otro", debtRepayment: "💳 Pago de Deuda" };
  const allocSrc = client.alloc || {};
  const committedSrc = client.committed || {};
  const ALL_KEYS = ["stocks", "retirement", "realEstate", "savings", "vacation", "other", "debtRepayment"];
  const allocEntries = ALL_KEYS
    .filter(k => Number(allocSrc[k]) > 0)
    .map(k => [k, { pct: Number(allocSrc[k]), label: (isEs ? ALLOC_LABELS_ES : ALLOC_LABELS)[k] || k, committed: !!committedSrc[k] }]);
  const allocTotal = allocEntries.reduce((s, [_, v]) => s + Number(v.pct), 0);
  const investAllocHTML = inc.investAllocation && allocEntries.length ? `
    <div style="font-size:10px;color:${MUTED};margin-bottom:6px">${L.available}: ${fmtUSD(Math.max(0, agg.netMonthly))}/mo</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">%</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.amount}</th></tr></thead>
      <tbody>
      ${allocEntries.map(([k, v]) => {
        const amt = (Number(v.pct) / 100) * Math.max(0, agg.netMonthly);
        return `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(v.label || k)}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${fmtPct(v.pct)}</td><td style="padding:5px 8px;text-align:right;color:${BLUE};font-weight:600">${fmtUSD(amt)}</td></tr>`;
      }).join("")}
      <tr style="background:#F8F6EF"><td style="padding:6px 8px;font-weight:700;color:${TEXT}">${L.allocated}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${allocTotal > 100 ? NEG : TEXT}">${fmtPct(allocTotal)}</td><td style="padding:6px 8px;text-align:right;font-weight:700;color:${BLUE}">${fmtUSD((allocTotal / 100) * Math.max(0, agg.netMonthly))}</td></tr>
      </tbody>
    </table>` : '';

  // ── Financial Ratios (v0.40.0 — adds 3 Radial Gauges + 5-axis Radar)
  const liquidityRatio = agg.bills > 0 ? (agg.cashAccounts / agg.bills).toFixed(2) : 0;
  const debtToAsset = agg.totalAssets > 0 ? ((agg.debt / agg.totalAssets) * 100).toFixed(0) : 0;
  const emergencyFundMo = agg.bills > 0 ? (agg.cashAccounts / agg.bills).toFixed(1) : 0;
  // v0.40.0 — health metrics for gauges + radar
  const dsrPct = agg.income > 0 ? (agg.debtMinPay / agg.income) * 100 : 0;
  const srPct = agg.income > 0 ? (Math.max(0, agg.netMonthly) / agg.income) * 100 : 0;
  const efMo = +emergencyFundMo;
  const dtaPct = +debtToAsset;
  const radarVals = [
    Math.max(0, Math.min(1, 1 - (dsrPct / 50))),
    Math.max(0, Math.min(1, srPct / 25)),
    Math.max(0, Math.min(1, efMo / 6)),
    Math.max(0, Math.min(1, 1 - (dtaPct / 80))),
    Math.max(0, Math.min(1, agg.income > 0 ? (agg.netMonthly / agg.income) / 0.1 : 0)),
  ];
  const radarAxes = isEs ? ["DSR","Ahorro","EF","D/A","Flujo"] : ["DSR","Savings","EF","D/A","Cash"];
  const financialRatiosHTML = inc.financialRatios ? `
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;margin:10px 0">
      <div style="background:transparent;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${L.totalAssets}</div>
        <div style="font-size:16px;color:${BLUE};font-weight:700">${fmtUSD(agg.totalAssets)}</div>
      </div>
      <div style="background:transparent;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${L.totalLiab}</div>
        <div style="font-size:16px;color:${NEG};font-weight:700">${fmtUSD(agg.debt)}</div>
      </div>
      <div style="background:transparent;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${L.netWorth}</div>
        <div style="font-size:16px;color:${agg.netWorth >= 0 ? POS : NEG};font-weight:700">${fmtUSD(agg.netWorth)}</div>
      </div>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:14px">
      <div style="background:#fff;border:1px solid ${BORDER};border-radius:6px;padding:10px">
        <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:8px;font-weight:600">${isEs?'Indicadores de Salud':'Health Gauges'}</div>
        <div style="display:flex;justify-content:space-around;align-items:flex-start;gap:6px">
          ${radialGaugeSVG(dsrPct, 60, 36, "DSR", isEs?"≤ 36%":"≤ 36%", null, 116, "lower", [0.6, 0.83])}
          ${radialGaugeSVG(srPct, 40, 20, isEs?"Ahorro":"Savings", "≥ 20%", null, 116, "higher", [0.5, 0.25])}
          ${radialGaugeSVG(efMo, 12, 3, isEs?"Meses EF":"EF Months", "3-6", null, 116, "higher", [0.25, 0.125])}
        </div>
      </div>
      <div style="background:#fff;border:1px solid ${BORDER};border-radius:6px;padding:10px;text-align:center">
        <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:4px;font-weight:600">${isEs?'Puntaje de Salud':'Health Score'}</div>
        ${radarSVG(radarAxes, radarVals, 0.8, 200)}
      </div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:10px;margin-top:14px">
      <tbody>
      <tr style="border-bottom:1px solid ${BORDER}"><td style="padding:8px;color:${TEXT}">${L.liquidityRatio}</td><td style="padding:8px;text-align:right;color:${MUTED}">${L.benchmark}: &gt; 1.0x</td><td style="padding:8px;text-align:right;font-weight:700;color:${liquidityRatio >= 1 ? POS : WARN}">${liquidityRatio}x</td><td style="padding:8px;text-align:right;font-size:9px;color:${liquidityRatio >= 1 ? POS : WARN}">${liquidityRatio >= 1 ? L.good : L.attention}</td></tr>
      <tr style="border-bottom:1px solid ${BORDER}"><td style="padding:8px;color:${TEXT}">${L.debtToAsset}</td><td style="padding:8px;text-align:right;color:${MUTED}">${L.benchmark}: &lt; 40%</td><td style="padding:8px;text-align:right;font-weight:700;color:${debtToAsset < 40 ? POS : WARN}">${debtToAsset}%</td><td style="padding:8px;text-align:right;font-size:9px;color:${debtToAsset < 40 ? POS : WARN}">${debtToAsset < 40 ? L.good : L.attention}</td></tr>
      <tr><td style="padding:8px;color:${TEXT}">${L.emergencyFund}</td><td style="padding:8px;text-align:right;color:${MUTED}">${L.benchmark}: &gt; 6 mo</td><td style="padding:8px;text-align:right;font-weight:700;color:${emergencyFundMo >= 6 ? POS : WARN}">${emergencyFundMo} mo</td><td style="padding:8px;text-align:right;font-size:9px;color:${emergencyFundMo >= 6 ? POS : WARN}">${emergencyFundMo >= 6 ? L.good : L.attention}</td></tr>
      </tbody>
    </table>` : '';

  // ── Cash Flow Statement (v0.40.0 — Waterfall at the top)
  const wfSegments = [
    { label: isEs?"Ingreso":"Income", value: agg.income, color: POS },
    { label: isEs?"Gastos":"Bills", value: -agg.bills, color: NEG },
    { label: isEs?"Pago Mín":"Debt Min", value: -agg.debtMinPay, color: "#ED7D31" },
    { label: isEs?"Neto":"Net", kind: "total", value: agg.netMonthly, color: GOLD },
  ];
  const cashFlowHTML = inc.cashFlow ? `
    ${agg.income > 0 ? `<div style="margin:10px 0 14px;background:#fff;border:1px solid ${BORDER};border-radius:6px;padding:10px;text-align:center">
      <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px;font-weight:600">${isEs?'Cascada de Flujo Mensual':'Monthly Cash Flow Waterfall'}</div>
      ${waterfallSVG(wfSegments, 540, 180)}
    </div>` : ''}
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px;margin:10px 0">
      <div>
        <div style="font-size:11px;font-weight:700;color:${POS};margin-bottom:6px">💰 ${L.inflows}</div>
        <div style="font-size:10px;color:${MUTED};margin-bottom:3px">${L.incomeHdr}: ${fmtUSD(agg.income)}/mo</div>
        <div style="font-size:12px;font-weight:700;color:${TEXT};margin-top:6px;padding-top:6px;border-top:1px solid ${BORDER}">Total ${L.inflows}: ${fmtUSD(agg.income)}/mo</div>
      </div>
      <div>
        <div style="font-size:11px;font-weight:700;color:${NEG};margin-bottom:6px">💸 ${L.outflows}</div>
        <div style="font-size:10px;color:${MUTED};margin-bottom:3px">${L.billsHdr}: ${fmtUSD(agg.bills)}/mo</div>
        <div style="font-size:10px;color:${MUTED};margin-bottom:3px">${L.debtService}: ${fmtUSD(agg.debtMinPay)}/mo</div>
        <div style="font-size:12px;font-weight:700;color:${TEXT};margin-top:6px;padding-top:6px;border-top:1px solid ${BORDER}">Total ${L.outflows}: ${fmtUSD(agg.bills + agg.debtMinPay)}/mo</div>
      </div>
    </div>
    <div style="background:#F8F6EF;border:1px solid ${POS}44;border-radius:6px;padding:12px;margin-top:10px">
      <div style="font-size:11px;font-weight:700;color:${POS};margin-bottom:4px">⚡ ${L.operatingCF}</div>
      <div style="font-size:16px;font-weight:700;color:${POS}">${fmtUSD(agg.netMonthly)}/mo</div>
    </div>` : '';

  // ── Strategy Plan (Debt Payoff + Financial Roadmap + Investment Projection)
  const debtPayoffHTML = inc.strategyPlan && debtRows.length ? `
    <div style="font-size:11px;font-weight:700;color:${TEXT};margin-bottom:8px">💳 ${L.debtPayoffOrder}</div>
    <table style="width:100%;border-collapse:collapse;font-size:10px">
      <thead><tr style="background:transparent;border-bottom:1px solid ${BORDER}"><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">#</th><th style="text-align:left;padding:6px 8px;color:${MUTED};font-weight:600">${L.item}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">${L.balance}</th><th style="text-align:right;padding:6px 8px;color:${MUTED};font-weight:600">APR</th></tr></thead>
      <tbody>
      ${debtRows.slice(0, 5).map((d, i) => `<tr style="border-bottom:1px solid ${BORDER}"><td style="padding:5px 8px;color:${MUTED}">${i + 1}</td><td style="padding:5px 8px;color:${TEXT}">${htmlEscape(d.name || d.label)}</td><td style="padding:5px 8px;text-align:right;color:${NEG};font-weight:600">${fmtUSD(d.balance)}</td><td style="padding:5px 8px;text-align:right;color:${MUTED}">${d.apr != null ? fmtPct(d.apr) : "0%"}</td></tr>`).join("")}
      </tbody>
    </table>` : '';
  
  const roadmapHTML = inc.strategyPlan ? `
    <div style="font-size:11px;font-weight:700;color:${TEXT};margin:14px 0 8px">🗺 ${L.financialRoadmap}</div>
    <div style="background:#F8F6EF;border:1px solid ${NEG}44;border-radius:6px;padding:12px;margin-bottom:10px">
      <div style="font-size:11px;font-weight:700;color:${NEG};margin-bottom:4px">${L.phase1}</div>
      <div style="font-size:10px;color:${TEXT};line-height:1.5">Focus extra cash on debt. Projected payoff: ${(agg.debt / Math.max(1, agg.netMonthly)).toFixed(0)} months.</div>
    </div>
    <div style="background:#F8F6EF;border:1px solid ${POS}44;border-radius:6px;padding:12px">
      <div style="font-size:11px;font-weight:700;color:${POS};margin-bottom:4px">${L.phase2}</div>
      <div style="font-size:10px;color:${TEXT};line-height:1.5">Allocate to investments. Dollar-cost average monthly. Max employer 401k match first.</div>
    </div>` : '';

  const projectionHTML = inc.strategyPlan ? `
    <div style="font-size:11px;font-weight:700;color:${TEXT};margin:14px 0 8px">📈 ${L.investmentProjection}</div>
    <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:10px">
      ${[5, 10, 20].map(y => {
        const monthlyInvest = Math.max(0, agg.netMonthly * 0.45);
        const fv = monthlyInvest * (((Math.pow(1 + 0.085 / 12, y * 12) - 1) / (0.085 / 12)) * (1 + 0.085 / 12));
        const contrib = monthlyInvest * y * 12;
        const growth = fv - contrib;
        return `<div style="background:#F8F6EF;border:1px solid ${BLUE}44;border-radius:6px;padding:10px">
          <div style="font-size:9px;color:${MUTED};text-transform:uppercase;letter-spacing:0.05em;margin-bottom:3px">${y} ${L.years}</div>
          <div style="font-size:14px;color:${BLUE};font-weight:700">${fmtUSD(fv)}</div>
          <div style="font-size:9px;color:${POS};margin-top:2px">+${fmtUSD(growth)} ${L.growth}</div>
        </div>`;
      }).join("")}
    </div>` : '';

  // ── KPI strip (Page 1 lead). v0.50 — compact claude-design cards.
  const kpis = [
    { label: L.kpiIncome, value: fmtUSD(agg.income), color: POS },
    { label: L.kpiBills, value: fmtUSD(agg.bills), color: NEG },
    { label: L.kpiDebt, value: fmtUSD(agg.debt), color: NEG },
    { label: L.kpiNetWorth, value: fmtUSD(agg.netWorth), color: agg.netWorth >= 0 ? GOLD_DEEP : NEG },
    { label: L.kpiNetMonthly, value: fmtUSD(agg.netMonthly), color: agg.netMonthly >= 0 ? POS : NEG }
  ];
  const kpiHTML = `
    <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:6px;margin:6px 0 6px">
      ${kpis.map(k => `
        <div style="background:${CARD_BG};border:1px solid ${BORDER};border-radius:3px;padding:7px 9px;text-align:left">
          <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:6.5pt;color:${MUTED};text-transform:uppercase;letter-spacing:0.06em;font-weight:700">${htmlEscape(k.label)}</div>
          <div style="font-family:'JetBrains Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;font-size:13px;color:${k.color};font-weight:700;margin-top:2px">${k.value}</div>
        </div>`).join("")}
    </div>`;

  // ── Final HTML document
  return `<!DOCTYPE html><html lang="${isEs ? 'es' : 'en'}"><head><meta charset="utf-8"><title>${htmlEscape(L.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;1,6..72,400;1,6..72,500&family=Source+Serif+4:ital,opsz,wght@0,8..60,400;0,8..60,600;1,8..60,400&family=Plus+Jakarta+Sans:wght@500;600;700;800&family=JetBrains+Mono:wght@400;500&display=swap">
<style>
  @page { size: Letter; margin: 0.5in; background: ${PAGE_BG}; }
  body { font-family: "Source Serif 4", Georgia, "Times New Roman", serif; color: ${TEXT}; margin: 0; padding: 0; background: ${PAGE_BG}; font-size: 9.5pt; line-height: 1.45; font-feature-settings: "tnum" 1; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  h1, h2, h3, h4 { margin: 0; font-family: "Plus Jakarta Sans", system-ui, sans-serif; }
  /* v0.50 — claude-design "sect-head" pattern: section cards lose the heavy
     amber top rule + chunky padding; section headers become small amber
     uppercase with a hairline rule that extends right via ::after. */
  .section { page-break-inside: avoid; margin-top: 14px; background: transparent; border: none; border-radius: 0; padding: 0; }
  .section-hdr { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 8pt; font-weight: 700; color: ${GOLD_DEEP}; text-transform: uppercase; letter-spacing: 0.14em; margin: 12px 0 6px; display: flex; align-items: center; gap: 6px; }
  .section-hdr::after { content: ""; flex: 1; height: 1px; background: ${BORDER}; }
  .report-title { font-family: "Newsreader", Georgia, serif; font-style: italic; font-weight: 500; font-size: 22px; color: #0D1B2A; line-height: 1.1; text-align: center; margin: 4px 0 2px; }
  .header-bar { display: flex; align-items: flex-end; justify-content: space-between; padding-bottom: 10px; border-bottom: 1px solid ${GOLD}; margin-bottom: 14px; }
  .brand { display:flex; align-items:center; gap:8px; }
  .brand-mark { width:28px; height:28px; }
  .brand-mark img { width:100%; height:100%; object-fit:contain; }
  .brand-name { font-family: "Newsreader", Georgia, serif; font-style: italic; font-size: 16px; color: ${GOLD}; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; }
  .brand-sub { font-family: "Source Serif 4", serif; font-style: italic; font-size: 8px; color: ${MUTED}; margin-top: 1px; }
  .meta { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 9px; color: ${MUTED}; text-align: right; line-height: 1.5; }
  .meta strong { font-weight: 600; color: ${TEXT}; }
  .mono, .money, td.num { font-family: "JetBrains Mono", ui-monospace, monospace; font-variant-numeric: tabular-nums; }
  /* v0.50 — disclaimer slimmed to thin text with gold top rule, no card. */
  .disclaimer { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 7.5pt; color: ${MUTED}; line-height: 1.5; border-top: 1px solid ${GOLD}; padding-top: 8px; margin-top: 22px; font-style: italic; background: transparent; padding-left: 0; padding-right: 0; padding-bottom: 0; }
  .page-footer { font-family: "Plus Jakarta Sans", system-ui, sans-serif; font-size: 8px; color: ${MUTED}; text-align: center; margin-top: 8px; letter-spacing: 0.06em; text-transform: uppercase; }
  table { border-collapse: collapse; width: 100%; font-family: "Source Serif 4", serif; font-size: 8.5pt; }
  table th { text-align: left; font-family: "Plus Jakarta Sans", sans-serif; font-size: 7pt; font-weight: 700; letter-spacing: 0.04em; text-transform: uppercase; color: ${MUTED}; padding: 4px 4px 6px; border-bottom: 1px solid #CBD5E1; }
  table td { padding: 4px 4px; border-bottom: 1px solid #F1F5F9; color: ${TEXT}; }
  table tr.total td, table tr:last-child td { border-top: 1px solid ${GOLD}; border-bottom: none; padding-top: 6px; }
</style></head><body>

<div class="header-bar">
  <div class="brand">
    <div class="brand-mark"><img src="https://finance.goldenanchor.life/anchor-monogram.svg" alt="Golden Anchor"/></div>
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

<div style="margin:8px 0 14px">
  <div class="report-title">${htmlEscape(L.title)}</div>
  <div style="text-align:center;font-family:'Plus Jakarta Sans',system-ui,sans-serif;font-size:8pt;color:${MUTED};letter-spacing:0.06em;text-transform:uppercase;font-weight:600;margin-bottom:8px">${htmlEscape(L.snapshot)}</div>
</div>

${kpiHTML}

${inc.income ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.incomeHdr)}</div>
  ${incomeChart}
  ${incomeTable}
</div>` : ''}

${inc.bills ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.billsHdr)}</div>
  ${billsChart}
  ${billsTable}
</div>` : ''}

${inc.debt ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.debtHdr)}</div>
  ${debtBar}
  ${debtsTable}
</div>` : ''}

${inc.assets ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.assetsHdr)}</div>
  ${balanceTreemapsHTML}
  ${assetsTable}
</div>` : ''}

${inc.investAllocation && investAllocHTML ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.investAllocationHdr)}</div>
  ${investAllocHTML}
</div>` : ''}

${inc.financialRatios && financialRatiosHTML ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.financialRatiosHdr)}</div>
  ${financialRatiosHTML}
</div>` : ''}

${inc.cashFlow && cashFlowHTML ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.cashFlowHdr)}</div>
  ${cashFlowHTML}
</div>` : ''}

${inc.strategyPlan && (debtPayoffHTML || roadmapHTML || projectionHTML) ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.strategyPlanHdr)}</div>
  ${debtPayoffHTML}
  ${roadmapHTML}
  ${projectionHTML}
</div>` : ''}

${inc.notes && notesHTML ? `<div class="section">
  <div class="section-hdr">${htmlEscape(L.notesHdr)}</div>
  ${notesHTML}
</div>` : ''}

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
    <div style="font-family:'Plus Jakarta Sans',system-ui,sans-serif;max-width:560px;margin:0 auto;color:#0F172A;line-height:1.55">
      <div style="text-align:center;padding:24px 0 16px;border-bottom:1px solid #E2E8F0">
        <img src="https://finance.goldenanchor.life/anchor-monogram.svg" alt="Golden Anchor" style="width:44px;height:44px"/>
        <div style="font-family:'Newsreader',Georgia,serif;font-style:italic;font-size:22px;color:#B8860B;font-weight:500;letter-spacing:0.10em;text-transform:uppercase;margin-top:4px">Golden Anchor</div>
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
  // chromium-min fetches the brotli tarball from the URL on first run,
  // decompresses to /tmp/chromium, and reuses it on warm invocations.
  const executablePath = await chromium.executablePath(CHROMIUM_PACK_URL);
  const browser = await puppeteer.launch({
    args: [
      ...chromium.args,
      "--hide-scrollbars",
      "--disable-web-security",
      "--no-sandbox",
      "--disable-setuid-sandbox"
    ],
    defaultViewport: chromium.defaultViewport,
    executablePath,
    headless: "shell"
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
  // v0.51 — Resend only required for email mode; download mode skips it.

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

  const mode = body.mode === "download" ? "download" : "email";
  const clientId = String(body.clientId || "").trim();
  const to = String(body.to || "").trim();
  const subject = String(body.subject || "").trim().slice(0, 200) || "Your financial report";
  const message = String(body.message || "").slice(0, 4000);
  const lang = body.lang === "es" ? "es" : "en";
  const advisorName = String(body.advisorName || "").trim().slice(0, 120);
  const advisorEmail = String(body.advisorEmail || "").trim().slice(0, 200);
  const include = body.include || null; // reportInclude toggle map
  const reportType = ["monthly", "financial", "complete"].includes(body.reportType) ? body.reportType : "complete";

  if (!clientId) return res.status(400).json({ ok: false, error: "clientId required" });
  // v0.51 — only email mode requires recipient + Resend.
  if (mode === "email") {
    if (!RESEND_API_KEY) {
      return res.status(500).json({ ok: false, error: "Resend env var missing on server" });
    }
    if (!vEmail(to)) {
      return res.status(400).json({ ok: false, error: "Valid recipient email required" });
    }
  }

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
  const html = buildPrintHTML(clientRow, lang, advisor, include, reportType);

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
  const TYPE_SLUG = { monthly: "monthly", financial: "financial-statements", complete: "complete-report" };
  const filename = `golden-anchor-${TYPE_SLUG[reportType] || "report"}-${safeName}-${today}.pdf`;

  // v0.51 — download mode: return the PDF buffer directly with attachment headers.
  // The same render path produces the same artifact whether emailed or downloaded.
  if (mode === "download") {
    const pdfBytes = Buffer.from(pdfBuffer);
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${filename}"`);
    res.setHeader("Content-Length", String(pdfBytes.length));
    res.setHeader("Cache-Control", "no-store");
    return res.end(pdfBytes);
  }

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
