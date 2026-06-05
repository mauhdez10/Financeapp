# DESIGN MODE — Golden Anchor Finance

> Read this whenever the task is **visual/UI/UX**: redesigning a page, building a
> component, picking colors/type/motion, polishing, or critiquing a look.
> Pointered from `CLAUDE.md` and `AGENT.md §10.5`.

## The mandate (owner's standing instruction, 2026-06-05)

When we are in design mode, **quality is the only objective. Credit cost and time
are not constraints.** Mauricio does not design; he relies on these tools, each
built by people who do. Therefore, in design mode:

1. **Use every relevant tool — don't shortcut to one.** Each tool below owns a
   different layer (structure, palette, components, motion, polish, anti-slop).
   A finished surface should have passed through the whole pipeline, not just one.
2. **Explore the full option space inside each tool.** Generate multiple variants
   (palettes, font pairings, component versions, motion treatments). Don't take
   the first output. Show the alternatives, then pick.
3. **When tools overlap, compare and choose deliberately.** Use the overlap map
   below. Run both if it's not obvious, put them side by side, justify the pick.
4. **Always dual-mode.** Every design ships correct in BOTH light and dark
   (D-3-adjacent discipline; the design lab is dual-mode for this reason).
5. **Gate before shipping.** Run the Impeccable `detect` CLI + an Emil motion
   pass + an accessibility pass before any version bump.

This is deliberate over-investment. Default to MORE exploration, not less.

## The pipeline (each layer, in order)

| Layer | Tool | Owns | How to invoke |
|---|---|---|---|
| **0. Process + project context** | `design-principles` skill | Asking the right questions, brand context, avoiding AI-slop, dual-mode discipline, giving variations | Skill — triggers on any UI/visual/brand work |
| **1. Vocabulary + anti-slop + gate** | **Impeccable** | Design vocabulary; 23 commands (polish / audit / critique / bolder / quieter / animate / typeset / colorize…); deterministic CLI rule-checker as a PR gate | Skill `impeccable`. Gate: `npx impeccable detect src/` (no LLM, safe to run deliberately) |
| **2. Palettes / fonts / styles** | **ui-ux-pro-max** | 161 color palettes, 57 font pairings, 50+ styles, 161 product types, chart types | Plugin/skill `ui-ux-pro-max` |
| **3. Component sourcing** | **21st.dev Magic** | Generating real component code from a prompt + inspiration browsing + logo/refine | MCP `magic` — `/ui`, `/21` slash cmds; tools `21st_magic_component_builder`, `_inspiration`, `_refiner`, `logo_search` |
| **4. Motion / micro-interactions** | **Emil (emil-design-eng)** | Animation timing (<300ms, custom easing), micro-interactions, component feel, loading states; "review this animation" | Skill `emil-design-eng` |
| **Backgrounds / hero** | **`algorithmic-art`** | Seeded p5.js flow-fields / particle / harmonic backgrounds. Export **PNG** (fits single-file + `useReducedMotion`) or hand-wrap a canvas. Fills the empty `LOTTIE_HERO_URL` slot. | Anthropic skill |
| **Standalone mockup sandbox** | **`web-artifacts-builder`** | React+Tailwind+shadcn concept app → `bundle.html`. **NOT App.jsx drop-in** — prototype, screenshot, hand-port the ideas. | Anthropic skill |
| **Static poster / PDF art** | **`canvas-design`** | Marketing one-pagers, report cover art (40-font kit incl. our Lora + JetBrains Mono). | Anthropic skill |
| **Brand / palette generation** | `theme-factory` (preset **"Golden Hour"** ≈ our brand), `brand-guidelines` (Anthropic-brand only — low value) | On-the-fly themes for decks/docs, NOT app code | Anthropic skills |
| **Review + gates** | `design:*` suite | `design-critique` (early/often), **`accessibility-review` (the hard gate)**, `design-handoff`, `design-system` (token audit), `ux-copy` (**EN+ES**) | Skills |

> **Full deep study + overlap rulings + constraints:** `docs/DESIGN-TOOLKIT-STUDY.md`.
> **Stack reality:** App is single-file `App.jsx` + Recharts + plain CSS (no Tailwind/shadcn/TS),
> so shadcn/React outputs from ui-ux-pro-max & web-artifacts-builder must be TRANSLATED, not pasted.
> **Brand default trap:** the Anthropic skills default to orange/Poppins/Lora — always pass
> gold `#D97706` / amber / cream + Newsreader + JetBrains Mono explicitly.

## Overlap map — when two tools could do the job

- **Component to build a button / modal / card / navbar?**
  → **21st.dev Magic** generates the code; **ui-ux-pro-max** decides its style/palette;
  **Impeccable** critiques/polishes it; **Emil** tunes its motion. Run in that order.
- **Anti-slop / "make it not look AI-generated"?**
  → **Impeccable** is primary (CLI gate + vocabulary). `taste-skill` was evaluated and
  **skipped** (~80% overlap, less mature). Style-genre variety → ui-ux-pro-max's 50+ styles.
- **Animation / loading / transitions?**
  → **Emil** is the authority on timing/easing/feel. Impeccable's `animate` command for
  vocabulary. Never animate high-frequency actions (Emil's rule).
- **Color palette?**
  → **ui-ux-pro-max** (161 palettes) for options → **theme-factory** to apply →
  **Impeccable** `colorize`/critique to validate against the existing gold/amber/cream system.
  The app already has a strong brand system (`src/colors_and_type.css`) — **extend, don't replace.**
- **Typography?**
  → **ui-ux-pro-max** (57 pairings) + Impeccable `typeset`. App uses Newsreader (display),
  JetBrains Mono (numerals) — keep that spine.

## Design-mode workflow (per surface)

1. **Context** (`design-principles`) — what is this surface, who uses it, what's the job.
2. **Structure** — layout/hierarchy/IA before any pixels.
3. **Palette + type** (ui-ux-pro-max → theme-factory) — generate ≥2–3 options, dual-mode.
4. **Components** (21st.dev Magic) — generate, browse inspiration, refine; multiple variants.
5. **Motion** (Emil) — loading, transitions, micro-interactions; <300ms, custom easing.
6. **Critique + anti-slop** (Impeccable) — `critique`, `polish`, then `detect` CLI gate.
7. **A11y** (`accessibility-review`) — contrast, focus, touch targets, both modes.
8. **Lab it** — drop into `preview/design-lab.html` (dual-mode) for side-by-side review BEFORE touching `src/App.jsx`.
9. **Build + verify** — `npm run build`, then bump version via `finance-app-updater`.

## House design system (the spine — extend, never replace)

- Palette: gold / amber / cream. Tokens in `src/colors_and_type.css`.
- Type: Newsreader (display italic), JetBrains Mono (tabular numerals).
- Charts: pure-SVG component library already in `App.jsx` (Donut, Waterfall, Sankey,
  Treemap, RadialGauge, etc.) — gradient-polished v0.42–v0.45.
- Dual-mode lab: `preview/design-lab.html` (v2, Light/Dark toggle).

## Security note

The 21st.dev Magic API key is in `~/.claude.json` plaintext (pre-launch exception).
Rotate + move to 1Password before launch. Don't run Impeccable's bundled npm scripts
blind — only the `detect` CLI deliberately.
