# Golden Anchor Finance — Professional Polish Punch-List
*Research basis: motionsites.ai showcase patterns; Mercury (incl. Blake Crosley's full teardown w/ exact values); Linear's two published redesign retrospectives + design-system extractions; Stripe dashboard/app design docs; Ramp design system; Origin & Copilot Money. Compiled 2026-06-10. This is the SPEC for the professionalization pass — implement items as written; each is concrete on purpose.*

---

## 0. Reference DNA — what each benchmark actually does

| Reference | Techniques worth stealing |
|---|---|
| **Mercury** | Headline weight 480 (variable font — deliberately between 400/500, "nothing is a default value"). Financial figures are a distinct type class: 28px / 500 / −0.5px tracking / line-height 1.0. Text is off-white `rgb(237,237,243)`, never pure white; 3-step text hierarchy (237/170/120 lightness). Borders = `rgba(255,255,255,0.08)`. Semantic money colors desaturated: credit `#34D399`, debit `#F87171`, pending `#FBBF24`. Body line-height 1.625 on dark. |
| **Linear** | One chromatic accent, **rationed to one primary action per screen**; everything else is a tight 4-step monochrome surface stack. Borders are white-alpha overlays (0.02–0.08), never fixed greys. Cards get presence from 1px inset border + bg step, not fills or shadows. Inter Display for headings, regular for body; tight negative tracking on display sizes only. Theme = 3 variables (base, accent, contrast), LCH-uniform. |
| **Stripe** | Density follows information value — pack data zones, keep chrome quiet. Active filters always visible as removable chips, never buried in dropdowns. Muted currency symbols/decimals next to strong integers. Rigid grid; every table/filter control from one shared system. FocusView pattern: dim everything behind the current task. |
| **Ramp** | 4px grid absolutism. Inter with one defined type ramp. Motion expressions defined as tokens, not per-component improvisation. |
| **Origin / Copilot** | Modular identical-card system; charts as the hero of each card, skimmable in <1s; native-feeling, minimal-chrome data viz; premium = restraint + one beautiful visualization per surface, not many mediocre ones. |
| **motionsites.ai showcase** | Best sites use **one** signature ambient background in the hero only; scroll reveals are intersection-triggered fade/rise on cards, uniform across the page; section hierarchy via spacing rhythm + eyebrow labels, not via new visual treatments per section; micro-interactions limited to badges/hover state-swaps. |

---

## A. Global / system-wide

1. **Lock the type scale to 7 sizes and delete everything else.** `11 / 12 / 13 / 14 / 16 / 20 / 28` px (+ display `40–56` landing-only). Audit App.jsx for one-off sizes (15, 17, 18, 22…) and snap each to the nearest token. More than ~7 sizes in one app is the single biggest amateur tell.

2. **Codify the number type class (Mercury pattern).** Every financial figure: JetBrains Mono, `tabular-nums`, tracking −0.5px, line-height 1.0. Big numbers 28px/600, table numbers 13px/500, chip numbers 11px/500. Numbers are never Plus Jakarta, never proportional.

3. **Newsreader discipline: one serif moment per screen, 20px+ only.** Italic serif at small sizes inside cards reads decorative/old-school (the anti-Origin direction). Serif = page hero, modal title at most. Never serif labels, never serif in tables.

4. **Tracking rules:** uppercase micro-labels 10–11px / 600 / `0.08–0.12em` / tertiary color. Display sizes (28px+) get `−0.01` to `−0.02em`. Body text: 0, always. Never letter-space mixed-case body — it reads template-y.

5. **4px spacing grid, 9 allowed values:** `4 8 12 16 20 24 32 48 64`. Card padding exactly 20px desktop / 16px mobile, everywhere. Grep for odd paddings (10, 14, 18, 25…) and snap.

6. **Borders become white-alpha overlays, not hex greys.** Replace `#2A2E35` with `rgba(255,255,255,0.07)` (default), `0.11` (hover), `0.15` (active/focus-adjacent). Light mode: `rgba(20,16,5,0.08)`. Alpha borders sit correctly on every tinted surface; fixed hex shifts hue and is why hairlines look inconsistent across cards.

7. **Surface stack: exactly 4 dark levels, never nest cards.** Canvas `#0C0D11` → card `#16181C` → elevated (menus/popovers) `#1B1E24` → modal `#1F232A`. Card-inside-card is forbidden — use a hairline divider (`1px` white-alpha 0.06) or an inset section with 12px left padding instead.

8. **Shadow policy:** flat surfaces get **no** shadow (border + bg step is the elevation). Only floating layers (popover, dropdown, modal) get `0 8px 24px rgba(0,0,0,0.4)`. One glow allowed in the entire app: the primary CTA, `0 0 24px rgba(201,168,76,0.25)`.

9. **Ration the gold (Linear's accent rule).** Gold = one primary action per view + active nav state + focus ring + at most one data accent per chart. If a screen has 3+ gold elements competing, demote all but one to ghost/outline. Gold backgrounds always carry near-black text `#1A1405`, never white.

10. **Desaturate semantics for dark mode.** Positive `#34D399`, negative `#F87171`, warning `#FBBF24` — as **text or 10%-alpha tinted chips only**, never solid fills. Solid saturated red/green panels are the #1 "built by a developer" signal in fintech.

11. **Two radii total:** 8px (inputs, buttons, chips, menu items) and 12px (cards, modals, popovers); `9999px` for pills. Kill every 4/6/10/16 in between.

12. **Text = 3 steps, off-white top.** Primary `#EDEDF3`, secondary `#A8AAB5`, tertiary `#787A8C`. Pure `#FFFFFF` body text on `#0C0D11` vibrates — reserve it for the hero number only, or not at all.

13. **Real focus states:** `:focus-visible` → 2px ring `rgba(226,195,117,0.6)`, 2px offset, on every button/input/link/row-action. Browser-default blue outline anywhere = instant credibility loss.

## B. Navigation / shell

14. **Sidebar spec:** 240px fixed; items 34px tall, 8px radius, 13px/500 labels, 16px Lucide icons at 1.5px stroke (one icon family — no emoji remnants in nav). Active = bg `rgba(255,255,255,0.05)` + gold **text/icon** (not a gold-filled pill). Section eyebrows 10px uppercase 0.1em tertiary with 24px space above groups.

15. **Topbar: 56px, hairline bottom border, zero shadow.** Page title 16px/600 left; right side a single action cluster with 8px gaps. Add a ⌘K-style search pill (32px, hairline border, tertiary placeholder + mono `⌘K` kbd chip) — the strongest "serious tool" signal Linear/Mercury share.

16. **Page-header pattern, identical on every screen:** eyebrow (10px mono uppercase tertiary) → H1 20px/600 → optional 13px secondary meta line; actions right-aligned. No screen invents its own header layout.

## C. Dashboard / data surfaces

17. **KPI tile spec:** label 11px uppercase 0.1em tracked tertiary, top; value 28px JetBrains Mono 600 tabular −0.5px; delta as an 11px mono chip (10%-alpha tint bg, desaturated semantic text, true `−`/`+` signs) baseline-aligned right of the value; sparkline 1.5px stroke, no axes, bottom-anchored so it touches the tile edge. All four tiles identical internal geometry.

18. **Tables (Promotions, client lists, portal):** 13px body, 42px rows, **horizontal hairlines only** — no zebra, no vertical rules, no per-cell borders. Header row 11px uppercase 0.08em tertiary, sticky. Numeric columns right-aligned mono tabular; text columns left. Row hover = bg `rgba(255,255,255,0.03)`, nothing moves.

19. **One number-formatting law, app-wide:** currency `$12,480` (no cents ≥ $1,000; cents only in detail/ledger views), negatives `−$1,240` with a true minus (U+2212) in desaturated red text, percents one decimal (`4.2%`). Stripe trick: render the `$` and cents at tertiary color / 0.85em so the integer dominates.

20. **Chart grammar, unified across all 20 SVG components:** gridlines 1px `rgba(255,255,255,0.05)`, no axis lines, max 5 ticks, tick labels 10px mono tertiary; ≤4 series colors from a fixed ramp (gold `#C9A84C`, green `#34D399`, red `#F87171`, neutral `#787A8C`); area-fill gradients capped at 12% opacity fading to 0; tooltips on the elevated surface with hairline border, 12px mono values.

21. **Fix the chart-height equalization problem** (known Sankey issue): top-align cards in dashboard rows (`align-items:start`), let charts keep intrinsic aspect, pad with whitespace below — never stretch an SVG to fill a row.

22. **Designed empty states everywhere a table/chart can be empty:** 40px circle with 10%-gold tint + 18px icon, one 13px secondary sentence, optional ghost CTA. "No data" text alone or blank space reads unfinished.

23. **Density follows value (Stripe):** tighten data zones (table rows 42px, KPI grids 16px gaps), loosen narrative zones (32px between dashboard sections). Don't apply one density everywhere.

24. **Active filters as removable chips** above any filtered table — visible state, ✕ to dismiss — never state hidden inside a dropdown.

## D. Landing / marketing page

25. **Hero spec:** Newsreader italic 48–64px / −0.02em headline (max 2 lines) → 16px secondary subhead (max 2 lines) → one gold primary CTA + one ghost CTA, 12px apart. Gold line-field canvas dimmed to ≤40% opacity behind text, fully paused under `prefers-reduced-motion`. Nothing else animates in the hero.

26. **Section rhythm:** 96–128px between sections; every section opens identically — mono 11px uppercase gold eyebrow → 28–32px H2 → 15px secondary intro. Uniform rhythm is what makes Linear/Stripe landings feel engineered.

27. **Show the real product.** One large dashboard screenshot in a minimal browser frame (12px radius, 1px white-alpha border, `0 24px 48px rgba(0,0,0,0.45)` shadow), slight dark-gradient fade at the bottom (Mercury's hero-overlay trick). Abstract feature cards without product proof read as vaporware.

28. **One scroll-reveal pattern for the whole page:** opacity 0→1 + translateY 12px→0, 450ms ease-out, fires once via IntersectionObserver, 60ms stagger within a row. No parallax, no scale-ins, no rotate — the motionsites top tier uses exactly one ambient effect (hero) + one reveal pattern (everything else).

29. **Trust/legal as quiet furniture:** FL license, disclaimers, credentials → footer, 12px tertiary, mono badges if badged. Never pills in the hero.

## E. Forms / modals / settings

30. **Input spec:** 38px height, 8px radius, bg `#101216` (one step below card) or transparent, border white-alpha 0.08 → gold focus ring (item 13). Label 12px/500 above the field — never placeholder-as-label. Helper/error 12px below; error = desaturated-red border + message, never a red fill.

31. **Modal system: two widths only** (480 standard / 760 wide e.g. Chart Gallery), 12px radius, three zones — header (16px/600 title + 28px ✕ hit area), body (24px padding), footer (ghost Cancel + gold primary, right-aligned, 8px gap). Scrim `rgba(0,0,0,0.6)` + optional 4px blur. Both fade+scale 0.98→1, 200ms.

32. **Buttons: exactly 3 variants.** Primary (gold bg, `#1A1405` text, 600), Secondary (transparent, hairline border), Ghost (text only). Heights 36px default / 32px compact, 13px/600 labels. No gradient buttons, no third accent.

33. **Settings flip cards — gate the theatrics:** flip only on explicit click (never hover), 500ms `cubic-bezier(0.32,0.72,0,1)`, and respect the global Flip-off toggle + reduced-motion. Card grid stays fixed-size during flip (no layout shove — the v0.69.8 bug class).

## F. Motion system

34. **Four duration tokens, period:** 120ms (hover/press), 200ms (fades, menus, tooltips), 300ms (modals, drawers), 450ms (landing reveals). Easing: `cubic-bezier(0.32,0.72,0,1)` for anything that moves, plain `ease-out` for pure fades. Nothing in-app exceeds 500ms.

35. **Animate `transform` and `opacity` only.** Never height/width/padding/top — layout animation causes the hover-shove jank already fixed once. If size must change, animate a transform scale of a fixed-size box.

36. **One hover effect per surface.** Cards currently can stack lift + shadow + gold spotlight: pick spotlight **or** 2px lift+border-brighten per surface class, app-wide. Hover-lift cap: `translateY(-2px)`, no added shadow.

37. **Do-not-animate list:** numbers after the bootstrap count-up (re-renders snap), table rows, sidebar items, focus rings, chart re-draws on filter change (single 250ms tween max — the existing 800ms tween is too slow for repeat interactions; cut to 250–300ms after first paint).

38. **`prefers-reduced-motion` gates everything:** landing canvas, spotlight, flips, tweens, reveals — already partially wired via `useReducedMotion`; extend to the cursor-spotlight and settings flips.

---

## Top 5 amateur tells (and the fix)

1. **Too many type sizes/weights.** A dozen ad-hoc font sizes screams "no system." → Items 1–4: 7-size scale, one number class, serif rationed, tracking rules.
2. **Full-saturation semantic colors / solid red-green fills on dark.** Reads like a Bootstrap alert, not a private bank. → Item 10: desaturated text + 10%-alpha tint chips only.
3. **Mixed radii and off-grid spacing** (a 6px button beside a 10px card with 14px padding). The eye can't name it but registers "cheap." → Items 5, 11: two radii, nine spacing values, snap everything.
4. **Over-animated hover states** — lift + shadow + glow + spotlight simultaneously, slow tweens on every re-render. Premium tools (Linear, Mercury) are *calmer* than amateur ones, not flashier. → Items 34–37: duration tokens, one effect per surface, do-not-animate list.
5. **Unfinished system edges:** browser-default focus rings, blank empty states, inconsistent number formatting (`$1,200.00` here, `1200$` there), pure-white text on near-black. These edges are where users subconsciously judge craft. → Items 12, 13, 19, 22.

**Sources:** motionsites.ai · Mercury teardown (Blake Crosley) · Linear "How we redesigned the Linear UI" + "Behind the latest design refresh" · getdesign.md Linear analysis · LogRocket on the Linear trend · Stripe app design docs · Setproduct dashboard principles · Eleken "Make it like Stripe" · Ramp × Bakken & Baeck + Ramp UI library · shadcn.io Mercury design system · Copilot Money · Origin · tracking-in-typography (Medium) · think.design dashboard do's/don'ts 2026.
