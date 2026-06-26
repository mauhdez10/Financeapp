> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](../../LOGIC_MAP.md)). **Kill-condition:**
> REMOVED once the owner approves it (it then graduates to a plan in `docs/superpowers/plans/`) or
> rejects it (then archived with the decision). Until then it is the FG-3 design of record.
> Authored by the cruise loop (`finance-cron`) 2026-06-26 — **spec only, nothing built.** Per
> [BACKLOG.md](../../BACKLOG.md): FG-3 is owner-approved in *direction* (no cost), but the full
> surface must NOT be blind-built in an autonomous tick — this spec is queued for owner review first.

# FG-3 — Daily habit / streak + micro-lessons (bilingual)

## 1. What it is, in one line
A lightweight daily-engagement layer for **client accounts**: open the app, do one tiny money
action (a 30-second "money minute"), read a one-screen bilingual micro-lesson, and keep a visible
**streak**. The hook that turns "I'll check my finances someday" into a daily habit — the single
biggest predictor of whether coaching actually changes behavior.

## 2. Why (fit with the product)
- The app is **coaching, not management** (CLAUDE.md). Coaching only works if the client shows up.
  A streak is the cheapest, most-proven retention mechanic and it reinforces the brand promise.
- **No new cost** (owner's 2026-06-26 constraint): micro-lessons are static bilingual content
  shipped in the bundle; streak state is a tiny per-account row. **No Claude API, no new paid
  service, no new Vercel function** (stays under the 12-function cap, pitfall #20 — streak
  read/writes go through the existing Supabase client under RLS, not `api/`).
- Differentiator already on file: `docs/DIFFERENTIATION-IDEAS.md` lists engagement/streak mechanics;
  this is the concrete, shippable slice.

## 3. Scope

### In scope (v1)
- A **Today card** on the client **Overview** (top of `ClientDetail` `clientMode`): greeting, the
  current streak count + flame, today's **one** micro-lesson (title + 2–4 sentences + one optional
  "try this"), and a single **"Mark done today"** action.
- **Streak engine**: increments once per local day the client completes the day's action; shows
  current streak, longest streak, and a 7-day dot strip.
- **Micro-lesson library**: ~30 bilingual lessons (EN/ES, D-3) on a rotation, each one screen,
  tagged by theme (budgeting, debt, saving, insurance literacy, mindset). Content is static data
  (new carve-out file, see §6) — no DB, no API.
- **Persistence**: a new `habit_state` table (one row per account) OR a key inside the existing
  `settings` row — see Open Question 4. Either way it is **separate from the client financial blob**
  and never touches the live save path (`gaSaveClient`, the array-diff persist effect).

### Out of scope (v1 — explicitly, so nothing is silent)
- AI-personalized lessons (that is **FG-1/FG-2**, deferred — needs the Claude API key).
- Push/email reminders ("you'll lose your streak"). Possible v2 via the existing Resend wiring;
  flagged as Open Question 6 because it sends mail.
- Advisor-side gamification dashboards / leaderboards.
- Rewards, points, badges beyond the streak number + longest-streak (keep v1 honest and minimal).
- Any change to money formulas, roles, RLS boundaries, or the portal allow-list.

## 4. Roles & gating (consulted `golden-anchor-logic` §1)
- **Audience = client accounts.** Role source of truth stays `user.user_metadata.role` — read it,
  never store/derive role from `settings` (pitfall #18). The Today card renders only in the client
  shell's Overview; the advisor app is unchanged.
- **Advisor account:** v1 shows **nothing** new (the advisor isn't the habit audience). Optional
  later: a read-only "client last active / current streak" hint on the advisor client list — that is
  a **client-data read across accounts**, so it would route through a sanitized server read, NOT a
  direct cross-account SELECT (same discipline as the portal/Link-R). Deferred → Open Question 5.
- **Premium gating?** The Useful-Links directory is Premium-gated for clients; calculators/upsell
  use the choose-your-price model. A daily-habit hook is a **retention** feature — gating it behind
  Premium would blunt the exact metric it exists to move. **Recommendation: FREE for all client
  accounts** (it drives the engagement that later converts to Premium). Owner decides → Open
  Question 1. Plan status keys off the client's own `accountPlan` exactly as today; FG-3 never
  changes Premium status.

## 5. UX surface (D-1 single-file; lands in the client Overview)
- **Today card** at the top of `ClientDetail` when `clientMode` is on (above the existing Overview
  content). Quiet, on-brand: glass `mCARD`, mono streak number (the "private bank number" look from
  the design system), a calm flame glyph, a 7-dot week strip (filled = completed that day), the
  lesson body, and one primary action button.
- **States:** not-done-today (action live) → done-today (button becomes a check + "Come back
  tomorrow", streak ticks up with a small rise/press motion, no page jump). Empty/first-day state:
  "Day 1 — let's start." Broken-streak state: gentle, non-punitive ("Streak reset — start a new
  one," never red/alarm).
- **Localization:** fully bilingual via `translations.js` (D-3). Every string — card chrome, states,
  and all lesson content — exists in both `T.en` and `T.es` in the same edit. Respects the client's
  language setting, which already re-renders live (v0.69).
- **Mobile-first (D-27):** the card is a single column, comfortably tappable (40–44px action),
  centered modal if any detail view is added.
- **Accessibility:** the streak isn't conveyed by color/flame alone (number + "N-day streak" label);
  the week strip dots carry text labels; action button has a clear focus ring.

## 6. Data & persistence (grounded in the real schema — read-only check 2026-06-26)
Existing tables: `clients, settings, intake_submissions, intake_invites, sms_consent_log,
portal_links, client_links, client_monthly_summary` — all RLS-enabled.

**Two viable options (Open Question 4):**

- **Option A — new `habit_state` table (recommended).** One row per account:
  `user_id uuid PK/FK (auth.uid())`, `current_streak int`, `longest_streak int`,
  `last_done_date date` (the client's local date of the last completion),
  `completed_dates jsonb` (rolling last ~14 for the dot strip), `lesson_cursor int` (rotation
  pointer), `updated_at timestamptz`. RLS: `auth.uid() = user_id` for select/insert/update — the
  same boundary every other table uses. **Pro:** fully isolated from the financial blob, can't
  collide with the array-diff persist effect, trivial to reason about. **Con:** one migration +
  one new RLS policy set (additive, reversible).
- **Option B — a `habit` key on the existing `settings` row.** No migration. **Con:** `settings`
  is client-cached in localStorage and has a cross-account-leak history (pitfall #18); mixing daily
  mutable streak state into it invites cache-staleness bugs and complicates the uid-tagged cache
  rules. **Not recommended.**

**Streak-write path (critical — must NOT touch the live financial save path):** the "Mark done"
action writes ONLY to `habit_state` (Option A) via the Supabase client under RLS. It is a standalone
mutation — it never calls `gaSaveClient`, never enters the array-diff persist effect, never writes
the client blob. This keeps the production save path untouched (UNIVERSAL_RULES §6).

**Micro-lesson content** lives in a new pure-data carve-out, e.g. `src/constants/microLessons.js`
(D-1 allows pure-data carve-outs like `translations.js`): an array of
`{ id, theme, en:{title, body, tryThis?}, es:{title, body, tryThis?} }`. No DB, no API — ships in
the bundle (watch ISS-07 bundle size; ~30 short lessons is a few KB, negligible).

## 7. Streak logic (the rules that must be pinned before code)
- **A "day" = the client's local calendar date.** Store `last_done_date` as a date string computed
  client-side from their timezone (not UTC) so "today" matches what the user sees. (Open Question 3
  covers grace/freeze.)
- **Increment rule:** on "Mark done", if `last_done_date` is yesterday → `current_streak += 1`; if
  it's today already → no-op (idempotent, can't double-count); if it's older than yesterday →
  streak resets to 1. `longest_streak = max(longest_streak, current_streak)`.
- **What counts as "done"?** v1 = the explicit "Mark done today" tap after the lesson is shown
  (honest + simple). Open Question 2 asks whether to tie it to a real action (e.g. updated a
  number, opened a calculator) instead of a self-report tap.
- **No server clock dependency for correctness** beyond `updated_at`; the date comparison is the
  source of truth, guarded against client-clock abuse only loosely (this is self-coaching, not a
  competition — no anti-cheat needed in v1).

## 8. Open questions for the owner (numbered — answer "1. a 2. yes …")
1. **Gating:** FREE for all client accounts (my recommendation), or Premium-only? — *Rec: FREE.*
2. **"Done" trigger:** simple self-report tap (v1, recommended), or require a real in-app action
   (updated a field / ran a calculator)? — *Rec: self-report tap for v1, upgrade later.*
3. **Streak forgiveness:** hard reset on a missed day (recommended, simplest + honest), or a 1-day
   grace / monthly "freeze"? — *Rec: hard reset v1; revisit if it feels punishing.*
4. **Persistence:** new `habit_state` table (recommended) vs. a key on `settings`? — *Rec: new table.*
5. **Advisor visibility:** should advisors see a client's streak / last-active (sanitized server
   read), or keep v1 client-only? — *Rec: client-only v1; add advisor hint in v2.*
6. **Reminders:** add a "don't lose your streak" email later (uses existing Resend), or never? —
   *Rec: defer to v2; it sends mail, so owner-gated.*
7. **Lesson voice:** OK for me to draft the ~30 bilingual micro-lessons in *your* coaching voice
   (educational, not advice; bilingual), for you to edit — or do you want to write the seed set?

## 9. Build phases (after approval — each to definition-of-done: build → lint → EN/ES → bump marker)
1. **Data + content:** `habit_state` migration + RLS (Option A); `src/constants/microLessons.js` seed
   (10 lessons to start, EN/ES). Adversarial RLS proof: a client can read/write only its own row.
2. **Engine:** a small `useHabitStreak` hook (date math + idempotent increment + Supabase read/write),
   fully unit-reasoned against §7 rules.
3. **Today card UI** in the client Overview, all states, bilingual strings, mobile + a11y, dual-mode.
4. **Verify** (Playwright headless on a Vercel preview, client account `clientdemo@`): mark-done
   ticks the streak, refresh persists it, same-day re-tap is a no-op, advisor app unchanged, and the
   adversarial role proof stays green. Then expand to ~30 lessons.

## 10. Risks / guardrails
- **Don't touch the live save path** — streak writes are isolated (§6). ✅ by design.
- **D-3 bilingual** — every lesson + every chrome string in both languages, same edit. ✅ required.
- **Role isolation** — client-only surface, role from auth token, no cross-account read in v1. ✅.
- **Bundle size (ISS-07)** — static lessons are tiny; if the library grows large later, lazy-load it.
- **Scope creep into FG-1/FG-2** — keep v1 fully static; AI personalization is explicitly deferred.

---
*Status: queued for owner review (see [REVIEW_QUEUE.md](../../../REVIEW_QUEUE.md)). No code shipped.*
