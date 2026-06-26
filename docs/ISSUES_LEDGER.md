# ISSUES_LEDGER.md — Golden Anchor Finance

> Brief, one-line-per-issue tracker of known problems + their history. The review handler
> (`finance-review-mode`, §4c) checks this **backward**: a new report that matches an existing
> entry is a **recurrence** — root-cause the old fix, don't re-paste it. Keep entries terse;
> the "why" of any shipped fix lives in `CHANGELOG.md`. Newest on top.
>
> Status: 🔴 open · 🟡 owner-decision · 🟢 fixed (kept briefly for recurrence-matching, then pruned) · 🔁 recurrence

## Open

| ID | Area | Status | One-line | Notes / owner question |
|---|---|---|---|---|
| ISS-10 | security / deps | 🟡 | `npm audit` = 4 vulns (2 high `form-data`+`ws`, 1 mod `js-yaml`, 1 low `@babel/core`) | All dev-only OR not attacker-reachable in prod (analysis in CRUISE_QUESTIONS 2026-06-26). `npm audit fix` is non-breaking but `ws` rides puppeteer-core (api/ PDF path) — verify in an attended session, don't auto-push. |
| ISS-09 | lint / hooks | 🟡 | `react-hooks/*` ×183 (static-components, rules-of-hooks, exhaustive-deps, set-state-in-effect) | Component-structure + hook-order (pitfalls #13/#17). Attended review only — NOT a safe autonomous bulk sweep. |
| ISS-08 | lint / cosmetic | 🔴 | `no-unused-vars` ×199 + `no-empty` ×26 | Cosmetic debt in dense extracted code. Bulk patches need scope-aware review (D-36) — don't blind-fix. |
| ISS-07 | perf / build | 🔴 | Bundle >800 KB after minify (index ~1.3 MB) | Code-splitting / dynamic import opportunity. Single-bundle by D-1 history; needs a deliberate split plan. |
| ISS-06 | calc | 🟡 | `IncomeCalc` uses hardcoded 2025 tax brackets | Annual maintenance item — refresh brackets each tax year. |
| ISS-05 | dashboard | 🟡 | 3 placeholder charts: `billsStacked` / `billsYoY` / `payoffProgression` | Need bills-by-category + per-debt apr/min aggregates AND a dashboard.jsx re-wire. Owner: worth it? |
| ISS-04 | reminders | 🟡 | `promoExpiring` + per-bill/card "Client Due" reminders are blob-only | Need new summary columns + a backfill (save-path derivation change). Owner decision. |
| ISS-03 | scale | 🟢 | `color1` is a deterministic hash (originals not stored in summary) | Intended follow-up; accent re-derives stably. Revisit only if owner wants original accents preserved. |

## Recently fixed (recurrence-watch — prune after a few clean cycles)

| ID | Area | Status | One-line | Shipped |
|---|---|---|---|---|
| ISS-02 | extraction / imports | 🟢 | Missing imports after Phase-2 carve-out → `ReferenceError` (admin.jsx `expBackup`; import.js `MS`; chartEditors `dashChartOptions`) | v0.83.3 / v0.83.6 / v0.83.7 — **recurrence pattern: watch every extraction for lost imports.** |
| ISS-01 | save path | 🟢 | Advisor save-success toast fired unconditionally — a failed save showed "✓ saved" (silent data-loss risk) | v0.83.1 (shipped to main 2026-06-25, owner-approved in test-mode) |

> **Recurrence pattern to watch (from ISS-02):** Phase-2/3 file extractions repeatedly drop a
> module-level import that was implicit in the old single-file scope. Any future extraction MUST
> re-run `npm run lint` and confirm `no-undef` is **0** before commit.
