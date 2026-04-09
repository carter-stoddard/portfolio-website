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

    // Start hero FIRST so WebGL renders before the wrapper fades in
    var heroReady = (typeof Hero !== 'undefined') ? Hero.start() : Promise.resolve();
    heroReady.then(function() {
      Animations.heroEntrance();
    });

    Animations.quoteReveal();
    Animations.aboutScroll();
    Animations.statsReveal();
    Animations.servicesReveal();
    Animations.clientsGrid();
    Animations.testimonialsReveal();
    Animations.contactReveal();
    Animations.footerReveal();

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

    // 3. Testimonial carousel drag/swipe
    (function() {
      var row = document.querySelector('.test__row');
      var wrap = document.querySelector('.test__row-wrap');
      if (!row || !wrap) return;

      var isDragging = false;
      var startX = 0;
      var scrollLeft = 0;
      var dragDistance = 0;

      // Get current translateX from the CSS animation
      function getCurrentTranslateX() {
        var style = window.getComputedStyle(row);
        var matrix = new DOMMatrix(style.transform);
        return matrix.m41;
      }

      function onDragStart(e) {
        isDragging = true;
        dragDistance = 0;
        startX = (e.touches ? e.touches[0].clientX : e.clientX);
        scrollLeft = getCurrentTranslateX();
        row.classList.add('is-dragging');
        row.style.animation = 'none';
        row.style.transform = 'translateX(' + scrollLeft + 'px)';
      }

      function onDragMove(e) {
        if (!isDragging) return;
        var x = (e.touches ? e.touches[0].clientX : e.clientX);
        var walk = x - startX;
        dragDistance = Math.abs(walk);
        row.style.transform = 'translateX(' + (scrollLeft + walk) + 'px)';
      }

      function onDragEnd() {
        if (!isDragging) return;
        isDragging = false;
        row.classList.remove('is-dragging');
        // Resume auto-scroll from current position
        var currentX = getCurrentTranslateX();
        var totalWidth = row.scrollWidth / 2;
        // Normalize position within the loop range
        var normalized = ((currentX % totalWidth) + totalWidth) % totalWidth;
        var progress = normalized / totalWidth;
        row.style.transform = '';
        row.style.animation = '';
        row.style.animationDelay = '-' + (progress * 46) + 's';
      }

      // Mouse events
      wrap.addEventListener('mousedown', onDragStart);
      window.addEventListener('mousemove', onDragMove);
      window.addEventListener('mouseup', onDragEnd);

      // Touch events
      wrap.addEventListener('touchstart', onDragStart, { passive: true });
      window.addEventListener('touchmove', onDragMove, { passive: true });
      window.addEventListener('touchend', onDragEnd);

      // Prevent card click from firing if user was dragging
      wrap.addEventListener('click', function(e) {
        if (dragDistance > 10) {
          e.stopPropagation();
          e.preventDefault();
        }
      }, true);
    })();

    // 4. Testimonial card popup modal
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

      var linkEl = document.getElementById('test-modal-link');

      function openTestModal(card) {
        var quote = card.querySelector('.test__card-quote');
        var avatar = card.querySelector('.test__avatar');
        var name = card.querySelector('.test__person-name');
        var title = card.querySelector('.test__person-title');
        var company = card.querySelector('.test__person-company');
        var linkedin = card.dataset.linkedin || '';

        if (quoteEl) quoteEl.textContent = quote ? quote.textContent : '';
        if (avatarEl && avatar) { avatarEl.src = avatar.src; avatarEl.alt = avatar.alt; }
        var nameText = name ? name.textContent.replace(/\s*$/, '') : '';
        if (nameEl) {
          if (linkedin) {
            nameEl.innerHTML = nameText + ' <svg class="test-modal__linkedin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
          } else {
            nameEl.textContent = nameText;
          }
        }
        if (titleEl) titleEl.textContent = title ? title.textContent : '';
        if (companyEl) companyEl.textContent = company ? company.textContent : '';

        if (linkEl) {
          if (linkedin) {
            linkEl.href = linkedin;
            linkEl.style.cursor = 'pointer';
            linkEl.onclick = null;
          } else {
            linkEl.href = 'javascript:void(0)';
            linkEl.style.cursor = 'default';
            linkEl.onclick = function(e) { e.preventDefault(); };
          }
        }

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

      // Inject LinkedIn icon on carousel cards that have a LinkedIn URL
      document.querySelectorAll('.test__row .test__card[data-linkedin]').forEach(function(card) {
        var nameEl = card.querySelector('.test__person-name');
        if (nameEl && !nameEl.querySelector('.test__linkedin-icon')) {
          nameEl.innerHTML = nameEl.textContent + ' <svg class="test__linkedin-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"><path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/></svg>';
        }
      });

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
