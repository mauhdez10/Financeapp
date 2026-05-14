import { test as base, expect, Page } from "@playwright/test";

/**
 * Auth strategy: real Supabase login.
 *
 * We log in ONCE in `global-setup.ts` using the dedicated test account
 * (test@goldenanchor.life), save the authenticated browser state to
 * `playwright/.auth/user.json`, and every test reuses that state via the
 * `storageState` option in playwright.config.ts.
 *
 * This means:
 *  - No App.jsx hook required (production code is untouched).
 *  - Each test starts already-logged-in — fast (~50ms per test instead of
 *    the ~2-3s a fresh Supabase signInWithPassword would take).
 *  - Tests run against real Supabase Postgres, so we exercise the real
 *    RLS policies and the v0.5.1 migration code path.
 *
 * The test user (9d017248-fc0a-44ad-b68b-53315bb928d8) has duplicated
 * fake/demo client data. NEVER point this at the main advisor account.
 */

type GAFixtures = {
  appPage: Page;
};

export const test = base.extend<GAFixtures>({
  /**
   * `appPage` — a Page already authenticated, loaded at the app root,
   * with the build marker confirmed. Most tests should use this.
   */
  appPage: async ({ page }, use) => {
    await page.goto("/");

    // Wait for build marker. This catches the "black screen" failure mode
    // (build marker never set) and also confirms storageState restored
    // the Supabase session (we skipped the login screen).
    await page.waitForFunction(
      // @ts-ignore
      () => typeof window !== "undefined" && !!window.__GA_BUILD__,
      { timeout: 15_000 },
    );

    // Belt-and-suspenders: if storageState somehow expired, the login
    // screen will be visible. Fail loudly with a clear message instead
    // of letting downstream selectors time out mysteriously.
    const loginVisible = await page
      .getByRole("button", { name: /^Sign In$|^Entrar$/i })
      .isVisible()
      .catch(() => false);
    if (loginVisible) {
      throw new Error(
        "Login screen is visible — storageState did not restore. " +
          "Delete playwright/.auth/user.json and re-run to re-authenticate.",
      );
    }

    await use(page);
  },
});

export { expect };

/**
 * Click a sidebar nav item by its visible label.
 * Examples: "Dashboard", "Clients", "Calculators", "Promotions"
 */
export async function navTo(page: Page, label: string) {
  await page
    .locator("button, a")
    .filter({ hasText: new RegExp(`\\b${label}\\b`, "i") })
    .first()
    .click();
}

/**
 * Open a specific client by name from the Clients list.
 */
export async function openClient(page: Page, fullName: string) {
  await navTo(page, "Clients");
  await page.getByText(fullName, { exact: false }).first().click();
}

/**
 * Type into a labeled number-style input. Selects existing content first
 * because the app does `onFocus={e=>e.target.select()}`.
 */
export async function fillNumberByLabel(
  page: Page,
  label: string | RegExp,
  value: string,
) {
  const input = page.getByLabel(label).first();
  await input.click();
  await input.fill(value);
  await input.blur();
}

/**
 * Read the build marker out of the page. Useful for asserting the deployed
 * build is the one you expect after a Vercel push.
 */
export async function getBuildMarker(page: Page): Promise<string> {
  return await page.evaluate(
    // @ts-ignore
    () => window.__GA_BUILD__ as string,
  );
}
