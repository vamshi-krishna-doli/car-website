# NOCTIS — Scrollytelling Website

A minimal, single-page scrollytelling experience for **NOCTIS**, a fictional luxury electric car brand.

Mood: *A city in total blackout at night where the car's light is the only light in the world. Quiet, expensive, and precise.*

## Features

- **Pure Vanilla Stack**: Plain HTML5, CSS3, and JavaScript only. Zero frameworks, zero external libraries.
- **Scroll-Scrubbed Canvas Sequences**:
  - **Hero (432 frames, 600vh)**: Seamlessly joined 3-clip sequence tracking 0–100% scroll progress with custom velocity and traversed distance HUD.
  - **Component Dismantle (144 frames, 350vh)**: Exploded view with laser-accurate component callouts (Body, Light signature, Battery pack, Dual motors).
- **Interactive Lineup Accordion**: 5-model vehicle selector (GT-E, S, X, R, ONE) with 80ms debounced transitions, interactive color swatches, and keyboard navigation.
- **The Headlight Custom Cursor**: Follows mouse coordinates with smooth lerp physics and morphs into a xenon light bar on interactive elements.
- **Micro-Effects**: Fixed offscreen film-grain noise canvas, staggered typography reveals, and reduced-motion fallbacks.

## Running Locally

Run a simple local server in this directory:

```bash
# Using Node
node server.js
```

Open [http://localhost:3000](http://localhost:3000) in your browser.
