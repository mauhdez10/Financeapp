# CRUISE_MODE.md — Golden Anchor Finance autonomous loop

> The single source of truth for unattended work. A cruise worker **follows this EXACTLY**.
> Live·canonical. Bootstraps from [UNIVERSAL_RULES.md](UNIVERSAL_RULES.md) → [STATE.md](STATE.md) →
> [LOGIC_MAP.md](LOGIC_MAP.md). Pairs with the `finance-app-updater`, `golden-anchor-logic`,
> `finance-review-mode` skills. Last updated 2026-06-25.

## GOAL (standing quality bar — not a finish line)
Get as much done as possible while **taking time on each step and making everything tight** — never
rush. Keep cycling the ordered map below, re-scanning and deepening; never declare "done" and idle.
The bar is *correctness and polish*, not speed.

## ABSOLUTE
- **NEVER touch Velo.** Separate repo + separate Supabase. Velo takes priority. For data use only the
  `supabase-finance` MCP (project `ukqqcrupyooqyksotieu`).
- **Production is live** at finance.goldenanchor.life; `git push origin main` auto-deploys.

## Workers & heartbeat (dual-trigger handshake)
Two workers coordinate via [CRUISE_HEARTBEAT.md](CRUISE_HEARTBEAT.md):
- **`finance-cron`** — fires ~every 15 min regardless of any open chat (the always-on failsafe).
- **`finance-session`** — an in-chat `/loop`, when one is running. Takes priority.

**Before each action:** `git pull origin main`; read the LAST line of `CRUISE_HEARTBEAT.md`. If it was
stamped **<35 min ago by the OTHER worker**, STOP this tick (the other loop is alive). Otherwise append
`<worker> · <UTC from: date -u> · starting <item>` and proceed. **Push the stamp only if safe** (see
push safety) — in a cron/cloud checkout the stamp may stay local; that's fine, the pull/yield logic
still prevents collisions for the in-session worker.

## PUSH SAFETY (critical — read with UNIVERSAL_RULES §6)
- Before ANY push: `git pull` and verify **`origin/main == HEAD`** (no surprise divergence).
- **Additive + fully verified** (bug fix, leak, crash, broken import, objective UX/a11y/copy) → push
  to `main`.
- **Live save / load / mutation path** (`gaSaveClient`, the array-diff persist effect,
  archive/split/join/delete, `gaLoadClient`/Summaries, bootstrap) that you **cannot verify
  headlessly**, OR anything you're unsure of → **do NOT push.** A cloud checkout is ephemeral, so
  "commit local" would be lost — instead **queue it**: append a yes/no (with your recommendation) to
  [CRUISE_QUESTIONS.md](CRUISE_QUESTIONS.md) and/or a line in [REVIEW_QUEUE.md](../REVIEW_QUEUE.md), and
  move on. Never break the live save path. Never block, never idle.

## THE ORDERED MAP (one action per tick, in this priority)
1. **Bugs / correctness** — fix all known issues before any new work. Source: [ISSUES_LEDGER.md](ISSUES_LEDGER.md)
   (🔴/🔁 first), then [BACKLOG.md](BACKLOG.md), then [REVIEW_QUEUE.md](../REVIEW_QUEUE.md).
2. **Competitor + feature-gap scan** — WebSearch competing finance/coaching apps; list features we
   DON'T have; log candidates as yes/no in `CRUISE_QUESTIONS.md` for the owner. (Research + log only —
   no feature-building without a yes.)
3. **Security review** — secrets exposure, auth, RLS, data handling, dependency/supply-chain audit
   (`npm audit`). Fix the safe/additive ones; queue anything risky or owner-gated.
4. **Website / UX improvement** — performance, accessibility, copy, contrast, layout. **Objective
   fixes** (a11y, perf, broken copy) → fix-and-(safely)-push. **Subjective / visual / taste** → build a
   mockup or HTML option set and queue it for the owner (design-mode = owner-only, see UNIVERSAL_RULES §8).

## DEFINITION OF DONE (four gates, every change)
`npm run build` (clean) → `npm run lint` (no NEW errors vs baseline) → **EN/ES symmetry** (every
new/changed visible string in BOTH `T.en` and `T.es`) → bump `__GA_BUILD__` in `src/App.jsx` (app
behavior changes only; NOT docs/tooling). Then doc-sync (CHANGELOG = why; ISSUES_LEDGER; STATE if the
picture changed; REVIEW_QUEUE lean) + lifecycle sweep (§4b).

## GUARDS (non-negotiable)
- **`golden-anchor-logic`** BEFORE any code that computes money / gates a role / enforces RLS / handles
  SSN / splits-joins a client.
- **`finance-app-updater`** on any App.jsx or canonical-doc change.
- **`finance-review-mode`** when acting on owner feedback; **`finance-feedback-intake`** for big batches.
- **D-1/D-37** architecture; **D-3** bilingual. Read the impact via [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md)
  before changing shared code (`primitives`, `utils/finance`, the theme pair, the save path).

## TESTING (no tool that needs the owner present)
- **Playwright** (headless) against deploy URLs — prod, or a Vercel branch-preview for unmerged work.
- **`supabase-finance` MCP** read-only for DB/RPC checks (rolled-back or test-account-only writes).
- **Probe-and-degrade:** on first run, check what's available (Playwright? preview env with Supabase?
  the MCP?). Use what's there; **log what you couldn't run** rather than faking it or failing.
- **BANNED** (need the owner present): agent-browser, computer-use, Claude-in-Chrome.
- Owner spot-checks prod on his phone asynchronously — leave clear notes of what to eyeball.

## DATA & PII SAFETY
All Supabase data is production (no separate sandbox). Real advisor/client rows are READ-ONLY; do
fixture work only against the test account's own rows, prefer rolled-back transactions. The auto-mode
classifier blocking persistent prod mutations is correct — never work around it. `finance-credentials.md`
+ anything under `docs/reference/` hold real secrets/PII — gitignored, NEVER commit or print full values.

## TEST ACCOUNT
`test@goldenanchor.life` / `Miami2020@` (advisor). Never use it for real client data.

---

## Appendix — the registered scheduled-task prompt (kept here under version control)
This is the prompt registered as the `finance-cron` scheduled task (and re-used by the in-session
`/loop`). It is intentionally short — it points here.

> Finance (Golden Anchor) CRUISE MODE — work autonomously, never stop. ABSOLUTE: never affect Velo
> (separate repo + Supabase; Velo takes priority). Bootstrap: read docs/UNIVERSAL_RULES.md →
> docs/STATE.md → docs/LOGIC_MAP.md, then docs/CRUISE_MODE.md, and FOLLOW CRUISE_MODE.md EXACTLY.
> Heartbeat handshake (worker "finance-cron" or "finance-session") before each action: git pull; read
> the last line of docs/CRUISE_HEARTBEAT.md; if stamped <35 min ago by the OTHER worker, yield; else
> stamp + proceed. PUSH SAFETY: pull and verify origin/main == HEAD before any push; additive+verified
> → push to main; live-save-path or anything unsure → DON'T push, queue a yes/no in
> docs/CRUISE_QUESTIONS.md and move on. Do ONE action per tick from the ORDERED MAP (bugs → competitor/
> feature-gap scan → security → website/UX) to definition-of-done (build → lint → EN/ES symmetry →
> bump __GA_BUILD__ → doc-sync + lifecycle sweep). Guards: golden-anchor-logic before money/role/RLS/
> SSN/split; finance-app-updater on app/doc changes. Test with Playwright on the deploy + supabase-
> finance MCP (read-only); NO agent-browser/computer-use/Claude-in-Chrome. Fix-and-(safely-)push what's
> sure; queue the rest; never block, never idle. Never affect Velo.
