import { test, expect, openCalculator, fillNumberByLabel } from "../utils/fixtures";

/**
 * Calculator math correctness tests.
 *
 * The CalculatorsPage (line 1551 of App.jsx) renders 9 calculator entries
 * as a 3x3 grid of <div onClick> cards — NOT buttons. Each card shows the
 * emoji on top and the label below. Clicking a card opens that calculator
 * in-place; a Back button returns to the gallery.
 *
 * We test 5 calculators that drive most of the client-facing value:
 *   1. Home Calculator (Equity / HELOC / Refi / Amortization sub-tabs)
 *   2. Car Loan
 *   3. Affordability (max home price from income + debt)
 *   4. Debt Reduction (standalone: Payoff + CC-vs-Loan modes)
 *   5. High Yield Savings (compound growth)
 *
 * These are smoke + math assertions, not deep validation. Goal: catch
 * the "calculator rendered but math is wrong" regression — a class of
 * bug we've shipped twice (RSR formula, Liquidity rename).
 *
 * NOTE: The text labels on inputs change with t.calc<Foo>Lbl translations,
 * so we match labels with case-insensitive partial regex against the EN
 * dictionary entries from `T.en`. Tests assume language=EN. If you want
 * ES coverage of the same flows, that's a separate spec.
 */

test.describe("calculator math correctness (EN)", () => {
  test("Home Calculator — Equity/HELOC tab computes available equity", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Home Calculator");

    // Home Calc opens on the 🏦 Equity/HELOC sub-tab by default.
    // Inputs: Home Value, 1st Mortgage, 2nd Mortgage, Other Liens, Max LTV.
    // Expected: equity = homeValue - sum(mortgages + liens).
    //
    // Home Value 500000, 1st 300000, 2nd 0, Other 0, LTV 80%
    //   → Current Equity = 200,000
    //   → Max Borrowable = 500000 * 0.80 - 300000 = 100,000
    await fillNumberByLabel(page, /Home Value/i, "500000");
    await fillNumberByLabel(page, /1st Mortgage/i, "300000");

    // The result panel shows the computed Current Equity and Max Borrowable
    // values formatted as `$200,000` etc. We assert those strings exist.
    await expect(page.getByText(/Current Equity/i).first()).toBeVisible();
    await expect(page.getByText("$200,000").first()).toBeVisible();
    // Max Borrowable: 500000 * 0.8 = 400000, minus 300000 owed = 100000.
    await expect(page.getByText("$100,000").first()).toBeVisible();
  });

  test("Car Loan — monthly payment from price + APR + term", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Car Loan");

    // CarLoanCalc defaults: tax 7%, title&tag $450, dealer $899, doc $299,
    // GAP $600. The test wants a clean "Amount Financed = price - down"
    // assertion, so we zero out tax and all fees before filling.
    //
    // Vehicle price 25000, down 5000, APR 6%, term 60 mo, tax 0, fees 0
    //   → Amount financed = 20000
    //   → Monthly payment ≈ 386.66
    await fillNumberByLabel(page, /Sales Tax Rate/i, "0");
    await fillNumberByLabel(page, /Title.*Tag/i, "0");
    await fillNumberByLabel(page, /Dealer Fee/i, "0");
    await fillNumberByLabel(page, /Doc Fee/i, "0");
    await fillNumberByLabel(page, /GAP/i, "0");
    await fillNumberByLabel(page, /Vehicle Price/i, "25000");
    await fillNumberByLabel(page, /Down Payment/i, "5000");
    await fillNumberByLabel(page, /APR/i, "6");
    // Term is in months for Car Loan (carMonthsLbl = "months").
    await fillNumberByLabel(page, /Term/i, "60");

    // Amount Financed should show $20,000 somewhere.
    await expect(page.getByText("$20,000").first()).toBeVisible();
    // Monthly payment is around $386. Check the dollar sign + 38 prefix.
    // Use a loose regex because the app's `fmt()` may render it as
    // "$386" (no cents) or "$386.66" depending on fmtD/fmt rules.
    await expect(page.getByText(/\$38[6-7]/).first()).toBeVisible();
  });

  test("Affordability — max home price from income + DTI", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Affordability");

    // AffordabilityCalc default DTI is 43 (FHA-friendly), not 36. We
    // explicitly set 36 to match the conservative housing-payment math
    // the test asserts.
    //
    // Gross monthly income 10000, existing debt 500, DTI 36%
    //   → Max housing payment = 10000 * 0.36 - 500 = $3,100/mo (PITI cap)
    await fillNumberByLabel(page, /Gross Monthly Income/i, "10000");
    await fillNumberByLabel(page, /Existing Monthly Debt/i, "500");
    await fillNumberByLabel(page, /DTI/i, "36");

    // The Max Total Housing Payment cell shows the DTI cap (gross * 0.36
    // - existing debt). With our inputs that's $3,100.
    await expect(page.getByText("$3,100").first()).toBeVisible();
    // Max Home Price should render — just confirm the label is shown.
    await expect(page.getByText(/Max Home Price/i).first()).toBeVisible();
  });

  test("Debt Reduction — standalone mode picker renders", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Debt Reduction");

    // The standalone DebtReductionCalc (line 1447 of App.jsx) renders two
    // modes — "📉 Payoff" and "⚖️ CC vs Loan" — NOT the Avalanche/Snowball
    // strategy radios. Those live on the client-bound ClientDebtCalc
    // because they need real debt data to rank.
    //
    // Smoke check: we're on the calc page and one of the two modes is
    // visible.
    await expect(
      page.getByRole("heading", { name: /Debt Reduction/i }).first(),
    ).toBeVisible();
    await expect(
      page.getByText(/Payoff|CC vs Loan/i).first(),
    ).toBeVisible();
  });

  test("High Yield Savings — compound interest growth", async ({ appPage }) => {
    const page = appPage;
    await openCalculator(page, "High Yield Savings");

    // Initial 10000, monthly deposit 500, APY 4%, term 10 years.
    // After 10 years with monthly compounding:
    //   FV(initial)   = 10000 * (1.003333...)^120  ≈ 14,908
    //   FV(deposits)  = 500 * (((1.003333)^120 - 1)/0.003333) ≈ 73,624
    //   Total         ≈ $88,500 (rough)
    // We assert the result is above $80,000 and below $100,000 — wide
    // enough to tolerate small formula variations (annual vs monthly
    // compounding edge cases) but tight enough to catch a broken calc.
    await fillNumberByLabel(page, /Initial (Deposit|Investment)/i, "10000");
    await fillNumberByLabel(page, /Monthly Deposit/i, "500");
    await fillNumberByLabel(page, /APY/i, "4");
    await fillNumberByLabel(page, /Years|Term/i, "10");

    // The Total Amount or Future Value result should be in the $80-100k
    // range. Match against a $8 or $9 prefix followed by a 5-digit
    // number formatted with thousands separator.
    await expect(page.getByText(/\$[89]\d,\d{3}/).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
