import { chromium, FullConfig } from "@playwright/test";
import { existsSync, mkdirSync } from "fs";
import { dirname } from "path";

/**
 * Global setup — runs once before all tests.
 *
 * Logs into Supabase via the real login UI using the dedicated test
 * account (test@goldenanchor.life). The authenticated browser state
 * (cookies + localStorage including the Supabase session JWT) is saved
 * to STORAGE_STATE_PATH so individual tests can reuse it without
 * re-authenticating.
 *
 * Credentials come from env vars (NEVER commit them). See README.md.
 *
 * This re-runs on every `npx playwright test` invocation, which keeps
 * the saved JWT fresh (Supabase JWTs default to 1 hour TTL).
 */

export const STORAGE_STATE_PATH = "playwright/.auth/user.json";

export default async function globalSetup(config: FullConfig) {
  const baseURL =
    config.projects[0]?.use?.baseURL ||
    process.env.GA_BASE_URL ||
    "http://localhost:5173";

  const email = process.env.GA_TEST_EMAIL;
  const password = process.env.GA_TEST_PASSWORD;

  if (!email || !password) {
    throw new Error(
      "Missing GA_TEST_EMAIL / GA_TEST_PASSWORD env vars. " +
        "Create a .env file (see README.md) or export them in your shell.",
    );
  }

  // Safety check — refuse to run if someone wired in the main advisor UUID.
  // The main account is b373dd8a-bf12-4df2-9439-d7770406d416 and must
  // never be touched by automated tests.
  if (email.includes("mauricio") || email.includes("hernandez")) {
    throw new Error(
      `Refusing to use "${email}" — looks like the main advisor account. ` +
        "Use the dedicated test user (test@goldenanchor.life) instead.",
    );
  }

  // Ensure auth dir exists
  if (!existsSync(dirname(STORAGE_STATE_PATH))) {
    mkdirSync(dirname(STORAGE_STATE_PATH), { recursive: true });
  }

  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  console.log(`[global-setup] Logging in as ${email} at ${baseURL}…`);

  await page.goto(baseURL);

  // Wait for the login form to render. Field labels match T.en dict.
  await page
    .getByLabel(/Email/i)
    .first()
    .waitFor({ state: "visible", timeout: 15_000 });

  await page.getByLabel(/Email/i).first().fill(email);
  await page.getByLabel(/Password/i).first().fill(password);

  await page
    .getByRole("button", { name: /^Sign In$|^Entrar$/i })
    .first()
    .click();

  // After successful login, the build marker should appear and the
  // login form should be gone. We wait for both.
  await page.waitForFunction(
    // @ts-ignore
    () => typeof window !== "undefined" && !!window.__GA_BUILD__,
    { timeout: 20_000 },
  );

  // Make sure we're past the "bootstrapping" loading screen too
  // (the app shows "Loading clients…" while fetching from Supabase)
  await page.waitForFunction(
    () => {
      const body = document.body.innerText || "";
      return !body.includes("Loading clients") && !body.includes("Cargando clientes");
    },
    { timeout: 20_000 },
  );

  // Save the storage state — this includes the Supabase auth cookie/JWT
  await context.storageState({ path: STORAGE_STATE_PATH });

  console.log(`[global-setup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}
