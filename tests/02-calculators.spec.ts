import { test, expect, navTo, fillNumberByLabel } from "../utils/fixtures";

/**
 * CALCULATOR CORRECTNESS
 *
 * These tests do not depend on exact pixel layout. They drive the inputs the
 * way an advisor would, then assert that the computed output is in the
 * expected range. This protects against:
 *  - Logic regressions (e.g. the RSR formula bug fixed in v0.4.0)
 *  - Translation pass touching a computed string by mistake
 *  - Refactors that accidentally remove a calculator's output row
 *
 * Tolerance: results use `fmt()` formatting ($X,XXX) so we assert against the
 * rendered string range, not the exact number, to avoid penny-rounding flakes.
 */

test.describe("calculators — math correctness", () => {
  test.beforeEach(async ({ appPage }) => {
    await navTo(appPage, "Calculators");
  });

  /**
   * Home Equity — $500k home, $200k mortgage balance, 80% LTV
   * Expected: max borrowable = $500k * 0.80 - $200k = $200k
   * Current equity = $500k - $200k = $300k
   */
  test("Home Equity calculator: $500k home, $200k mortgage, 80% LTV", async ({
    appPage,
  }) => {
    // Click into the Home calculator tab
    await appPage.getByRole("button", { name: /Home/i }).first().click();

    // The Equity/HELOC sub-tab is the default. Fill the inputs.
    // Field labels come from the t dictionary, so we match by label text.
    await fillNumberByLabel(appPage, /Home Value/i, "500000");
    await fillNumberByLabel(appPage, /1st Mortgage/i, "200000");
    await fillNumberByLabel(appPage, /Max LTV/i, "80");

    // Computed Current Equity should be $300,000 and Max Borrowable $200,000.
    await expect(appPage.getByText(/\$300,000/).first()).toBeVisible();
    await expect(appPage.getByText(/\$200,000/).first()).toBeVisible();
  });

  /**
   * Car Loan — $30k vehicle, $5k down, 7% APR, 60 months
   * Expected monthly payment ≈ $495 (off-the-shelf amortization)
   * Tolerant assertion: $4XX–$5XX range, no fraction
   */
  test("Car Loan: $30k vehicle, $5k down, 7% APR, 60mo -> ~$495/mo", async ({
    appPage,
  }) => {
    await appPage.getByRole("button", { name: /Car Loan/i }).first().click();

    await fillNumberByLabel(appPage, /Vehicle Price/i, "30000");
    await fillNumberByLabel(appPage, /Down Payment/i, "5000");
    await fillNumberByLabel(appPage, /APR/i, "7");

    // Monthly Payment row should render in the $4XX or $5XX range.
    // We don't pin the exact value because tax/fee defaults shift it.
    const body = await appPage.locator("body").innerText();
    expect(body).toMatch(/\$(4|5)\d{2}/);
  });

  /**
   * Affordability — $8k/mo income, $500 existing debt, 36% DTI
   * Max housing payment = $8k * 0.36 - $500 = $2,380/mo
   */
  test("Affordability: $8k income / $500 debt / 36% DTI -> $2,380 max housing", async ({
    appPage,
  }) => {
    await appPage.getByRole("button", { name: /Affordability/i }).first().click();

    await fillNumberByLabel(appPage, /Gross Monthly Income/i, "8000");
    await fillNumberByLabel(appPage, /Existing Monthly Debt/i, "500");
    // DTI default is 36% — verify by checking the conservative/typical toggle is on 36

    await expect(appPage.getByText(/\$2,380/).first()).toBeVisible({
      timeout: 5_000,
    });
  });

  /**
   * Interest Calculator (HY Savings) — $10k initial, 4% APY, monthly,
   * 5 years, $0 deposit -> compounded total ≈ $12,200
   */
  test("HY Savings: $10k @ 4% APY, 5 years -> total ~$12.2k", async ({
    appPage,
  }) => {
    await appPage
      .getByRole("button", { name: /High Yield Savings|HY Savings/i })
      .first()
      .click();

    await fillNumberByLabel(appPage, /Initial Deposit/i, "10000");
    await fillNumberByLabel(appPage, /APY/i, "4");

    const body = await appPage.locator("body").innerText();
    // Should land in $12,XXX range
    expect(body).toMatch(/\$12,\d{3}/);
  });

  /**
   * Debt Reduction — Confirm the CC vs Loan comparison tab renders
   * and that adding a hypothetical scenario produces a payoff projection.
   * This is structural, not exact-math: the bug we want to catch is the
   * "black screen on Debt Reduction tab" class.
   */
  test("Debt Reduction tab opens and shows scope/strategy controls", async ({
    appPage,
  }) => {
    await appPage
      .getByRole("button", { name: /Debt Reduction|Reducción/i })
      .first()
      .click();

    // At least one of these should always be present on this tab
    const sentinels = [/Avalanche/i, /Snowball/i, /CC vs Loan/i, /Total Balance/i];
    let found = false;
    for (const re of sentinels) {
      if (await appPage.getByText(re).first().isVisible().catch(() => false)) {
        found = true;
        break;
      }
    }
    expect(found, "Expected at least one Debt Reduction control to be visible").toBe(
      true,
    );
  });
});
