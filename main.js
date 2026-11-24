/**
 * NOCTIS — Main Controller & Scrollytelling Engine
 * Pure vanilla JavaScript, 60fps canvas render loop, frame cache, HUD,
 * statement scrub, dismantle callouts, lineup accordion, and custom headlight cursor.
 */

(function () {
  'use strict';

  // Check reduced motion preference
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (prefersReducedMotion) {
    document.body.classList.add('reduce-motion');
  }

  /* ==========================================================================
     1. FILM-GRAIN OVERLAY GENERATOR
     ========================================================================== */
  function initFilmGrain() {
    const grainCanvas = document.getElementById('grain-canvas');
    if (!grainCanvas) return;
    const ctx = grainCanvas.getContext('2d', { alpha: true });

    // Generate offscreen noise tile (128x128)
    const tileSize = 128;
    const offscreen = document.createElement('canvas');
    offscreen.width = tileSize;
    offscreen.height = tileSize;
    const offCtx = offscreen.getContext('2d');
    const imgData = offCtx.createImageData(tileSize, tileSize);
    const buf = imgData.data;

    for (let i = 0; i < buf.length; i += 4) {
      const val = (Math.random() * 255) | 0;
      buf[i] = val;     // R
      buf[i + 1] = val; // G
      buf[i + 2] = val; // B
      buf[i + 3] = 40;  // Alpha ~15% on tile, rendered with global opacity 3.5%
    }
    offCtx.putImageData(imgData, 0, 0);

    function resizeGrain() {
      grainCanvas.width = window.innerWidth;
      grainCanvas.height = window.innerHeight;
    }
    window.addEventListener('resize', resizeGrain, { passive: true });
    resizeGrain();

    // Shift randomly ~8 times per second (125ms interval)
    let lastShift = 0;
    function renderGrain(now) {
      if (now - lastShift > 125) {
        lastShift = now;
        ctx.clearRect(0, 0, grainCanvas.width, grainCanvas.height);
        const offsetX = (Math.random() * tileSize) | 0;
        const offsetY = (Math.random() * tileSize) | 0;

        for (let x = -tileSize; x < grainCanvas.width + tileSize; x += tileSize) {
          for (let y = -tileSize; y < grainCanvas.height + tileSize; y += tileSize) {
            ctx.drawImage(offscreen, x + offsetX, y + offsetY);
          }
        }
      }
      requestAnimationFrame(renderGrain);
    }
    requestAnimationFrame(renderGrain);
  }

  /* ==========================================================================
     2. FRAME PRELOADER & CACHE MANAGER
     ========================================================================== */
  class FrameSequence {
    constructor(cfg) {
      this.cfg = cfg;
      this.totalFrames = cfg.frameCount;
      this.frames = new Array(this.totalFrames);
      this.loadedCount = 0;
      this.isMobile = window.innerWidth < 768;
    }

    getFramePath(index) {
      const basePath = this.isMobile ? this.cfg.paths.mobile : this.cfg.paths.desktop;
      const numStr = String(index + 1).padStart(this.cfg.paths.pad, '0');
      return `${basePath}${numStr}${this.cfg.paths.ext}`;
    }

    preloadInitial(count, onProgress) {
      return new Promise((resolve) => {
        let loaded = 0;
        const target = Math.min(count, this.totalFrames);
        let timeout = setTimeout(() => {
          console.warn('preloadInitial timeout, proceeding to reveal...');
          resolve();
        }, 2000);

        for (let i = 0; i < target; i++) {
          this.loadFrame(i).then(() => {
            loaded++;
            if (onProgress) onProgress(loaded / target);
            if (loaded >= target) {
              clearTimeout(timeout);
              resolve();
            }
          });
        }
      });
    }

    loadFrame(index) {
      if (this.frames[index]) {
        return Promise.resolve(this.frames[index]);
      }

      return new Promise((resolve) => {
        const img = new Image();
        let settled = false;

        const complete = (result) => {
          if (settled) return;
          settled = true;
          this.frames[index] = result;
          if (result) this.loadedCount++;
          if (this.onFrameLoaded) this.onFrameLoaded(index);
          resolve(result);
        };

        img.onload = () => {
          if (typeof img.decode === 'function') {
            img.decode().then(() => complete(img)).catch(() => complete(img));
          } else {
            complete(img);
          }
        };

        img.onerror = () => {
          complete(null);
        };

        img.src = this.getFramePath(index);

        // Safety timeout per frame: never hang longer than 1500ms
        setTimeout(() => complete(null), 1500);
      });
    }

    preloadRemaining(startIndex = 0) {
      let current = startIndex;
      const loadNext = () => {
        if (current >= this.totalFrames) return;
        this.loadFrame(current).then(() => {
          current++;
          if (window.requestIdleCallback) {
            requestIdleCallback(loadNext, { timeout: 80 });
          } else {
            setTimeout(loadNext, 16);
          }
        });
      };
      loadNext();
    }

    getNearestLoadedFrame(targetIndex) {
      if (this.frames[targetIndex]) {
        return this.frames[targetIndex];
      }
      // Search outward for the closest loaded frame
      let offset = 1;
      while (targetIndex - offset >= 0 || targetIndex + offset < this.totalFrames) {
        if (targetIndex - offset >= 0 && this.frames[targetIndex - offset]) {
          return this.frames[targetIndex - offset];
        }
        if (targetIndex + offset < this.totalFrames && this.frames[targetIndex + offset]) {
          return this.frames[targetIndex + offset];
        }
        offset++;
      }
      return null;
    }
  }

  /* ==========================================================================
     3. CANVAS RENDER LOOP CONTROLLER
     ========================================================================== */
  class CanvasScroller {
    constructor(canvasId, wrapperId, sequence, options = {}) {
      this.canvas = document.getElementById(canvasId);
      this.wrapper = document.getElementById(wrapperId);
      this.sequence = sequence;
      this.options = options;
      this.ctx = this.canvas ? this.canvas.getContext('2d', { alpha: false }) : null;

      this.currentFrame = 0;
      this.targetFrame = 0;
      this.lastDrawnFrame = -1;
      this.needsRedraw = true;
      this.progress = 0;
      this.dpr = Math.min(window.devicePixelRatio || 1, 2);

      this.init();
    }

    init() {
      if (!this.canvas || !this.wrapper) return;
      this.resize();
      window.addEventListener('resize', () => this.resize(), { passive: true });
    }

    resize() {
      const rect = this.canvas.getBoundingClientRect();
      this.width = rect.width;
      this.height = rect.height;
      this.canvas.width = this.width * this.dpr;
      this.canvas.height = this.height * this.dpr;
      this.ctx.scale(this.dpr, this.dpr);

      // Force redraw
      this.lastDrawnFrame = -1;
      this.needsRedraw = true;
      this.draw(Math.round(this.currentFrame));
    }

    updateScroll(progress) {
      this.progress = Math.max(0, Math.min(1, progress));
      this.targetFrame = Math.round(this.progress * (this.sequence.totalFrames - 1));
    }

    tick() {
      // Lerp frame progress
      this.currentFrame += (this.targetFrame - this.currentFrame) * 0.15;
      const rounded = Math.round(this.currentFrame);

      if (rounded !== this.lastDrawnFrame || this.needsRedraw) {
        const drawn = this.draw(rounded);
        if (drawn) {
          this.lastDrawnFrame = rounded;
          this.needsRedraw = false;
        }
      }
    }

    draw(frameIndex) {
      if (!this.ctx) return false;
      const img = this.sequence.getNearestLoadedFrame(frameIndex);
      if (!img) return false;

      const cw = this.width;
      const ch = this.height;
      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;

      this.ctx.fillStyle = '#07080A'; // --asphalt
      this.ctx.fillRect(0, 0, cw, ch);

      const isLandscape = cw >= ch;

      let drawW, drawH, drawX, drawY;

      if (isLandscape) {
        // Landscape: cover-fit
        const scale = Math.max(cw / iw, ch / ih);
        drawW = iw * scale;
        drawH = ih * scale;
        drawX = (cw - drawW) / 2;
        drawY = (ch - drawH) / 2;
      } else {
        // Portrait: contain-fit, vertically centered on --asphalt, car never cropped
        const scale = Math.min(cw / iw, ch / ih);
        drawW = iw * scale;
        drawH = ih * scale;
        drawX = (cw - drawW) / 2;
        drawY = (ch - drawH) / 2;
      }

      this.ctx.drawImage(img, drawX, drawY, drawW, drawH);

      // Optional fade to black (used in hero over last 5% of scroll)
      if (this.options.fadeToBlack && this.progress >= 0.95) {
        const fadeAlpha = (this.progress - 0.95) / 0.05;
        this.ctx.fillStyle = '#07080A';
        this.ctx.globalAlpha = Math.min(1, fadeAlpha);
        this.ctx.fillRect(0, 0, cw, ch);
        this.ctx.globalAlpha = 1.0;
      }

      // Store current render transform for coordinate projection (callouts)
      this.lastTransform = { drawX, drawY, drawW, drawH, isLandscape, cw, ch };
      return true;
    }
  }

  /* ==========================================================================
     4. HUD & CHAPTER CONTROLLER (Hero)
     ========================================================================== */
  class HeroHUDController {
    constructor(cfg) {
      this.cfg = cfg;
      this.hudChapter = document.getElementById('hud-chapter-text');
      this.hudSpeed = document.getElementById('hud-speed-num');
      this.hudDist = document.getElementById('hud-dist-num');
      this.progressFill = document.getElementById('hero-progress-fill');
      this.chapterEls = [
        document.getElementById('hero-ch-1'),
        document.getElementById('hero-ch-2'),
        document.getElementById('hero-ch-3'),
        document.getElementById('hero-ch-4')
      ];
      this.currentChapterIndex = 0;
    }

    update(progress) {
      // 1. Update bottom progress line
      if (this.progressFill) {
        this.progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
      }

      // 2. Velocity & Traversed telemetry
      if (this.hudSpeed) {
        const speed = Math.round(progress * this.cfg.speedMax);
        this.hudSpeed.textContent = String(speed).padStart(3, '0');
      }
      if (this.hudDist) {
        const dist = (progress * this.cfg.distanceMax).toFixed(1);
        this.hudDist.textContent = dist;
      }

      // 3. Chapter activation
      let activeIndex = 0;
      const chapters = this.cfg.chapters;
      for (let i = 0; i < chapters.length; i++) {
        if (progress >= chapters[i].start && progress <= chapters[i].end) {
          activeIndex = i;
          break;
        } else if (progress > chapters[i].end && i === chapters.length - 1) {
          activeIndex = i;
        }
      }

      if (activeIndex !== this.currentChapterIndex) {
        this.currentChapterIndex = activeIndex;
        if (this.hudChapter && chapters[activeIndex]) {
          this.hudChapter.textContent = chapters[activeIndex].hudChapter;
        }
      }

      // Update visibility and line reveal
      for (let i = 0; i < chapters.length; i++) {
        const el = this.chapterEls[i];
        if (!el) continue;
        const isActive = (progress >= chapters[i].start && progress <= chapters[i].end);
        if (isActive) {
          el.classList.add('active');
        } else {
          el.classList.remove('active');
        }
      }
    }
  }

  /* ==========================================================================
     5. STATEMENT WORD-BY-WORD SCRUBBER
     ========================================================================== */
  function initStatementScrubber(cfg) {
    const section = document.getElementById('statement');
    const textEl = document.getElementById('statement-text');
    if (!section || !textEl) return;

    const words = cfg.text.split(' ');
    textEl.innerHTML = words.map(w => `<span class="statement-word">${w}</span>`).join(' ');
    const wordSpans = textEl.querySelectorAll('.statement-word');

    function updateStatement() {
      const rect = section.getBoundingClientRect();
      const winH = window.innerHeight;
      // Calculate progress while section is moving through viewport
      const progress = (winH - rect.top) / (winH + rect.height);
      const clamped = Math.max(0, Math.min(1, progress));

      // Reveal words in sequence from 15% to 100% opacity
      const count = wordSpans.length;
      wordSpans.forEach((span, idx) => {
        const threshold = idx / count;
        if (clamped >= threshold + 0.1) {
          span.style.opacity = '1';
        } else if (clamped >= threshold) {
          const factor = (clamped - threshold) / 0.1;
          span.style.opacity = (0.15 + factor * 0.85).toFixed(2);
        } else {
          span.style.opacity = '0.15';
        }
      });
    }

    window.addEventListener('scroll', updateStatement, { passive: true });
    updateStatement();
  }

  /* ==========================================================================
     6. DISMANTLE CALLOUTS CONTROLLER
     ========================================================================== */
  class DismantleController {
    constructor(cfg, canvasScroller) {
      this.cfg = cfg;
      this.scroller = canvasScroller;
      this.progressFill = document.getElementById('dismantle-progress-fill');
      this.callouts = cfg.callouts;
      this.calloutEls = {};

      this.callouts.forEach(c => {
        this.calloutEls[c.id] = document.getElementById(`callout-${c.id}`);
      });

      this.positionCallouts();
      window.addEventListener('resize', () => this.positionCallouts(), { passive: true });
    }

    positionCallouts() {
      const tf = this.scroller && this.scroller.lastTransform;
      const stageW = window.innerWidth;
      const stageH = window.innerHeight;

      // Map percentages to stage positions
      this.callouts.forEach(c => {
        const el = this.calloutEls[c.id];
        if (!el) return;

        const dot = el.querySelector('.callout-dot');
        const card = el.querySelector('.callout-card');
        const line = el.querySelector('.callout-line');
        const svg = el.querySelector('.callout-hairline');

        // Pin directly to actual drawn car part on canvas
        const targetPixelX = tf ? tf.drawX + (c.targetX / 100) * tf.drawW : (c.targetX / 100) * stageW;
        const targetPixelY = tf ? tf.drawY + (c.targetY / 100) * tf.drawH : (c.targetY / 100) * stageH;

        dot.style.left = `${targetPixelX}px`;
        dot.style.top = `${targetPixelY}px`;

        const labelPixelX = (c.labelX / 100) * stageW;
        const labelPixelY = (c.labelY / 100) * stageH;

        card.style.left = `${labelPixelX}px`;
        card.style.top = `${labelPixelY}px`;

        const minX = Math.min(targetPixelX, labelPixelX) - 10;
        const minY = Math.min(targetPixelY, labelPixelY) - 10;
        const width = Math.abs(labelPixelX - targetPixelX) + 20;
        const height = Math.abs(labelPixelY - targetPixelY) + 20;

        svg.style.left = `${minX}px`;
        svg.style.top = `${minY}px`;
        svg.style.width = `${Math.max(1, width)}px`;
        svg.style.height = `${Math.max(1, height)}px`;
        svg.setAttribute('viewBox', `0 0 ${width} ${height}`);

        line.setAttribute('x1', targetPixelX - minX);
        line.setAttribute('y1', targetPixelY - minY);
        line.setAttribute('x2', labelPixelX - minX);
        line.setAttribute('y2', labelPixelY - minY);
      });
    }

    update(progress) {
      if (this.progressFill) {
        this.progressFill.style.width = `${(progress * 100).toFixed(1)}%`;
      }

      this.positionCallouts();

      this.callouts.forEach(c => {
        const el = this.calloutEls[c.id];
        if (!el) return;
        if (progress >= c.progress) {
          el.classList.add('is-visible');
        } else {
          el.classList.remove('is-visible');
        }
      });
    }
  }

  /* ==========================================================================
     7. LINEUP ACCORDION CONTROLLER
     ========================================================================== */
  function initLineupAccordion(cfg) {
    const accordion = document.getElementById('lineup-accordion');
    const section = document.getElementById('lineup');
    if (!accordion || !section) return;

    const slides = Array.from(accordion.querySelectorAll('.accordion-slide'));
    let activeIndex = cfg.defaultActiveIndex || 0;
    let hoverTimeout = null;

    function setActiveSlide(index) {
      if (index === activeIndex && slides[index].classList.contains('is-active')) return;
      activeIndex = index;

      slides.forEach((slide, i) => {
        const isCurrent = (i === index);
        slide.classList.toggle('is-active', isCurrent);
        slide.setAttribute('aria-expanded', isCurrent ? 'true' : 'false');
        slide.setAttribute('aria-selected', isCurrent ? 'true' : 'false');
      });
    }

    // Hover with 80ms debounce on desktop
    slides.forEach((slide, idx) => {
      slide.addEventListener('mouseenter', () => {
        if (window.innerWidth < 768) return;
        clearTimeout(hoverTimeout);
        hoverTimeout = setTimeout(() => {
          setActiveSlide(idx);
        }, cfg.hoverDebounceMs || 80);
      });

      slide.addEventListener('mouseleave', () => {
        clearTimeout(hoverTimeout);
      });

      // Tap / Click for mobile and touch
      slide.addEventListener('click', (e) => {
        if (!e.target.closest('.configure-link') && !e.target.closest('.swatch')) {
          setActiveSlide(idx);
        }
      });

      // Swatches selection
      const swatches = slide.querySelectorAll('.swatch');
      swatches.forEach(swatch => {
        swatch.addEventListener('click', (e) => {
          e.stopPropagation();
          swatches.forEach(s => s.classList.remove('is-active'));
          swatch.classList.add('is-active');
        });
      });
    });

    // Keyboard Navigation (Arrow Keys)
    accordion.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') {
        e.preventDefault();
        const next = (activeIndex + 1) % slides.length;
        setActiveSlide(next);
        slides[next].focus();
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') {
        e.preventDefault();
        const prev = (activeIndex - 1 + slides.length) % slides.length;
        setActiveSlide(prev);
        slides[prev].focus();
      }
    });

    // Staggered reveal on scroll
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          section.classList.add('is-revealed');
          observer.unobserve(section);
        }
      });
    }, { threshold: 0.15 });
    observer.observe(section);
  }

  /* ==========================================================================
     8. CUSTOM CURSOR ("The Headlight")
     ========================================================================== */
  function initCustomCursor() {
    if (prefersReducedMotion || window.innerWidth < 768) return;

    const cursor = document.getElementById('cursor');
    const labelEl = document.getElementById('cursor-label');
    if (!cursor) return;

    let mouseX = -100;
    let mouseY = -100;
    let cursorX = -100;
    let cursorY = -100;
    const lerp = 0.18;

    window.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    }, { passive: true });

    // Render loop for cursor lerp
    function renderCursor() {
      cursorX += (mouseX - cursorX) * lerp;
      cursorY += (mouseY - cursorY) * lerp;
      cursor.style.transform = `translate3d(${cursorX}px, ${cursorY}px, 0)`;
      requestAnimationFrame(renderCursor);
    }
    requestAnimationFrame(renderCursor);

    // Mousedown brightening for 120ms
    window.addEventListener('mousedown', () => {
      cursor.classList.add('is-down');
      setTimeout(() => {
        cursor.classList.remove('is-down');
      }, 120);
    });

    // Morph state detection on hoverable elements
    document.addEventListener('mouseover', (e) => {
      if (!e || !e.target || !e.target.closest) return;
      const target = e.target.closest('a, button, [data-cursor], .accordion-slide');
      if (target) {
        cursor.classList.add('is-hovering');
        let label = target.getAttribute('data-cursor') || 'VIEW';

        if (target.classList.contains('accordion-slide')) {
          label = target.classList.contains('is-active') ? 'CONFIGURE' : 'OPEN';
        }
        if (labelEl) labelEl.textContent = label;
      }
    });

    document.addEventListener('mouseout', (e) => {
      if (!e || !e.target || !e.target.closest) return;
      const target = e.target.closest('a, button, [data-cursor], .accordion-slide');
      if (target) {
        cursor.classList.remove('is-hovering');
        if (labelEl) labelEl.textContent = '';
      }
    });
  }

  /* ==========================================================================
     9. GLOBAL NAV AUTO-HIDE CONTROLLER
     ========================================================================== */
  function initNavScroll() {
    const header = document.getElementById('site-header');
    if (!header) return;

    let lastScrollY = window.scrollY;
    let ticking = false;

    window.addEventListener('scroll', () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          const currentScrollY = window.scrollY;
          if (currentScrollY > 100 && currentScrollY > lastScrollY) {
            header.classList.add('is-hidden');
          } else {
            header.classList.remove('is-hidden');
          }
          lastScrollY = currentScrollY;
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ==========================================================================
     10. INITIALIZATION & ORCHESTRATION
     ========================================================================== */
  async function init() {
    const cfg = window.NOCTIS_CONFIG || (typeof NOCTIS_CONFIG !== 'undefined' ? NOCTIS_CONFIG : null);
    if (!cfg) {
      console.error('NOCTIS_CONFIG not found');
      document.body.classList.remove('is-loading');
      return;
    }

    // Apply section heights dynamically from config.js
    const heroEl = document.getElementById('hero');
    if (heroEl && cfg.hero && cfg.hero.sectionHeight) {
      heroEl.style.height = cfg.hero.sectionHeight;
    }
    const dismantleEl = document.getElementById('dismantle');
    if (dismantleEl && cfg.dismantle && cfg.dismantle.sectionHeight) {
      dismantleEl.style.height = cfg.dismantle.sectionHeight;
    }

    // Initialize UI components
    initFilmGrain();
    initCustomCursor();
    initNavScroll();
    initStatementScrubber(cfg.statement);
    initLineupAccordion(cfg.lineup);

    // Prepare frame sequences
    const heroSeq = new FrameSequence(cfg.hero);
    const dismantleSeq = new FrameSequence(cfg.dismantle);

    // Setup canvas controllers
    const heroScroller = new CanvasScroller('hero-canvas', 'hero', heroSeq, { fadeToBlack: true });
    const heroHUD = new HeroHUDController(cfg.hero);

    const dismantleScroller = new CanvasScroller('dismantle-canvas', 'dismantle', dismantleSeq);
    const dismantleCtrl = new DismantleController(cfg.dismantle, dismantleScroller);

    // Notify scrollers whenever background frames arrive
    heroSeq.onFrameLoaded = () => { heroScroller.needsRedraw = true; };
    dismantleSeq.onFrameLoaded = () => { dismantleScroller.needsRedraw = true; };

    // Preloader elements
    const preloader = document.getElementById('preloader');
    const preloaderLine = document.getElementById('preloader-line');
    const preloaderCounter = document.getElementById('preloader-counter');

    // Preload initial frames (hero 1-40 and dismantle 1-12) with a guaranteed exit
    const heroPreload = heroSeq.preloadInitial(cfg.hero.initialPreloadCount, (progress) => {
      const pct = Math.round(progress * 100);
      if (preloaderLine) preloaderLine.style.width = `${pct}%`;
      if (preloaderCounter) preloaderCounter.textContent = String(pct).padStart(3, '0');
    });
    const dismantlePreload = dismantleSeq.preloadInitial(12);

    const preloaderTimeout = setTimeout(() => {
      document.body.classList.remove('is-loading');
      if (preloader) preloader.classList.add('exiting');
    }, 1500);

    try {
      await Promise.all([heroPreload, dismantlePreload]);
    } catch (err) {
      console.warn('Preload notice:', err);
    } finally {
      clearTimeout(preloaderTimeout);
      if (preloader) {
        preloader.classList.add('exiting');
        setTimeout(() => {
          document.body.classList.remove('is-loading');
        }, 150);
      } else {
        document.body.classList.remove('is-loading');
      }
    }

    // Global scroll calculation loop
    function onScroll() {
      // 1. Hero calculation
      const heroWrapper = document.getElementById('hero');
      if (heroWrapper) {
        const rect = heroWrapper.getBoundingClientRect();
        const maxScroll = heroWrapper.offsetHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, -rect.top / maxScroll)) : 0;
        heroScroller.updateScroll(progress);
        heroHUD.update(progress);
      }

      // 2. Dismantle calculation
      const dismantleWrapper = document.getElementById('dismantle');
      if (dismantleWrapper) {
        const rect = dismantleWrapper.getBoundingClientRect();
        const maxScroll = dismantleWrapper.offsetHeight - window.innerHeight;
        const progress = maxScroll > 0 ? Math.max(0, Math.min(1, -rect.top / maxScroll)) : 0;
        dismantleScroller.updateScroll(progress);
        dismantleCtrl.update(progress);
      }
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    onScroll();

    // 60fps Animation Loop
    function animationLoop() {
      heroScroller.tick();
      dismantleScroller.tick();
      requestAnimationFrame(animationLoop);
    }
    requestAnimationFrame(animationLoop);

    // Asynchronously preload remaining frames in background in parallel
    setTimeout(() => {
      heroSeq.preloadRemaining(cfg.hero.initialPreloadCount);
      dismantleSeq.preloadRemaining(12);
    }, 200);
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
