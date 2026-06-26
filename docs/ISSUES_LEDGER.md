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
| ISS-09 | lint / hooks | 🟡 | `react-hooks/*` ×183 (static-components, rules-of-hooks, exhaustive-deps, set-state-in-effect) | Component-structure + hook-order (pitfalls #13/#17). Attended review only — NOT a safe autonomous bulk sweep. |
| ISS-08 | lint / cosmetic | 🔴 | `no-unused-vars` ×199 + `no-empty` ×26 | Cosmetic debt in dense extracted code. Bulk patches need scope-aware review (D-36) — don't blind-fix. |
| ISS-07 | perf / build | 🔴 | Bundle >800 KB after minify (index ~1.3 MB) | Code-splitting / dynamic import opportunity. Single-bundle by D-1 history; needs a deliberate split plan. |
| ISS-06 | calc | 🟡 | `IncomeCalc` uses hardcoded 2025 tax brackets | Annual maintenance item — refresh brackets each tax year. |
| ISS-05 | dashboard | 🟡 | 3 placeholder charts: `billsStacked` / `billsYoY` / `payoffProgression` | Need bills-by-category + per-debt apr/min aggregates AND a dashboard.jsx re-wire. Owner: worth it? |
| ISS-04 | reminders | 🟡 | `promoExpiring` + per-bill/card "Client Due" reminders are blob-only | Need new summary columns + a backfill (save-path derivation change). Owner decision. |
| ISS-03 | scale | 🟢 | `color1` is a deterministic hash (originals not stored in summary) | Intended follow-up; accent re-derives stably. Revisit only if owner wants original accents preserved. |

## Whole-app multi-agent review — 2026-06-26 (39 findings, top 25 verified; 3 fixed in v0.83.8)
> Disposition tags: **⛔attended** = touches the live save path / needs backfill → NEVER autonomous-fix (CRUISE_MODE push-safety); **🟢loop-ok** = additive, no save-path → cruise loop may fix-and-push; **🟡owner** = product/policy decision (see CRUISE_QUESTIONS).

| ID | Area | Sev | Disp | One-line |
|---|---|---|---|---|
| ISS-12 | save-path | high | ⛔attended | `gaSaveClient` non-atomic find-then-insert; two racing first-saves of a new client → unique-violation → silent failed write (newer edits dropped, `selected` still shows them). |
| ISS-13 | save-path | high | ⛔attended | `client_monthly_summary` is upsert-only, never pruned → relabeling/removing a month leaves stale rows feeding `ga_dashboard_trend` + debtRising. |
| ISS-14 | save-path | high | ⛔attended | `gaDeleteClient`/`gaSetArchived` don't touch cms → deleted/archived clients still inflate the portfolio trend chart (RPC has no deleted_at/archived filter). |
| ISS-15 | save-path | med | ⛔attended | cms upsert failure is caught-and-logged after the blob write → time-series silently diverges; green "saved" toast still fires. |
| ISS-16 | save-path | med | ⛔attended | `importMultiple` ignores `gaSaveClient` result; an imported blob whose id collides with an existing `local_id` silently OVERWRITES that client (mig preserves incoming id). |
| ISS-17 | save-path | med | ⛔attended | Client bootstrap mints a fresh self-blob when `gaLoadClients` returns null (load ERROR, not empty) → duplicate self row, real data stranded. |
| ISS-18 | money / scale | med | ⛔attended | `monthlyRows` net_worth = savings(liquid)−debt ≠ canonical totalA−totalL (§3) → monthly net-worth trend understated/negative for asset-rich clients. Needs formula fix + backfill. |
| ISS-19 | security | high | 🟡owner | `api/_sanitize` allow-list filters TOP-LEVEL keys only; nested free-text (e.g. `customAssets[].desc`) passes verbatim to the public portal + linked clients. Owner: which nested fields are private? |
| ISS-20 | security | med | ⛔attended | `api/admin-members` grant/revoke authorized for ANY advisor (only `list` is admin-gated) → any self-registered advisor can comp Premium. Clean fix (gate behind `isAdmin`) but it's a permission change → attended, not autonomous. |
| ISS-21 | security | high | 🟡owner | Admin `list` gated by MUTABLE auth email, not a stable uid → email-change privilege-escalation if Supabase email-confirm is off. Fix: gate by uid (needs the real admin uids). |
| ISS-22 | security | med | 🟡owner | `resolve-portal` rate-limit is fail-open when Upstash unset (by design). Defense-in-depth only — token entropy makes brute force impractical. |
| ISS-23 | security | med | ⛔attended | `link.js` island snapshot uses `.limit(1)` with no order → arbitrary row frozen if a client account ever has >1 `clients` row (rare; client-role normally has one). |
| ISS-24 | product | med | 🟡owner | Signup lets anyone self-select "Advisor"; advisors are never Premium-gated → Free/Premium model bypassable at registration (D-13b territory). |
| ISS-25 | product | med | 🟡owner | PremiumUpgrade "I already subscribed — activate" flips `accountPlan` client-side with no server verify (known honor-system; tighten now that the webhook exists?). |
| ISS-26 | api / billing | med | 🟡owner | `stripe-webhook` grants premium from `client_reference_id` without checking `payment_status==='paid'`/`mode`, and no event de-dup → premium before capture / on replay. |
| ISS-27 | api / scale | med | 🟢loop-ok | `patchByEmail` lists only first 200 auth users → grant/revoke silently no-ops for accounts past page 1 (only bites >200 users). Fix: paginate like `loadClients`. |
| ISS-28 | calc | 🟢 | `HomeEquityCalc` "Months Saved" rounded payoff up to whole years → understated/0/negative. **FIXED** v0.83.9. |
| ISS-29 | calc | 🟢 | `HomeEquityCalc` "Interest Saved" was a fabricated approx unrelated to the amort table. **FIXED** v0.83.9. |
| ISS-30 | i18n (D-3) | 🟢 | `AmortTablePaginated` hardcoded English headers + "Yr". **FIXED** v0.83.10 (passed `t`, new keys). |
| ISS-31 | i18n (D-3) | 🟢 | `EquityTablePaginated` hardcoded English headers + "Yr". **FIXED** v0.83.10. |
| ISS-32 | i18n (D-3) | 🟢 | `clientCalcs` 5 "Prefilled from…" helper lines hardcoded. **FIXED** v0.83.10 ({n}-token replace). |
| ISS-33 | i18n (D-3) | 🟢 | `clientCalcs` "HOUSEHOLD COMBINED" block hardcoded. **FIXED** v0.83.10 (reused income keys + new header key). |

## Recently fixed (recurrence-watch — prune after a few clean cycles)

| ID | Area | Status | One-line | Shipped |
|---|---|---|---|---|
| ISS-30–33 | i18n (D-3) | 🟢 | Calculator hardcoded-English (amort/equity table headers + clientCalcs prefill helpers + household block) → bilingual; 14 new keys EN+ES, 4 reused | v0.83.10 (2026-06-26) |
| ISS-29 | review / calc | 🟢 | `HomeEquityCalc` Interest Saved fabricated approx → now real (baseInt − extraInt) from shared amort loop | v0.83.9 (2026-06-26) |
| ISS-28 | review / calc | 🟢 | `HomeEquityCalc` Months Saved year-rounded vs exact → understated/0/neg; now exact-month difference | v0.83.9 (2026-06-26) |
| ISS-36 | review / money | 🟢 | aiExport card "min" called `payM(cd)` (wrong fn+arity) → always $0; now `effectiveMin(cd)` | v0.83.8 (2026-06-26) |
| ISS-35 | review / calc | 🟢 | `SavingsCalc` 0% APY divided by rate → NaN→$0; now guarded to simple sum | v0.83.8 (2026-06-26) |
| ISS-34 | review / nav | 🟢 | advisor Back/Forward compared string summary-id `===` number selectedId; now `String()===String()` | v0.83.8 (2026-06-26) |
| ISS-11 | lint / theme | 🟢 | `no-misleading-character-class` ×3 in `stripLeadEmoji` (invisible FE0F/ZWJ/20E3 in source) | 2026-06-26 — rewrote literal combining chars as `\u{…}` escapes + justified disable; behavior identical. **Footgun pattern: never leave raw combining/ZWJ code points in source — they resist byte patching; use `\u{…}` escapes.** |
| ISS-10 | security / deps | 🟢 | `npm audit` 4 vulns (form-data/ws/js-yaml/@babel) → 0 | 2026-06-26 — `npm audit fix` (lock-only; puppeteer-core unchanged, ws patch 8.20.1→8.21.0). Owner optional: PDF spot-check on prod. |
| ISS-02 | extraction / imports | 🟢 | Missing imports after Phase-2 carve-out → `ReferenceError` (admin.jsx `expBackup`; import.js `MS`; chartEditors `dashChartOptions`) | v0.83.3 / v0.83.6 / v0.83.7 — **recurrence pattern: watch every extraction for lost imports.** |
| ISS-01 | save path | 🟢 | Advisor save-success toast fired unconditionally — a failed save showed "✓ saved" (silent data-loss risk) | v0.83.1 (shipped to main 2026-06-25, owner-approved in test-mode) |

> **Recurrence pattern to watch (from ISS-02):** Phase-2/3 file extractions repeatedly drop a
> module-level import that was implicit in the old single-file scope. Any future extraction MUST
> re-run `npm run lint` and confirm `no-undef` is **0** before commit.
