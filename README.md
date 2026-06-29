# 8BitTrading Academy

A static teaching mini-site that takes a trader from zero options knowledge to reading the
8BitTrading dealer-exposure levels (gamma / vanna / charm) and trading them on ES futures.

Built to pair with the **gexpro** TradingView indicator and the automated UW → Discord gamma
pipeline. Every level definition and color matches what the indicator actually plots.

## Pages

| File | What it covers |
|------|----------------|
| `index.html` | Home — the core mental model, the 3 greeks, learning path, level legend, glossary |
| `01-gamma.html` | Gamma from zero — the two regimes, the flip, the four ramp scenarios |
| `02-vanna.html` | Vanna — IV/VIX mechanics, the four regimes, the 5% override rule |
| `03-charm.html` | Charm — pin gravity, the charm clock, time-weighting, the drift read |
| `04-levels.html` | **The nine levels** — each with mechanics, edge cases, strategies, scenario trees |
| `05-plays.html` | The 12 plays, the weekly greek map, pre-market checklist, quick-reference tables |
| `academy.css` | Shared design system (Syne + DM Mono dark theme, real gexpro level colors) |

## Stack

Plain static HTML + one shared CSS file. No build step, no framework, no dependencies —
open `index.html` in a browser, or host the folder as-is (GitHub Pages, Netlify, etc.).

## Design system

This site uses the **Matrix design system**, defined in
`~/Projects/AGENT/skills/matrix-design-system/SKILL.md`. `academy.css` is the built
implementation of that spec (Space Mono, single dark surface, one brand-green accent,
2px corners, hairline borders). **Agents:** read that skill before adding or restyling
any UI here — it is the source of truth for tokens, components, and layout.

## Local preview

```bash
open index.html          # quickest
# or serve the folder:
python3 -m http.server 8080   # then visit http://localhost:8080
```

---

*Educational — not financial advice.*
