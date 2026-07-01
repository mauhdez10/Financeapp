# OPTIMIZATION-ROADMAP.md — Golden Anchor Finance

> 🔖 **Live · canonical** (planning). Source: the 2026-06-27 whole-app optimization research
> (multi-agent, 4 dimensions × ~7 recs → 28 → 22 deduped). Indexed in [LOGIC_MAP](LOGIC_MAP.md).
> Ordered by (impact desc, effort asc). Cross-refs ISSUES_LEDGER where a rec fixes a known issue.

## 🥇 Top 3 — do first
1. **Atomic client-save RPC** — one `ga_save_client` SECURITY DEFINER RPC (upsert ON CONFLICT + replace
   cms rows + RAISE on failure) **fixes ISS-12/13/15 as one root cause.** Highest risk in the app:
   silently corrupts persisted financial data on the primary advisor path behind a green success toast.
   *(arch · high · M · ⛔attended — live save path)*
2. **Deep-import `lucide-react` icons** — the 625 KB barrel chunk defeats tree-shaking; app uses ~30–40
   icons. Convert `from "lucide-react"` → per-icon deep imports across ~21 files. Biggest single bundle
   win, near-zero risk. *(perf · high · S · 🟢loop-ok)*
3. **Confirm Vercel Pro + Fluid compute** — Hobby's non-commercial ToS + 12-fn cap blocks launching a
   paid product; Pro unlocks Active-CPU idle savings. Dashboard check. *(cost · high · S · 🟡owner)*

## Tier 1 — quick wins (high impact, S/M effort)
- **Dynamic-import XLSX behind the import wizard** — 122 KB gz SheetJS is eager for every user; only
  `utils/import.js` uses it (advisor-only click). `await import('xlsx')` inside the parse fns. *(perf·high·S·🟢)*
- **Atomic client-save RPC** — see Top-3 #1. *(arch·high·M·⛔)*
- **Cap/paginate `gaLoadClientSummaries`** — loads ALL rows (5MB+ at 50k) every advisor login; switch
  roster to a paged `gaListClients` + virtualized list; keep load-all only for export/backup. *(cost·high·M·⛔ scale)*
- **Route-split with `React.lazy` + Suspense** — zero code-splitting today; marketing/portal/intake/
  admin/members ship on first paint. `lazy(()=>import('./pages/X'))` behind one Suspense; index chunk <800KB. *(perf/arch·high·M·🟢)*
- **Vitest for the money layer** — ~15 ledger bugs (ISS-44…91) are pure-fn correctness bugs a 5-line test
  catches. Port the throwaway harnesses (effectiveMin, payM NaN guard, sumMin, totalA-with-MI,
  monthlyRows) into named tests + CI gate. *(arch·high·M·🟢)*
- **Onboarding → first-data "aha" path** — wizard collects goals then dumps client on an empty Overview;
  deep-link the CTA into a goal-scoped "Add your first [X]" flow. *(ux·high·M)*
- **FG-3 monthly-check-in streak** (owner-approved, no-cost) — derive off existing monthSnapshots (no new
  save-path column); progress ring on Overview, reduced-motion gated. *(ux·high·M·🟢)*

## Tier 2 — big bets (high impact, L effort)
- **Fix `render-report-pdf` cold-start cost** — ~50 MB chromium tarball per cold start at 1024MB/30s,
  nearly all Active-CPU; dominates the Vercel bill at 50k reports. Instrument download-vs-render; cache-pin
  the tarball; evaluate a hosted PDF service. *(cost·high·L)*

## Tier 3 — later
**Perf (unlock after route-split):** lazy-load Recharts + IntersectionObserver-gate charts (med·M) ·
memoize ClientDetail derivations `useMemo` (med·S) · self-host + trim the 5 Google Fonts (med·M) ·
split vendor chunk + `build.target:es2022` (low·S).
**Cost/scale:** cache the 5 dashboard RPCs `s-maxage` (med·M) · index/drop the `data->>'id'` save-path
fallback (med·S) · per-function memory in vercel.json (med·S) · plan the JSONB-blob growth ceiling
(child `client_snapshots` table) (med·L).
**Arch/UX debt:** consolidate raw-vs-canonical money helpers (the #1 recurring root cause ISS-44…91)
(med·L) · decompose charts.jsx(1401)/clientReports.jsx(762)/dashboard.jsx(539) (med·M) · triage
react-hooks lint (35 real bugs vs 123 cosmetic) (med·L·ISS-09) · insurance-lead in-app confirmation +
Resend follow-up (med·S) · audience-aware landing hero by signupRole (med·S) · non-destructive
"Skip for now" onboarding (med·S) · close a11y blockers ISS-88/89 (med·L) · instrument
activation/retention events (med·M).

## Process adoptions (from the Velo + Mauricio-OS recon, 2026-06-27)
- **SessionStart hooks** (`doc-freshness.sh`, `kill-date.sh` — port from Velo `.claude/hooks/`) — auto-warn
  on stale/expired docs at session start. *(S)*
- **Verification matrices in `golden-anchor-logic`** ("as [role], try [action] → expect [outcome]") —
  formalizes the adversarial access proof; strengthens the ISS-19/20/21 security fixes. *(M)*
- **§9 cost/scale-check + §6 adversarial-access-proof gates** — add to AGENT.md as pre-merge gates for
  money/role/RLS changes. *(S)*
- (Most other Velo/OS items — LOGIC_MAP, UNIVERSAL_RULES, ISSUES_LEDGER, feedback-intake/review-mode,
  cruise mode — are ALREADY built in finance as of 2026-06-25/26.)
