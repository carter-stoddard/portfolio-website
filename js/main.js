/* ============================================================
   MAIN.JS
   Entry point. Initializes all modules in sequence.
   ============================================================ */

// Reset scroll before unload so browser doesn't restore mid-page
window.addEventListener('beforeunload', function() {
  window.scrollTo(0, 0);
});

// Note: pinch-to-zoom is no longer blocked for accessibility (WCAG 1.4.4)

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
  if (typeof Hero !== 'undefined') Hero.preload();

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
    if (typeof Hero !== 'undefined') Hero.start();

    // Recalculate ScrollTrigger positions once images/fonts are fully loaded
    window.addEventListener('load', function() {
      ScrollTrigger.refresh();
    });

    // ── Premium UX Enhancements ──

    // 1. Scroll progress bar
    const progressBar = document.getElementById('scroll-progress');
    if (progressBar) {
      window.addEventListener('scroll', function() {
        const scrollTop = window.scrollY || document.documentElement.scrollTop;
        const docHeight = document.documentElement.scrollHeight - window.innerHeight;
        const progress = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
        progressBar.style.width = progress + '%';
      }, { passive: true });
    }

    // 2. Cursor glow on partnership patches + stats cells
    function initCursorGlow(selector) {
      document.querySelectorAll(selector).forEach(function(el) {
        // Ensure relative positioning
        if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
        var glow = document.createElement('div');
        glow.className = selector.includes('clients') ? 'clients__glow' : 'stats__glow';
        el.appendChild(glow);

        el.addEventListener('mousemove', function(e) {
          var rect = el.getBoundingClientRect();
          var x = e.clientX - rect.left;
          var y = e.clientY - rect.top;
          glow.style.background = 'radial-gradient(circle 120px at ' + x + 'px ' + y + 'px, rgba(204,255,0,0.08), transparent 70%)';
        });
      });
    }
    initCursorGlow('.clients__patch');
    initCursorGlow('.stats__cell');

    // 3. Testimonial card popup modal
    (function() {
      var modal = document.getElementById('test-modal');
      var closeBtn = document.getElementById('test-modal-close');
      var backdrop = modal ? modal.querySelector('.test-modal__backdrop') : null;
      var quoteEl = document.getElementById('test-modal-quote');
      var avatarEl = document.getElementById('test-modal-avatar');
      var nameEl = document.getElementById('test-modal-name');
      var titleEl = document.getElementById('test-modal-title');
      var companyEl = document.getElementById('test-modal-company');
      if (!modal) return;

      function openTestModal(card) {
        var quote = card.querySelector('.test__card-quote');
        var avatar = card.querySelector('.test__avatar');
        var name = card.querySelector('.test__person-name');
        var title = card.querySelector('.test__person-title');
        var company = card.querySelector('.test__person-company');

        if (quoteEl) quoteEl.textContent = quote ? quote.textContent : '';
        if (avatarEl && avatar) { avatarEl.src = avatar.src; avatarEl.alt = avatar.alt; }
        if (nameEl) nameEl.textContent = name ? name.textContent : '';
        if (titleEl) titleEl.textContent = title ? title.textContent : '';
        if (companyEl) companyEl.textContent = company ? company.textContent : '';

        modal.classList.add('is-open');
        modal.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
        if (closeBtn) closeBtn.focus();
      }

      function closeTestModal() {
        modal.classList.remove('is-open');
        modal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
      }

      // Inject 5 stars into every carousel card
      document.querySelectorAll('.test__row .test__card').forEach(function(card) {
        var quote = card.querySelector('.test__card-quote');
        if (quote && !card.querySelector('.test__card-stars')) {
          var stars = document.createElement('div');
          stars.className = 'test__card-stars';
          stars.setAttribute('aria-label', '5 out of 5 stars');
          stars.textContent = '★★★★★';
          card.insertBefore(stars, quote);
        }
      });

      // All carousel cards (inside .test__row), including duplicates for infinite loop
      var rowCards = document.querySelectorAll('.test__row .test__card');
      rowCards.forEach(function(card) {
        card.addEventListener('click', function() { openTestModal(card); });
      });

      if (closeBtn) closeBtn.addEventListener('click', closeTestModal);
      if (backdrop) backdrop.addEventListener('click', closeTestModal);
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && modal.classList.contains('is-open')) closeTestModal();
      });
    })();

    // 4. Nav link scroll highlight flash
    document.querySelectorAll('[data-menu-link], .footer__col-link[href^="#"], .footer__col-link[href^="/#"]').forEach(function(link) {
      link.addEventListener('click', function() {
        var href = link.getAttribute('href').replace('/', '');
        var target = document.querySelector(href);
        if (target) {
          // Brief lime flash on arrival
          setTimeout(function() {
            gsap.fromTo(target,
              { boxShadow: 'inset 0 0 60px rgba(204,255,0,0.06)' },
              { boxShadow: 'inset 0 0 0px rgba(204,255,0,0)', duration: 1.2, ease: 'power2.out' }
            );
          }, 800);
        }
      });
    });

  });

});
