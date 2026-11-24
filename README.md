# NOCTIS — Scrollytelling Website

> *A city in total blackout at night. The car's light is the only light in the world. Quiet, expensive, and precise.*

**NOCTIS** is an immersive, single-page scrollytelling website for a fictional luxury electric car brand — built entirely with vanilla HTML, CSS, and JavaScript. No frameworks. No dependencies. Just the web platform pushed to its limits.

Scroll through cinematic frame sequences, explore an exploded component view, configure your model from a 5-car interactive lineup, and navigate with a custom headlight cursor that reacts to your every move.

---

## ✨ Features

| Feature | Description |
|---|---|
| 🎞️ **Scroll-Scrubbed Hero** | 432-frame canvas sequence across 600vh — 3 clips joined seamlessly, tracking scroll progress with a live velocity + distance HUD |
| 🔩 **Component Dismantle** | 144-frame exploded view across 350vh with callouts for Body, Light signature, Battery pack & Dual motors |
| 🚗 **Interactive Lineup** | 5-model selector (GT-E, S, X, R, ONE) with color swatches, 80ms debounced transitions & keyboard navigation |
| 🔦 **Headlight Cursor** | Custom cursor with lerp physics that morphs into a xenon light bar on interactive elements |
| 🎬 **Film Grain + Reveals** | Fixed offscreen noise canvas, staggered typography reveals, and full reduced-motion support |
| ⚡ **Zero Dependencies** | Pure HTML5, CSS3, and JavaScript — no frameworks, no libraries |

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (any recent version)

### Run Locally

```bash
# 1. Clone the repo
git clone https://github.com/KRISHNA2006usa/car-website.git

# 2. Enter the project folder
cd car-website

# 3. Start the local server
node server.js
```

Then open **[http://localhost:3000](http://localhost:3000)** in your browser.

> The server handles all MIME types correctly (WebP, MP4, JS, CSS) and sets CORS headers for local development — no extra setup needed.

---

## 📁 Project Structure

```
car-website/
├── index.html          # Main HTML — all sections
├── main.js             # All scroll logic, canvas rendering, interactions
├── styles.css          # All styles — layout, animations, typography
├── config.js           # Frame counts, paths, section config
├── server.js           # Minimal Node.js static file server
├── assets/
│   ├── cars/           # Car lineup WebP images (GT-E, S, X, R, ONE)
│   └── frames/         # Optimised WebP frame sequences
│       ├── hero-*/     # Hero scroll frames (desktop + mobile)
│       └── dismantle-*/# Dismantle scroll frames (desktop + mobile)
├── clip-1.mp4          # Raw hero clip 1 (source)
├── clip-2.mp4          # Raw hero clip 2 (source)
├── clip-3.mp4          # Raw hero clip 3 (source)
└── flow-clip.mp4       # Dismantle section clip (source)
```

---

## 🔗 Resources

- 🌐 **Live Demo** — *(coming soon — deploy via Netlify or GitHub Pages)*
- 📦 **GitHub Repo** — [github.com/KRISHNA2006usa/car-website](https://github.com/KRISHNA2006usa/car-website)
- 🛠️ **Tech Stack** — HTML5 · CSS3 · Vanilla JavaScript · Node.js

---

## 📄 License

This project is for portfolio and educational purposes. The NOCTIS brand is fictional.
