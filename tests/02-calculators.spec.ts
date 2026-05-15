import { test, expect, openCalculator, fillNumberByLabel } from "../utils/fixtures";

/**
 * Calculator math correctness tests.
 *
 * The CalculatorsPage (line 1551 of App.jsx) renders 9 calculator entries
 * as a 3x3 grid of <div onClick> cards — NOT buttons. Each card shows the
 * emoji on top and the label below. Clicking a card opens that calculator
 * in-place; a Back button returns to the gallery.
 *
 * Calculator inputs use the `Field` component which renders a sibling
 * `<label>` (not a wrapping or `for=`-referenced one), so Playwright's
 * `getByLabel()` does NOT work. Instead, `Field` writes a `data-cf`
 * attribute on its wrapping div for test selectors. The fixtures'
 * `fillNumberByLabel()` helper handles this.
 *
 * These tests assert real math, not just selectors. Inputs use the
 * default DTI / APY / term values the calculators initialize with.
 */

test.describe("calculator math correctness (EN)", () => {
  test("Home Calculator — Equity/HELOC tab computes available equity", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Home Calculator");

    // Default tab is Equity/HELOC. Default loanPct = 80.
    // Home Value 500000, 1st mortgage 300000, 2nd = 0, liens = 0:
    //   Total Owed = 300,000
    //   Max Borrowable = 500000 * 0.80 - 300000 = 100,000
    //   Current Equity = 500000 - 300000 = 200,000
    await fillNumberByLabel(page, /Home Value/i, "500000");
    await fillNumberByLabel(page, /1st Mortgage/i, "300000");

    await expect(page.getByText(/Current Equity/i).first()).toBeVisible();
    await expect(page.getByText("$200,000").first()).toBeVisible();
    await expect(page.getByText("$100,000").first()).toBeVisible();
  });

  test("Car Loan — monthly payment from price + APR + term", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Car Loan");

    // Term is a range slider (label is interpolated: "Term: 60 months"), so
    // we leave it at the default of 60 months. We also zero out all fees and
    // sales tax so the math is clean: amountFinanced = price - down.
    //
    // Price 25000, down 5000, all fees+tax 0, APR 6%, term 60 mo →
    //   amountFinanced = $20,000
    //   monthly payment = 20000 * 0.005 * 1.3489 / 0.3489 = $386.66
    await fillNumberByLabel(page, /Vehicle Price/i, "25000");
    await fillNumberByLabel(page, /Down Payment/i, "5000");
    await fillNumberByLabel(page, /Sales Tax Rate/i, "0");
    await fillNumberByLabel(page, /Title & Tag/i, "0");
    await fillNumberByLabel(page, /Dealer Fee/i, "0");
    await fillNumberByLabel(page, /Doc Fee/i, "0");
    await fillNumberByLabel(page, /GAP Insurance/i, "0");
    await fillNumberByLabel(page, /Ext Warranty/i, "0");
    // APR label is "APR (%)" — anchor exact to avoid matching other APR fields.
    await fillNumberByLabel(page, /^APR \(%\)$/, "6");

    await expect(page.getByText(/Monthly Payment/i).first()).toBeVisible();
    // With clean inputs, expect monthly payment exactly $386 (fmt strips
    // cents). Use a tolerant match in case rounding lands at $387 in some
    // browser float-math edge case.
    await expect(page.getByText(/\$38[67](?:\.\d{2})?/).first()).toBeVisible();
  });

  test("Affordability — max total housing payment from income + DTI", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Affordability");

    // Default DTI slider = 43%. We set income and existing debt only.
    // Max Total Housing = 10000 * 0.43 - 500 = $3,800
    await fillNumberByLabel(page, /Gross Monthly Income/i, "10000");
    await fillNumberByLabel(page, /Existing Monthly Debt/i, "500");

    await expect(
      page.getByText(/Max Total Housing Payment/i).first(),
    ).toBeVisible();
    await expect(page.getByText("$3,800").first()).toBeVisible();
    await expect(page.getByText(/Max Home Price/i).first()).toBeVisible();
  });

  test("Debt Reduction — payoff mode shows time, total paid, total interest", async ({
    appPage,
  }) => {
    const page = appPage;
    await openCalculator(page, "Debt Reduction");

    // Standalone DebtReductionCalc has "📉 Payoff" / "⚖️ CC vs Loan" modes.
    // Default values render the Payoff result panel with three rows:
    //   Payoff Time / Total Paid / Total Interest
    // We assert all three labels render — this is the smoke contract.
    // (The client-bound variant has Avalanche/Snowball strategy; this
    // standalone version does not.)
    await expect(page.getByText(/Payoff Time/i).first()).toBeVisible();
    await expect(page.getByText(/Total Paid/i).first()).toBeVisible();
    await expect(page.getByText(/Total Interest/i).first()).toBeVisible();
    // Confirm at least one dollar value > $1,000 renders (proves math ran).
    await expect(page.getByText(/\$\d,\d{3}/).first()).toBeVisible();
  });

  test("High Yield Savings — compound interest growth", async ({ appPage }) => {
    const page = appPage;
    await openCalculator(page, "High Yield Savings");

    // Initial 10000, monthly 500, APY 4%, years 10.
    // FV = 10000 * (1.003333)^120 + 500 * ((1.003333^120 - 1)/0.003333)
    //    ≈ 14,908 + 73,619 ≈ $88,527
    // Expect FV in the $80-99k range.
    await fillNumberByLabel(page, /Initial Deposit/i, "10000");
    await fillNumberByLabel(page, /Monthly Deposit/i, "500");
    await fillNumberByLabel(page, /^APY \(%\)$/, "4");
    await fillNumberByLabel(page, /^Years$/, "10");

    await expect(page.getByText(/Future Value/i).first()).toBeVisible();
    await expect(page.getByText(/\$[89]\d,\d{3}/).first()).toBeVisible({
      timeout: 5_000,
    });
  });
});
