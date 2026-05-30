<div align="center">

<img src="assets/favicon.svg" width="64" alt="Helios logo" />

# Helios Analytics

### Decisions, illuminated.

A polished, production-quality marketing site **and live interactive analytics dashboard** — built from scratch with vanilla HTML, CSS, and JavaScript. **Zero frameworks, zero build step, zero dependencies.**

[**▶ Live demo**](https://aniarakelyan.github.io/helios-analytics/) · [Features](#-highlights) · [Architecture](#-architecture) · [Run locally](#-run-it-locally)

</div>

---

> **Why this project exists.** It's a portfolio piece built to demonstrate front-end fundamentals done well: clean semantic markup, a real design system, hand-written SVG data visualisation, accessible interactions, and tidy, modular JavaScript — without hiding behind a framework or chart library.

## ✨ Highlights

| | |
|---|---|
| 📊 **Custom SVG charts** | Area, bar, donut and sparkline charts written by hand — no D3, no Chart.js. Smooth path interpolation (Catmull-Rom → Bézier), animated draw-in, and live hover tooltips. |
| 🎛️ **A dashboard that responds** | Switch time ranges (7D/30D/90D/1Y), filter by channel, sort the data table, and hit *Refresh* to simulate a new data pull. Everything re-renders from a single source of truth. |
| 🌗 **Dark / light theming** | CSS custom-property design system with a persisted theme toggle that respects `prefers-color-scheme`. |
| ⌘ **Command palette** | A `⌘K` / `Ctrl+K` palette for keyboard navigation and quick actions, with full arrow-key + Enter support. |
| ♿ **Accessibility-first** | Semantic landmarks, skip link, ARIA roles/labels, visible focus states, keyboard-operable controls, and full `prefers-reduced-motion` support. |
| 📱 **Fully responsive** | Fluid type with `clamp()`, a mobile menu, and layouts that reflow cleanly from 4K down to 360px. |
| ⚡ **Fast by default** | No dependencies to download, charts rendered lazily on scroll via `IntersectionObserver`, debounced resize handling. |

## 🏗 Architecture

The codebase is intentionally small and modular. JavaScript is split into focused ES modules with single responsibilities:

```
helios-analytics/
├── index.html            # Semantic, accessible markup
├── css/
│   └── styles.css        # Design tokens + component styles (organised, single sheet)
├── js/
│   ├── main.js           # Entry point — boots each module
│   ├── data.js           # Seeded PRNG + mock data generators (reproducible)
│   ├── format.js         # Number / date / currency formatting helpers
│   ├── charts.js         # Hand-built SVG charts (area, bar, donut, sparkline)
│   ├── dashboard.js      # Dashboard state + rendering + interactions
│   └── ui.js             # Theme, nav, reveal, counters, palette, forms, toasts
└── assets/               # SVG favicon + social card
```

**Design notes**
- **No build tooling.** Native ES modules load directly in the browser. Clone and open — that's it.
- **Single source of truth.** Dashboard state lives in one object; every interaction mutates state then re-renders, keeping data flow predictable.
- **Deterministic data.** A seeded [Mulberry32](https://en.wikipedia.org/wiki/Xorshift) PRNG makes the demo reproducible, while `reseed()` powers the *Refresh* button.
- **Progressive enhancement.** Each module fails gracefully if its markup is missing, and motion is disabled for users who request reduced motion.

## 🚀 Run it locally

Because it uses ES modules, open it through a tiny static server (not `file://`):

```bash
# clone
git clone https://github.com/aniarakelyan/helios-analytics.git
cd helios-analytics

# serve with any static server, e.g.
python -m http.server 8000
#   – or –  npx serve
```

Then visit **http://localhost:8000**.

> On Windows PowerShell: `python -m http.server 8000` works the same.

## 🎯 What this demonstrates

- Writing **maintainable vanilla JS** with clear module boundaries
- **Data visualisation from first principles** (scales, SVG path geometry, polar coordinates)
- A real **CSS design system**: tokens, theming, fluid layout, motion
- **Accessibility and UX polish** that holds up under keyboard and screen-reader use
- Attention to **performance** and graceful degradation

## 🧰 Tech

`HTML5` · `CSS3 (custom properties, grid, clamp)` · `JavaScript (ES2022 modules)` · `SVG`

## 📄 License

[MIT](LICENSE) — free to learn from and build on.

---

<div align="center">

Helios is a **fictional product** created as a portfolio demonstration by **Ani Arakelyan**.

</div>
