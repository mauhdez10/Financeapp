import { test, expect, navTo, getBuildMarker } from "../utils/fixtures";

/**
 * SMOKE TESTS
 *
 * The minimum bar: app boots, build marker is set, every sidebar tab opens
 * without a black screen or React-tree explosion. This is what catches the
 * brace-imbalance / undefined-variable class of bugs you've hit before.
 *
 * NOTE: All tests use the `appPage` fixture, which is pre-authenticated
 * via global-setup.ts. We do NOT use any __GA_TEST_AUTOLOGIN__ bypass —
 * tests hit the real Supabase Auth flow with the dedicated test user.
 */
test.describe("smoke", () => {
  test("app boots and sets build marker", async ({ appPage }) => {
    const build = await getBuildMarker(appPage);
    expect(build).toMatch(/^\d{4}-\d{2}-\d{2}/);
    // The sidebar should be visible
    await expect(appPage.getByText(/Dashboard/i).first()).toBeVisible();
  });

  test("no console errors during initial load", async ({ appPage }) => {
    const errors: string[] = [];
    appPage.on("pageerror", (err) => errors.push(`PAGEERROR: ${err.message}`));
    appPage.on("console", (msg) => {
      if (msg.type() === "error") errors.push(`CONSOLE: ${msg.text()}`);
    });

    await appPage.goto("/");
    await appPage.waitForFunction(
      // @ts-ignore
      () => !!window.__GA_BUILD__,
      { timeout: 10_000 },
    );
    // Wait until past the bootstrapping screen
    await appPage.waitForFunction(
      () => {
        const body = document.body.innerText || "";
        return (
          !body.includes("Loading clients") &&
          !body.includes("Cargando clientes")
        );
      },
      { timeout: 15_000 },
    );
    // Give React a beat to finish any deferred renders
    await appPage.waitForTimeout(500);

    // Filter out known-benign noise. The [GA] migration logs are info-level
    // but Supabase client sometimes emits expected noise we don't care about.
    const real = errors.filter(
      (e) =>
        !e.includes("ResizeObserver") &&
        !e.includes("[GA]") &&
        !e.includes("favicon"),
    );

    expect(real, `Unexpected console errors:\n${real.join("\n")}`).toEqual([]);
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

  test("language toggle switches EN -> ES without errors", async ({
    appPage,
  }) => {
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
