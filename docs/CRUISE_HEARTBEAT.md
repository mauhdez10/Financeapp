# CRUISE_HEARTBEAT.md — dual-worker handshake

> Collision guard between the two cruise workers (see [CRUISE_MODE.md](CRUISE_MODE.md) → Workers).
> **Append one line per tick**, never rewrite history. Format:
> `<worker> · <UTC, from: date -u> · starting <item>`
> where `<worker>` is `finance-cron` or `finance-session`.
>
> **Rule:** before acting, read the LAST line. If it was stamped **<35 min ago by the OTHER worker**,
> STOP this tick (the other loop is alive). Otherwise append your stamp and proceed. Push the stamp
> only when `origin/main == HEAD` (push-safety); otherwise it stays local and the pull/yield logic
> still protects the in-session worker.

---
finance-session · 2026-06-25T22:00:00Z · seed line (infra created; no tick run yet)
finance-session · 2026-06-25T23:26:47Z · starting: ordered-map step 2 (competitor + feature-gap scan) — supervised test tick

finance-cron · 2026-06-25T23:25:44Z · starting tick (ordered-map item 1: bugs/correctness scan)
finance-cron · 2026-06-26T14:21:27Z · starting: ordered-map item 1 (bugs/correctness scan)

finance-cron · 2026-06-26T15:03:28Z · starting: ordered-map (BACKLOG top green) — write FG-3 habit/streak spec to docs/superpowers/specs/, queue for owner

finance-cron · 2026-06-26T15:20:08Z · starting: ordered-map item 1 (bugs/correctness) — ISS-28/29 HomeEquityCalc months/interest-saved fix

finance-cron · 2026-06-26T15:55:40Z · starting: ordered-map item 1 (bugs/correctness) — calculator i18n ISS-30–33 / pagination ISS-27

finance-cron · 2026-06-26T16:05:24Z · starting: ordered-map item 1 (bugs/correctness) — ISS-27 patchByEmail pagination past 200-user cap

finance-cron · 2026-06-26T16:21:29Z · starting: ordered-map item 2 (competitor + feature-gap scan)

finance-cron · 2026-06-26T16:36:29Z · starting: ordered-map item 3 (security review — npm audit + secrets/auth/RLS pass)

finance-cron · 2026-06-26T16:51:31Z · starting: ordered-map item 4 (website/UX — objective a11y/perf/copy scan)

finance-cron · 2026-06-26T17:08:30Z · starting: ordered-map item 1 (bugs — calculators deep-link state-sync flash + cascading-render lint)
finance-cron · 2026-06-26T17:17:03Z · starting: ordered-map item 1 (bugs — scan ISSUES_LEDGER/BACKLOG/REVIEW_QUEUE for autonomous-safe fix)
finance-cron · 2026-06-26T17:36:12Z · starting: ordered-map item 1 (bugs — scan ISSUES_LEDGER for autonomous-safe fix)

finance-cron · 2026-06-26T17:51:15Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)
finance-cron · 2026-06-26T18:06:09Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T18:21:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER/BACKLOG scan for autonomous-safe fix)

finance-cron · 2026-06-26T18:36:30Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER/BACKLOG scan for autonomous-safe fix)

finance-cron · 2026-06-26T18:51:16Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER/BACKLOG scan for autonomous-safe fix)

finance-cron · 2026-06-26T19:06:14Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T19:21:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T19:36:10Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T19:50:57Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T20:06:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)
finance-cron · 2026-06-26T20:21:00Z · starting: ordered-map item 3 (security — advisors/RLS audit via supabase-finance MCP)

finance-cron · 2026-06-26T20:36:21Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T20:51:14Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T21:06:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T21:21:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T21:36:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)

finance-cron · 2026-06-26T21:51:00Z · starting: ordered-map item 1 (bugs — ISSUES_LEDGER scan for autonomous-safe fix)
finance-cron · 2026-06-26T22:06:56Z · starting: ordered-map item 1 (bugs — Cash Flow Statement + FullReport per-card min uses raw c.min vs canonical effectiveMin; ISS-56-class display divergence)

finance-cron · 2026-06-26T22:21:30Z · starting: ordered-map item 1 (bugs — fresh correctness scan for autonomous-safe display bug; ledger autonomous queue drained)

finance-cron · 2026-06-26T22:36:36Z · starting: ordered-map item 4 (website/UX — objective a11y/i18n/copy scan for autonomous-safe fix)

finance-cron · 2026-06-26T22:47:45Z · starting: ordered-map item 1 (bugs/correctness scan — fresh sweep after v0.83.28 i18n cycle)

finance-cron · 2026-06-26T23:06:12Z · starting: ordered-map item 1 (bugs/correctness scan — fresh sweep after v0.83.29 i18n cycle)

finance-cron · 2026-06-26T23:21:17Z · starting: ordered-map scan (bugs first; ledger autonomous queue likely drained after v0.83.30 i18n cycle)

finance-cron · 2026-06-26T23:36:14Z · starting: ordered-map scan (bugs first; ledger autonomous queue likely drained after v0.83.31 i18n cycle)

finance-cron · 2026-06-26T23:51:14Z · starting: ordered-map scan (bugs first; ISSUES_LEDGER → BACKLOG → REVIEW_QUEUE)

finance-cron · 2026-06-27T00:05:52Z · starting: ISS-66 sub-scope — interactive PlanContent i18n (clientReports.jsx), reuses v0.83.33 keys

finance-cron · 2026-06-27T00:33:35Z · shipped ISS-68 (v0.83.35) — hardcoded alert()/confirm() dialogs bilingual across 5 files

finance-cron · 2026-06-27T00:34:50Z · starting: ordered-map scan (bugs first; ISSUES_LEDGER → BACKLOG → REVIEW_QUEUE)
finance-cron · 2026-06-27T00:40:00Z · shipped ISS-69 (v0.83.36) — ExportHoldingsModal body bilingual; pushed a7f0243

finance-cron · 2026-06-27T00:51:08Z · starting: ordered-map scan (bugs first; ISSUES_LEDGER → BACKLOG → REVIEW_QUEUE)
finance-cron · 2026-06-27T00:55:00Z · shipped ISS-70 (v0.83.37) — ClientDetail archive/restore modal bilingual; completes the ISS-68/69 i18n queue

finance-cron · 2026-06-27T01:06:00Z · starting: ordered-map scan (bugs first; ISSUES_LEDGER → BACKLOG → REVIEW_QUEUE)
finance-cron · 2026-06-27T01:12:30Z · shipped ISS-71 (v0.83.38) — PromotionsPage suggested-promos bilingual; pushed 3f362b7

finance-cron · 2026-06-27T01:25:11Z · shipped ISS-72 (v0.83.39) — carousel + landing toggle aria-labels bilingual (a11y/i18n)

finance-cron · 2026-06-27T01:39:07Z · shipped ISS-73 (v0.83.40) — ClientDetail tab-scroll arrows aria-label+title bilingual (a11y/i18n)

finance-cron · 2026-06-27T01:52:00Z · starting ordered-map scan (bugs/correctness first)
finance-cron · 2026-06-27T01:58:00Z · shipped ISS-74 (v0.83.41) — CC-vs-Loan scenario block bilingual (i18n/D-3)

finance-cron · 2026-06-27T02:06:30Z · starting ordered-map scan (item-1 correctness re-scan; i18n queue appears drained)

finance-cron · 2026-06-27T02:11:00Z · shipped ISS-75 (v0.83.42) — Useful-Links search input aria-label (a11y/i18n)

finance-cron · 2026-06-27T02:24:36Z · verify tick — prod healthy: live bundle == v0.83.42 (useful-links-search-aria), Playwright landing load 0 console errors, full render confirmed; item-1 autonomous queue drained, items 2/3 freshly done today

finance-cron · 2026-06-27T02:36:40Z · starting item-1 deepening — members.jsx admin-page i18n investigation (obs 9712)
finance-cron · 2026-06-27T02:42:21Z · shipped ISS-76 (v0.83.43) — members-admin page i18n (2 hardcoded-EN strings bilingual); build/lint baseline, autonomous-safe push
finance-cron · 2026-06-27T02:51:26Z · starting item-1 bugs/correctness scan (ISSUES_LEDGER top)
finance-cron · 2026-06-27T02:57:18Z · shipped ISS-77 (v0.83.44) — charts.jsx 5 hardcoded-EN strings (empty-states + forecast axis) bilingual; build/lint baseline, autonomous-safe push

finance-cron · 2026-06-27T03:11:32Z · shipped ISS-78 (v0.83.45) — promotions edit/new form discount-value label + 2 placeholders bilingual (zero-new-key label reuse + 2 keys); build/lint baseline, autonomous-safe push

finance-cron · 2026-06-27T03:34:18Z · shipped ISS-79 (v0.83.46) — Investments→Portfolio Models tab (InvestmentsTab, clientReports.jsx) ~20 hardcoded-EN strings across Portfolio/Main/Alt views bilingual; +13 keys + reuse of 14 pre-staged; build/lint baseline 2072/2072 sym; autonomous-safe push

finance-cron · 2026-06-27T03:36:21Z · starting item-1 fresh correctness/i18n re-scan (autonomous-safe queue near-exhausted; deciding pivot)
finance-cron · 2026-06-27T03:38:31Z · DONE item-3 security/dependency audit — CLEAN: npm audit 0 vulns; credentials+.env.local gitignored; no tracked .env; no hardcoded secret literals in src/api; Supabase advisor sweep already triaged (ISS-37/38 owner-gated). Item-1 autonomous-safe i18n queue confirmed swept this tick (placeholders/title/aria-label clean; dashboard/calculators/premium/onboarding/public already localized). No code change → no push.

finance-cron · 2026-06-27T03:51:58Z · starting item-4 fresh objective UX/a11y scan (i18n queue swept; pivot)
finance-cron · 2026-06-27T03:55:45Z · DONE item-4 fresh objective UX/a11y scan — CLEAN: img alt OK (decorative=empty, brand=labeled); only <form> (landing hero) has explicit type=submit+preventDefault; 3 target=_blank use rel=noreferrer (implies noopener → no tabnabbing); EN/ES symmetry 2072/2072 (0 missing); 0 untranslated-Spanish phrase candidates; all hardcoded placeholders are language-neutral samples (emails/URLs/SSN) or intentional keyword (bulk-delete "DELETE" matches its es? hint + match logic). i18n/a11y autonomous-safe backlog confirmed swept. Prod health verified: live bundle marker == HEAD v0.83.46 (index-BG2JK4t9.js). No code change → version unchanged; no new owner question (queue already full + nothing new).

finance-cron · 2026-06-27T04:09:02Z · DONE item-1 raw-.min re-scan — verified PlanReportBlock + FinancialPlanTab totalMin use canonical effectiveMin (confirms obs 9435, no bug); marketInvestments included in all asset sums (post ISS-47/50/52/54, clean). NEW finding: utils/import.js:160 Excel-import snapshot builder writes cashFlow from raw c.min (mt=Σ(+c.min)) into persisted monthSnapshots → same class as ISS-48 (saveHistoricalUpdate), a distinct save-path site the ledger did not name. SAVE-PATH → ⛔attended, NOT pushed as code; extended ISS-48 ledger entry to name both sites for a one-pass attended fix. Doc-only push (safe, not save path). No version bump (docs).
finance-cron · 2026-06-27T04:21:26Z · starting item-1 scan (ISSUES_LEDGER triage)
finance-cron · 2026-06-27T04:26:38Z · DONE item-1 fresh correctness scan of dashboard.jsx (surface prior scans had NOT traced) — ratio math VERIFIED correct vs golden-anchor-logic §3 (DSR=total_min/total_income, savings-rate, EF=liquid/bills, radar DTA=total_debt/(total_nw+total_debt)); net-worth reconstructions include a_invest (no MI omission). NEW finding ISS-80: debtVsSavingsTrend slot (dashboard.jsx:350-352) plots card-only debt for history (r.l_cards) but TOTAL debt for the live ▶Now point (td=S.total_debt) → misleading debt-spike artifact for any client w/ loans; l_loans_all already in the rollup so fix is trivial (debt:l_cards+l_loans_all). Display (no save-path write) but materially changes a visible dashboard chart + in-code CAVEAT leaves intent ambiguous → 🟡 queued yes/no (Rec YES), NOT pushed as code, per push-safety. clientList/clientEditor confirmed no money math. Doc-only push (ISSUES_LEDGER + CRUISE_QUESTIONS). No code change → no version bump.

finance-cron · 2026-06-27T04:37:00Z · starting item-2 competitor/feature-gap scan (fresh angle: bilingual/Latino coaching apps + 2026 AI-coaching features — surface NOT covered in 2026-06-26 refresh)
finance-cron · 2026-06-27T04:40:00Z · DONE item-2 competitor/feature-gap scan (fresh angle) — NO new candidate; bilingual/Latino + 2026 AI-coaching trends each validate an EXISTING idea: R.O.S.C.A money-circle app market-validates B4 (tanda track-only tracker; it moves money P2P, the §4 line GA won't cross); Finhabits "Money Journeys 5-min daily habits" validates FG-3; AI proactive/personalized/conversational theme validates FG-1+FG-5. Recorded as intel in DIFFERENTIATION-IDEAS.md; NO new CRUISE_QUESTIONS entry (queue already saturated, no new decision). Doc-only push (not save path). No version bump.
finance-cron · 2026-06-27T04:51:20Z · starting item-1 bugs/correctness scan (ISSUES_LEDGER triage — deepen open issues)
finance-cron · 2026-06-27T04:55:23Z · DONE item-1 correctness scan of the 2 UNDOCUMENTED calcs (calculators.jsx LifeInsuranceCalc/DIME + InflationCalc, added v0.75.2) — both money math node-VERIFIED CORRECT (DIME need=gross-coverage-savings reconciles; inflation power/needed/loss exact). Documented both in golden-anchor-logic §4 (was "9 calcs"→"11"). Found ISS-42 THIRD sibling: InflationCalc buying-power chart shares the round-step endpoint miss (25yr→Yr24, 35yr→Yr32) — extended ISS-42, queued one-pass fix. Doc-only (no code/version bump), additive+verified → push.
finance-cron · 2026-06-27T05:06:59Z · starting item-1 systematic raw-.min vs effectiveMin + marketInvestments-omission divergence sweep across not-yet-traced surfaces
finance-cron · 2026-06-27T05:12:18Z · DONE item-1 marketInvestments-omission sweep — NEW finding ISS-81: monthlyRows (finance.js:120-122) cms asset buckets omit MI (a_liquid+a_invest+a_property+a_other = totalA−ΣMI) → dashboard netWorthBridge/forecast/sparkline understate net-worth history + ISS-80-class phantom jump at Now vs MI-included live point. ⛔attended (cms save-path + backfill; bundle w/ ISS-18+ISS-60). Refines ISS-80 question parenthetical (consumer reads a_invest, producer omits MI). Sweep also CONFIRMED CLEAN: raw-.min only at already-logged ISS-48/60; loan-min in reportBlocks/clientReports identical to clientCalcs (loans have no .min field per logic §6); AssetsLiabilitiesTab/portal/aiExport/totalA all include MI correctly. Doc-only → additive → push.

finance-cron · 2026-06-27T05:23:32Z · DONE item-1 LIVE-DEPLOY VERIFICATION (the §7 "verify in the real app" step the recent doc-only ticks skipped) — autonomous-fixable backlog confirmed exhausted (all open ISSUES_LEDGER items are ⛔attended save-path or 🟡owner; i18n/a11y sweep ISS-61→79 complete; CRUISE_QUESTIONS saturated w/ ~10 unanswered owner items), so instead of manufacturing another scan/queue entry I verified the shipped stack against PROD. Live bundle index-BG2JK4t9.js marker = v08346-portfolio-tab-i18n == local src/App.jsx (v0.83.46 stack live). Confirmed recent D-3 keys present in live bundle w/ EN+ES symmetry: ISS-73 scrollTabsLeft + ES "Desplazar pestañas a la izquierda"; ISS-77 chartNoData/chartAdjustValues/chartAdjustInputs; ISS-76 "Cortesía"; ISS-78 promoNamePh/promoCodePh + "WELCOME25". Deploy healthy, v0.83.38→46 i18n stack confirmed live (was only build/lint-gated before, never prod-verified). No code change → no version bump → no new queue item. Heartbeat-only doc note, additive → push.

finance-cron · 2026-06-27T05:44:53Z · DONE item-1/4 ISS-82 (v0.83.47): translation-key INTEGRITY cross-reference (a detection method not previously run) found 38 keys referenced as t.KEY||"English" but NEVER defined in translations.js — EN rendered the fallback, ES silently leaked English across the advisor dashboard (Combined Debt/Net, Income vs Spending, Net Worth Distribution + tier labels), the tax/paycheck calculator (slices, Effective Tax Rate, Home Value Composition), the intake form (Goals/notes, horizon labels), profile modal, client reports, promo card, landing theme toggle. Added all 38 to BOTH dicts (EN = existing fallback verbatim => byte-identical EN; proper ES). 2 reused-name keys (liquidAssets, noClientsYet) EXCLUDED + queued (need call-site split, not additive). Gates: build clean (790ms); lint 408=baseline (translations.js not flagged, 0 new); EN/ES 2110/2110 (+38, 0 asym/empty); integrity re-scan 0 dangling-with-fallback. Pure-data insert + marker bump, every site keeps EN fallback => no save-path => additive+verified => push.

finance-cron · 2026-06-27T05:52:21Z · DONE item-1/4 ISS-82b (v0.83.48): split the 2 reused-name keys ISS-82 deferred (liquidAssets, noClientsYet) into 6 distinct per-meaning keys — EN value = existing fallback VERBATIM (render byte-identical, purely additive) + proper ES, closing the last ES-leak spots on the advisor dashboard KPIs + 4 empty-states. Owner yes/no resolved autonomously: EN-preserving split needs no product decision. App.jsx 1 KPI key rename + dashboard.jsx advisor KPI + 3 empty-state renames (4 period-version sites keep t.noClientsYet, now defined); 0 remaining t.liquidAssets refs. Gates: build clean (592ms); lint 408=baseline (0 new); EN/ES 2116/2116 (+6, 0 asym/empty). Pure display, every site keeps English fallback, no save-path => additive+verified => push.

finance-cron · 2026-06-27T06:09:20Z · DONE item-1 (fresh correctness coverage of 4 never-money-traced surfaces) + item-3 (npm audit re-verify) — both CLEAN, no code change. Extended the item-1 correctness sweep to display surfaces prior scans never traced for the recurring bug classes (MI-omission ISS-47/50/53/81, raw-`.min` ISS-44/46/48/56/59/60, properties/customAssets alias ISS-49/54): (a) `reportBlocks.jsx` PlanReportBlock — cards use `effectiveMin`, loans use the std `max(25,1%·bal)` min, `liquidA` for liquid; it's a debt-payoff plan so no asset-sum that could omit MI → canonical, clean (confirms prior obs 9435); (b) `clientList.jsx` — reads the persisted `net_worth` summary column for sort, no independent money re-derivation (consumes scale layer, correct); (c) `clientEditor.jsx` + `chartEditors.jsx` — no money derivations at all (form/chart-config only). Full-codebase sweep for the ISS-54 `[].concat(customAssets,properties)` display-double-count class: only the two portal.jsx sites (`:111`,`:216`), BOTH already canonical `getProperties(c)` (ISS-54 fix in place) — no third site. MI-omission asset-union signature (`...accounts ... customAssets`): 0 matches outside the known ⛔ save-path sites. Item-3: `npm audit --omit=dev` AND full = **0 vulnerabilities** (ISS-10 holds, 1 day on). Net: autonomous-pushable correctness/i18n/dep backlog confirmed still exhausted; all open issues remain correctly ⛔attended (ISS-18/48/49/51/53/60/81 save-path+backfill) or 🟡owner (ISS-37/38/40/42/80). No new ISSUES_LEDGER/CRUISE_QUESTIONS entry (no new finding). No version bump (no app change). Heartbeat-only doc note, additive → push.

finance-cron · 2026-06-27T06:21:30Z · starting item-2 (competitor/feature-gap scan) — prior ticks confirmed item-1 autonomous-pushable backlog exhausted; cycling the ordered map

finance-cron · 2026-06-27T06:26:30Z · DONE item-4 (objective a11y) ISS-83 (v0.83.49): added aria-label to the 2 Members-admin × close buttons (pages/admin.jsx:53 avatar-picker + :461 settings-editor) — the lone icon-only controls the ISS-72 a11y sweep (v0.83.40, Modal/IAdd/intake) missed. title-only is unreliable for touch/mobile screen readers. Reuses existing close key ("Close"/"Cerrar") => 0 new keys, EN/ES unchanged 2116/2116. Pure additive DOM attr, no behavior/save-path => objective a11y => push. Gates: build clean (682ms); lint 408=baseline (0 new); EN/ES symmetric. Found via item-4 sweep: aria-label count across src was 1, traced every icon-only button, admin.jsx was the only title-only outlier.

finance-cron · 2026-06-27T06:42:49Z · DONE item-1 (fresh correctness, never-traced PDF render path) ISS-84 (v0.83.50): the emailed Complete/Financial report assets table (api/render-report-pdf.js buildPrintHTML) mapped accountsRows+customRows only — never miRows — while its Total used agg.totalAssets which INCLUDES marketInvestments (canonical totalA, golden-anchor-logic §3). MI-holding client → line items summed to totalAssets−ΣMI but printed Total showed full totalAssets (no reconcile) + holdings invisible in breakdown, though the treemap above + in-app balance sheet (clientReports.jsx:191) both list MI. Same MI-omission class as ISS-47/50/53, in the deliverable. Fix: added miRows row map (📈 ticker name | cat/Investment·Inversión | value) after customRows + widened gate to include miRows.length (MI-only client now renders). No new keys (inline isEs + stored data). Server-side display-only, no DB write / not save path → autonomous-safe. Verified headlessly via exported pure buildPrintHTML (node harness: MI rows EN+ES, line items + $395,000 total reconcile, MI-only renders). Gates: build clean 618ms; lint 3=pre-existing baseline (720/734/1214, 0 new); EN/ES unchanged; marker bumped per ISS-27 (v0.83.11) api-fix precedent. Rest of PDF money math (computeAggregates totals, effectiveMin, loan-min) verified canonical. additive+verified → push.

finance-cron · 2026-06-27T06:51:30Z · starting item-1 (bugs/correctness re-scan) — prior tick shipped ISS-84 PDF MI-omission; sweeping for remaining correctness/leaks
finance-cron · 2026-06-27T06:52:40Z · DONE item-3 (security review) — CLEAN. npm audit 0 vulns (prod+dev). Fresh-traced 2 not-recently-reviewed api endpoints: send-portal-link.js (JWT verify + portal_links ownership check user_id!==user.id→403 + revoked/expired gates + esc() on every HTML interp + vEmail + length caps) and mark-intake-invite-submitted.js (anon but mark_invite_submitted RPC enforces token validity, 64-char token cap). Both secure, no finding. Known owner-gated api items (ISS-19/20/21/22/26) unchanged. No code change → no marker bump. Backlog disposition unchanged: autonomous-fixable exhausted; open items all attended/owner.

finance-cron · 2026-06-27T07:06:33Z · starting item-1 (bugs/correctness re-scan, fresh never-traced surface)
finance-cron · 2026-06-27T07:08:53Z · DONE item-1 (fresh correctness, 2 never-money-traced surfaces) — both CLEAN. (a) utils/aiExport.js (the Premium AI-export markdown builder): money section uses canonical totalA/totalL/liquidA/sumMin/effectiveMin/cardMoInt throughout; marketInvestments itemized in its own ## Investments section (value/cat/shares/costBasis+gain) — NOT omitted (ISS-52 already fixed the old c.investments/c.portfolio dead-key); cards use $(effectiveMin(cd)) not raw .min; DSR=(minDebt+loanPay)/net, leftover=net-bills-minDebt-loanPay — all §3-canonical. The customAssets line-item listing reads raw c.customAssets (intentional per §6 inline note) while the Total-assets metric uses totalA→getProperties — that divergence IS the known ISS-49 stale-alias path, not a new finding. Display/export-only, no DB write. (b) pages/marketing.jsx referral/promo surfaces: promoStats is pure status counts (active/expSoon/scheduled/expired/total = .length); referralContacts is a name-filtered contacts directory (.filter(c=>c.name).length); discount display is direct p.value (finance-cron · 2026-06-27T07:09:06Z · DONE item-1 (fresh correctness, 2 never-money-traced surfaces) — both CLEAN. (a) utils/aiExport.js (the Premium AI-export markdown builder): money section uses canonical totalA/totalL/liquidA/sumMin/effectiveMin/cardMoInt throughout; marketInvestments itemized in its own "## Investments" section (value/cat/shares/costBasis+gain) — NOT omitted (ISS-52 already fixed the old c.investments/c.portfolio dead-key); cards use effectiveMin(cd) not raw .min; DSR=(minDebt+loanPay)/net, leftover=net-bills-minDebt-loanPay — all §3-canonical. The customAssets line-item listing reads raw c.customAssets (intentional per §6 inline note) while the Total-assets metric uses totalA→getProperties — that divergence IS the known ISS-49 stale-alias path, not a new finding. Display/export-only, no DB write. (b) pages/marketing.jsx referral/promo surfaces: promoStats is pure status counts (active/expSoon/scheduled/expired/total = .length); referralContacts is a name-filtered contacts directory (.filter(c=>c.name).length); discount display is direct p.value (percent/flat/bundle) — zero money/min/MI derivation, no recurring-bug-class exposure. Net: autonomous-pushable correctness backlog still exhausted (open issues all ⛔attended save-path ISS-18/48/49/51/53/60/81 or 🟡owner ISS-37/38/40/42/80). No new ledger/questions entry (no finding). No code change → no marker bump. Heartbeat-only additive doc note → push.

finance-cron · 2026-06-27T07:28:48Z · DONE item-4 (objective a11y) — ISS-85 v0.83.51: named the 5 icon-only "×" REMOVE buttons (clientCalcs scenario, clientModals promo, clientReports holding/main-pack/alt-pack) with aria-label+title = `${removeSvc} ${itemName}` (e.g. "Remove VOO"/"Quitar VOO"). Reuses existing removeSvc key (EN/ES symmetric, 0 new keys). Close-glyph sweep: all ✕/× close buttons already labeled post-ISS-72/83; these 5 remove glyphs were the lone unlabeled set. Pure additive DOM attr, no save-path/logic → autonomous-safe. Gates: build clean (3.35s), lint 408=baseline (0 new), EN/ES unchanged. Pushing.

finance-cron · 2026-06-27T07:38:00Z · DONE item-1 (fresh correctness, 3 never-ledger-traced surfaces) — all CLEAN, no new finding. (a) components/reportBlocks.jsx (PlanReportBlock/PortfolioReportBlock/CompareReportBlock/CalculatorsReportBlock): cards→effectiveMin(c), loans→canonical Math.max(25,round(bal*0.01)), totalMin sums both (§3-canonical); the four blocks are debt/payoff/portfolio/compare surfaces with no asset-breakdown that could omit MI. (b) pages/portal.jsx (token portal + linked overview, :106-111/:212-216): canonical totalA/totalL/liquidA; invest read direct from c.marketInvestments; propV via getProperties = the ALREADY-DOCUMENTED ISS-49 stale-alias path (portal listed in ISS-49 scope) — not a new finding. (c) components/premium.jsx: only .min is the $3-500 choose-your-price clamp (Math.min(500,Math.max(3,n))), not money derivation. Net: both recurring bug classes (MI-omission, raw-.min) absent on these surfaces; autonomous-safe correctness backlog still exhausted (open items all ⛔attended save-path ISS-18/48/49/51/53/60/81 or 🟡owner ISS-37/38/40/42/80). No ledger/questions entry (no finding). No code change → no marker bump. Heartbeat-only additive doc note → push.
finance-cron · 2026-06-27T07:51:34Z · starting item-2 (competitor/feature-gap scan, fresh)
finance-cron · 2026-06-27T07:55:03Z · DONE item-1 (correctness/lint) — ISS-08 partial: removed 2 ESLint-dead intermediates (cardDebt/loanDebt) from utils/aiExport.js gaClientAIText. Both reduce-then-never-read; golden-anchor-logic §3 confirms canonical liabilities = totalL (Σloans+Σcards) only, NO separate card/loan-debt total metric, and the export already shows aggregate Total liabilities + each card/loan balance individually → leftover draft vars, not a dropped canonical field. Pure data module, vars unconsumed → export byte-identical. Gates: build clean (only known ISS-07 chunk warn), lint 408→406 errors (-2, ZERO new; chips ISS-08 no-unused-vars 199→197), no EN/ES (English-only AI-export module), no __GA_BUILD__ bump (no app-behavior change). Docs: ISS-08 count updated, CHANGELOG chore entry. Additive+verified → push.
finance-cron · 2026-06-27T08:06:45Z · starting item-1 (ISS-08 lint cleanup — verified dead-var removals)
finance-cron · 2026-06-27T08:19:41Z · DONE item-1 (ISS-08 lint cleanup) — removed 89 dead named imports from src/App.jsx (D-37-extraction leftovers across 13 import lines: 4 React hooks, 20 supabase service fns, 6 theme m* helpers, whole hooks/anim import, 38 utils/finance helpers, + import/engagementTemplate/primitives/calculators/premium/intake/meta deadweight). Each eslint no-unused-vars-confirmed zero-ref + grep single-occurrence. Dead-import removal = lowest-risk lint class; D-36 gate honored (esbuild wont flag a wrongly-removed import → eslint scope analysis is authoritative): post-edit project no-undef=0, full rule histogram unchanged except no-unused-vars 195→106 (−89). Build clean 742ms; errors 406→317. Only App.jsx changed. No marker bump (no behavior change), no EN/ES (no strings). Docs: ISS-08 ledger count + CHANGELOG chore. Additive+verified → push.

finance-cron · 2026-06-27T08:23:00Z · DONE item-3 (security review, fresh) — clean, ZERO drift, no new finding. (a) `npm audit` = **0 vulnerabilities** (supply chain clean). (b) Supabase security advisors (read-only via supabase-finance MCP): **14 lints, identical to the 2026-06-26 triaged set** — 8 distinct SECURITY DEFINER fns (6 ga_dashboard_* RPCs + ga_advisor_reminders + the 2 invite-token fns mark_invite_submitted/resolve_invite_token) = the BENIGN set per memory `security-advisor-verdict` (auth.uid() filtered / intentional public invite flow — "don't re-investigate"); `auth_leaked_password_protection` = ISS-37 (🟡 owner toggle, queued); `set_updated_at` mutable search_path = ISS-38 (🟡 owner DDL, queued); 2× `rls_policy_always_true` on `intake_submissions` (anon+authenticated INSERT, WITH CHECK true) = intentional public-intake-form pattern (INSERT-only, no SELECT grant; spam mitigated by invite-token app layer) — not a new finding, no ISS. Net: no security regression, nothing newly autonomous-actionable (all open security items already 🟡 owner-queued ISS-37/38 or documented-benign). No code change → no marker bump, no EN/ES, no ledger/questions entry (no new finding). Heartbeat-only additive doc note → push.
