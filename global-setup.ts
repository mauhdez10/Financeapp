export const STORAGE_STATE_PATH = "playwright/.auth/user.json";

import "dotenv/config";
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

  // Surface in-app errors if login fails
  const errorMessages: string[] = [];
  page.on("pageerror", (err) => errorMessages.push(`[pageerror] ${err.message}`));
  page.on("console", (msg) => {
    if (msg.type() === "error") errorMessages.push(`[console.error] ${msg.text()}`);
  });

  console.log(`[global-setup] Logging in as ${email} at ${baseURL}…`);

  await page.goto(baseURL, { waitUntil: "domcontentloaded" });

  // Selectors that actually match Golden Anchor's Login component:
  // - email input has ONLY autoComplete="email" (no type, no name, no placeholder)
  // - password input has type="password"
  // - submit button text is "Sign In" (EN) or "Entrar" (ES)
  const emailInput = page.locator('input[autocomplete="email"]').first();
  const passwordInput = page.locator('input[type="password"]').first();
  const submitButton = page
    .getByRole("button", { name: /^(Sign In|Entrar)$/i })
    .first();

  try {
    await emailInput.waitFor({ state: "visible", timeout: 15_000 });
  } catch (e) {
    const html = await page.content();
    console.error("[global-setup] Login page did not render expected inputs.");
    console.error("[global-setup] Page title:", await page.title());
    console.error("[global-setup] First 500 chars of body:", html.slice(0, 500));
    if (errorMessages.length) {
      console.error("[global-setup] In-app errors:\n" + errorMessages.join("\n"));
    }
    throw e;
  }

  await emailInput.fill(email);
  await passwordInput.fill(password);
  await submitButton.click();

  // Wait for either the dashboard to appear or an error banner.
  const dashboard = page.locator("h2", { hasText: /Dashboard|Tablero/i }).first();
  const errorBanner = page
    .locator("div", { hasText: /Invalid|Error|Connection/i })
    .first();

  const result = await Promise.race([
    dashboard
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "dashboard"),
    errorBanner
      .waitFor({ state: "visible", timeout: 30_000 })
      .then(() => "error"),
  ]).catch(() => "timeout");

  if (result === "error") {
    const errorText = await errorBanner.textContent();
    console.error("[global-setup] Login rejected by app:", errorText);
    throw new Error(`Login failed: ${errorText}`);
  }
  if (result === "timeout") {
    console.error(
      "[global-setup] Timed out waiting for dashboard or error after submit.",
    );
    console.error("[global-setup] Current URL:", page.url());
    if (errorMessages.length) {
      console.error("[global-setup] In-app errors:\n" + errorMessages.join("\n"));
    }
    throw new Error("Login submit did not produce dashboard or error within 30s.");
  }

  // After successful login, the build marker should appear
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
      return (
        !body.includes("Loading clients") && !body.includes("Cargando clientes")
      );
    },
    { timeout: 20_000 },
  );

  // Save the storage state — this includes the Supabase auth cookie/JWT
  await context.storageState({ path: STORAGE_STATE_PATH });

  console.log(`[global-setup] Auth state saved to ${STORAGE_STATE_PATH}`);

  await browser.close();
}
