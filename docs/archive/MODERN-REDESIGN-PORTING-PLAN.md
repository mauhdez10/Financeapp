> **⛔ ARCHIVED — do not use.** This work is DONE/SHIPPED or SUPERSEDED. Kept for history only; NOT in LOGIC_MAP. For current truth see [docs/STATE.md](STATE.md) + [CHANGELOG.md](../../CHANGELOG.md).

# Modern Redesign — Porting Plan (2026-06-07)

The new design language is locked across **four** standalone labs in `preview/`. This is the
plan to port them into the real `src/App.jsx`. Direction: modern/airy/glassy like Origin
(useorigin.com) — see memory `modern-aesthetic-origin`.

## The design system (from the labs)
- **Palette** — dark: bg `#0A0C10`, glass card `rgba(255,255,255,.045)`, border `rgba(255,255,255,.09)`, text `#EDEFF2`, muted `#9AA3AF`, dim `#626B78`, gold `#CBA85A`, accent `#E2C375`. light: bg `#FAFAF7`, card `#FFFFFF`, border `#ECEAE3`, text `#16181C`, muted `#5A6270`, dim `#9AA0A8`, gold `#B8901E`, accent `#8A6B1E`. pos/neg: `#3DD68C`/`#F2766B` (dark), `#0E9F6E`/`#D64545` (light).
- **Type** — Plus Jakarta Sans (clean sans, weights 400–600, big numbers tabular at 500); JetBrains Mono UPPERCASE micro-labels (`letter-spacing .12–.14em`); Newsreader italic **only** as a 1-word marketing accent. Drop Newsreader as a UI face.
- **Surfaces** — glass cards (translucent + 1px low-opacity border + `backdrop-filter blur(16px)` in dark / soft shadow in light), radius 14–18, atmospheric radial glows so glass reads.
- **Charts** — THIN: hairline sparklines (1px), 1.25px lines, no heavy area fills (≤0.07 opacity), 5px bars + donut/gauge rings. Gold restrained.
- **Controls** — pill toggles for **Light/Dark** (default **light**) and **EN/ES** (swaps copy). Buttons: solid gold fill + dark ink `#1A1208` (a11y-verified), flat.

## Labs (source of truth)
| Surface | Lab file | App.jsx target |
|---|---|---|
| Landing / Login | `preview/landing-v2.html` | `Login` component (~5593) |
| Dashboard | `preview/dashboard-lab.html` | `Dashboard` + app shell (sidebar/topbar) (~5180) |
| Client Detail | `preview/client-detail-lab.html` | `ClientDetail` + sections |
| Public Intake | `preview/intake-lab.html` | `PublicIntake` 5-stage flow |

## Porting order (safest → hardest)
1. **Tokens first.** Add the modern palette to `src/colors_and_type.css` (new `--ga-*` modern vars) + extend the App.jsx theme object (`th`) so both modes resolve to the new values. This is the foundation every surface reads. Verify nothing else regresses.
2. **Login** (most self-contained). Replace the `Login` render with the modern landing — keep ALL existing auth handlers untouched (`signInWithPassword`, `resetPasswordForEmail`, `updateUser`, the `type=recovery` hash detection). Wire copy to existing `T.en`/`T.es` keys (reuse, don't duplicate). Port the thin line-field as a reduced-motion-gated component. `npm run build` → smoke test login + forgot + recovery.
3. **App shell + Dashboard.** Restyle sidebar/topbar + KPI tiles + the 3 chart slots + client list. Reuse the existing pure-SVG charts but thin them (stroke widths, drop heavy fills) to match. Keep `dashboardSlots` picker behavior.
4. **Client Detail.** Restyle header + KPI row + trend + the 3 health gauges + cash-flow + section tabs. Thin the existing chart components.
5. **Public Intake.** Restyle the 5-stage flow (glass card, mono step label, progress, modern fields, gold CTA). Keep the stage logic, signature, and submit handlers intact.

## Rules during port (do not break)
- **D-3 / pitfall #9** — every visible string in BOTH `T.en` and `T.es`, same edit. Reuse existing keys where they exist; only add new keys in both languages.
- **D-1** — single-file, components at top level (pitfall #17). **D-8** — Recharts/pure-SVG only.
- **a11y** — re-run the contrast check + Impeccable `detect` after each surface; keep gold-button dark-ink fix.
- **Build marker** — bump version + `__GA_BUILD__` per surface via `finance-app-updater`; one surface per PR/commit, build-verified.
- Charts: thin everything (the locked Origin look) — sparkline 1px, lines 1.25px, bars/rings ~5px, fills ≤0.07.

## Recommended execution
One surface per session/commit, in the order above, each `npm run build`-verified before the next.
Start with **(1) tokens + (2) Login** — smallest blast radius, immediately visible win.
