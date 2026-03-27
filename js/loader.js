/* ============================================================
   SECTION 00 — LOADER
   3-2-1 countdown → "LIFTOFF" → hide loader, reveal site
   Placeholder. Final design TBD.
   ============================================================ */

const Loader = (() => {

  const SEQUENCE = ['3', '2', '1'];
  const STEP_DURATION = 800;       // ms per countdown number
  const LIFTOFF_HOLD   = 1000;     // ms to hold "LIFTOFF" before hiding
  const FADE_DURATION  = 800;      // matches CSS transition duration

  let onComplete = null;

  function init(callback) {
    onComplete = callback;
    const el = document.getElementById('loader');
    if (!el) { if (callback) callback(); return; }

    // LOADER BYPASSED — skip sequence during development
    // Remove the two lines below to restore the full 3-2-1 countdown
    el.style.display = 'none';
    if (callback) callback();
    return;

    runSequence(el); // eslint-disable-line no-unreachable
  }

  function runSequence(el) {
    const countdown = el.querySelector('.loader__countdown');
    const liftoff   = el.querySelector('.loader__liftoff');

    let step = 0;

    // Show first number immediately
    countdown.textContent = SEQUENCE[0];

    const interval = setInterval(() => {
      step++;

      if (step < SEQUENCE.length) {
        // Pulse out, swap number, pulse in
        countdown.style.opacity = '0';
        countdown.style.transform = 'scale(0.85)';

        setTimeout(() => {
          countdown.textContent = SEQUENCE[step];
          countdown.style.transition = 'opacity 0.2s ease, transform 0.3s ease';
          countdown.style.opacity = '1';
          countdown.style.transform = 'scale(1)';
        }, 150);

      } else {
        // Sequence done — show LIFTOFF
        clearInterval(interval);

        countdown.style.opacity = '0';
        countdown.style.transform = 'scale(1.2)';

        setTimeout(() => {
          countdown.style.display = 'none';
          liftoff.style.transition = 'opacity 0.4s ease';
          liftoff.style.opacity = '1';

          // Hold liftoff, then hide loader
          setTimeout(() => hideLoader(el), LIFTOFF_HOLD);
        }, 300);
      }
    }, STEP_DURATION);
  }

  function hideLoader(el) {
    el.classList.add('hidden');

    // Remove from DOM after fade completes
    setTimeout(() => {
      el.style.display = 'none';
      if (onComplete) onComplete();
    }, FADE_DURATION);
  }

  return { init };

})();
