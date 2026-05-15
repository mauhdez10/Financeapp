import { test, expect, openClient } from "../utils/fixtures";

/**
 * CLIENT WORKFLOWS
 *
 * The seeded SEED data ships with two clients:
 *   - Miguel & Sofia Torres (couple, 4 cards, 2 loans, 4 month snapshots)
 *   - Amanda Chen (single, 1 card, 2 loans, 2 month snapshots)
 *
 * Opening these and walking the report tabs is the highest-yield regression
 * test because it exercises the same code paths your real clients will.
 */

test.describe("client workflows", () => {
  test("can open Miguel Torres and see the report header", async ({ appPage }) => {
    await openClient(appPage, "Miguel");
    // Header shows full names
    await expect(appPage.getByText(/Miguel/).first()).toBeVisible();
    await expect(appPage.getByText(/Torres/).first()).toBeVisible();
    // KPI cards should render with the four standard tiles
    await expect(appPage.getByText(/Total Income|Net Income/i).first()).toBeVisible();
    await expect(appPage.getByText(/Net Worth|Patrimonio/i).first()).toBeVisible();
  });

  test("all client detail tabs render without crashing (Miguel)", async ({
    appPage,
  }) => {
    await openClient(appPage, "Miguel");

    // Inner tabs from ClientDetail.tabs
    const tabs = [
      /📊 Client Report/i,
      /📅 Monthly Statement/i,
      /📋 Financial Statements/i,
      /💹 Portfolios/i,
      /📋 Strategy Plan/i,
      /🧮 Calculators/i,
      /📝 Intake/i,
      /🗒 Notes/i,
    ];

    for (const tab of tabs) {
      // Two of these labels collide with sidebar nav buttons (Calculators
      // and Clients are in <nav>; Strategy Plan / Notes etc. are not).
      // .first() returns DOM-order — which on collisions is the sidebar
      // button, navigating away from ClientDetail and breaking the Back
      // assertion. Filter the candidate buttons down to those NOT inside
      // <nav>.
      const candidates = await appPage.getByRole("button", { name: tab }).all();
      let btn = null;
      for (const c of candidates) {
        const inNav = await c.evaluate((el) => !!el.closest("nav"));
        if (!inNav) {
          btn = c;
          break;
        }
      }
      if (btn && (await btn.isVisible().catch(() => false))) {
        await btn.click();
        // Each tab change shouldn't blank the page. Check the back button
        // is still visible (it's always rendered in ClientDetail).
        await expect(appPage.getByRole("button", { name: /Back|Volver/i }).first())
          .toBeVisible();
      }
    }
  });

  test("Complete Report renders with all sections (Miguel)", async ({
    appPage,
  }) => {
    await openClient(appPage, "Miguel");
    // Drill into Client Report -> Complete Report
    await appPage.getByRole("button", { name: /Client Report/i }).first().click();
    await appPage
      .getByRole("button", { name: /Complete Report/i })
      .first()
      .click();

    // Expected sections of the complete report
    const sections = [
      /INCOME/i,
      /BILLS & EXPENSES/i,
      /DEBT/i,
      /FINANCIAL RATIOS/i,
    ];
    for (const re of sections) {
      await expect(appPage.getByText(re).first()).toBeVisible({ timeout: 5_000 });
    }

    // No raw dictionary keys should leak through
    const body = await appPage.locator("body").innerText();
    expect(body).not.toContain("undefined");
    expect(body).not.toMatch(/\b[a-z]+Hdr\b/); // header keys like "incomeHdr"
  });

  test("Amanda Chen (single client) renders without partner-related errors", async ({
    appPage,
  }) => {
    await openClient(appPage, "Amanda");
    // Single client — should NOT render partner name
    const body = await appPage.locator("body").innerText();
    expect(body).toContain("Amanda");
    expect(body).not.toContain("undefined undefined");
  });
});
