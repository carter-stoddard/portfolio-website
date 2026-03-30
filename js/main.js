/* ============================================================
   MAIN.JS
   Entry point. Initializes all modules in sequence.
   ============================================================ */

// Reset scroll before unload so browser doesn't restore mid-page
window.addEventListener('beforeunload', function() {
  window.scrollTo(0, 0);
});

document.addEventListener('DOMContentLoaded', () => {

  // 0. Force scroll to top on every page load — prevents browser restoring mid-page position
  if ('scrollRestoration' in history) {
    history.scrollRestoration = 'manual';
  }
  window.scrollTo(0, 0);
  document.documentElement.scrollTop = 0;
  document.body.scrollTop = 0;

  // 1. Init animations registry
  Animations.init();

  // 2. Init starfield immediately
  const starCanvas = document.getElementById('starfield-canvas');
  if (starCanvas) Starfield.init(starCanvas);

  // 3. Start loading hero textures NOW — runs in parallel with loader animation
  Hero.preload();

  // 4. Run loader → on complete, hero renders + Lenis starts
  Loader.init(() => {
    document.body.classList.add('site-ready');

    // Lenis smooth scroll — full proxy on desktop, native scroll on mobile
    const isTouchDevice = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    if (typeof Lenis !== 'undefined') {
      window.lenis = new Lenis({
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: !isTouchDevice,
        smoothTouch: false,
        syncTouch: false,
      });
      window.lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((time) => { window.lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);

      if (!isTouchDevice) {
        // Desktop only — proxy lets ScrollTrigger read Lenis scroll position
        ScrollTrigger.scrollerProxy(document.documentElement, {
          scrollTop(value) {
            if (arguments.length) { window.lenis.scrollTo(value, { immediate: true }); }
            return window.lenis.scroll;
          },
          getBoundingClientRect() {
            return { top: 0, left: 0, width: window.innerWidth, height: window.innerHeight };
          },
          pinType: document.documentElement.style.transform ? 'transform' : 'fixed',
        });
        ScrollTrigger.defaults({ scroller: document.documentElement });
      }

      ScrollTrigger.refresh();
    }

    // Force scroll to top again after Lenis init
    window.scrollTo(0, 0);

    MenuOverlay.init();

    // Hero lock button — mobile only
    window.heroLocked = false;
    const lockBtn = document.getElementById('hero-lock-btn');
    const heroSection = document.getElementById('hero');
    if (lockBtn && heroSection) {
      // Show button only while hero is in viewport
      const heroObserver = new IntersectionObserver(function(entries) {
        entries.forEach(function(entry) {
          lockBtn.classList.toggle('is-visible', entry.isIntersecting);
          // Auto-unlock when hero scrolls out of view
          if (!entry.isIntersecting && window.heroLocked) {
            window.heroLocked = false;
            lockBtn.classList.remove('is-locked');
            lockBtn.setAttribute('aria-pressed', 'false');
            lockBtn.querySelector('.hero-lock-btn__label').textContent = 'LOCK';
          }
        });
      }, { threshold: 0.1 });
      heroObserver.observe(heroSection);

      lockBtn.addEventListener('click', function() {
        window.heroLocked = !window.heroLocked;
        lockBtn.classList.toggle('is-locked', window.heroLocked);
        lockBtn.setAttribute('aria-pressed', String(window.heroLocked));
        lockBtn.querySelector('.hero-lock-btn__label').textContent = window.heroLocked ? 'LOCKED' : 'LOCK';
        // When locking, prevent Lenis from scrolling
        if (window.lenis) {
          window.heroLocked ? window.lenis.stop() : window.lenis.start();
        }
      });
    }

    Animations.heroEntrance();
    Animations.quoteReveal();
    Animations.aboutScroll();
    Animations.statsReveal();
    Animations.servicesReveal();
    Animations.clientsGrid();
    Animations.testimonialsReveal();
    Animations.contactReveal();
    Animations.footerReveal();
    Hero.start();

    // Recalculate ScrollTrigger positions once images/fonts are fully loaded
    window.addEventListener('load', function() {
      ScrollTrigger.refresh();
    });
  });

});
