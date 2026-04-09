/* ============================================================
   SECTION 00 — LOADER
   Signature hand-drawn stroke + progress bar + tagline
   ============================================================ */

const Loader = (() => {

  const HOLD_DURATION = 800;
  const FADE_DURATION = 800;

  let onComplete = null;

  function init(callback) {
    onComplete = callback;
    const el = document.getElementById('loader');
    if (!el) { if (callback) callback(); return; }

    const nameEl = el.querySelector('.loader__name');
    const progressBar = document.getElementById('loader-progress');
    const tagline = el.querySelector('.loader__tagline');

    if (!nameEl || typeof gsap === 'undefined') {
      el.style.display = 'none';
      if (callback) callback();
      return;
    }

    // Show loader, lock scroll
    el.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    // Init starfield on loader canvas
    var loaderStarfield = document.getElementById('loader-starfield');
    if (loaderStarfield && typeof Starfield !== 'undefined') {
      Starfield.init(loaderStarfield);
    }

    // Preload hero portrait images while loader plays
    var heroImages = [
      'assets/images/portrait-base-desktop.webp',
      'assets/images/portrait-astronaut-desktop.webp'
    ];
    var imagesLoaded = false;
    var animationDone = false;

    Promise.all(heroImages.map(function(src) {
      return new Promise(function(resolve) {
        var img = new Image();
        img.onload = resolve;
        img.onerror = resolve;
        img.src = src;
      });
    })).then(function() {
      imagesLoaded = true;
      if (animationDone) hideLoader(el);
    });

    var tl = gsap.timeline({
      onComplete: function() {
        gsap.delayedCall(HOLD_DURATION / 1000, function() {
          animationDone = true;
          if (imagesLoaded) hideLoader(el);
        });
      }
    });

    // Progress bar — fills across the full animation duration
    if (progressBar) {
      tl.to(progressBar, {
        width: '100%',
        duration: 1.8,
        ease: 'power2.inOut',
      }, 0);
    }

    // Cinematic slow reveal — starts small and grows as it fades in
    tl.fromTo(nameEl,
      { opacity: 0, scale: 0.4 },
      { opacity: 1, scale: 1, duration: 2.2, ease: 'power2.out' },
      0.3
    );

    if (tagline) {
      gsap.set(tagline, { y: 6 });
      tl.fromTo(tagline,
        { opacity: 0 },
        { opacity: 1, y: 0, duration: 1.4, ease: 'power1.out' },
        0.8
      );
    }
  }

  function hideLoader(el) {
    // Unlock scroll, destroy loader starfield
    document.body.style.overflow = '';
    window.scrollTo(0, 0);
    if (typeof Starfield !== 'undefined') Starfield.destroy();

    el.classList.add('hidden');

    setTimeout(function() {
      el.style.display = 'none';
      if (onComplete) onComplete();
    }, FADE_DURATION);
  }

  return { init };

})();
