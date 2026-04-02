/* ============================================================
   ANIMATIONS.JS
   GSAP + ScrollTrigger — site-wide animation system.
   ============================================================ */

const Animations = (() => {

  function init() {
    if (typeof gsap === 'undefined') return;
    gsap.registerPlugin(ScrollTrigger);
  }

  // ----------------------------------------------------------
  // Hero entrance — runs once after loader completes
  // ----------------------------------------------------------
  function heroEntrance() {
    if (typeof gsap === 'undefined') return;

    const tl = gsap.timeline({ delay: 0.1 });

    tl.fromTo('#nav',
      { opacity: 0, y: -16 },
      { opacity: 1, y: 0, duration: 0.7, ease: 'power2.out' }
    )
    .fromTo('.hero__porthole',
      { opacity: 0, scale: 0.94 },
      { opacity: 1, scale: 1, duration: 1.3, ease: 'power3.out' },
      '-=0.4'
    )
    .fromTo('.hero__portrait-wrapper',
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' },
      '-=1.0'
    );

    setupPortalScroll();
  }

  // ----------------------------------------------------------
  // Portal scroll — scrubbed transition from hero into space
  // ----------------------------------------------------------
  function setupPortalScroll() {
    const hero      = document.getElementById('hero');
    const interior  = document.querySelector('.hero__interior');
    const frame     = document.querySelector('.hero__porthole-frame');
    const portrait  = document.querySelector('.hero__portrait-wrapper');
    const astronaut = document.querySelector('.hero__astronaut-float');
    if (!hero || !interior || !frame || !portrait) return;

    const isMobilePortal = window.matchMedia('(hover: none) and (pointer: coarse)').matches;
    const tl = gsap.timeline({ defaults: { ease: 'none' } });

    // Helmet crossfade — desktop only. On mobile, canvas is hidden and
    // astronaut layer is set to opacity:1 by Hero.start(). If we add this
    // tween on mobile, GSAP snapshots opacity:0 from CSS and holds it at
    // scroll progress 0, overriding the JS-set opacity:1.
    if (!isMobilePortal) {
      tl.to('#hero-canvas',            { opacity: 0, duration: 0.02 }, 0)
        .to('.hero__layer--astronaut', { opacity: 1, duration: 0.02 }, 0);
    }

    // Scroll prompt — fade out immediately on scroll.
    // The CSS entrance animation uses 'forwards' fill which overrides GSAP,
    // so listen for it to end, then hand opacity control to GSAP.
    const scrollPrompt = document.querySelector('.hero__scroll-prompt');
    if (scrollPrompt) {
      scrollPrompt.addEventListener('animationend', function() {
        scrollPrompt.style.animation = 'none';
        scrollPrompt.style.opacity = '1';
      }, { once: true });
      tl.to(scrollPrompt, { opacity: 0, duration: 0.05 }, 0);
    }

    // Interior zooms in
    tl.to(interior, { scale: 6.5, duration: 1 }, 0)

    // Portrait exits right via scale
    .to(portrait, { scale: 14, transformOrigin: '20% 50%', duration: 1 }, 0)

    // Shuttle fades out → marquee fully revealed in space
    .to(interior, { opacity: 0, duration: 0.3 }, 0.7)

    // Portrait fades out with the shuttle — at 14x scale it bleeds into sections below
    .to(portrait, { opacity: 0, duration: 0.25 }, 0.72);

    // Marquee text — starts small, scales to current size during scroll
    const marquee = document.querySelector('.hero__marquee');
    if (marquee) {
      gsap.set(marquee, { scale: 0.3 });
      tl.to(marquee, {
        scale: 1,
        duration: 1,
        ease: 'none',
      }, 0);
    }

    // Floating astronaut — starts tiny, grows to full size during scroll
    if (astronaut) {
      gsap.set(astronaut, { xPercent: -50, yPercent: -50, scale: 0.1 });
      tl.to(astronaut, {
        scale: 1,
        duration: 1,
        ease: 'none',
      }, 0);
    }

    if (isMobilePortal) {
      // Mobile — no pin, play portal exit once on scroll, no snap-back risk
      hero.style.overflow = 'visible';
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=40%',
        scrub: 1,
        animation: tl,
        onLeave: () => { hero.style.overflow = 'hidden'; },
      });
    } else {
      ScrollTrigger.create({
        trigger: hero,
        start: 'top top',
        end: '+=50%',
        pin: true,
        scrub: 0.5,
        animation: tl,
        onUpdate: (self) => {
          hero.style.overflow = (self.progress > 0 && self.progress < 1) ? 'visible' : 'hidden';
        },
        onLeave:     () => { hero.style.overflow = 'hidden'; },
        onEnterBack: () => {
          hero.style.overflow = 'visible';
          var heroCanvas = document.getElementById('hero-canvas');
          if (heroCanvas) heroCanvas.style.display = 'block';
        },
      });
    }
  }

  // ----------------------------------------------------------
  // Quote reveal — pinned section, text block scrolls up from bottom,
  // each line gets a wipe-bar reveal as it enters the viewport center.
  // ----------------------------------------------------------
  function quoteReveal() {
    if (typeof gsap === 'undefined') return;

    var section = document.getElementById('quote');
    var block   = section ? section.querySelector('.quote__text') : null;
    var lines   = section ? section.querySelectorAll('.quote__line') : [];
    if (!section || !block || !lines.length) return;

    // Hide all lines — text clipped, bar ready
    lines.forEach(function(line) {
      var inner = line.querySelector('.quote__line-inner');
      if (inner) gsap.set(inner, { clipPath: 'inset(0 100% 0 0)' });
      var bar = line.querySelector('.quote__wipe-bar');
      if (bar) gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    });

    // Trigger when section scrolls into view
    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: function() {
        // Domino: true wipe across each line, staggered
        lines.forEach(function(line, i) {
          var inner = line.querySelector('.quote__line-inner');
          var bar   = line.querySelector('.quote__wipe-bar');
          if (!inner || !bar) return;

          var delay = i * 0.18;

          // Bar sweeps full width left to right
          gsap.fromTo(bar,
            { scaleX: 0, transformOrigin: 'left center' },
            { scaleX: 1, duration: 0.54, ease: 'power2.inOut', delay: delay }
          );

          // Text clip-path reveals left to right, following the bar
          gsap.to(inner,
            { clipPath: 'inset(0 0% 0 0)', duration: 0.54, ease: 'power2.inOut', delay: delay }
          );

          // Bar exits to the right
          gsap.to(bar,
            { scaleX: 0, transformOrigin: 'right center', duration: 0.42, ease: 'power2.inOut', delay: delay + 0.37 }
          );
        });
      },
    });
  }

  // ----------------------------------------------------------
  // About horizontal scroll — collage tracks left as you scroll down.
  // anticipatePin: 1 prevents the "scroll up then down" jump bug.
  // invalidateOnRefresh recalculates track width on resize.
  // ----------------------------------------------------------
  function aboutScroll() {
    if (typeof gsap === 'undefined') return;

    const section = document.getElementById('about');
    const track   = section && section.querySelector('.about__track');
    if (!section || !track) return;

    // ── Header entrance — label fades up, heading follows 0.15s after ──
    var aboutLabel = section.querySelector('.about__label');
    var aboutHeadMain = section.querySelector('.about__heading-main');
    var aboutHeadAccent = section.querySelector('.about__heading-accent');

    var headerTl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        once: true,
      },
    });

    if (aboutLabel) {
      headerTl.fromTo(aboutLabel,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
    if (aboutHeadMain) {
      headerTl.fromTo(aboutHeadMain,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '+=0.15'
      );
    }
    if (aboutHeadAccent) {
      headerTl.fromTo(aboutHeadAccent,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.45'
      );
    }

    const isMobileAbout = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

    // Helper — animate a single wipe element
    function fireWipe(el, delay) {
      var inner = el.querySelector('.about__wipe-inner');
      var bar   = el.querySelector('.about__wipe-bar');
      if (!inner || !bar) return;

      gsap.fromTo(bar,
        { scaleX: 0, transformOrigin: 'left center' },
        { scaleX: 1, duration: 0.54, ease: 'power2.inOut', delay: delay }
      );
      gsap.to(inner,
        { clipPath: 'inset(0 0% 0 0)', duration: 0.54, ease: 'power2.inOut', delay: delay }
      );
      gsap.to(bar,
        { scaleX: 0, transformOrigin: 'right center', duration: 0.42, ease: 'power2.inOut', delay: delay + 0.37 }
      );
    }

    // Set initial hidden state on all wipe elements
    track.querySelectorAll('.about__wipe').forEach(function(el) {
      var inner = el.querySelector('.about__wipe-inner');
      var bar   = el.querySelector('.about__wipe-bar');
      if (inner) gsap.set(inner, { clipPath: 'inset(0 100% 0 0)' });
      if (bar) gsap.set(bar, { scaleX: 0, transformOrigin: 'left center' });
    });

    // Mobile — sticky scroll (CSS sticky + scroll listener, no GSAP pin = no crash)
    // Section gets tall enough to scroll through all cards, sticky wrapper keeps
    // content in viewport, and scroll progress drives track.scrollLeft.
    if (isMobileAbout) {
      // Wipe animations fire on enter
      ScrollTrigger.create({
        trigger: section,
        start: 'top 75%',
        once: true,
        onEnter: function() {
          track.querySelectorAll('.about__wipe').forEach(function(el, i) {
            fireWipe(el, i * 0.08);
          });
        },
      });

      // Wrap all section children in a sticky container
      var sticky = document.createElement('div');
      sticky.style.cssText = 'position:sticky;top:0;height:100vh;overflow:hidden;width:100%;display:flex;flex-direction:column;justify-content:center;';
      while (section.firstChild) sticky.appendChild(section.firstChild);
      section.appendChild(sticky);

      // Track: JS drives scrollLeft, no native scroll
      track.style.overflowX = 'hidden';

      function setAboutHeight() {
        var scrollDist = track.scrollWidth - window.innerWidth;
        section.style.height = (scrollDist + window.innerHeight) + 'px';
      }
      setAboutHeight();
      window.addEventListener('resize', setAboutHeight, { passive: true });

      // Lerp target — RAF loop smooths it like GSAP scrub
      var targetLeft = 0;
      var currentLeft = 0;

      window.addEventListener('scroll', function() {
        var scrollDist = track.scrollWidth - window.innerWidth;
        if (scrollDist <= 0) return;
        var progress = Math.max(0, Math.min(1, -section.getBoundingClientRect().top / scrollDist));
        targetLeft = progress * scrollDist;
      }, { passive: true });

      (function rafLoop() {
        currentLeft += (targetLeft - currentLeft) * 0.12;
        track.scrollLeft = currentLeft;
        requestAnimationFrame(rafLoop);
      })();

      return;
    }

    const scrollTween = gsap.to(track, {
      x: () => -(track.scrollWidth - window.innerWidth),
      ease: 'none',
      force3D: true,
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${track.scrollWidth - window.innerWidth}`,
        pin: true,
        anticipatePin: 1,
        scrub: 3,
        invalidateOnRefresh: true,
      },
    });

    // Single-line wipes (standalone .about__wipe not inside a group)
    track.querySelectorAll('.about__wipe:not(.about__wipe-group .about__wipe)').forEach(function(el) {
      ScrollTrigger.create({
        trigger: el,
        containerAnimation: scrollTween,
        start: 'left 85%',
        once: true,
        onEnter: function() { fireWipe(el, 0); },
      });
    });

    // Multi-line wipe groups — stagger each line 0.18s
    track.querySelectorAll('.about__wipe-group').forEach(function(group) {
      var lines = group.querySelectorAll('.about__wipe');
      ScrollTrigger.create({
        trigger: group,
        containerAnimation: scrollTween,
        start: 'left 85%',
        once: true,
        onEnter: function() {
          lines.forEach(function(line, i) {
            fireWipe(line, i * 0.18);
          });
        },
      });
    });
  }

  // ----------------------------------------------------------
  // Stats reveal — radar sweep + count-up animation
  // ----------------------------------------------------------
  function statsReveal() {
    if (typeof gsap === 'undefined') return;

    const section = document.getElementById('stats');
    const sweep   = section && section.querySelector('.stats__sweep');
    const cells   = section ? section.querySelectorAll('.stats__cell') : [];
    const numbers = section ? section.querySelectorAll('.stats__number') : [];
    if (!section || !cells.length) return;

    const statsLabel = section.querySelector('.stats__header-label');
    const statsHeadMain = section.querySelector('.stats__heading-main');
    const statsHeadAccent = section.querySelector('.stats__heading-accent');

    const tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        once: true,
      },
    });

    // 0. Header entrance — label then heading
    if (statsLabel) {
      tl.fromTo(statsLabel,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
    if (statsHeadMain) {
      tl.fromTo(statsHeadMain,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.35'
      );
    }
    if (statsHeadAccent) {
      tl.fromTo(statsHeadAccent,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.45'
      );
    }

    // Cells fade up — all at once, no stagger
    tl.fromTo(cells,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.8'
    );

    // 2b. Glow pulse — panel power-on effect, all at once
    tl.fromTo(cells,
      { boxShadow: 'inset 0 0 20px rgba(204, 255, 0, 0.35)' },
      { boxShadow: 'inset 0 0 0px rgba(204, 255, 0, 0)', duration: 0.6, ease: 'power2.out' },
      '-=0.3'
    );

    // Add a label so all number count-ups start at the same time
    tl.addLabel('numbersStart');

    // 3. Numbers count up — all start AND finish together (2s duration)
    // Custom modes: "revenue" ticks 0M→100M→…→900M→1B+
    //               "countdown" ticks from start value down to target
    const countDuration = 2;

    numbers.forEach((el, i) => {
      const mode = el.dataset.mode || '';
      const target = parseInt(el.dataset.target, 10);
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      const startVal = parseInt(el.dataset.start, 10) || 0;

      if (mode === 'revenue') {
        const obj = { val: 0 };
        tl.to(obj, {
          val: 1000,
          duration: countDuration,
          ease: 'power2.out',
          onUpdate() {
            const v = Math.round(obj.val / 100) * 100;
            if (v >= 1000) {
              el.innerHTML = prefix + '1B' + '<span class="stats__accent">' + suffix + '</span>';
            } else {
              el.innerHTML = prefix + v + 'M' + '<span class="stats__accent">' + suffix + '</span>';
            }
          },
          onComplete() {
            el.innerHTML = prefix + '1B' + '<span class="stats__accent">' + suffix + '</span>';
          },
        }, 'numbersStart');

      } else if (mode === 'countdown') {
        const obj = { val: startVal };
        tl.to(obj, {
          val: target,
          duration: countDuration,
          ease: 'power2.out',
          onUpdate() {
            const current = Math.round(obj.val);
            el.innerHTML = current + (suffix ? '<span class="stats__accent">' + suffix + '</span>' : '');
          },
          onComplete() {
            el.innerHTML = target + (suffix ? '<span class="stats__accent">' + suffix + '</span>' : '');
          },
        }, 'numbersStart');

      } else {
        const obj = { val: 0 };
        tl.to(obj, {
          val: target,
          duration: countDuration,
          ease: 'power2.out',
          onUpdate() {
            const current = Math.round(obj.val);
            el.innerHTML = prefix + current + (suffix ? '<span class="stats__accent">' + suffix + '</span>' : '');
          },
        }, 'numbersStart');
      }
    });

    // 4. Synchronized blink — all numbers flash together after counts finish
    tl.addLabel('countsDone', 'numbersStart+=' + countDuration);
    tl.to(numbers, {
      keyframes: [
        { opacity: 0.3, duration: 0.06 },
        { opacity: 1, duration: 0.06 },
        { opacity: 0.5, duration: 0.06 },
        { opacity: 1, duration: 0.06 },
        { opacity: 0.2, duration: 0.06 },
        { opacity: 1, duration: 0.12 },
      ],
    }, 'countsDone');
  }

  // ----------------------------------------------------------
  // Services reveal — mission briefing entrance + interactions
  // ----------------------------------------------------------
  function servicesReveal() {
    if (typeof gsap === 'undefined') return;

    const section = document.getElementById('services');
    if (!section) return;

    // ── Service data — placeholder subcategories ──
    const serviceData = [
      {
        desc: 'Websites and digital products that work as hard as you do.',
        subs: ['Custom-coded websites built to convert and perform', 'Animated, scroll-driven experiences that stop people mid-scroll', 'Mobile-first design that looks sharp on every screen', 'Landing pages designed to turn visitors into leads', 'Online stores built to sell', 'Web apps and custom digital tools built for your business', 'Ongoing maintenance and support after launch'],
      },
      {
        desc: 'A brand that looks the part and means something.',
        subs: ['Logo design and full visual identity', 'Color, typography, and brand guidelines', 'Brand naming and positioning', 'Brand voice and messaging', 'Brand refreshes for businesses ready to level up', 'Everything you need to show up consistently everywhere'],
      },
      {
        desc: 'Less manual work. More revenue. Running while you sleep.',
        subs: ['Automated lead capture and follow-up sequences', 'AI-powered email and SMS workflows', 'CRM setup and database management', 'Automated phone and voicemail campaigns', 'Chatbots and AI assistants for your website', 'Custom AI tools built for your specific business'],
      },
      {
        desc: 'Content that builds an audience and keeps them coming back.',
        subs: ['Platform strategy for Instagram, TikTok, LinkedIn, and more', 'Content creation \u2014 graphics, video, captions, everything', 'Full account management and scheduling', 'Community engagement and growth', 'Influencer and partnership outreach', 'Monthly reporting and performance tracking'],
      },
      {
        desc: 'Content people actually watch \u2014 and share.',
        subs: ['Short-form video for Reels, TikTok, and YouTube Shorts', 'Brand films and sizzle reels', 'Product videos that drive sales', 'Testimonial video production', 'Product and lifestyle photography', 'Motion graphics and animated content', 'On-location shoots anywhere in Southern California'],
      },
      {
        desc: 'Get found \u2014 on Google and every AI platform people search on.',
        subs: ['On-page and technical SEO', 'Local SEO and Google Business optimization', 'Content written to rank and convert', 'Link building and off-page authority', 'Review management strategy', 'Optimization for AI platforms like ChatGPT and Perplexity', 'Site audits and keyword strategy'],
      },
      {
        desc: 'Everything that makes your brand look good everywhere.',
        subs: ['Business cards, flyers, menus, and brochures', 'Social media graphics and branded templates', 'Pitch decks and presentations', 'Product packaging and labels', 'Signage and storefront design', 'Ad creative for every platform and format'],
      },
      {
        desc: 'The thinking behind everything that makes it work.',
        subs: ['Brand strategy and market positioning', 'Competitive analysis and audience research', 'Go-to-market planning for launches and campaigns', 'Campaign concepting and big-picture creative', 'Content strategy and messaging frameworks', 'Consulting for brands that need a clear direction'],
      },
      {
        desc: 'Direct lines to your customers that actually convert.',
        subs: ['Email campaign design and copywriting', 'SMS marketing setup and management', 'Automated drip sequences and follow-ups', 'Newsletter strategy and management', 'List building and audience segmentation', 'Performance tracking and optimization'],
      },
      {
        desc: 'Ad spend that works \u2014 not just spends.',
        subs: ['Meta ads \u2014 Facebook and Instagram', 'Google Search and Display campaigns', 'TikTok and LinkedIn ads', 'Retargeting campaigns for warm audiences', 'Landing page strategy tied to every campaign', 'Ad creative production included', 'Full campaign management and reporting'],
      },
    ];

    // ── Build mobile accordion ──
    const accordion = section.querySelector('.services__accordion');
    if (accordion) {
      const categoryNames = [
        'Web Design, Development & Apps', 'Branding & Identity', 'AI & Automation',
        'Social Media Content & Management', 'Video, Motion & Photography', 'AI Search & SEO',
        'Print & Digital Graphic Design', 'Strategy & Creative Direction', 'Email & SMS Marketing', 'Paid Advertising',
      ];
      categoryNames.forEach((name, i) => {
        const num = String(i + 1).padStart(2, '0');
        const item = document.createElement('div');
        item.className = 'services__acc-item';
        item.innerHTML =
          '<button class="services__acc-trigger" type="button" data-acc="' + i + '">' +
            '<span class="services__num">' + num + '</span>' +
            '<span class="services__name">' + name + '</span>' +
          '</button>' +
          '<div class="services__acc-body">' +
            '<div class="services__acc-body-inner">' +
              serviceData[i].subs.map(function(s) {
                return '<div class="services__acc-sub">' + s + '</div>';
              }).join('') +
            '</div>' +
          '</div>';
        accordion.appendChild(item);
      });
    }

    // ── Desktop panel interaction ──
    const rows = section.querySelectorAll('.services__row');
    const panelInner = section.querySelector('.services__panel-inner');

    function showPanel(index, animate) {
      var data = serviceData[index];
      if (!panelInner || !data) return;

      var html =
        '<p class="services__detail-desc">' + data.desc + '</p>' +
        '<ul class="services__detail-list">' +
          data.subs.map(function(s) {
            return '<li class="services__detail-item">' + s + '</li>';
          }).join('') +
        '</ul>';

      if (animate) {
        gsap.to(panelInner, {
          opacity: 0, x: -10, duration: 0.15, ease: 'power2.in',
          onComplete: function() {
            panelInner.innerHTML = html;
            gsap.fromTo(panelInner,
              { opacity: 0, x: 10 },
              { opacity: 1, x: 0, duration: 0.3, ease: 'power2.out' }
            );
          }
        });
      } else {
        panelInner.innerHTML = html;
        gsap.set(panelInner, { opacity: 1, x: 0 });
      }

      rows.forEach(function(r) { r.classList.remove('is-active'); });
      if (rows[index]) rows[index].classList.add('is-active');
    }

    // Set first category active on load
    showPanel(0, false);

    // Click/hover handlers
    rows.forEach(function(row) {
      var idx = parseInt(row.dataset.service, 10);
      row.addEventListener('click', function() { showPanel(idx, true); });
      row.addEventListener('mouseenter', function() { showPanel(idx, true); });
    });

    // ── Mobile accordion interaction ──
    var accTriggers = section.querySelectorAll('.services__acc-trigger');
    var openIndex = -1;

    accTriggers.forEach(function(trigger) {
      trigger.addEventListener('click', function() {
        var idx = parseInt(trigger.dataset.acc, 10);
        var item = trigger.parentElement;
        var body = item.querySelector('.services__acc-body');
        var subs = item.querySelectorAll('.services__acc-sub');

        if (openIndex === idx) {
          // Close current
          gsap.to(body, { height: 0, duration: 0.35, ease: 'power2.out' });
          item.classList.remove('is-open');
          openIndex = -1;
          return;
        }

        // Close previous
        if (openIndex >= 0) {
          var prevItem = accordion.children[openIndex];
          if (prevItem) {
            var prevBody = prevItem.querySelector('.services__acc-body');
            gsap.to(prevBody, { height: 0, duration: 0.35, ease: 'power2.out' });
            prevItem.classList.remove('is-open');
          }
        }

        // Open new
        item.classList.add('is-open');
        gsap.set(body, { height: 'auto' });
        var fullHeight = body.offsetHeight;
        gsap.fromTo(body,
          { height: 0 },
          { height: fullHeight, duration: 0.35, ease: 'power2.out' }
        );

        // Stagger subcategory fade-in
        gsap.fromTo(subs,
          { opacity: 0, y: 6 },
          { opacity: 1, y: 0, duration: 0.25, ease: 'power2.out', stagger: 0.05, delay: 0.1 }
        );

        openIndex = idx;
      });
    });

    // ── Scroll-triggered entrance animation ──
    var label = section.querySelector('.services__label');
    var headMain = section.querySelector('.services__heading-main');
    var headAccent = section.querySelector('.services__heading-accent');
    var cta = section.querySelector('.services__cta');
    var panel = section.querySelector('.services__panel');

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        once: true,
      },
    });

    // Label fades up
    tl.fromTo(label,
      { opacity: 0, y: 14 },
      { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
    );

    // Heading staggers up
    tl.fromTo(headMain,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.2'
    );
    tl.fromTo(headAccent,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
      '-=0.45'
    );

    // Left column rows slide in
    tl.fromTo(rows,
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.5, ease: 'power2.out', stagger: 0.06 },
      '-=0.3'
    );

    // Right panel fades in after rows
    if (panel) {
      tl.fromTo(panel,
        { opacity: 0, y: 10 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }

    // CTA fades up last
    if (cta) {
      tl.fromTo(cta,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
        '-=0.2'
      );
    }
  }

  // ----------------------------------------------------------
  // Clients marquee — infinite scrolling logo strip
  // ----------------------------------------------------------
  function clientsGrid() {
    if (typeof gsap === 'undefined') return;

    var section = document.getElementById('clients');
    if (!section) return;

    var label = section.querySelector('.clients__label');
    var headMain = section.querySelector('.clients__heading-main');
    var headAccent = section.querySelector('.clients__heading-accent');
    var patches = section.querySelectorAll('.clients__patch');

    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: function() {
        var tl = gsap.timeline();

        // Header entrance — label then heading staggered
        if (label) {
          tl.fromTo(label,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        }
        if (headMain) {
          tl.fromTo(headMain,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.35'
          );
        }
        if (headAccent) {
          tl.fromTo(headAccent,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.45'
          );
        }

        // Patches fade up staggered
        if (patches.length) {
          tl.fromTo(patches,
            { opacity: 0, y: 30 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.07 },
            '-=0.2'
          );
        }

        // CTA button fade in after patches
        var ctaWrap = section.querySelector('.clients__cta-wrap');
        if (ctaWrap) {
          tl.fromTo(ctaWrap,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            '-=0.1'
          );
        }
      },
    });
  }

  // ----------------------------------------------------------
  // Testimonials — featured quote line reveal + card row entrance
  // ----------------------------------------------------------
  function testimonialsReveal() {
    if (typeof gsap === 'undefined') return;

    var section = document.getElementById('testimonials');
    if (!section) return;

    var label = section.querySelector('.test__header-label');
    var headMain = section.querySelector('.test__heading-main');
    var headAccent = section.querySelector('.test__heading-accent');
    var featured = section.querySelector('.test__featured');
    var quoteLines = section.querySelectorAll('.test__quote-line');
    var cards = section.querySelectorAll('.test__card');

    // Header entrance
    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        once: true,
      },
    });

    if (label) {
      tl.fromTo(label,
        { opacity: 0, y: 14 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
      );
    }
    if (headMain) {
      tl.fromTo(headMain,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.35'
      );
    }
    if (headAccent) {
      tl.fromTo(headAccent,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.45'
      );
    }

    // Featured testimonial fade in
    if (featured) {
      tl.fromTo(featured,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
        '-=0.2'
      );
    }

    // Quote lines reveal — staggered 0.12s per line
    if (quoteLines.length) {
      tl.fromTo(quoteLines,
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out', stagger: 0.12 },
        '-=0.3'
      );
    }

    // Card row entrance — fade in when carousel scrolls into view
    var rowWrap = section.querySelector('.test__row-wrap');
    if (rowWrap) {
      ScrollTrigger.create({
        trigger: rowWrap,
        start: 'top 75%',
        once: true,
        onEnter: function() {
          gsap.fromTo(rowWrap,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
          );
        },
      });
    }
  }

  // ----------------------------------------------------------
  // Contact — header + form rows staggered fade-up
  // ----------------------------------------------------------
  function contactReveal() {
    if (typeof gsap === 'undefined') return;

    var section = document.getElementById('contact');
    if (!section) return;

    var label = section.querySelector('.contact__label');
    var headMain = section.querySelector('.contact__heading-main');
    var headAccent = section.querySelector('.contact__heading-accent');
    var subtext = section.querySelector('.contact__subtext');
    var rows = section.querySelectorAll('.contact__row, .contact__submit');

    ScrollTrigger.create({
      trigger: section,
      start: 'top 75%',
      once: true,
      onEnter: function() {
        var tl = gsap.timeline();

        if (label) {
          tl.fromTo(label,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' }
          );
        }
        if (headMain) {
          tl.fromTo(headMain,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '+=0.15'
          );
        }
        if (headAccent) {
          tl.fromTo(headAccent,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.45'
          );
        }
        if (subtext) {
          tl.fromTo(subtext,
            { opacity: 0, y: 14 },
            { opacity: 1, y: 0, duration: 0.5, ease: 'power2.out' },
            '+=0.1'
          );
        }
        if (rows.length) {
          tl.fromTo(rows,
            { opacity: 0, y: 20 },
            { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.06 },
            '-=0.1'
          );
        }
      },
    });
  }

  // ----------------------------------------------------------
  // Footer reveal — cinematic staggered entrance
  // ----------------------------------------------------------
  function footerReveal() {
    if (typeof gsap === 'undefined') return;

    var footer = document.getElementById('footer');
    if (!footer) return;

    var bgText = footer.querySelector('.footer__bg-text');
    var astronaut = footer.querySelector('.footer__astronaut');
    var columns = footer.querySelector('.footer__columns');
    var copyrightBar = footer.querySelector('.footer__copyright-bar');

    ScrollTrigger.create({
      trigger: footer,
      start: 'top 75%',
      once: true,
      onEnter: function() {
        var tl = gsap.timeline();

        // Background text fades up
        if (bgText) {
          tl.fromTo(bgText,
            { opacity: 0, y: 40 },
            { opacity: 1, y: 0, duration: 0.8, ease: 'power2.out' }
          );
        }

        // Astronaut rises up — preserve CSS left/transform positioning
        if (astronaut) {
          tl.fromTo(astronaut,
            { opacity: 0, yPercent: 5 },
            { opacity: 1, yPercent: 0, duration: 0.8, ease: 'power2.out', clearProps: 'yPercent' },
            '-=0.5'
          );
        }

        // Columns fade up
        if (columns) {
          tl.fromTo(columns,
            { opacity: 0, y: 24 },
            { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' },
            '-=0.3'
          );
        }

        // Copyright
        if (copyrightBar) {
          tl.fromTo(copyrightBar,
            { opacity: 0 },
            { opacity: 1, duration: 0.5, ease: 'power2.out' },
            '-=0.3'
          );
        }
      },
    });
  }

  return { init, heroEntrance, quoteReveal, aboutScroll, statsReveal, servicesReveal, clientsGrid, testimonialsReveal, contactReveal, footerReveal };

})();


/* ============================================================
   NAV — Hamburger menu overlay (GSAP-powered)
   Full-screen overlay with staggered link animations,
   Lenis scroll-to on link click, focus trap, Escape to close.
   ============================================================ */
const MenuOverlay = (() => {

  let isOpen = false;
  let openTl = null;
  let closeTl = null;

  function init() {
    const btn     = document.querySelector('.nav__menu-btn');
    const overlay = document.getElementById('menu-overlay');
    const nav     = document.getElementById('nav');
    if (!btn || !overlay) return;

    const links   = overlay.querySelectorAll('.menu-overlay__link');
    const socials = overlay.querySelectorAll('.menu-overlay__social');
    const label   = overlay.querySelector('.menu-overlay__label');
    const tagline = overlay.querySelector('.menu-overlay__tagline');
    const copy    = overlay.querySelector('.menu-overlay__copy');
    // All focusable elements inside overlay (for focus trap)
    function getFocusable() {
      return overlay.querySelectorAll('a[href], button, [tabindex]:not([tabindex="-1"])');
    }

    const reticle = btn.querySelector('.nav__reticle');

    // ── Open ──
    function open() {
      if (isOpen) return;
      isOpen = true;

      // Kill any running close animation
      if (closeTl) { closeTl.kill(); closeTl = null; }

      btn.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
      overlay.classList.add('is-open');
      if (nav) nav.classList.add('nav--menu-open');
      document.body.style.overflow = 'hidden';

      // Reticle: rotate 45° + close brackets inward
      if (reticle) {
        gsap.to(reticle, { rotation: 45, duration: 0.35, ease: 'power2.inOut', transformOrigin: '50% 50%' });
        gsap.to(reticle.querySelector('.nav__reticle-tl'), { x: 3, y: 3, duration: 0.35, ease: 'power2.inOut' });
        gsap.to(reticle.querySelector('.nav__reticle-tr'), { x: -3, y: 3, duration: 0.35, ease: 'power2.inOut' });
        gsap.to(reticle.querySelector('.nav__reticle-bl'), { x: 3, y: -3, duration: 0.35, ease: 'power2.inOut' });
        gsap.to(reticle.querySelector('.nav__reticle-br'), { x: -3, y: -3, duration: 0.35, ease: 'power2.inOut' });
      }

      openTl = gsap.timeline();

      // Fade in overlay
      openTl.to(overlay, { opacity: 1, duration: 0.4, ease: 'power2.out' });

      // Stagger nav links from below
      openTl.fromTo(links,
        { y: 60, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.07 },
        0.1
      );

      // Right column elements fade in
      var rightEls = [label, ...socials, tagline, copy].filter(Boolean);
      openTl.fromTo(rightEls,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.4, ease: 'power3.out', stagger: 0.05 },
        0.25
      );

      // Focus first link after animation
      openTl.call(() => {
        var first = getFocusable()[0];
        if (first) first.focus();
      });
    }

    // ── Close ──
    function close() {
      if (!isOpen) return;
      isOpen = false;

      // Kill any running open animation
      if (openTl) { openTl.kill(); openTl = null; }

      btn.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
      if (nav) nav.classList.remove('nav--menu-open');

      // Reticle: return to neutral
      if (reticle) {
        gsap.to(reticle, { rotation: 0, duration: 0.3, ease: 'power2.inOut', transformOrigin: '50% 50%' });
        gsap.to(reticle.querySelectorAll('span'), { x: 0, y: 0, duration: 0.3, ease: 'power2.inOut' });
      }

      closeTl = gsap.timeline({
        onComplete: function() {
          overlay.classList.remove('is-open');
          document.body.style.overflow = '';
          // Return focus to hamburger button
          btn.focus();
        }
      });

      // Links fade up and out
      closeTl.to(links,
        { y: -20, opacity: 0, duration: 0.25, ease: 'power2.in', stagger: 0.04 },
        0
      );

      // Right column fades out
      var rightEls = [label, ...socials, tagline, copy].filter(Boolean);
      closeTl.to(rightEls,
        { opacity: 0, duration: 0.2, ease: 'power2.in' },
        0
      );

      // Overlay fades out
      closeTl.to(overlay,
        { opacity: 0, duration: 0.35, ease: 'power2.in' },
        0.15
      );
    }

    // ── Toggle on hamburger click ──
    btn.addEventListener('click', function() {
      if (isOpen) close(); else open();
    });

    // ── Nav link click — scroll to section + close ──
    links.forEach(function(link) {
      link.addEventListener('click', function(e) {
        var target = link.getAttribute('href');

        // Cross-page link (e.g. index.html#about) — let browser navigate normally
        if (!target || !target.startsWith('#')) {
          close();
          return;
        }

        e.preventDefault();
        close();

        // Same-page anchor — use Lenis if available, otherwise fallback
        setTimeout(function() {
          if (window.lenis) {
            window.lenis.scrollTo(target, { offset: 0, duration: 1.2 });
          } else {
            var el = document.querySelector(target);
            if (el) el.scrollIntoView({ behavior: 'smooth' });
          }
        }, 400);
      });
    });

    // ── Escape key closes overlay ──
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && isOpen) close();
    });

    // ── Focus trap ──
    overlay.addEventListener('keydown', function(e) {
      if (e.key !== 'Tab' || !isOpen) return;

      var focusable = getFocusable();
      if (!focusable.length) return;

      var first = focusable[0];
      var last  = focusable[focusable.length - 1];

      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }

  return { init };

})();
