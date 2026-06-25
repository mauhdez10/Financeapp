> 🔖 **Live · ephemeral** (lifecycle §4b, see [LOGIC_MAP](LOGIC_MAP.md)). **Kill-condition:** Archive once these design-lab picks are ported into the app.

# Golden Anchor — Design Picks (2026-06-04)

Owner picks from the Design Lab (`preview/design-lab.html` v2 dual-mode). Captured for the next session.

**Direction owner stated:** wait to codify until **21st.dev Magic MCP** is installed (needs API key from `21st.dev/magic/console`, can only be done from home network — work blocks it). When installed + the new `design-principles` skill is active, then codify these picks into `src/tokens/tokens.css` and proceed to Phase 1 of the audit's refactor plan (`docs/AUDIT-2026-06-03.md` §6).

---

## Per-section picks

### A — Palette
- **Pick:** `A1` "Navy Editorial" — light AND dark.
- Notes: works in both modes; the navy + reserved gold is what `SKILL.md` and `colors_and_type.css` already encode (matches the audit's recommendation).

### B — Typography pairing
- **Pick:** `B1` — Newsreader italic (display) + Plus Jakarta Sans (body) + JetBrains Mono (numbers).
- Notes: this is the canonical pairing per `colors_and_type.css`. Audit recommendation matches. Per `design-principles` skill, Inter (which was in B2 / B3) is flagged as overused — owner instinctively avoided it.

### C — KPI hero number style
- **Pick:** `C1` "Editorial Italic" — Newsreader italic 64px with gold superscript dollar sign + thin gold hairline above caption.

### D — Card vs section
- **Pick (hybrid):** `D4` as the base (alternating tinted rows, no cards) **BUT** with **thicker separators where D1 puts them** — the thick rule under the section date and the thick rule above the Total Income row.
- **Dark-mode override:** in dark mode, the alternating tinted rows currently use a barely-visible tint. Owner wants a **lighter tint** (more contrast against the dark surface) so the alternation is visible.

### E — Chart density
- **Pick:** `E1` "Sparse Editorial" — 260px chart, generous padding, Newsreader italic title, 3 Y ticks, legend below in eyebrow caption.
- **Dark-mode override:** owner doesn't like the current dark-mode chart colors. **Action: redesign dark-mode chart palette** with better contrast / clarity. Likely needs a brighter cream/gold for series strokes against the navy bg, and tighter gridline alpha.

### F — Chart color encoding
- **Pick:** `F1` "Gold-only accent" — net line in gold, income + spending in cream/ink with stroke-style differentiation (solid vs dashed).

### G — Sign-in screen
- **Pick:** `G1` "Editorial Landing" — large left hero + sticky right sign-in card.
- **Override 1:** the v1 single-mode lab had a **moving background animation** on G1; the dual-mode v2 conversion lost it. Owner wants the moving background restored.
- **Override 2:** owner ALSO really likes `G3` "Split Quote" from the v1 single-mode lab (customer-quote on warm linen left, form right). Keep G3 as an alternate / secondary sign-in option (maybe for a "Welcome back" return-visitor flow, or as a marketing landing variant).

### H — Intake form
- **Pick (both, not either/or):** `H1` for mobile · `H2` for desktop.
- Notes: comparing a phone mockup against desktop forms in the lab made no sense as a single pick — they serve different viewports. Use H1's iOS frame layout under mobile breakpoint; H2's centered card layout for desktop.

### I — Client detail summary tab
- **Pick (hybrid):** `I1` "Editorial 3-Column" **LAYOUT** + `I4`'s **color story** in both modes.
- Light-mode: I1 looks monochromatic; owner prefers the white + yellow contrast he saw in `I4` light (sticky-sidebar variant). Apply I4's accent treatment to the I1 layout.
- Dark-mode: same hybrid — I1 layout + I4 dark's **lighter blue** sticky-sidebar accent for contrast.

### J — Report header
- **Pick:** `J1` "Italic Editorial" — Newsreader italic title + tracked subtitle + thin gold rule + 3-column footer.
- **Override:** make the **client name bigger** than currently rendered. The title "Monthly Report" should still be the H1, but the client name ("Amanda Chen · May 2026") needs more visual weight than the lab variant gave it.

---

## System-wide directives

### Remove advisor credentials from chrome
- **Rule:** stop pasting "MBA · FPWMP · FL0215" everywhere as decorative chrome (sidebar, hero, login pills, etc).
- Reason: owner finds it tacky / over-promotional.
- Where credentials BELONG: only on the report header (J1) signature line, possibly on the public landing intake page (one place, not throughout the app).
- Where they DO NOT belong: sidebar, dashboard chrome, sign-in screen, dashboard KPI cards, anywhere else they appear in the lab.

### Inter / Roboto / Arial / system-ui ban
- Per the new `design-principles` skill: avoid these as display fonts. Owner's natural picks honored this (B1 = Newsreader + Plus Jakarta + JetBrains Mono).
- Lab chrome currently uses `system-ui` (a bias-prevention move from earlier in the lab build) — must be replaced when codifying, since system-ui is also on the slop list.

---

## Outstanding decisions for the codification session

When 21st.dev is installed and we resume:

1. **G1 moving background** — what specific animation? Confirm with owner what he saw in v1 (probably a subtle parallax or gradient drift). Recreate.
2. **E dark-mode chart palette** — design a new dark palette for chart series. Owner doesn't like the current navy-cream-terracotta combo in dark. Propose 3 alternatives before codifying.
3. **D dark-mode tint level** — how much lighter should the alternating tint be? Mock 3 levels (subtle / medium / bold) for owner to pick.
4. **I1 + I4 color hybrid** — confirm the white-yellow contrast is light mode; lighter blue is dark mode. Generate the merged variant before applying to App.jsx.
5. **J1 client name size** — how much bigger? Mock 3 sizes (current / +20% / +40%) for owner to pick.
6. **G3 "Split Quote" placement** — does owner want it as the PRIMARY sign-in (with G1 as fallback), or as a SECONDARY surface like a marketing landing? Needs scoping.

---

## What NOT to do until 21st.dev is installed

- Don't start codifying these picks into `src/tokens/tokens.css`.
- Don't open `src/App.jsx` for any visual changes.
- Don't generate new lab variants (the picks are made; we're past the lab phase).
- Don't push any UI changes to production.

---

## Next-session prompt

When owner returns from home with 21st.dev installed:

```
Picking up Golden Anchor design codification (2026-06-04 picks recorded).

State:
- Design Lab v2 dual-mode reviewed; picks in docs/DESIGN-PICKS-2026-06-04.md
- 21st.dev Magic MCP should now be installed (verify with /ui or /21)
- design-principles skill is installed at ~/.claude/skills/design-principles/
- Audit + 7-phase refactor plan at docs/AUDIT-2026-06-03.md
- App.jsx is 7,950 lines, currently v0.59.2

Two-folder workflow:
- Working copy: C:\Users\mauhd\Projects\golden-anchor\ (no .git, edit here)
- Git clone: C:\Users\mauhd\Projects\financeapp-deploy\ (PAT-in-URL, push from here)

Owner picks (see docs/DESIGN-PICKS-2026-06-04.md for full notes):
A1 · B1 · C1 · D4+D1 separators · E1 (redesign dark chart palette)
F1 · G1 (restore moving bg) + G3 as alt · H1 mobile + H2 desktop
I1 layout + I4 color story · J1 with bigger client name
+ system-wide: remove advisor credentials from chrome

Outstanding decisions to resolve THIS session before codifying:
1. G1 moving background — what animation specifically
2. E dark chart palette — mock 3 alternatives
3. D dark tint level — mock 3 levels
4. I1+I4 hybrid — confirm + visualize
5. J1 client name size — mock 3 sizes
6. G3 — primary sign-in or alternate surface

Sequence:
1. Invoke design-principles skill
2. Use 21st.dev /ui or /21 to source variants for the outstanding decisions
3. Codify final tokens into src/tokens/tokens.css per audit Phase 1
4. Patch the design-system/golden-anchor/MASTER.md drift
5. Run quality gates (build, lint, Playwright); commit and push

Model: Opus 4.8 max. This is Phase 1 of the 7-phase refactor.

What's first — confirm 21st.dev is installed?
```

---

_Captured by Claude Code in session [c--users-mauhd-health-crm/e32f8a8a-f718-4369-b52b-51c5cad33b04] on 2026-06-04._
