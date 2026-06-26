# STATE.md — Golden Anchor Finance (current snapshot)

> The 60-second orientation for a fresh chat: where the project is **right now**. Updated on every
> batch (part of definition-of-done). For the full doc index see [LOGIC_MAP.md](LOGIC_MAP.md);
> always-on rules in [UNIVERSAL_RULES.md](UNIVERSAL_RULES.md); known issues in
> [ISSUES_LEDGER.md](ISSUES_LEDGER.md). Last updated: **2026-06-26**.

## Live now
- **Marker:** `__GA_BUILD__ = 2026-06-26-v08321-aiexport-marketinvestments` (v0.83.21).
- **Deployed:** https://finance.goldenanchor.life (Vercel auto-deploys `main`).
- **origin/main == local HEAD** — clean base, **no held stack** (the v0.83.1→v0.83.7 stack was
  approved and pushed 2026-06-25; the v0.83.1 save-toast gate shipped, accepted in test-mode).

## Codebase shape
- Single-file-origin React/Vite SPA. `src/App.jsx` ≈ 3,023 lines (down from 8,502) after the D-37
  Phase 0/1/2 extraction into `constants/ utils/ services/ components/ pages/ styles/ hooks/
  contexts/`. Plan + status: [ARCHITECTURE-PLAN.md](ARCHITECTURE-PLAN.md).
- **Phase 2 remaining (deferred, attended-only):** the `ClientDetail` / `Dashboard` shell
  decomposition — highest state coupling; do in a focused session, not an autonomous tick.
- Two roles live: **advisor** + **client**, isolated via auth `user_metadata`. Money/role rules:
  the `golden-anchor-logic` skill.
- Scale data layer shipped (v0.81–v0.83): advisor app holds summary rows + lazy-loads blobs;
  5 dashboard RPCs; reminders RPC; paged loaders. Source: `superpowers/` reports (archived).

## In flight (this work)
- **Documentation-lifecycle system (PLAYBOOK §4b/§4c) — ✅ DONE (2026-06-25).** `LOGIC_MAP`,
  `UNIVERSAL_RULES`, `STATE`, `ISSUES_LEDGER`, `DEPENDENCY-MAP` created; 12 done docs archived +
  stamped + dropped from the map; every ephemeral doc has a kill-condition; `CLAUDE.md` has a
  self-orienting bootstrap; the **`finance-review-mode`** + **`finance-feedback-intake`** skills are live.
- **CRUISE MODE infra — ✅ BUILT (2026-06-25).** `docs/CRUISE_MODE.md` (GOAL + ordered map +
  push-safety + gates + guards + testing + Velo isolation) and `docs/CRUISE_HEARTBEAT.md` (dual-worker
  handshake) are live; the registered prompt is version-controlled in CRUISE_MODE.md's appendix. Two
  workers (`finance-cron` ~15-min + `finance-session`) coordinate via the heartbeat. **LIVE as of
  2026-06-26** — `finance-backlog-loop` ENABLED (owner go-ahead). Already proven: a cron tick shipped a
  real PWA fix (`0ee6afc`) + ran the security audit. Pause anytime via the Scheduled sidebar.

## Where things live (so a fresh chat checks instead of asking)
- **Secrets / keys / logins:** `finance-credentials.md` (gitignored, repo root) — never commit/print.
- **Real client sample files (imports/exports/payloads):** **none on disk yet** (test-mode, no real
  data). When a `docs/reference/` folder is added, the review handler verifies against it.
- **Code-structure map:** `graphify-out/GRAPH_REPORT.md` + [APP-MAP.md](APP-MAP.md) →
  [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md).
- **DB:** `supabase-finance` MCP, project `ukqqcrupyooqyksotieu` (read-only for checks).

## Owner-pending (won't move without you)
- **FG-1 (AI assistant) + FG-2 (auto-plan) are DEFERRED** — owner 2026-06-26: "no cost things right now."
  They need a Claude API key + cost sign-off; the cruise loop will NOT pursue them until you re-green.
  FG-3 (habit/streak, no cost) is the active feature (spec-first).
- 2 Vercel env vars (`STRIPE_SECRET_KEY` + `STRIPE_WEBHOOK_SECRET`) → unlock auto-activation /
  any-amount checkout / MRR panel.
- Rotate all pasted secrets pre-launch (Stripe / Resend / GitHub PAT / Supabase `sbp_`).
- The 🟡 owner-decision items in [ISSUES_LEDGER.md](ISSUES_LEDGER.md).
