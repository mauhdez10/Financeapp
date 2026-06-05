# DESIGN TOOLKIT — Deep Study & Comparison (2026-06-05)

Reference companion to `docs/DESIGN-MODE.md`. Built from an exhaustive read of every
tool's on-disk skill files. This is the "which tool, when, and why" decision record.

## The full roster, by role

| Tool | Role / layer | What it uniquely gives | Output |
|---|---|---|---|
| **design-principles** | Process + taste governance (upstream) | 6-step process, ≥8 questions, **named anti-AI-slop blocklist**, Design Lab ("A2,B4,C1" picking), dual-mode discipline, reads OUR tokens/CHANGELOG/AGENT.md | Guidance + Lab HTML |
| **ui-ux-pro-max** | Catalog + token-system generator | **160 token palettes, 73 font pairings, 84 styles, 25 a11y-graded charts, 161 product types, 98 UX rules, 16 stacks**; `--design-system --persist` → `MASTER.md` | CLI search + persisted system |
| **21st.dev Magic** (`magic` MCP) | Component + logo sourcing | Fetches **real React component code** + refines existing + brand **logos as SVG/JSX/TSX**. `/ui` `/21` build, `/21st` inspiration, `/logo` | React snippets |
| **web-artifacts-builder** | Standalone mockup sandbox | Full React 18+TS+Tailwind+**40 shadcn components**→ one `bundle.html` | Standalone app (NOT App.jsx) |
| **algorithmic-art** | **Backgrounds / hero visuals** | Seeded **p5.js** flow-fields / particle fields / harmonic mandalas; reproducible seeds; reduced-motion fallback | p5 HTML artifact + **PNG** |
| **canvas-design** | Static poster / PDF art | Museum-grade poster/PDF, **40-font embed kit** (incl. Lora + JetBrains Mono = our faces) | `.png` / `.pdf` |
| **theme-factory** | Palette/font theming for artifacts | 10 presets — **"Golden Hour"** is closest to our brand; on-the-fly theme gen | Theme applied to decks/docs |
| **brand-guidelines** | Brand application | Anthropic's OWN brand only — **low value here** (reference pattern only) | Doc/deck post-processing |
| **emil-design-eng** | Motion / physics / perf | **Hard numbers**: <300ms, button 100–160ms, dropdown 150–250ms, modal 200–500ms; custom easings (`cubic-bezier(0.23,1,0.32,1)`); spring/gesture physics; transform+opacity only | Critique + code patterns |
| **impeccable** | Anti-slop + deterministic gate | **`detect` CLI** (no LLM, exit-2 on findings = CI gate), live variant mode (HMR hot-swap), 25 commands (polish/audit/critique/bolder/quieter/animate/typeset/colorize/overdrive/delight/harden/onboard…) | CLI gate + variants |
| **design: suite** | Review + gates | `design-critique`, **`accessibility-review` (the one true gate)**, `design-handoff`, `design-system` (token audit), `ux-copy` (must be EN+ES) | Reports/specs |

## Overlap rulings — when 2+ tools compete

- **Component code** → **21st.dev Magic** sources it; **ui-ux-pro-max** decides its style/palette; **Impeccable**/**Emil** polish it. **web-artifacts-builder** is for *standalone mockups only*, never pasted into `App.jsx`.
- **Backgrounds / hero** → **algorithmic-art** (unique). Ship the **PNG export** (zero runtime cost, fits single-file + `useReducedMotion`), or hand-wrap a trimmed canvas. Fills the empty `LOTTIE_HERO_URL` slot.
- **Motion** → **Emil** is authoritative (the numbers + easings + physics) > Impeccable `animate` (vocabulary) > ui-ux-pro-max animation rules (general).
- **Anti-slop** → **design-principles** (named, project-aware blocklist) + **Impeccable `detect`** (deterministic gate). `taste-skill` evaluated & skipped (80% overlap).
- **Palette / type** → **ui-ux-pro-max** catalog for OPTIONS → **design-principles** discipline (token-first, oklch, one-accent, WCAG AA) for the DECISION. **theme-factory** only for non-app artifacts.
- **Critique** → **design-critique** (general) + **Impeccable `critique`** (scored, Nielsen heuristics) + design-principles audit. Run early, often, cheap.
- **Accessibility** → **`design:accessibility-review`** is the hard gate. Amber `#D97706`/`#B8901E` on cream `#FFFBEB`/`#FAFAF7` sits near the AA floor — not a formality.

## Critical constraints (agents flagged these — do not ignore)

1. **D-1 / D-8 stack reality.** App is a **single-file `App.jsx`, Recharts, plain CSS** — NO Tailwind/shadcn/TS. So ui-ux-pro-max's shadcn outputs and web-artifacts-builder's React all need **translating to our inline-component + Lucide setup**, not pasting.
2. **Anthropic-skill brand default.** `algorithmic-art`, `canvas-design`, `theme-factory`, `brand-guidelines`, `web-artifacts-builder` all default to **Anthropic orange `#d97757` + Poppins/Lora**. Always pass our **gold `#D97706` / amber / cream + Newsreader + JetBrains Mono** explicitly or output is off-brand.
3. **Artifact ≠ production code.** algorithmic-art / canvas-design / theme-factory emit artifacts/PNG/PDF — port deliberately.
4. **Impeccable is Med-risk.** Only `detect` CLI + the browser overlay are safe to run freely. `live`/`craft`/asset pipeline mutate source + patch CSP — gate behind explicit consent.
5. **ui-ux-pro-max `--persist`** previously wrote `design-system/golden-anchor/MASTER.md`, but that file is NOT in this folder (was in the archived working copy). **Regenerate it** as Phase-0 of design mode.

## The design-mode pipeline (synthesized order)

```
Phase 0 — DISCOVER
  design-system (audit) + design-principles (questions) → read src/colors_and_type.css
  → ui-ux-pro-max --design-system --persist  ⇒ regenerate design-system/golden-anchor/MASTER.md
Phase 1 — GENERATE
  ui-ux-pro-max (palette/type/style options) → Design Lab (dual-mode HTML, 3–6 variants/dimension)
  → 21st.dev Magic (components) → algorithmic-art (background PNG)
Phase 2 — CRITIQUE LOOP (iterative, cheap)
  design-critique  ⇄  ux-copy (EN+ES, settle before locking spacing)  ⇄  Impeccable critique
Phase 3 — POLISH
  Emil (motion/feel) + Impeccable polish/typeset/colorize
Phase 4 — GATES (hard, before port)
  accessibility-review (GATE) + Impeccable detect (exit-2 CI gate) + design-handoff
  → port into App.jsx → npm run build → version bump via finance-app-updater
```

## House spine (extend, never replace)

Gold/amber/cream tokens in `src/colors_and_type.css` · Newsreader (display italic) + JetBrains Mono (numerals) · pure-SVG chart library in `App.jsx` (gradient-polished v0.42–45) · dual-mode lab `preview/design-lab.html`.
