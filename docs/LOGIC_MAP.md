# LOGIC_MAP.md — Golden Anchor Finance doc hub

> **The single index of every LIVE doc.** New chats start here. Hub → focused docs → code/DB.
> Indexes **only live** docs (PLAYBOOK §4b); archived/done work is in [archive/](archive/) and is
> deliberately NOT listed. Each row tagged: **①canonical** · **②cross-project** (shared, never
> archived) · **③ephemeral** (has a kill-condition). Last swept: **2026-06-25**.
>
> Read order for a fresh chat: **[UNIVERSAL_RULES](UNIVERSAL_RULES.md) → [STATE](STATE.md) → this map**,
> then the specific doc you need. Always-on rules + lifecycle live in UNIVERSAL_RULES.

## Rules & bootstrap
| Doc | Tag | What | Read when |
|---|---|---|---|
| [../CLAUDE.md](../CLAUDE.md) | ① | Auto-loaded session bootstrap (points here) | Every session (automatic) |
| [UNIVERSAL_RULES.md](UNIVERSAL_RULES.md) | ① | Always-on owner rules + lifecycle + review handler | FIRST, every session |
| [../AGENT.md](../AGENT.md) | ① | Locked architecture: decisions D-1…D-37, pitfalls #1…#19 | Before structural/decision work |

## Domain logic & how-to (skills)
| Doc | Tag | What | Read when |
|---|---|---|---|
| [../SKILL.md](../SKILL.md) | ① | **`finance-app-updater`** — the procedure to safely edit the app/docs | Before ANY app or canonical-doc change |
| [.claude/skills/golden-anchor-logic/SKILL.md](../.claude/skills/golden-anchor-logic/SKILL.md) | ① | Role rules, portal allow-list, every money formula + targets | Before money/role/RLS/SSN/split code |
| [.claude/skills/golden-anchor-design-surface/SKILL.md](../.claude/skills/golden-anchor-design-surface/SKILL.md) | ② | Design-system skill (brand colors/type/assets) for hi-fi mocks | Brand/visual design artifacts |
| [.claude/skills/finance-review-mode/SKILL.md](../.claude/skills/finance-review-mode/SKILL.md) | ① | The §4c handler for EVERY owner input (log → impact-check → replace → update+flip → verify) | Every time the owner gives feedback/answers/a bug |
| [.claude/skills/finance-feedback-intake/SKILL.md](../.claude/skills/finance-feedback-intake/SKILL.md) | ① | Big-batch front-end: parse → tag → round doc → recurrence check → refill → ask-once | A large/multi-item owner batch |

## Data & relationships
| Doc | Tag | What | Read when |
|---|---|---|---|
| [DEPENDENCY-MAP.md](DEPENDENCY-MAP.md) | ① | What-touches-what: module graph + DB tables/RPCs ↔ service fns; the fragile save path | Impact-check before any change (§4c) |
| [APP-MAP.md](APP-MAP.md) | ① | Surface map of pages/components/data flow | Orienting in the codebase |
| [../graphify-out/GRAPH_REPORT.md](../graphify-out/GRAPH_REPORT.md) | ③ | Machine code-graph (regenerate on big changes) | Deep structural questions |

## Decisions, history & plan
| Doc | Tag | What | Read when |
|---|---|---|---|
| [../CHANGELOG.md](../CHANGELOG.md) | ① | The decision ledger — versioned history + the *why* | Knowing what shipped/why |
| [ARCHITECTURE-PLAN.md](ARCHITECTURE-PLAN.md) | ① | D-37 modularization plan (Phase 2 in progress) | Before a structural refactor |

## Current state & work queues (live, ephemeral)
| Doc | Tag | What | Kill-condition |
|---|---|---|---|
| [STATE.md](STATE.md) | ① | 60-second current snapshot | (canonical — refreshed each batch) |
| [ISSUES_LEDGER.md](ISSUES_LEDGER.md) | ① | Known issues + recurrence tracker | (canonical — prune fixed after clean cycles) |
| [REVIEW_QUEUE.md](../REVIEW_QUEUE.md) | ③ | Owner checklist of pending items | Items removed once owner verifies |
| [BACKLOG.md](BACKLOG.md) | ③ | Ordered green-light execution queue | Drains into shipped work |
| [CRUISE_QUESTIONS.md](CRUISE_QUESTIONS.md) | ③ | Unattended-tick yes/no questions for owner | Entries removed once answered |

## Design
| Doc | Tag | What | Kill-condition |
|---|---|---|---|
| [DESIGN-MODE.md](DESIGN-MODE.md) | ① | Design-tool pipeline + overlap rulings | (canonical methodology) |
| [DESIGN-TOOLKIT-STUDY.md](DESIGN-TOOLKIT-STUDY.md) | ② | Deep study of each design tool | (cross-project reference) |
| [../design-system/charts/MASTER.md](../design-system/charts/MASTER.md) | ② | Chart design specs | (cross-project reference) |
| [DESIGN-POLISH-PUNCHLIST.md](DESIGN-POLISH-PUNCHLIST.md) | ③ | 38-item professional-polish spec | Archive when all 38 shipped or descoped |
| [DESIGN-PICKS-2026-06-04.md](DESIGN-PICKS-2026-06-04.md) | ③ | Owner's design-lab picks | Archive when picks are ported |

## Content & feature specs (live, ephemeral)
| Doc | Tag | What | Kill-condition |
|---|---|---|---|
| [USEFUL-LINKS-DIRECTORY.md](USEFUL-LINKS-DIRECTORY.md) | ① | Source catalog (147 links) for the in-app directory | (canonical source of the directory content) |
| [CALCULATOR-ROADMAP.md](CALCULATOR-ROADMAP.md) | ③ | Calculator gap analysis + P1 priorities | Archive when P1 calcs shipped/descoped |
| [CLIENT-PORTAL-EDIT-ALLOWLIST.md](CLIENT-PORTAL-EDIT-ALLOWLIST.md) | ③ | Portal-write editable-field allow-list | Archive when portal-write ships or is rejected |
| [CLIENT-PORTAL-LASTMILE.md](CLIENT-PORTAL-LASTMILE.md) | ③ | feature/client-portal completion notes | Archive when that branch merges or is abandoned |
| [DIFFERENTIATION-IDEAS.md](DIFFERENTIATION-IDEAS.md) | ③ | 16 growth ideas, top-5 sequenced | Accepted ideas move to BACKLOG; archive when exhausted |

## Presentations & intake (live, ephemeral)
| Doc | Tag | What | Kill-condition |
|---|---|---|---|
| [GTM-CLIENT-PITCH.md](GTM-CLIENT-PITCH.md) · [GTM-AGENT-RECRUIT.md](GTM-AGENT-RECRUIT.md) · [GTM-INVESTOR-BRIEF.md](GTM-INVESTOR-BRIEF.md) | ③ | GTM collateral (need `[OWNER: fill]`) | Archive when finalized/launched |
| [ADVISOR-SOP.md](ADVISOR-SOP.md) | ① | Advisor operating procedure — first contact → lifelong client (pairs with the questionnaire) | (canonical operations manual) |
| [MASTER-QUESTIONNAIRE.md](MASTER-QUESTIONNAIRE.md) | ② | Reusable client intake interview (EN/ES) | (cross-project sales tool) |

## Tests & secrets
| Doc | Tag | What | Notes |
|---|---|---|---|
| [../README.md](../README.md) | ① | Playwright e2e scaffold (setup, smoke, CI) | Test-suite maintenance |
| `../finance-credentials.md` | — | **Gitignored secrets** (logins/keys/env map) | NEVER committed/printed; not a tracked doc |

---
**Archived** (history only, never linked as live): see [archive/](archive/) — incl. the shipped
2026-06-11 MASTER-DIRECTIVE (v0.76.2), the scalable-data-layer plan/spec/reports (v0.81–v0.83),
dashboard-rewrite, PRICING-AUDIT, MODERN-REDESIGN, old audits/workplan.
