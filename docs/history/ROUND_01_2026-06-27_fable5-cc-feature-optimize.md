# ROUND 01 — 2026-06-27 — CC feature + Velo/OS harvest + optimization research

> 🔖 **Live · ephemeral** (lifecycle §4b). **Kill-condition:** archive when every item below is
> shipped + owner-verified. Captured verbatim per finance-feedback-intake §1 (owner's exact words
> first, analysis after). Owner switched model to Fable 5 for this batch.

## Owner's message (verbatim)
> "ok so you have now fable 5. please check the project on HEalth crm. there are new workflows and
> new things that might help you also check mauricio OS. try to use as many usefull things as you can.
>
> Also i wanted to add a feature for creditcard to have when was the last used and when was the 0 apr
> ending if they dont have it.
> and add a reminder for clients to be able to turn on and of to let them know when x ammount of
> months have passed wihtout using them.
>
> I need you to doo a deep research on how to optimize this project, the tasks and start working on it."

## Items

| ID | Type | Area | Gate? | Owner-decision? | Item |
|---|---|---|---|---|---|
| R01-01 | ⚙️ recon | Velo (`health-crm`) — READ ONLY | no | no | Harvest new workflows / patterns / skills from the Health-CRM project that could help finance. **ABSOLUTE: never edit Velo.** |
| R01-02 | ⚙️ recon | `mauricio-os` (INVENTORY/MODES/GUIDES/skills) | no | no | Check the OS for new useful things; adopt what applies. |
| R01-03 | 🟣 feature | card model (`cards[]`, finance.js `mk`/`migrateCard`) + CardModal/DebtSection | **YES** (money/card model + save-path) | scope | Add card **"last used"** date field. |
| R01-04 | 🟣 feature | card model + CardModal | **YES** | scope | Add card **"0% APR ends"** date "if they don't have it." NOTE: promos[] already carry `{rate:0, end}` — likely wants a simpler card-level field for cards without a promo entry. Needs clarification. |
| R01-05 | 🟣 feature | reminder engine (`getClientRem`) + client settings toggle | **YES** (client-role + reminders) | scope | Client-toggleable reminder: alert when **X months** passed without using a card (uses R01-03 last-used). Client turns on/off + sets X. |
| R01-06 | 🔬 research | whole project | no | scope | Deep research on how to **optimize this project** + the task list, then start working. |

## Recurrence cross-check (vs ISSUES_LEDGER)
- R01-04/R01-05 relate to **ISS-04** (promoExpiring + per-bill/card "Client Due" reminders are
  blob-only; need summary columns + backfill for the SERVER reminder path). The advisor
  `promoExpiring` reminder already exists (getAdvRem, fires ≤60d before promo `end`). The NEW ask is a
  **client-side** unused-card reminder — a different reminder type. Not a regression; net-new.
- Card model change (R01-03/04) flows through the **save path** (gaSaveClient persist) → attended,
  golden-anchor-logic gate. Relates to the ⛔attended save-path cluster (ISS-12–18).

## Status
- Cron loop PAUSED during this attended batch (re-enable at end).
- Recon (R01-01/02) dispatched read-only.
- Clarifying questions: asked in one pass (see below / CRUISE_QUESTIONS).
