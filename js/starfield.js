/* ============================================================
   STARFIELD
   Canvas-based procedural star field.
   Renders behind the hero portrait layers.
   ============================================================ */

const Starfield = (() => {

  // Desktop density — scales down on smaller screens
  const STAR_DENSITY = 0.00015; // stars per square pixel (≈300 on 1920×1080)
  const STAR_MIN_R   = 0.3;
  const STAR_MAX_R   = 1.6;
  const TWINKLE_SPEED = 0.008;

  let canvas, ctx, stars = [], raf;
  let W, H, dpr;
  // Mouse parallax — stars shift opposite to cursor for depth effect
  const PARALLAX_STRENGTH = 12; // max px offset
  let mouseX = 0.5, mouseY = 0.5; // normalized 0–1, center default
  let offsetX = 0, offsetY = 0;   // smoothed current offset

  function init(canvasEl) {
    // Respect reduced motion preference
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

    canvas = canvasEl;
    ctx    = canvas.getContext('2d');
    resize();
    buildStars();
    render();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', onMouseMove);
  }

  function onMouseMove(e) {
    mouseX = e.clientX / window.innerWidth;
    mouseY = e.clientY / window.innerHeight;
  }

  function resize() {
    dpr = window.devicePixelRatio || 1;
    W = canvas.offsetWidth;
    H = canvas.offsetHeight;
    // Scale canvas buffer for sharp rendering on Retina/HiDPI
    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    // Rebuild stars on resize so they fill the new dimensions
    if (stars.length) buildStars();
  }

  function buildStars() {
    stars = [];

    // Use higher density on mobile to avoid bald spots on small canvases
    const isMobile = W < 768;
    const density  = isMobile ? 0.00012 : STAR_DENSITY;
    const count    = Math.max(Math.round(W * H * density), isMobile ? 50 : 80);

    if (isMobile) {
      // Jittered grid — divide canvas into cells, one star per cell.
      // Guarantees even spatial distribution with no empty patches.
      const cols = Math.ceil(Math.sqrt(count * (W / H)));
      const rows = Math.ceil(count / cols);
      const cellW = W / cols;
      const cellH = H / rows;
      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          stars.push({
            x:     col * cellW + Math.random() * cellW,
            y:     row * cellH + Math.random() * cellH,
            r:     STAR_MIN_R + Math.random() * (STAR_MAX_R - STAR_MIN_R),
            alpha: Math.random(),
            delta: (Math.random() - 0.5) * TWINKLE_SPEED * 2,
            phase: Math.random() * Math.PI * 2,
          });
        }
      }
    } else {
      // Desktop — pure random is fine at higher counts
      for (let i = 0; i < count; i++) {
        stars.push({
          x:     Math.random() * W,
          y:     Math.random() * H,
          r:     STAR_MIN_R + Math.random() * (STAR_MAX_R - STAR_MIN_R),
          alpha: Math.random(),
          delta: (Math.random() - 0.5) * TWINKLE_SPEED * 2,
          phase: Math.random() * Math.PI * 2,
        });
      }
    }
  }

  function render() {
    ctx.clearRect(0, 0, W, H);

    // Smooth lerp toward target offset (opposite of cursor direction)
    const targetX = (0.5 - mouseX) * PARALLAX_STRENGTH;
    const targetY = (0.5 - mouseY) * PARALLAX_STRENGTH;
    offsetX += (targetX - offsetX) * 0.05;
    offsetY += (targetY - offsetY) * 0.05;

    for (const s of stars) {
      // Twinkle
      s.phase += s.delta;
      s.alpha = Math.min(1, 0.3 + 0.55 * (0.5 + 0.5 * Math.sin(s.phase)));

      // Larger stars shift more for depth layering
      const depth = s.r / STAR_MAX_R;
      const px = s.x + offsetX * depth;
      const py = s.y + offsetY * depth;

      ctx.beginPath();
      ctx.arc(px, py, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255, 255, 255, ${s.alpha})`;
      ctx.fill();
    }

    raf = requestAnimationFrame(render);
  }

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener('resize', resize);
    window.removeEventListener('mousemove', onMouseMove);
  }

  return { init, destroy };

})();
