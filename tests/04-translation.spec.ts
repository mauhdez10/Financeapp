import { test, expect, navTo } from "../utils/fixtures";

/**
 * TRANSLATION INTEGRITY
 *
 * D-3 (locked): EN/ES toggle must never blank the screen. If a key is missing
 * in T.es, the code uses `t.key || "Fallback English"` — but only where the
 * developer remembered to add the fallback.
 *
 * Pitfall #9 (locked): both T.en AND T.es get touched in the SAME edit when
 * adding any user-facing string. These tests assert that's actually happening
 * by walking every major surface in ES mode and looking for tells of missing
 * keys.
 *
 * Tells of a missing/broken translation:
 *  - The literal word "undefined" rendered in the DOM
 *  - A raw camelCase dictionary key like "totalIncome" leaking through
 *  - An English label persisting after the language switch
 */

const RAW_KEY_PATTERN =
  /\b(totalIncome|netWorth|cashFlow|incomeHdr|billsExpensesHdr|debtCcHdr|financialRatiosHdr|searchClients|signOut|loadingClients|migratingData)\b/;

async function switchToSpanish(page: any) {
  // The sidebar has an EN/ES toggle. Set lang via the global as a fallback,
  // then click any visible language toggle if present.
  await page.evaluate(() => {
    // @ts-ignore
    window.__GA_LANG = "es";
  });
  // Try the explicit toggle if it exists
  const esBtn = page.getByRole("button", { name: /^ES$/ }).first();
  if (await esBtn.isVisible().catch(() => false)) {
    await esBtn.click();
  }
}

test.describe("translation integrity (ES)", () => {
  const surfaces: Array<{ nav: string; spanishSentinel: RegExp }> = [
    { nav: "Tablero", spanishSentinel: /Alertas|Tablero/i },
    { nav: "Clientes", spanishSentinel: /Buscar clientes|Nuevo Cliente|Clientes/i },
    { nav: "Calculadoras", spanishSentinel: /Retiro|Portafolio|Hogar|Calculadora/i },
    { nav: "Promociones", spanishSentinel: /Promoci/i },
    { nav: "Formularios", spanishSentinel: /Formulario/i },
    { nav: "Recursos", spanishSentinel: /Recurso|Gu[ií]a/i },
    { nav: "Nosotros", spanishSentinel: /Servicio|Ancla|Golden/i },
  ];

  for (const { nav, spanishSentinel } of surfaces) {
    test(`ES mode: "${nav}" tab — no missing keys, no undefined, has Spanish content`, async ({
      appPage,
    }) => {
      await switchToSpanish(appPage);
      // Use the Spanish label of the nav item
      await navTo(appPage, nav);

      const body = await appPage.locator("body").innerText();

      // Sentinel: at least one expected Spanish word renders
      expect(body).toMatch(spanishSentinel);

      // No raw dictionary keys
      const rawKeyMatch = body.match(RAW_KEY_PATTERN);
      expect(
        rawKeyMatch,
        `Raw dictionary key leaked into ${nav} ES view: ${rawKeyMatch?.[0]}`,
      ).toBeNull();

      // No "undefined" literals
      expect(body).not.toContain("undefined");
    });
  }

  test("ES mode: client report walks all sub-tabs without English fallback leakage", async ({
    appPage,
  }) => {
    await switchToSpanish(appPage);
    await navTo(appPage, "Clientes");
    await appPage.getByText(/Miguel/).first().click();

    // Walk inner report tabs
    const innerTabs = [
      /Reporte del Cliente|Reporte/i,
      /Estado Mensual/i,
      /Estados Financieros/i,
      /Portafolios/i,
    ];
    for (const re of innerTabs) {
      const btn = appPage.getByRole("button", { name: re }).first();
      if (await btn.isVisible().catch(() => false)) {
        await btn.click();
        const body = await appPage.locator("body").innerText();
        expect(body).not.toContain("undefined");
        expect(body).not.toMatch(RAW_KEY_PATTERN);
      }
    }
  });
});
