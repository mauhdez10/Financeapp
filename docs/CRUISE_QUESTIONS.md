> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Each entry REMOVED once the owner answers it. The file persists.

# CRUISE_QUESTIONS.md — unattended-tick questions for the owner

> The cruise tick appends yes/no questions here (with a recommendation) when it hits something it
> should not decide alone, then moves on. Newest on top. The owner answers; answered entries are
> pruned (kept one cycle as a pointer, then removed).

## 2026-06-26 — whole-app review · owner yes/no (the 🟡owner findings; full list in ISSUES_LEDGER)
- **ISS-24 — advisor signup bypasses Premium.** Anyone can self-select "Advisor" at signup, and advisors are never gated → the Free/Premium model is bypassable. Is that acceptable (advisor = your firm, low abuse risk pre-launch) or should advisor signup be restricted (invite/allowlist)? **Rec: restrict advisor signup before public launch.**
- **ISS-25 — client-side Premium activation.** "I already subscribed — activate" flips the account to Premium with no server check. Now that `stripe-webhook` exists, tighten to webhook-only activation? **Rec: keep the honor-system button pre-launch, tighten at launch.**
- **ISS-26 — Stripe webhook grants premium before payment capture** (no `payment_status==='paid'`/mode check, no event de-dup). **Rec: YES, fix — add the paid/mode guard + idempotency (api change; do when you greenlight billing work).**
- **ISS-19 — portal sanitize leaks nested free-text** (`customAssets[].desc` etc. reach the public portal). Which nested fields are advisor-private vs client-visible? Once you say, I strip them server-side in `api/_sanitize.js`. **Rec: treat `desc`/any notes-like sub-field as private.**
- **ISS-21 — admin gated by mutable email.** The master-admin `list` is gated by auth email, not a stable uid. To harden, I need your real admin **user-ids** (from Supabase auth) to gate by uid. **Rec: send the uids; low urgency if Supabase email-confirm is on.**

> The cruise loop is cleared to fix the 🟢loop-ok findings (ISS-27 pagination, ISS-28/29 calc, ISS-30–33 i18n) without asking. ⛔attended findings (ISS-12–18, ISS-20 auth-gate, ISS-23) wait for a focused attended session.

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
