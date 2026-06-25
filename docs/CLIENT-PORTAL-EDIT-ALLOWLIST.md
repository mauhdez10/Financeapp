> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Archive when portal-write (client_update_own_data) ships or is rejected.

# Portal — Client Edit Allow-List PROPOSAL (needs Mauricio's approval)

For portal migration 02 (`client_update_own_data` / `client_get_own_data`). Built from the
**real** `clients.data` top-level keys (verified live, keys-only, 2026-06-06). NOT applied —
this is a proposal for you to approve/adjust before the corrected migration is written.

Three buckets: **CLIENT-EDITABLE** (client can change via the portal), **CLIENT-READ-ONLY**
(client sees but cannot edit), **ADVISOR-ONLY / HIDDEN** (client never sees or edits).

## Security must-haves (non-negotiable)
- **SSNs never client-editable:** `social`, `p1Social`, `p2Social`. (Reading their own is debatable — recommend HIDDEN/masked in portal.)
- **Advisor notes never exposed:** `notes` → HIDDEN from `client_get_own_data`.
- **Historical integrity:** `monthSnapshots` must NOT be client-editable (it's the advisor's record). Read-only at most.
- Real key name is `incomeStreams` (NOT `income`) — the original draft would have no-op'd.

## Proposed buckets

| Key | v1 recommendation | Note |
|---|---|---|
| firstName, lastName | **EDITABLE** | own contact |
| email, phone, address, dob | **EDITABLE** | own contact |
| partnerFirst, partnerLast | **EDITABLE** | partner name |
| p1Phone, p1Email, p2Phone, p2Email | **EDITABLE** | partner contact |
| p1Dob, p2Dob | **EDITABLE** | |
| social, p1Social, p2Social | **HIDDEN** | SSNs — never edit; recommend not shown |
| notes | **HIDDEN** | advisor private notes |
| recommendedBy | **ADVISOR-ONLY** | referral source |
| clientType, archived, committed | **ADVISOR-ONLY** | status flags |
| servicePlan, planStrategy, reportInclude | **ADVISOR-ONLY** | advisor-set |
| monthSnapshots | **READ-ONLY** | historical record — integrity-critical |
| savedCalcs, savedCompare, savedPortfolio | **READ-ONLY** | advisor work artifacts |
| incomeStreams, bills, cards, loans, accounts | **DECISION NEEDED** | core financial inputs — see below |
| assets, liabilities, properties, marketInvestments, customAssets | **DECISION NEEDED** | financial inputs |
| alloc, portfolioCustom | **ADVISOR-ONLY** | advisor allocations |
| color1, color2 | EDITABLE (cosmetic) | person colors |
| currentMonthLabel, efMonths, hideNumbers | **ADVISOR-ONLY** | app/computed state |
| id | **NEVER** | system id |

## The one real product decision
**Can a client self-edit their financial inputs (income/bills/cards/loans/accounts/assets) between sessions?**
- **Option A — Conservative (recommended for v1):** client edits **contact info only**; all financial
  data is advisor-maintained during sessions. Lowest risk of corrupting the advisor's working model;
  the "My Info" screen becomes a contact-details form. Simplest to ship + secure.
- **Option B — Full self-service:** client can update income/bills/debts too (the buckets marked
  "DECISION NEEDED" become EDITABLE). More useful, but needs a "client-submitted vs advisor-confirmed"
  distinction so a client edit doesn't silently overwrite the advisor's numbers, and careful UX.

**Recommendation:** ship **Option A** in v1 (contact-only), revisit Option B after the portal is live
and the isolation tests pass. This keeps the launch surface small and the data model safe.

→ Once you pick A or B (and confirm the SSN/notes exclusions), I'll write the corrected migration 02
with the exact key list + the `data->>'id'` → uuid mapping fix for migration 03.
