# Advisor SOP — From First Contact to Lifelong Client

> **Purpose (Master Directive §J):** Mauricio's operating procedure for running a client
> through Golden Anchor efficiently. Pairs with `docs/MASTER-QUESTIONNAIRE.md` (the Q
> referenced throughout). Built for the mission: low-income families and older, low-tech
> clients. Pricing per the locked catalog (D-13): Checkup **$149** · Quarterly **$199** ·
> Strategy **$129** · Annual **$499** · Lite **$49/mo** · Lite+ **$79/mo** · health-insurance
> consult **free** · returning-client code **GACLIENT50**.

---

## 1. First Contact (day 0 — respond within 24h)

**Where leads come from:** referrals (ask Q-1.8 and log `recommendedBy` — thank the
referrer); onboarding signup checkboxes (free health-insurance consult / car-insurance
interest — see §8 monthly sweep); the public intake link; walk-ups at community events.

**The only goals of first contact:** get a name + phone, book a 15-minute discovery call,
and set the tone. Script:
- EN: "I help families get control of their money — no judgment, no selling. First chat is
  free and takes 15 minutes. When's good this week?"
- ES: "Ayudo a familias a tomar control de su dinero — sin juicios, sin ventas. La primera
  charla es gratis y toma 15 minutos. ¿Cuándo le queda bien esta semana?"

Do **not** quote prices or ask for numbers yet. Older/low-tech clients: offer phone or
in-person — never force an app or email step at this stage.

## 2. Discovery Call (15 minutes — use Questionnaire §10)

1. Run the **15-minute quick version** exactly as written (Q-§10, items 1–7).
2. While talking, open the app → **Clients → New client** and enter what you hear live
   (names, phone, clientType, the one-row income/bills/debt totals). Five minutes of typing
   now saves a full re-entry later.
3. Close with the free health-insurance consult offer (Q-6.2) — it costs them nothing and
   builds trust even if they don't buy anything.
4. **Decision point:** if they want help → recommend ONE service (default: **Financial
   Checkup $149**; returning clients: mention **GACLIENT50**). If hesitant → invite them to
   make a **Free account** ("you can see your own numbers, no charge") and diary a 2-week
   follow-up.
5. Book the full meeting (60–90 min) and send/read the documents list (Q-§8).

## 3. Engagement Letter + Intake Invite

1. App → **Intake Forms → New invite** → enter their email → send. The public intake walks
   them through: Welcome → pick Service → **Engagement letter (signed here, not at account
   signup)** → Your information → Done.
2. Tech-comfortable clients fill the intake themselves before the meeting (it mirrors
   Q-§1–§7: contact, income, bills, cards, assets, goals). **Older/low-tech clients: skip
   self-serve** — sign the engagement letter together at the meeting and YOU fill the form
   while running the questionnaire aloud. Never let the form become a barrier.
3. Payment: send the Stripe payment link for the chosen service (Settings → Stripe links).
   Cash/Zelle clients: log it in your records; the app is not the payment system.
4. When an intake submission arrives: **Intake Forms → open submission → review → convert
   to client** (or merge into the discovery-call record — don't create duplicates).

## 4. Data Entry — fastest path (target: 25–35 min per full client)

> **Hard rule (Master Directive §J.2 pushback, logged):** NEVER ask for bank usernames or
> passwords. Questionnaire answers + paper/PDF statements are the source. Bank-connected
> import (Plaid-style) only later, **opt-in**, for clients who ask for it.

Open the client → enter tabs in this order (it matches the questionnaire, so you can type
straight down your notes):

| Step | Where | What | Tips |
|---|---|---|---|
| 1 | Edit client (kebab → Edit) | Names, partner, phone, email, DOB, clientType, recommendedBy, servicePlan | SSN only if an insurance app needs it (Q-1.7) |
| 2 | **Income** section | One stream per income source, per person | Enter amounts at their real frequency (weekly/biweekly/…) — the app converts to monthly. Use NET from the paystub; gross too if shown |
| 3 | **Bills** section | Every bill from Q-§3 | Set `type` right: temporary bills get a maturity date, annual bills a due month — this keeps the monthly math honest. Due days power the reminders |
| 4 | **Debt** (cards) | Balance, APR, limit, min, due day per card | **Always enter promos** with their end date (Q-4.5) — the app alerts you 60 days before a 0% promo expires |
| 5 | **Loans** | Balance, type, APR | Skip loans tied to a house/car you'll enter in step 7 — see tip there |
| 6 | **Accounts** | Checking, savings, retirement, IRA | Type matters: only checking/savings/money-market count as emergency fund. "Cash at home / envelope" → savings account named "Cash" |
| 7 | **Assets** (physical) | Home, vehicles, business, land | Enter remaining debt **on the asset itself** (`currentDebt` + APR) — the app auto-creates the linked loan. Don't also add it in step 5 (double-count) |
| 8 | **Investments** | Stocks/crypto, ticker + value | NICE-level; skip if none |
| 9 | **Notes** | Goals short/mid/long + #1 worry; setbacks → the private fields | Private notes (general, setbacks) never reach any portal — write freely |
| 10 | **Monthly** tab | Save the month snapshot | This is the baseline every future "look how far you've come" chart compares against. Non-negotiable |

**Statement-reading shortcuts:** card statements — balance/APR/min are in the top summary
box, promo expiry in the "promotional rates" table. Paystubs — gross top line, net bottom
line, frequency from the pay-period dates. Bank statement — scan the transactions list for
recurring names you missed in Q-3.2 (streaming, subscriptions, transfers). If a client
brings a CSV export, sort by description and eyeball recurring rows — but hand-keying
10 bills is usually faster than cleaning a CSV.

**Quality gate before the review meeting:** dashboard shows no $0 income, cash flow looks
plausible (±10% of "what's left over" from the call), every card has an APR, snapshot saved.

## 5. Report Review Meeting (the product — 45–60 min)

Order: **numbers → chart → plain words**, one idea at a time. Never show two charts at once.

1. **Cash flow first.** Waterfall chart. EN: "Money in, money out — this is what's left
   each month." ES: "Lo que entra, lo que sale — esto es lo que queda cada mes."
2. **Net worth.** EN: "Everything you own minus everything you owe. We'll watch this number
   grow." ES: "Todo lo que tiene menos todo lo que debe. Vamos a ver crecer este número."
3. **One gauge:** debt-service ratio. EN: "Out of every $100 you bring home, $X goes to
   debt. Under $36 is the goal." ES: "De cada $100 que trae a casa, $X se van a deudas. La
   meta es menos de $36."
4. **Emergency fund gauge.** Frame it as months, never dollars: "you have 1.2 months of
   cushion; we're building to 3" / "tiene 1.2 meses de colchón; vamos por 3."
5. **The plan:** payoff chart for their highest-APR card + the allocation split. ONE action
   per meeting (e.g., "pay $50 extra on this card"). More than one action = none happen.
6. **End on their goal** (Q-7.1): "this is how this plan gets you to ___."

**Modo Sencillo — older / low-vision clients:**
- Bump the app **zoom in Settings → Appearance** before they sit down; pick whichever of
  light/dark mode they read more comfortably (warm light mode is usually easier on older eyes).
- Switch the app to **Spanish** before the meeting if that's their language — don't translate live.
- One chart per screen, full screen. Let THEM hold the mouse/finger on the second pass.
- Meeting in a public place? Toggle **Hide numbers** (client flag) — charts keep their
  shape, amounts blur.
- Print or PDF one page max. Send the **share-portal link** to a trusted adult child if the
  client asks ("mi hija maneja mis cosas") — it's read-only and strips SSN/DOB/private notes
  by design (logic SKILL §2). Pick which sections it shows.

## 6. Follow-Up Cadence by Plan

| Tier | Cadence | What happens |
|---|---|---|
| **Free** | 1 nudge at 2 weeks, then quarterly email | "How's the app going?" + free consult reminder. No advisor work owed |
| **Premium (self-serve)** | Quarterly email | Feature tips; invite to a paid Checkup when life changes |
| **Checkup $149 (one-time)** | Day 7 text + day 90 offer | Day 7: "did you do the one action?" Day 90: returning-client Checkup with **GACLIENT50** |
| **Lite $49/mo** | Monthly 20-min check-in (call ok) | Update the month snapshot live, review the one action, set next one |
| **Lite+ $79/mo** | Monthly check-in **+ 1 Strategy Session/mo** | Strategy Session = one deep topic (buy a car, tax refund plan, insurance) |
| **Quarterly $199** | Every 3 months, 45 min | Full re-run of §5 with month-compare charts |
| **Annual $499** | Quarterly reviews + priority access | Treat as Lite+ cadence with deeper quarterly reviews |

Every follow-up touch = open the client, **save a month snapshot**. The trend charts are
the retention engine — "look at this line" renews more plans than any pitch.

## 7. Referral-Network Handoffs

When a need is outside scope (car insurance, realtor, taxes, immigration legal, etc.):
1. **Disclose, always.** EN: "I'm sending you to someone I know and trust. I may have a
   relationship with them, and you're free to use anyone you want." ES: "Le voy a referir a
   alguien que conozco y de confianza. Puedo tener una relación con esa persona, y usted es
   libre de usar a quien quiera."
2. Warm handoff: text/email an intro naming both parties — never just hand over a number.
3. Log it in the client's private notes (`general`): who, for what, date.
4. No trusted contact for the need? Point to the vetted **Useful Links directory**
   (`docs/USEFUL-LINKS-DIRECTORY.md` categories) instead — never guess a vendor.
5. Keep the network list in Settings (referral contacts page, Master Directive §K.2) current.

## 8. Monthly Admin Checklist (first business day, ~30 min)

- [ ] **Members page** — scan new signups; welcome-email any new client accounts.
- [ ] **Insurance leads sweep** — pull everyone who checked "free health-insurance consult"
      or "car insurance interest" at onboarding; contact within the week (these are the
      warmest leads the app produces).
- [ ] **Dashboard alerts** — work the no-contact list (≥30 days; >60 is overdue), high-DSR
      flags (>36%), and **promo-expiry warnings** (≤60 days — call those clients first; a
      0% promo lapsing to 28% APR is an emergency).
- [ ] **Snapshots** — every active client has the prior month saved; bulk-snap stragglers.
- [ ] **Returning clients** — anyone whose one-time Checkup was ~90 days ago → GACLIENT50
      outreach (§6).
- [ ] **Archive** — clients inactive 6+ months and unresponsive → archived (they keep their
      data; the dashboard stays honest).
- [ ] **Stripe links + referral contacts** — spot-check links still work, prices match the
      catalog, network list current.
- [ ] **Pipeline** — every intake submission has been converted or replied to; no orphans.
