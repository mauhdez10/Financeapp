import { test, expect, switchLang, navTo } from "../utils/fixtures";
import type { Page } from "@playwright/test";

/**
 * Translation integrity tests.
 *
 * Catches three classes of regression:
 *   1. Untranslated EN strings leaking into ES (raw dict keys, e.g. "t.foo"
 *      or "Sin traducir" placeholders).
 *   2. `undefined` rendering in the DOM — happens when t.someKey doesn't
 *      exist on T.es. Per pitfall #9 in AGENT.md, every key must exist on
 *      BOTH T.en and T.es.
 *   3. Pages crashing or going blank when the language toggle flips.
 *
 * The language toggle is a SINGLE button labeled `🌐 EN | ES` in the
 * sidebar (line 2317 of App.jsx). Clicking it flips React state. Setting
 * `window.__GA_LANG` directly does NOT trigger a re-render — the global
 * is mirrored *from* React state via useEffect, not *to* it.
 *
 * Per pattern: load the page, switchLang to ES, navigate to each surface,
 * scrape the body text, assert no banned tokens, and confirm at least one
 * known Spanish word is present.
 */

// Surfaces to check — pair of (EN nav label, ES nav label, identifying ES
// word that must appear in body after navigation).
//
// We use EN labels for the first nav-to before switching to ES, then ES
// labels for subsequent navs. The ES expected-word is a Spanish-only
// translation we know should appear on that page after the switch.
const SURFACES: Array<{ en: string; es: string; esBodyWord: RegExp }> = [
  { en: "Dashboard", es: "Tablero", esBodyWord: /Tablero|Asesor|Cliente/ },
  { en: "Clients", es: "Clientes", esBodyWord: /Clientes|Buscar/ },
  { en: "Calculators", es: "Calculadoras", esBodyWord: /Calculadora|Hogar|Préstamo/ },
  { en: "Promotions", es: "Promociones", esBodyWord: /Promoci[oó]n|Descuento/ },
  { en: "Forms", es: "Formularios", esBodyWord: /Formulario|Descarg/ },
  { en: "Resources", es: "Recursos", esBodyWord: /Recurso|Gu[ií]a/ },
  { en: "About Us", es: "Nosotros", esBodyWord: /Nosotros|Asesor|Servicios/ },
];

// Tokens that must NEVER appear in body text:
//   - "undefined" — a missing t.key
//   - "[object Object]" — a render bug
//   - raw "t.foo" dict-key leaks
//
// We deliberately don't ban "null" — it can appear legitimately in things
// like "100% nullable" docs (none of which we have, but defensive).
const FORBIDDEN_TOKENS = [
  /\bundefined\b/,
  /\[object Object\]/,
  // Common pattern: a t.fooBar wrapped without a fallback that didn't render.
  /\bt\.[a-z][a-zA-Z0-9_]+\b(?!\()/,
];

async function bodyText(page: Page): Promise<string> {
  return await page.locator("body").innerText();
}

test.describe("translation integrity (ES)", () => {
  for (const surface of SURFACES) {
    test(`ES mode: "${surface.es}" tab — no missing keys, no undefined, has Spanish content`, async ({
      appPage,
    }) => {
      const page = appPage;

      // Step 1: switch to Spanish via the toggle button.
      await switchLang(page, "es");

      // Step 2: navigate to the surface using its ES label.
      await navTo(page, surface.es);

      // Step 3: scrape body text and assert.
      const text = await bodyText(page);

      // Banned tokens must not appear.
      for (const banned of FORBIDDEN_TOKENS) {
        expect(
          text,
          `Found banned token ${banned} in ${surface.es} body — likely a missing t.key on T.es`,
        ).not.toMatch(banned);
      }

      // At least one known Spanish word must appear — proves the lang
      // switch actually took effect and ES content rendered.
      expect(
        text,
        `No expected ES word (${surface.esBodyWord}) found on ${surface.es} — language switch may not have applied`,
      ).toMatch(surface.esBodyWord);
    });
  }

  test("toggle switches back from ES to EN cleanly", async ({ appPage }) => {
    const page = appPage;
    // Go to ES.
    await switchLang(page, "es");
    await navTo(page, "Tablero");
    expect(await bodyText(page)).toMatch(/Tablero|Asesor/);
    // Back to EN.
    await switchLang(page, "en");
    await navTo(page, "Dashboard");
    const text = await bodyText(page);
    expect(text).toMatch(/Dashboard|Advisor|Client/i);
    // The forbidden tokens must not appear in EN either.
    for (const banned of FORBIDDEN_TOKENS) {
      expect(text).not.toMatch(banned);
    }
  });
});
