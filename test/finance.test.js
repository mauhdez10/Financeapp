// Money-layer characterization tests — lock the canonical formulas in
// .claude/skills/golden-anchor-logic §3 (the recurring bug class: ISS-44…92 —
// effectiveMin vs raw .min, payM NaN guards, net-worth/DSR divergence, MI omissions).
// Runner: Vitest (resolves Vite's extensionless imports). `npm test`.
import { describe, it, expect } from "vitest";
import {
  FREQ, toM, effectiveMin, sumMin, payM, mthPmt, cardMoInt,
  sumN, sumG, sumB, totalA, totalL, liquidA, getProperties, availCredit,
  actB, getClientRem, getAdvRem, mig,
} from "../src/utils/finance.js";

describe("toM — frequency normalization to monthly (§3 FREQ)", () => {
  it("monthly2 is identity", () => expect(toM(100, "monthly2")).toBe(100));
  it("semimonthly = ×2", () => expect(toM(100, "semimonthly")).toBe(200));
  it("annual = ÷12", () => expect(toM(1200, "annual")).toBeCloseTo(100, 6));
  it("weekly = ×52/12", () => expect(toM(100, "weekly")).toBeCloseTo(100 * 52 / 12, 6));
  it("biweekly = ×26/12", () => expect(toM(100, "biweekly")).toBeCloseTo(100 * 26 / 12, 6));
  it("FREQ table matches §3", () => {
    expect(FREQ.semimonthly).toBe(2);
    expect(FREQ.monthly2).toBe(1);
    expect(FREQ.annual).toBeCloseTo(1 / 12, 6);
  });
});

describe("effectiveMin — card minimum (§3): balance>0 ? min(balance, max(25, min ?? est)) : 0", () => {
  it("uses the stated min when it clears the $25 floor", () =>
    expect(effectiveMin({ balance: 4961, apr: 28.3, min: 116.99 })).toBeCloseTo(116.99, 2));
  it("zero balance ⇒ 0 (never a phantom minimum)", () =>
    expect(effectiveMin({ balance: 0, apr: 20, min: 50 })).toBe(0));
  it("floors small computed minimums at 25 (bal high enough)", () =>
    expect(effectiveMin({ balance: 100, apr: 0 })).toBe(25));
  it("never exceeds the balance (caps below the $25 floor)", () =>
    expect(effectiveMin({ balance: 10, apr: 0 })).toBe(10));
});

describe("sumMin — Σ effectiveMin over cards (§3 min debt service)", () => {
  it("sums card minimums, ignores loans", () => {
    const cards = [
      { balance: 4961, apr: 28.3, min: 116.99 },
      { balance: 0, apr: 20, min: 50 },      // paid off ⇒ contributes 0
      { balance: 100, apr: 0 },              // ⇒ 25
    ];
    expect(sumMin(cards)).toBeCloseTo(116.99 + 0 + 25, 2);
  });
});

describe("payM — payoff months (§3): r=0 ⇒ ceil(bal/pay); null when payment can't outrun interest", () => {
  it("0% APR ⇒ simple ceil(balance/payment)", () => expect(payM(1200, 0, 100)).toBe(12));
  it("payment ≤ monthly interest ⇒ null (ISS-91: no NaN/∞)", () =>
    expect(payM(1000, 28.3, 10)).toBeNull());
  it("normal amortizing case ⇒ finite positive integer", () => {
    const m = payM(5000, 20, 300);
    expect(Number.isFinite(m)).toBe(true);
    expect(m).toBeGreaterThan(0);
  });
});

describe("mthPmt — standard amortization (§3): r=0 ⇒ P/n", () => {
  it("0% ⇒ principal / months", () => expect(mthPmt(1200, 0, 12)).toBe(100));
  it("with interest ⇒ payment above the flat split", () =>
    expect(mthPmt(10000, 6, 60)).toBeGreaterThan(10000 / 60));
});

describe("cardMoInt — monthly interest with promo balances (§3)", () => {
  it("no promos: (balance)·apr/12", () =>
    expect(cardMoInt({ balance: 1200, apr: 24, promos: [] })).toBeCloseTo(1200 * 0.24 / 12, 6));
  it("a 0% promo balance accrues at the promo rate, not the card APR", () => {
    // 1000 total, 400 at 0% promo ⇒ 600 at 24% + 400 at 0%
    const v = cardMoInt({ balance: 1000, apr: 24, promos: [{ balance: 400, rate: 0 }] });
    expect(v).toBeCloseTo(600 * 0.24 / 12, 6);
  });
});

describe("assets / liabilities / net worth (§3) — the ISS-18 divergence guard", () => {
  const client = {
    incomeStreams: [{ net: 1000, gross: 1300, freq: "monthly2" }],
    bills: [{ cost: 500, freq: "monthly2", type: "regular", dueDay: 5 }],
    cards: [{ balance: 1000, apr: 24, min: 50, promos: [] }],
    accounts: [
      { type: "checking", value: 2000 },
      { type: "savings", value: 3000 },
      { type: "retirement", value: 8000 }, // NOT liquid
    ],
    loans: [{ balance: 5000, apr: 6 }],
    customAssets: [{ value: 400000 }],
    properties: [],
    marketInvestments: [{ value: 1000 }],
  };
  it("liquidA = checking + savings only (retirement excluded)", () =>
    expect(liquidA(client)).toBe(5000));
  it("totalA = accounts + property + market investments (MI included — ISS-51/49)", () =>
    expect(totalA(client)).toBe(2000 + 3000 + 8000 + 400000 + 1000));
  it("totalL = loans + card balances", () =>
    expect(totalL(client)).toBe(5000 + 1000));
  it("net worth = totalA − totalL", () =>
    expect(totalA(client) - totalL(client)).toBe(414000 - 6000));
  it("sumN take-home, sumB bills, sumMin debt service normalize correctly", () => {
    expect(sumN(client.incomeStreams)).toBe(1000);
    expect(sumG(client.incomeStreams)).toBe(1300);
    expect(sumB(client.bills)).toBe(500);
    expect(sumMin(client.cards)).toBe(50);
  });
});

describe("getProperties — properties-over-customAssets, counted once (§6)", () => {
  it("prefers the newer `properties` alias when present", () =>
    expect(getProperties({ properties: [{ value: 5 }], customAssets: [{ value: 10 }] }))
      .toEqual([{ value: 5 }]));
  it("falls back to customAssets when properties is empty", () =>
    expect(getProperties({ properties: [], customAssets: [{ value: 10 }] }))
      .toEqual([{ value: 10 }]));
});

describe("availCredit — limit minus balance, never negative", () => {
  it("computes remaining credit", () =>
    expect(availCredit({ balance: 300, limit: 1000 })).toBe(700));
});

describe("actB — active bills (§3): regular always · annual only in dueMonth · temporary until maturity", () => {
  const curMonth = new Date().getMonth() + 1;
  const otherMonth = curMonth === 12 ? 1 : curMonth + 1;
  const bills = [
    { id: 1, name: "Rent", type: "regular", cost: 1000, freq: "monthly2", dueDay: 1 },
    { id: 2, name: "AnnualElsewhere", type: "annual", cost: 600, dueMonth: otherMonth, freq: "annual" },
    { id: 3, name: "MaturedTemp", type: "temporary", cost: 50, freq: "monthly2", maturity: "2020-01-01" },
  ];
  const active = actB(bills).map((b) => b.name);
  it("keeps regular bills", () => expect(active).toContain("Rent"));
  it("drops an annual bill outside its due month", () => expect(active).not.toContain("AnnualElsewhere"));
  it("drops a temporary bill past its maturity", () => expect(active).not.toContain("MaturedTemp"));
});

describe("getClientRem — client due reminders use effectiveMin, not raw .min (ISS-56)", () => {
  const rem = getClientRem([
    { id: 1, firstName: "A", lastName: "B", bills: [], cards: [{ id: 9, name: "Visa", balance: 1000, apr: 24, min: 50, promos: [] }] },
  ]);
  const card = rem.find((r) => r.type === "card");
  it("emits a card reminder for a card with a balance", () => expect(card).toBeTruthy());
  it("the amount is effectiveMin (50), scoped to the client", () => {
    expect(card.amount).toBeCloseTo(50, 2);
    expect(card.clientId).toBe(1);
    expect(card.name).toBe("Visa");
  });
});

describe("getAdvRem — advisor alerts fire on §3 thresholds and respect the toggle", () => {
  const on = { reminderAdvisor: { noContact: true, highDebt: true, promoExpiring: true, debtIncreasing: true }, noContactDays: 30 };
  it("No-Contact fires for a client with no snapshots (days=999)", () => {
    const rem = getAdvRem([{ id: 1, firstName: "No", lastName: "Contact", incomeStreams: [], cards: [], monthSnapshots: [] }], on);
    expect(rem.some((r) => r.type === "noContact")).toBe(true);
  });
  it("High-DSR fires when card min / net income > 36%", () => {
    const c = { id: 2, firstName: "High", lastName: "DSR", incomeStreams: [{ net: 1000, gross: 1300, freq: "monthly2" }], cards: [{ balance: 5000, apr: 24, min: 400, promos: [] }], monthSnapshots: [{ savedAt: new Date().toISOString(), debt: 5000 }] };
    expect(getAdvRem([c], on).some((r) => r.type === "highDebt")).toBe(true);
  });
  it("the toggle gates it: No-Contact off ⇒ no No-Contact reminder", () => {
    const rem = getAdvRem([{ id: 1, firstName: "No", lastName: "Contact", incomeStreams: [], cards: [], monthSnapshots: [] }], { reminderAdvisor: { noContact: false } });
    expect(rem.some((r) => r.type === "noContact")).toBe(false);
  });
});

describe("mig — card migration back-fills defaults incl. the CC feature fields (v0.83.55)", () => {
  const card = mig({ cards: [{ id: 1, name: "Visa", balance: 100, apr: 20, min: 30 }] }).cards[0];
  it("back-fills lastUsed + apr0End to '' (CC feature)", () => {
    expect(card.lastUsed).toBe("");
    expect(card.apr0End).toBe("");
  });
  it("defaults owedBy=joint + normalizes promos to an array; preserves given fields", () => {
    expect(card.owedBy).toBe("joint");
    expect(Array.isArray(card.promos)).toBe(true);
    expect(card.name).toBe("Visa");
    expect(card.balance).toBe(100);
  });
});
