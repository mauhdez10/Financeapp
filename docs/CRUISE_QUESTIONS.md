> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Each entry REMOVED once the owner answers it. The file persists.

# CRUISE_QUESTIONS.md — unattended-tick questions for the owner

> The cruise tick appends yes/no questions here (with a recommendation) when it hits something it
> should not decide alone, then moves on. Newest on top. The owner answers; answered entries are
> pruned (kept one cycle as a pointer, then removed).

## 2026-06-26 — bugs/correctness (ordered-map item 1) · owner yes/no (appended by finance-cron)

Deep item-1 scan of the calculators + shared money math (`finance.js`, `calculators.jsx`,
`charts.jsx`). The known calc bugs are all shipped (ISS-28–36/39); two findings remain:

- **`ratFmt` unused `abs` (finance.js:7)** — confirmed **harmless dead code**, not a bug:
  `currentRatio` and `dsr` are ratios of non-negative quantities, so `v` is never negative and
  `Math.abs(v)` could never differ. Pure ISS-08 cosmetic debt — no action, no question.
- **ISS-40 (NEW) — InterestCalc chart vs headline disagree at Quarterly/Annual.** The summary
  "Final value" / "Of which interest" honor the compound-frequency selector (pf=12/4/1, wired in
  the owner-approved v0.72.3), but the `CompoundGrowthStack` chart directly below always compounds
  **monthly** (`mr=r/12`). So when a user picks **Quarterly** or **Annual**, the chart's endpoint
  shows a *higher* number than the headline "Final value" — a visible inconsistency. This is
  **documented as the current behavior** in `golden-anchor-logic §4` ("the growth-stack chart still
  draws the monthly approximation"), i.e. v0.72.3 deliberately scoped freq to the summary only — so
  I will not silently change documented logic. **The fix is small + safe:** add an optional
  `freq=12` prop to `CompoundGrowthStack` (default preserves every other caller — it's used by
  InterestCalc ONLY) and have it mirror the summary's exact formula (`pr=r/pf, n=y·pf,
  perDep=monthly·12/pf`); pass `freq={+f.freq||12}` from InterestCalc. Headlessly math-verifiable
  (the new series equals the summary). **Rec: YES — make the chart honor the selector so its
  endpoint matches the headline; it's the kind of consistency a finance client would notice. (Or,
  if you prefer the chart stay a simple monthly illustration, say NO and I'll just annotate the
  chart "monthly approximation" so the mismatch is explained.)** Either way I'll update
  `golden-anchor-logic §4` in the same change.

## 2026-06-26 — security review (ordered-map item 3) · owner yes/no (appended by finance-cron)

Ran a full security pass: `npm audit`, tracked-source secret scan, and the Supabase security
advisor + a read-only catalog check of every RLS table and SECURITY DEFINER RPC. **Posture is
solid** — nothing leaking, nothing to hot-fix:
- **0 npm vulnerabilities** (ISS-10 still holds). No secret values in tracked source (only env-var
  *names* in comments/docs; `finance-credentials.md` confirmed gitignored, `.env.local` untracked).
- **RLS enabled on all 8 public tables** (clients, client_monthly_summary, client_links,
  portal_links, settings, intake_invites, intake_submissions, sms_consent_log).
- **All 6 SECURITY DEFINER RPCs are caller-scoped** — every `ga_dashboard_*` + `ga_advisor_reminders`
  filters internally by `auth.uid()`, so the definer privilege does **not** leak cross-advisor data
  (the advisor's "public can execute DEFINER" warnings are the correct, intended pattern).
- The `intake_submissions` anon/auth `INSERT … WITH CHECK (true)` and the anon-executable
  `resolve_invite_token` / `mark_invite_submitted` RPCs are **by-design public flows** (the public
  intake form + pre-login invite-token resolution). Not vulnerabilities. *(Minor: the public intake
  INSERT has no rate-limit — a spam-insert abuse vector, not a data leak. Note only; fold into a
  later hardening pass if owner wants.)*

Two **genuine low-effort hardening items** surfaced. Both are owner/config-gated (an Auth dashboard
toggle and a prod-DB migration) — out of bounds for an autonomous push, so queued here:

1. **Enable leaked-password protection (HaveIBeenPwned).** Supabase Auth → Providers → Password —
   currently **off**. One toggle, free, blocks signups/resets using known-breached passwords.
   **Rec: YES — enable it; pure defensive win, no code, no downside.**
2. **Pin `search_path` on the `set_updated_at` trigger function.** It has a mutable `search_path`
   (advisor WARN `0011`). Low risk (a trigger fn), but the standard hardening is
   `ALTER FUNCTION public.set_updated_at() SET search_path = ''` (or `= pg_catalog, public`).
   It's a one-line **DDL migration against the production DB**, which cruise push-safety bars me from
   applying unattended. **Rec: YES — I apply it via `supabase-migrations/` + the MCP when you're
   present to confirm, or you greenlight it here.**

## 2026-06-26 — competitor / feature-gap scan refresh · owner yes/no (appended by finance-cron)

Re-ran the ordered-map **item 2** scan (the 2026-06-11 `DIFFERENTIATION-IDEAS.md` memo is the
canonical home; FG-1..4 already decided). 15 days on, the field is **stable** — no competitor move
forces a re-think. One genuinely **new** feature-gap candidate surfaced; two findings are competitive
intel that only *validate* existing ideas (logged, no decision needed):

- **FG-5 (NEW) — "Money Runway" forward cash-flow projection.** Every mainstream budget app
  (Quicken Simplifi, Rocket Money, PocketGuard) leads 2026 with "safe-to-spend" / forward cash-flow
  forecasting; GA has only *backward-looking* trend charts + DSR. A forward version **fits GA's model
  with no bank feeds**: pure arithmetic on data the advisor already enters (income − recurring bills −
  debt minimums, against current liquid savings) → a 6–12-month liquid-balance trajectory that names
  the month a cushion runs out ("at this pace, savings dip below 1 month of expenses in March") or the
  surplus building. No Plaid, no AI, no cost, no new Vercel function — coaching-framed ("here's where
  today's habits lead"), not the killed bank-aggregation play. Overlaps the dormant `payoffProgression`
  placeholder (ISS-05) — same forward-chart plumbing, broader scope. **Build path if YES:** spec-first
  like other FG items; consult `golden-anchor-logic` (it derives money); EN/ES; informational-not-advice
  framing. **Rec: YES — queue behind FG-3.** It's the single most-common feature GA lacks that *doesn't*
  cross a regulatory/cost line, and it deepens the coaching story instead of chasing bank-feed parity.
  - *(Sub-note, not a question:* the 2026 coaching-app theme is "proactive intervention." GA already
    has `RemindersPanel` / `AlertsSettingsModal`; a small **rule-based money-health alert** — DSR or
    emergency-fund crossing a threshold — could ride that existing infra as a tweak. No new surface;
    fold into FG-5 or an alerts polish later. Flagging only so it isn't lost.)*
- **Intel — A4 (Advisor-in-a-Box) price anchors.** White-label advisor/coaching platforms are an
  active 2026 market: SuiteDash (branded client portal), TradingFront ($100/mo first 100 accts),
  and notably **pocketnest** — a white-label *financial-wellness* (coaching, not robo) platform, the
  closest analog to A4. Confirms the per-seat SaaS play is real and price-anchors the $49–99/agent/mo
  estimate. No decision needed — recorded for when A4 graduates.
- **Intel — B1 (employer charlas / B2B2C) validation.** Finhabits just launched **401(k) plans for
  small businesses**, targeting California's ~800k Latino-owned firms. Investing rails (GA's killed
  lane), but it confirms the *employer-paid Latino financial-wellness* channel B1 bets on is heating
  up. No decision needed.

## 2026-06-26 — whole-app review · owner yes/no (the 🟡owner findings; full list in ISSUES_LEDGER)
- **ISS-24 — advisor signup bypasses Premium.** Anyone can self-select "Advisor" at signup, and advisors are never gated → the Free/Premium model is bypassable. Is that acceptable (advisor = your firm, low abuse risk pre-launch) or should advisor signup be restricted (invite/allowlist)? **Rec: restrict advisor signup before public launch.**
- **ISS-25 — client-side Premium activation.** "I already subscribed — activate" flips the account to Premium with no server check. Now that `stripe-webhook` exists, tighten to webhook-only activation? **Rec: keep the honor-system button pre-launch, tighten at launch.**
- **ISS-26 — Stripe webhook grants premium before payment capture** (no `payment_status==='paid'`/mode check, no event de-dup). **Rec: YES, fix — add the paid/mode guard + idempotency (api change; do when you greenlight billing work).**
- **ISS-19 — portal sanitize leaks nested free-text** (`customAssets[].desc` etc. reach the public portal). Which nested fields are advisor-private vs client-visible? Once you say, I strip them server-side in `api/_sanitize.js`. **Rec: treat `desc`/any notes-like sub-field as private.**
- **ISS-21 — admin gated by mutable email.** The master-admin `list` is gated by auth email, not a stable uid. To harden, I need your real admin **user-ids** (from Supabase auth) to gate by uid. **Rec: send the uids; low urgency if Supabase email-confirm is on.**

> The cruise loop is cleared to fix the 🟢loop-ok findings without asking. **Shipped:** ISS-28/29 (HomeEquityCalc months/interest-saved) → v0.83.9. **Remaining loop-ok:** ISS-27 pagination, ISS-30–33 i18n. ⛔attended findings (ISS-12–18, ISS-20 auth-gate, ISS-23) wait for a focused attended session.

## 2026-06-26 — FG-3 spec ready for review (appended by finance-cron)

The **FG-3 spec is written** → `docs/superpowers/specs/FG-3-habit-streak-microlessons.md` (daily
habit/streak + bilingual micro-lessons; client-only, no-cost, isolated from the live save path —
no Claude API, no new Vercel function). Before the loop builds it, please answer (numbered shorthand
fine, "1. a 2. yes …"); my recommendation is in *italics*:

1. **Gating** — FREE for all client accounts, or Premium-only? *Rec: FREE — it drives the engagement
   that converts to Premium; gating it blunts the metric.*
2. **"Done" trigger** — a simple "Mark done today" tap, or require a real in-app action (updated a
   field / ran a calculator)? *Rec: self-report tap for v1.*
3. **Streak forgiveness** — hard reset on a missed day, or a 1-day grace / freeze? *Rec: hard reset
   v1; revisit if it feels punishing.*
4. **Persistence** — a new `habit_state` table, or a key on the existing `settings` row? *Rec: new
   table — `settings` has a cross-account cache-leak history (pitfall #18).*
5. **Advisor visibility** — should advisors see a client's streak / last-active (sanitized server
   read), or keep v1 client-only? *Rec: client-only v1; advisor hint in v2.*
6. **Reminders** — add a "don't lose your streak" email later (uses existing Resend), or never?
   *Rec: defer to v2 — it sends mail, so owner-gated.*
7. **Lesson voice** — OK for me to draft the ~30 bilingual micro-lessons in your coaching voice for
   you to edit, or do you want to write the seed set yourself?

## ✅ Earlier questions — answered (as of 2026-06-26)

All prior questions answered — decisions recorded in their canonical homes:
- **Feature-gap scan (FG-1..4):** FG-1 (AI assistant), FG-2 (auto-plan), FG-3 (habit/streak) = **YES** →
  scoped in [BACKLOG.md](BACKLOG.md) (FG-1/2 blocked on a Claude API key — owner dependency). FG-4
  (Plaid) = **HOLD**.
- **ISS-10 (npm audit, 4 vulns):** **fixed** 2026-06-26 (`npm audit fix`, 0 remaining) — see
  [ISSUES_LEDGER.md](ISSUES_LEDGER.md) + CHANGELOG.
- **Held stack (Q1) + missing infra (Q2):** resolved 2026-06-25 (stack shipped to main; docs lifecycle +
  cruise infra built).
