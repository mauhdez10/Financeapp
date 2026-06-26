> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Each entry REMOVED once the owner answers it. The file persists.

# CRUISE_QUESTIONS.md — unattended-tick questions for the owner

> The cron failsafe tick appends yes/no questions here (with a recommendation) when it
> hits something it should not decide alone, then moves on. Newest on top.

## 2026-06-26 — security audit (cruise map step 3: `npm audit`) · owner yes/no
`npm audit` reports **4 vulnerabilities (2 high, 1 moderate, 1 low)**, all with a non-breaking
`npm audit fix` (no `--force`, semver-compatible — touches `package-lock.json` only, no top-level
`package.json` dep change). **Reachability analysis says none are exploitable in our production
deployment:**

| Pkg | Sev | Chain | Reachable in prod? |
|---|---|---|---|
| `form-data` 4.0.0–4.0.5 (CRLF injection) | high | `wait-on → axios` | **No** — `wait-on` is dev-only (dev-server/playwright readiness); never deployed |
| `ws` 8.0.0–8.20.1 (memory-exhaustion DoS) | high | `puppeteer-core` (api/ PDF render, D-34) | **No** — DoS needs a malicious WS *server*; puppeteer connects only to the chromium WE launch, not an attacker |
| `js-yaml` ≤4.1.1 (quadratic DoS) | moderate | `eslint → @eslint/eslintrc` | **No** — dev-only (lint) |
| `@babel/core` ≤7.29.0 (arbitrary file read) | low | `eslint-plugin-react-hooks` | **No** — dev-only (lint) |

**Why this is queued, not auto-pushed:** 3 of 4 are pure dev tooling (verifiable headlessly — `npm run
build` + `npm run lint` still pass after a fix), but the `ws` bump rides inside `puppeteer-core`, which
runs in the production `api/render` PDF path that **cannot be verified headlessly** in an unattended
tick (needs the Vercel serverless chromium env). A cloud checkout is ephemeral, so a local-only fix
would be lost. Per push-safety §6 + ordered-map step 3 ("fix the safe ones, queue anything risky"),
this is a queue. Tracked as **ISS-10**.

**Rec: YES, but in an attended session** — run `npm audit fix`, then `npm run build` + `npm run lint`
(confirms the dev-tooling fixes), then generate ONE client PDF on a Vercel preview (confirms the
`ws`/puppeteer bump didn't break PDF render) before pushing to `main`. Low urgency (nothing
prod-exploitable today) but it's pre-launch hygiene — a clean `npm audit` before go-live.
**Yes = clear it this way next time you're at the keyboard?**

## 2026-06-25 — feature-gap scan (cruise map step 2) · owner yes/no
Scanned Monarch, Copilot, Origin, EveryDollar, and **Fintor** (the one direct bilingual EN/ES
competitor). Candidates below are filtered for fit with GA's model (coaching ≠ management;
advisor-entered data; low-income/older/low-tech audience). Each is a yes/no — **none built without your go.**

- **FG-1 — In-app AI assistant (bilingual Q&A over the client's own data).** Monarch/Copilot/Fintor
  all ship a built-in "ask anything about your finances" assistant; GA only has "Copy AI summary"
  (export to an external AI). **Rec: YES** — strong coaching fit, GA already has the data + the summary
  groundwork; scope/cost (Claude API) is your call. *(Refs: Monarch, Copilot, Fintor.)*
- **FG-2 — Auto-generated personalized plan (multi-section, from the client's data, ends in your
  free-consult CTA).** Fintor's "7-section AI plan." GA has reports but no one-tap tailored plan.
  **Rec: YES** — leverages existing data + funnels to you (the advisor). Owner scope call.
- **FG-3 — Daily habit / streak + micro-lessons (bilingual).** Fintor + EveryDollar use streaks/daily
  coaching for engagement. GA has none. **Rec: MAYBE** — fits the mission and the low-tech audience,
  but it's a sizable new surface; worth it only if you want an engagement loop.
- **FG-4 — Optional automatic bank linking (Plaid), manual entry stays default.** Every major app
  auto-syncs; GA is manual (advisor-entered). **Rec: HOLD** — conflicts with the coaching/low-tech/
  advisor-entered model + adds cost & compliance; revisit only as an optional Premium add-on later.

## ✅ 2026-06-25 — both open questions ANSWERED (kept briefly for traceability, prune next sweep)
- **Q1 (held stack)** → **ANSWERED: approve all → main.** Owner approved in test-mode; the 9-commit
  stack shipped to `origin/main` at v0.83.7. Hold cleared.
- **Q2 (missing CRUISE infra)** → **ANSWERED: author the infra + docs system.** Done 2026-06-25 —
  LOGIC_MAP/UNIVERSAL_RULES/STATE/ISSUES_LEDGER/DEPENDENCY-MAP created; CRUISE_MODE.md + heartbeat
  to follow as part of the cruise build.

---

## 2026-06-24 — cron tick (ANSWERED above — historical)

### Q1 (BLOCKER for all pushes) — review & approve the held v0.83.1 to unblock the queue
`origin/main` is still at **v0.83.0** (`179ef52`). The local `main` is **5 commits ahead**, all held:

| commit | ver | what | push-safety |
|---|---|---|---|
| `8659934` | v0.83.1 | gate advisor save-success toast on save result | **THE genuine hold** — touches the live save path; the failure branch can't be reproduced headlessly |
| `3572400` | v0.83.2 | server RPC restores advisor reminders (No-Contact + High-DSR + Debt-Rising) | additive + fully verified (RPC already live in DB) |
| `636a8b5` | v0.83.3 | export-all/Backup pages full blobs + Backup-page import fix | additive + fully verified |
| `eba9180` | v0.83.4 | gaLoadClientSummaries pages past the 1000-row cap | load path; <1000 verified no-regression, >1000 not E2E-able |
| `2abf047` | v0.83.5 | Compare-tab `<tbody>` whitespace React-warning fix (this tick) | cosmetic + additive + fully verified |

**Because the held v0.83.1 sits between origin and HEAD, NO `git push origin main` is possible without
shipping v0.83.1 to production.** That is why this tick committed v0.83.5 LOCAL and pushed nothing —
the PUSH DISCIPLINE ("never break the live save path") overrides the heartbeat-push step.

**Recommendation:** review v0.83.1's one-line change (gate the green "Client saved" toast on
`gaSaveClient`'s boolean, so a failed save no longer shows success — see memory `scale-data-layer.md`
TASK 1). If you accept it, a single `git push origin main` ships all five (v0.83.1–v0.83.5). If you'd
rather hold v0.83.1 longer, cherry-pick `3572400`+`636a8b5`+`2abf047` (the three fully-verified additive
ones) onto `origin/main` and push those. **Yes = approve v0.83.1 and push the lot? (recommended)**

### Q2 (infra) — the CRUISE orchestration files don't exist
The cron task instructs "read `docs/CRUISE_MODE.md` … and follow it EXACTLY" and runs a heartbeat
handshake against `docs/CRUISE_HEARTBEAT.md`, but **none of `CRUISE_MODE.md`, `CRUISE_HEARTBEAT.md`,
or `CRUISE_QUESTIONS.md` existed** in the repo at tick time (this file was created now). The tick fell
back to the named source-of-truth chain (memory `scale-data-layer.md` Follow-ups → `REVIEW_QUEUE.md` →
`docs/BACKLOG.md`), which worked. The heartbeat handshake was also a no-op (no file = no other worker
to collide with) and was NOT committed/pushed (push is blocked per Q1 anyway).

**Recommendation:** either (a) add `docs/CRUISE_MODE.md` with the real ordered map + create an empty
`docs/CRUISE_HEARTBEAT.md`, or (b) update the scheduled-task prompt to point at the actual
source-of-truth chain and drop the heartbeat handshake. **Which: (a) author the infra files, or (b)
fix the task prompt?**
