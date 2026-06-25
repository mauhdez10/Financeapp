# UNIVERSAL_RULES.md — Golden Anchor Finance

> **Read this FIRST, every session.** Short, always-on owner rules. When Mauricio says
> "universal rule," it lands here verbatim-in-spirit and is never dropped. Mirrors the
> Mauricio-OS PLAYBOOK §4 convention. The full doc index is [LOGIC_MAP.md](LOGIC_MAP.md).

## 0. Absolute
- **NEVER touch Velo.** The health-insurance CRM (Velo) is a separate project and repo. Never
  edit it, never push to it, and for data use **only** the `supabase-finance` MCP (project
  `ukqqcrupyooqyksotieu`) — **never** the Velo Supabase project. Velo always takes priority; this
  project must never affect it.
- **Production is live.** `git push origin main` auto-deploys to https://finance.goldenanchor.life.
  Treat every push as a deploy.

## 1. Communication
- Be **direct**. No compliments, no "Great question!". Treat Mauricio as a finance professional;
  don't over-explain basics.
- Default **English**; switch to Spanish only if he writes Spanish first.
- Numbered shorthand answers ("1. yes 2. a 3. skip") are valid — read as answers to the questions
  just asked.

## 2. Files & naming
- **Never date-suffix or version-suffix filenames.** No `App-v0.6.2.jsx`, no `App-backup.jsx`. One
  canonical name per file; history lives in git.
- **One owner per topic** (§4). On a change touch only the one owning doc + `CHANGELOG.md`
  (+ `UNIVERSAL_RULES` if a new rule). Don't edit every doc each time.

## 3. Editing the app
- **Always `git pull origin main` before editing** (parallel chats/loops push too).
- **Always `npm run build` after edits** (Vite catches JSX errors in ~1s).
- **Trust the build marker, not the docs** — confirm `__GA_BUILD__` in `src/App.jsx`; docs can lag.
- **D-1 / D-37 architecture:** edits land in `src/App.jsx` or the approved carve-outs
  (`constants/`, `utils/`, `services/`, `components/`, `pages/`, `styles/`, `hooks/`,
  `contexts/`). Don't propose new component-file splits beyond `docs/ARCHITECTURE-PLAN.md`.
- **Run the `finance-app-updater` skill** on any App.jsx / canonical-doc change.

## 4. Bilingual (D-3, hard lock)
- Every new/changed visible string MUST exist in **BOTH** `T.en` AND `T.es` in
  `src/translations.js`, in the **same edit**. No English-only strings, ever.

## 5. Money / roles / data — consult the logic skill first
- **Consult `golden-anchor-logic`** BEFORE touching any code that computes money (net worth, DSR,
  cash flow, payoff, emergency fund), gates a role (advisor vs client), enforces RLS, handles SSN,
  or splits/joins a client. These rules must not drift.
- **Access control gets an adversarial proof:** simulate each role and confirm it sees exactly what
  it should and **zero** of what it shouldn't — verify the UI/permission presets, not just rows.

## 6. Push discipline (stricter than fix-and-push)
- **Additive + fully verified** (a leak, a crash, a clearly-wrong value, a broken import) → push to
  `main`.
- Any change to the **live save / load / mutation path** (`gaSaveClient`, the array-diff persist
  effect, archive/split/join/delete, `gaLoadClient`/Summaries, bootstrap) that you **cannot verify
  headlessly** → commit locally, do NOT push, stage it in `REVIEW_QUEUE.md` for owner approval.
  **Never break the live save path — it is in production.**
- If **unsure**, append a yes/no question (with a recommendation) to `docs/CRUISE_QUESTIONS.md` and
  move on. Never block, never idle.

## 7. Verification
- **Verify in the real app, not by assertion.** Drive the running app (Playwright on the deploy, or
  the headless preview) and show proof. "It should work" is not verification.
- **Tools that need Mauricio present are banned in unattended work:** no agent-browser, no
  computer-use, no Claude-in-Chrome. Use Playwright (headless, against deploy URLs) + the
  `supabase-finance` MCP (read-only) instead.
- Gates before any push: `npm run build` → `npm run lint` → EN/ES symmetry → bump `__GA_BUILD__`.

## 8. Design mode
- Owner's standing rule (2026-06-05): **in design mode, quality is the only objective — cost and
  time are not constraints.** Use the full tool pipeline; see [DESIGN-MODE.md](DESIGN-MODE.md).
- **Subjective/visual/taste calls are owner-only** — build a mockup/HTML and queue it for review.
  Objective fixes (a11y, perf, broken copy, contrast) may be made directly.

## 9. Secrets
- `finance-credentials.md` is **gitignored** — never commit it, never print full secret values back.
  It holds every login/key/token + the env-var map. Rotate all pasted secrets before launch.

## 10. Documentation lifecycle (§4b) + review handler (§4c)
- Every doc is **live·canonical / live·cross-project / live·ephemeral / archived**. `LOGIC_MAP`
  indexes **only live** docs. Archive on **done + reviewed** only (never on "non-canonical," never
  delete). Every ephemeral doc needs a **kill-condition**.
- **Every owner input runs the `finance-review-mode` handler:** log faithfully → bidirectional
  impact-check → change as a replacement (not parallel) → update all affected canonical files +
  flip lifecycle states → verify on real files. Big batches go through `finance-feedback-intake`.
