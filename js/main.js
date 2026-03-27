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

    // Lenis smooth scroll — synced with GSAP ticker + ScrollTrigger
    if (typeof Lenis !== 'undefined') {
      window.lenis = new Lenis({
        duration: 1.6,
        easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
        smoothWheel: true,
        smoothTouch: true,
        syncTouch: true,
        syncTouchLerp: 0.04,
      });
      // Connect Lenis scroll position to ScrollTrigger
      window.lenis.on('scroll', ScrollTrigger.update);
      // Drive Lenis from GSAP's ticker for frame-perfect sync
      gsap.ticker.add((time) => { window.lenis.raf(time * 1000); });
      gsap.ticker.lagSmoothing(0);
      // Tell ScrollTrigger to use Lenis's scroller proxy
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
      // Refresh ScrollTrigger after Lenis is ready
      ScrollTrigger.refresh();
    }

    // Force scroll to top again after Lenis init
    window.scrollTo(0, 0);

    MenuOverlay.init();
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

    // Recalculate all ScrollTrigger positions once images/fonts are fully loaded
    window.addEventListener('load', function() {
      ScrollTrigger.refresh(true);
    });
  });

});
