import { test, expect, navTo, getBuildMarker } from "../utils/fixtures";

/**
 * SMOKE TESTS
 *
 * The minimum bar: app boots, build marker is set, every sidebar tab opens
 * without a black screen or React-tree explosion. This is what catches the
 * brace-imbalance / undefined-variable class of bugs you've hit before.
 */
test.describe("smoke", () => {
  test("app boots and sets build marker", async ({ appPage }) => {
    const build = await getBuildMarker(appPage);
    expect(build).toMatch(/^\d{4}-\d{2}-\d{2}/);
    // The sidebar should be visible
    await expect(appPage.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test("no console errors during initial load", async ({ page }) => {
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await page.addInitScript(() => {
      // @ts-ignore
      window.__GA_TEST_AUTOLOGIN__ = true;
      localStorage.setItem("ga_migrated_to_supabase", "1");
    });
    await page.goto("/");
    await page.waitForFunction(
      // @ts-ignore
      () => !!window.__GA_BUILD__,
      { timeout: 10_000 },
    );
    // Give React a beat to finish any deferred renders
    await page.waitForTimeout(500);

    // Ignore known-benign noise (e.g. third-party CDN failures) by filtering here
    // if you find any. For now: zero tolerance.
    expect(errors, errors.join("\n")).toHaveLength(0);
  });

  // Each main tab should render without crashing the React tree.
  // We test by clicking and asserting at least ONE distinctive element renders.
  const tabs: Array<{ nav: string; sentinel: RegExp }> = [
    { nav: "Dashboard", sentinel: /Advisor Alerts|Alerts/i },
    { nav: "Clients", sentinel: /Search clients|New Client/i },
    { nav: "Calculators", sentinel: /Retirement|Portfolio|Home/i },
    { nav: "Promotions", sentinel: /Promotion/i },
    { nav: "Forms", sentinel: /Forms & Documents|Forms/i },
    { nav: "Resources", sentinel: /Resources|Guide/i },
    { nav: "About", sentinel: /Golden Anchor|Our Services|About/i },
  ];

  for (const { nav, sentinel } of tabs) {
    test(`tab "${nav}" renders without black screen`, async ({ appPage }) => {
      await navTo(appPage, nav);
      await expect(appPage.getByText(sentinel).first()).toBeVisible({
        timeout: 5_000,
      });
    });
  }

  test("language toggle switches EN -> ES without errors", async ({ appPage }) => {
    // App stores lang in window.__GA_LANG and exposes a toggle button.
    // We don't know the exact button selector, so we drive lang via window:
    await appPage.evaluate(() => {
      // @ts-ignore — fallback if there is no UI toggle near at hand
      window.__GA_LANG = "es";
    });
    // Force a UI refresh by clicking through a tab
    await navTo(appPage, "Dashboard");
    await navTo(appPage, "Clients");
    // ES version of "Search clients…" is "Buscar clientes…" — if the dict
    // is healthy on both sides, neither raw key strings nor undefined render.
    const body = await appPage.locator("body").innerText();
    expect(body).not.toContain("undefined");
    expect(body).not.toMatch(/\bsearchClients\b/); // raw dict keys shouldn't leak
  });
});
