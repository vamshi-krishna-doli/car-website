/**
 * NOCTIS Configuration
 * All section heights, chapter ranges, frame counts, paths, and callout coordinates.
 */
var NOCTIS_CONFIG = {
  // Brand tokens & meta
  brand: {
    name: 'NOCTIS',
    tagline: 'Drive the night.',
    year: 2026
  },

  // Scrollytelling Sequences
  hero: {
    sectionHeight: '600vh',
    frameCount: 432,
    paths: {
      desktop: 'assets/frames/hero/frame_',
      mobile: 'assets/frames/hero-mobile/frame_',
      ext: '.webp',
      pad: 4
    },
    initialPreloadCount: 40,
    speedMax: 118, // KM/H
    distanceMax: 4.2, // KM
    chapters: [
      {
        id: 'c1',
        start: 0.00,
        end: 0.14,
        hudChapter: '01/04',
        eyebrow: '01 — AWAKENING',
        title: 'NOCTIS',
        subtitle: 'The city is asleep.',
        hint: 'SCROLL TO WAKE IT'
      },
      {
        id: 'c2',
        start: 0.22,
        end: 0.40,
        hudChapter: '02/04',
        eyebrow: '02 — ILLUMINATION',
        title: "It doesn't need the city's light.",
        subtitle: ''
      },
      {
        id: 'c3',
        start: 0.50,
        end: 0.68,
        hudChapter: '03/04',
        eyebrow: '03 — AUTONOMY',
        title: 'It brings its own.',
        subtitle: ''
      },
      {
        id: 'c4',
        start: 0.80,
        end: 1.00,
        hudChapter: '04/04',
        eyebrow: '04 — SYNTHESIS',
        title: 'GT-E',
        subtitle: '0–100 KM/H 3.1S · 640 KM RANGE · DUAL MOTOR',
        cta: 'Discover the GT-E',
        ctaHref: '#lineup'
      }
    ]
  },

  statement: {
    label: '02 — ENGINEERING',
    text: 'Every part was designed to disappear into one line of light.'
  },

  dismantle: {
    sectionHeight: '350vh',
    frameCount: 144,
    paths: {
      desktop: 'assets/frames/dismantle/frame_',
      mobile: 'assets/frames/dismantle-mobile/frame_',
      ext: '.webp',
      pad: 4
    },
    title: 'Look closer.',
    eyebrow: '02.1 — ARCHITECTURE',
    calloutStartProgress: 0.70,
    // Callouts: targetX/Y are percentages on the car canvas; labelX/Y are position offsets in %
    callouts: [
      {
        id: 'body',
        label: 'BODY',
        text: 'Carbon composite monocoque',
        targetX: 52,
        targetY: 22,
        labelX: 24,
        labelY: 20,
        progress: 0.72
      },
      {
        id: 'light',
        label: 'LIGHT',
        text: 'Single-line LED signature',
        targetX: 38,
        targetY: 46,
        labelX: 18,
        labelY: 44,
        progress: 0.78
      },
      {
        id: 'battery',
        label: 'BATTERY',
        text: '110 kWh structural pack',
        targetX: 55,
        targetY: 72,
        labelX: 32,
        labelY: 82,
        progress: 0.84
      },
      {
        id: 'drive',
        label: 'DRIVE',
        text: 'Dual axial-flux motors, 680 kW',
        targetX: 28,
        targetY: 64,
        labelX: 72,
        labelY: 68,
        progress: 0.90
      }
    ]
  },

  lineup: {
    eyebrow: '03 — THE LINEUP',
    title: 'Five ways to drive the night.',
    defaultActiveIndex: 0,
    hoverDebounceMs: 80,
    models: [
      {
        id: 'gt-e',
        num: '01',
        name: 'GT-E',
        tagline: 'The grand tourer.',
        specs: {
          range: '640 km',
          acceleration: '3.1 s',
          power: '680 kW'
        },
        image: 'assets/cars/gt-e.webp',
        alt: 'NOCTIS GT-E matte graphite electric grand tourer coupe side profile',
        swatches: ['#1A1C20', '#EDEAE4', '#0D1B2A', '#8B0000'],
        activeSwatch: 0
      },
      {
        id: 's',
        num: '02',
        name: 'S',
        tagline: 'Four doors, no compromise.',
        specs: {
          range: '600 km',
          acceleration: '3.6 s',
          power: '520 kW'
        },
        image: 'assets/cars/s.webp',
        alt: 'NOCTIS S four-door sport sedan satin bone white side profile',
        swatches: ['#E2DFD8', '#1A1C20', '#2C3E50', '#4A4E69'],
        activeSwatch: 0
      },
      {
        id: 'x',
        num: '03',
        name: 'X',
        tagline: 'Higher, never heavier.',
        specs: {
          range: '560 km',
          acceleration: '4.2 s',
          power: '480 kW'
        },
        image: 'assets/cars/x.webp',
        alt: 'NOCTIS X electric SUV coupe roofline midnight blue side profile',
        swatches: ['#0A192F', '#1B1F23', '#EDEAE4', '#202E39'],
        activeSwatch: 0
      },
      {
        id: 'r',
        num: '04',
        name: 'R',
        tagline: 'Built for the track.',
        specs: {
          range: '420 km',
          acceleration: '2.4 s',
          power: '900 kW'
        },
        image: 'assets/cars/r.webp',
        alt: 'NOCTIS R track coupe with rear wing satin black side profile',
        swatches: ['#121316', '#8F1D1D', '#E5E5E5', '#1F2A38'],
        activeSwatch: 0
      },
      {
        id: 'one',
        num: '05',
        name: 'ONE',
        tagline: 'The future, early.',
        specs: {
          range: 'Concept',
          acceleration: 'Concept',
          power: 'Concept'
        },
        image: 'assets/cars/one.webp',
        alt: 'NOCTIS ONE concept hypercar liquid silver side profile',
        swatches: ['#D1D5DB', '#0F172A', '#1C1917', '#334155'],
        activeSwatch: 0
      }
    ]
  },

  reserve: {
    eyebrow: '04 — RESERVATION',
    title: 'Drive the night.',
    body: 'Priority delivery slots are now open for the 2026 production allocation.',
    cta: 'RESERVE YOUR NOCTIS'
  },

  footer: {
    brand: 'NOCTIS',
    copyright: '© 2026 NOCTIS (fictional brand). All rights reserved.',
    columns: [
      {
        title: 'VEHICLES',
        links: ['GT-E Grand Tourer', 'S Sport Sedan', 'X Coupe SUV', 'R Track Coupe', 'ONE Hypercar']
      },
      {
        title: 'TECHNOLOGY',
        links: ['Light Architecture', 'Axial-Flux Motors', 'Structural Pack', 'Noctis OS', 'Charging Grid']
      },
      {
        title: 'COMPANY',
        links: ['Philosophy', 'Atelier', 'Press Room', 'Careers', 'Privacy Policy']
      }
    ]
  }
};

if (typeof window !== 'undefined') {
  window.NOCTIS_CONFIG = NOCTIS_CONFIG;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = NOCTIS_CONFIG;
}
