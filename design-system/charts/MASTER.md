# Golden Anchor — Chart Design Spec

Single source of truth for every chart component in `src/App.jsx`. When a
chart looks "off" against the rest of the app, this file is the contract
to enforce. **Do not deviate per surface.** If a chart needs a deviation,
it goes here first as an exception, with the reason.

Last updated: 2026-05-25 (v0.58-preview kickoff after Mauricio's chart audit)

---

## North-star aesthetic

Modern fintech dashboard — **thin strokes, thin numbers, generous
whitespace, no chunky bars, no serif inside charts**. Think Robinhood
trade charts, Stripe Sigma cards, Linear's analytics. NOT Bloomberg
Terminal (too dense) or 90s Excel (too chunky).

The Mauricio reference image (stock infographic with thin lines, tabular
mono numerals, uniform pill labels, consistent font weights across every
chart) is the target.

---

## Fonts (no exceptions)

| Role | Font | Size | Weight | Tracking | Case |
|---|---|---|---|---|---|
| Chart **title** | Plus Jakarta Sans | 11 pt | 700 | 0.04em | UPPERCASE |
| Axis **label** | Plus Jakarta Sans | 9 pt | 600 | 0.04em | UPPERCASE |
| Series / legend **label** | Plus Jakarta Sans | 10 pt | 500 | 0.02em | Sentence case |
| Numerical **value** (axis ticks, data labels, KPI strip) | JetBrains Mono | 11 pt | 500 | normal | as-is, `font-variant-numeric: tabular-nums` |
| Big KPI value (hero number in a card) | JetBrains Mono | 18-22 pt | 600 | -0.01em | as-is, tabular |
| Annotation / footnote | Plus Jakarta Sans | 9 pt | 400 | normal | Sentence case |

**Never use Newsreader (the brand italic serif) inside charts.** It's
reserved for hero headings and report titles. Charts are utilitarian.

---

## Strokes & weights

| Element | Width |
|---|---|
| Line series (SmoothAreaLine, Sparkline trendline) | **1.25 px** |
| Axis gridline | **0.75 px**, color `theme.dim` at 40% opacity |
| Axis baseline (x or y axis line) | **1 px** solid `theme.dim` |
| Donut ring | **stroke-width 14 px** for size ≥160px; **10 px** for size <160px |
| RadialGauge arc track + value arc | **stroke-width 8 px** (was 12+) |
| Waterfall bar | **width 28 px** (cap; was 80+). Padding between bars 18 px. |
| Bar chart (RankedHBars, GroupedYoY, StackedBars) | **bar height 14 px**, gap 10 px |
| Sankey link | **opacity 0.55**, stroke none |

**No drop shadows on data marks.** Shadows imply 3D / chunkiness. The
only shadow allowed in charts is the card container itself (subtle
`0 1px 3px rgba(0,0,0,0.05)`).

---

## Colors

Pull from the existing theme palette — never hardcode hex inside chart
components except for the brand series defaults below.

| Role | Token | Light value | Dark value |
|---|---|---|---|
| Positive / income / savings | `theme.pos` | `#047857` (deep emerald) | `#10B981` |
| Negative / debt / spending | `theme.neg` | `#B91C1C` (deep red) | `#EF4444` |
| Neutral / brand accent | `theme.amber` | `#C9A84C` (gold) | `#C9A84C` |
| Walnut / hero number | `theme.walnut` | `#755023` | `#EDD594` |
| Axis text / labels | `theme.muted` | `#475569` | `#CBD5E1` |
| Gridlines | `theme.dim` at 40% | `#94A3B8` | `#475569` |
| Tooltip background | `theme.card` | `#FFFFFF` | `#131F31` |

**Gradients allowed** on Donut slices, Treemap rectangles, and Sankey
links — but only as a 0→100% **subtle saturation lift** (e.g.
`linear-gradient(180deg, var(--c) 0%, color-mix(in srgb, var(--c) 70%, transparent) 100%)`).
Never amber → unrelated color rainbow.

---

## Sizing & spacing

### Chart container card

- Padding: **16 px** on all sides (was 20-24 — too airy)
- Title row: 11pt title + optional 9pt sub-label + right-aligned action
  (e.g. range toggle, ⚙ edit). Bottom margin **12 px**.
- Chart canvas: fills card width, height set per chart type below.

### Per-chart canvas heights (default)

| Chart | Default height |
|---|---|
| Sparkline (inline KPI tile) | 24 px |
| RadialGauge | 120 px (was 200 — too big) |
| Donut | 180 px (was 240 — too big when neighbor is small) |
| Waterfall | 160 px (was 220 — too tall, made bars chunky) |
| RankedHBars | computed: `(barHeight + gap) * rows + 16`; cap 240 px |
| SmoothAreaLine | 170 px |
| Sankey | 280 px |
| Treemap | 220 px |
| BulletChart | 40 px |
| NetWorthBridge | 200 px |

When two or more charts share a row, **the row's row-template must
equalize them**. Never let one chart auto-expand while another stays
small — that's the "tiny donut next to chunky waterfall" Mauricio
called out. Use CSS Grid with `grid-auto-rows: 1fr` or wrap each chart
in `<div style={{height:'100%', display:'flex', flexDirection:'column'}}>`.

---

## Labels & legends

- **Every chart with >1 series has a legend.** No exceptions.
- Legend is a horizontal pill row **above** the chart (right-aligned in
  the title row), or **below** the chart if there are >4 series.
- Legend swatch: 8 px circle (filled).
- Legend text: 10 pt Plus Jakarta Sans 500 sentence case.
- **No labels stacked / overlapping each other.** If labels would
  collide, rotate -25° (axis ticks) OR move to a tooltip (data labels).
  If still cramped, drop every-other label.

### Axis ticks

- Y-axis values right-align, 11pt JetBrains Mono tabular, no decimal
  for integers, max-2-decimals for currency.
- X-axis time labels: short form (`Jan`, `Q1 '26`, `5/25`). Never
  `January 2026 12:00 AM`.

### Data labels on bars / slices

- Show only when **bar/slice fills > 24 px** of the axis. Otherwise
  hide and surface in tooltip.
- Position: end-of-bar (right or top), 10pt JetBrains Mono.
- Color: bar's own color at 100% saturation (not white-on-white when
  bars are pale).

---

## Animation

- Entrance: **300 ms ease-out** for the data marks only. Axis,
  gridlines, and labels render synchronously.
- Hover: **150 ms ease-out** for color/opacity changes.
- Respect `prefers-reduced-motion` — already wired via `useReducedMotion`
  hook; every chart component must call it.
- **No looping pulse animations on data marks.** The v0.27 "live dot
  pulse" on SmoothAreaLine is the one exception (it signals real-time).

---

## Accessibility checklist (per chart)

1. `<svg role="img" aria-label="…">` with a one-sentence description of
   the trend ("Cash flow rose from $4K in January to $7K in May").
2. Tooltip content reachable via keyboard (`tabindex=0` on data marks).
3. Color is never the only signal — pair with icon or text label.
4. Min contrast on data marks vs background: **3:1**. On data labels:
   **4.5:1**.

---

## Per-chart fix tracker (v0.58 work)

| Chart | Bug | Spec change | Status |
|---|---|---|---|
| `RadialGauge` | Arc overflows card top in KPI Sparklines row | Default height 120px, stroke 8px, viewBox clamped to padding | □ |
| `Waterfall` | 80px chunky bars, huge mono labels | Cap bar width 28px, value font 11pt, total height 160px | □ |
| `RankedHBars` | 30px thick bars, large serif labels | Bar height 14px, label font Plus Jakarta 11pt (was serif) | □ |
| `Donut` | Tiny next to Waterfall neighbor | Default height 180px; parent grid must equalize | □ |
| `Sparkline` | Fine — keep at 24px | none | ✓ |
| `SmoothAreaLine` | Fine but verify stroke 1.25px | downgrade if currently >1.5 | □ |
| `BulletChart` | Need verify | TBD | □ |
| `Sunburst` / `Treemap` | Defer to v0.59 | none yet | □ |

---

## Build acceptance criteria

A chart fix is **done** when:

1. The chart renders inside its card without overflow at desktop AND mobile (375px).
2. All fonts/sizes/strokes match this spec.
3. Visual screenshot diffed against the v0.56 baseline (or a hand-screenshot
   from Mauricio) shows the intended change and nothing else.
4. Build passes `npm run build` (Vite catches syntax in ~1s).
5. No regression in print output (`@media print` overrides still hold).

If you can't meet a criterion, document the deviation here in the
"Per-chart fix tracker" with the reason, before merging.
