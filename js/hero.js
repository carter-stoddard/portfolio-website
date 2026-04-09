/* ============================================================
   SECTION 01 — HERO
   WebGL Navier-Stokes fluid simulation for portrait reveal.
   ============================================================ */

const Hero = (() => {

  // ----------------------------------------------------------
  // Config
  // ----------------------------------------------------------
  const isMobileHero = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  const CFG = {
    SIM_RES:              isMobileHero ? 64  : 128,
    DYE_RES:              isMobileHero ? 256 : 512,
    PRESSURE_ITER:        isMobileHero ? 12  : 25,
    VELOCITY_DISSIPATION: 0.98,
    DENSITY_DISSIPATION:  0.975,
    SPLAT_RADIUS:         0.0018,
    SPLAT_FORCE:          7000,
    MAX_REVEAL_MOUSE:     1.0,
    MAX_REVEAL_IDLE:      1.0,
    IDLE_TIMEOUT:         1800,
    IDLE_SPEED:           0.012,
  };

  // ----------------------------------------------------------
  // State
  // ----------------------------------------------------------
  let renderer, scene, camera, quad;
  let baseTexture, astronautTexture;
  let velocityFBO, densityFBO, pressureFBO, divergenceFBO;
  let splatMat, advectMat, divergenceMat, pressureMat, gradientMat, displayMat;

  let W = 1, H = 1;
  let wrapperEl, starfieldEl, frameEl, interiorEl;

  // Fluid sim mouse (relative to portrait wrapper)
  let mouse = { x: 0.5, y: 0.5, px: 0.5, py: 0.5, moved: false };
  // Parallax mouse (global, normalized -1 to 1 from center)
  let pTarget = { x: 0, y: 0 };
  // Three independent lerp layers — each settles at different speed & depth
  let pBg  = { x: 0, y: 0 };   // starfield   — slowest,  moves opposite
  let pMid = { x: 0, y: 0 };   // porthole frame — medium, slight drift
  let pFg  = { x: 0, y: 0 };   // portrait    — fastest,  most displacement

  let lastMoveTime = 0;
  let idleAngle    = 0;
  let lastTime     = 0;
  let raf;
  let contextLost  = false;

  // ----------------------------------------------------------
  // Shaders
  // ----------------------------------------------------------
  const VERT = `
    varying vec2 vUv;
    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `;

  const FRAG_SPLAT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uTarget;
    uniform float aspectRatio;
    uniform vec2  point;
    uniform vec3  color;
    uniform float radius;
    void main() {
      vec2 p = vUv - point;
      p.x   *= aspectRatio;
      float d = exp(-dot(p, p) / radius);
      gl_FragColor = vec4(texture2D(uTarget, vUv).rgb + d * color, 1.0);
    }
  `;

  const FRAG_ADVECT = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform sampler2D uSource;
    uniform vec2  texelSize;
    uniform float dt;
    uniform float dissipation;
    void main() {
      vec2 coord  = vUv - dt * texture2D(uVelocity, vUv).xy * texelSize;
      gl_FragColor = vec4(dissipation * texture2D(uSource, coord).rgb, 1.0);
    }
  `;

  const FRAG_DIVERGENCE = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uVelocity;
    uniform vec2 texelSize;
    void main() {
      float L = texture2D(uVelocity, vUv - vec2(texelSize.x, 0.0)).x;
      float R = texture2D(uVelocity, vUv + vec2(texelSize.x, 0.0)).x;
      float T = texture2D(uVelocity, vUv + vec2(0.0, texelSize.y)).y;
      float B = texture2D(uVelocity, vUv - vec2(0.0, texelSize.y)).y;
      gl_FragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
    }
  `;

  const FRAG_PRESSURE = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uPressure;
    uniform sampler2D uDivergence;
    uniform vec2 texelSize;
    void main() {
      float L   = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
      float R   = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
      float T   = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
      float B   = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
      float div = texture2D(uDivergence, vUv).x;
      gl_FragColor = vec4((L + R + B + T - div) * 0.25, 0.0, 0.0, 1.0);
    }
  `;

  const FRAG_GRADIENT = `
    precision mediump float;
    varying vec2 vUv;
    uniform sampler2D uPressure;
    uniform sampler2D uVelocity;
    uniform vec2 texelSize;
    void main() {
      float pL = texture2D(uPressure, vUv - vec2(texelSize.x, 0.0)).x;
      float pR = texture2D(uPressure, vUv + vec2(texelSize.x, 0.0)).x;
      float pT = texture2D(uPressure, vUv + vec2(0.0, texelSize.y)).x;
      float pB = texture2D(uPressure, vUv - vec2(0.0, texelSize.y)).x;
      vec2  vel = texture2D(uVelocity, vUv).xy - vec2(pR - pL, pT - pB) * 0.5;
      gl_FragColor = vec4(vel, 0.0, 1.0);
    }
  `;

  // Display: composite base + astronaut using density as mask
  const FRAG_DISPLAY = `
    precision highp float;
    varying vec2 vUv;
    uniform sampler2D uBase;
    uniform sampler2D uAstronaut;
    uniform sampler2D uDensity;
    uniform float     maxReveal;
    void main() {
      vec4  base      = texture2D(uBase,      vUv);
      vec4  astronaut = texture2D(uAstronaut, vUv);
      float density   = texture2D(uDensity,   vUv).r;
      float reveal    = clamp(density * 3.5, 0.0, maxReveal);
      gl_FragColor    = mix(base, astronaut, reveal);
    }
  `;

  // ----------------------------------------------------------
  // DoubleFBO
  // ----------------------------------------------------------
  function makeFBO(w, h, type) {
    return new THREE.WebGLRenderTarget(w, h, {
      minFilter:     THREE.LinearFilter,
      magFilter:     THREE.LinearFilter,
      format:        THREE.RGBAFormat,
      type:          type,
      depthBuffer:   false,
      stencilBuffer: false,
    });
  }

  class DoubleFBO {
    constructor(w, h, type) {
      this.read  = makeFBO(w, h, type);
      this.write = makeFBO(w, h, type);
    }
    swap() { const t = this.read; this.read = this.write; this.write = t; }
  }

  // ----------------------------------------------------------
  // Render a material to a target
  // ----------------------------------------------------------
  function renderTo(mat, target) {
    quad.material = mat;
    renderer.setRenderTarget(target);
    renderer.render(scene, camera);
  }

  // ----------------------------------------------------------
  // Init — called after textures are loaded
  // ----------------------------------------------------------
  function init(base, astro) {
    const canvas  = document.getElementById('hero-canvas');
    wrapperEl   = document.querySelector('.hero__portrait-wrapper');
    starfieldEl = document.getElementById('starfield-canvas');
    frameEl     = document.querySelector('.hero__porthole-frame');
    interiorEl  = document.querySelector('.hero__interior');
    if (!canvas || !wrapperEl) return;
    const wrapper = wrapperEl;

    baseTexture      = base;
    astronautTexture = astro;

    // Set texture filtering
    [baseTexture, astronautTexture].forEach(t => {
      t.minFilter = THREE.LinearFilter;
      t.magFilter = THREE.LinearFilter;
    });

    // Renderer — alpha true so transparent PNG areas let stars show through
    renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: false, premultipliedAlpha: false });
    renderer.setPixelRatio(1);
    renderer.autoClear = true;
    renderer.setClearColor(0x000000, 0); // transparent clear

    scene  = new THREE.Scene();
    // Orthographic camera — near/far span -1 to 1, plane sits at z=0
    camera = new THREE.OrthographicCamera(-1, 1, 1, -1, -1, 1);

    // Fullscreen quad
    quad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), null);
    scene.add(quad);

    // Size renderer
    resize(wrapper);
    window.addEventListener('resize', () => resize(wrapper));

    // Determine float texture support
    const floatType = renderer.capabilities.isWebGL2
      ? THREE.HalfFloatType
      : THREE.FloatType;

    // FBOs
    velocityFBO  = new DoubleFBO(CFG.SIM_RES, CFG.SIM_RES, floatType);
    densityFBO   = new DoubleFBO(CFG.DYE_RES, CFG.DYE_RES, floatType);
    pressureFBO  = new DoubleFBO(CFG.SIM_RES, CFG.SIM_RES, floatType);
    divergenceFBO = makeFBO(CFG.SIM_RES, CFG.SIM_RES, floatType);

    // Build materials
    buildMaterials(floatType);

    // Handle WebGL context loss (browser reclaims GPU when off-screen)
    canvas.addEventListener('webglcontextlost', e => {
      e.preventDefault();
      contextLost = true;
      cancelAnimationFrame(raf);
    });
    canvas.addEventListener('webglcontextrestored', () => {
      contextLost = false;
      // Re-create FBOs and materials — old GPU resources are gone
      const floatT = renderer.capabilities.isWebGL2
        ? THREE.HalfFloatType
        : THREE.FloatType;
      velocityFBO   = new DoubleFBO(CFG.SIM_RES, CFG.SIM_RES, floatT);
      densityFBO    = new DoubleFBO(CFG.DYE_RES, CFG.DYE_RES, floatT);
      pressureFBO   = new DoubleFBO(CFG.SIM_RES, CFG.SIM_RES, floatT);
      divergenceFBO = makeFBO(CFG.SIM_RES, CFG.SIM_RES, floatT);
      buildMaterials();
      lastTime     = performance.now();
      lastMoveTime = lastTime;
      raf = requestAnimationFrame(loop);
    });

    // Visibility observer — restart render loop when hero scrolls back into view.
    // Mobile browsers aggressively throttle/pause off-screen canvases; rAF alone
    // won't resume until the canvas is on-screen AND the tab is active.
    const heroSection = document.getElementById('hero');
    if (heroSection && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting && !contextLost) {
            // Resume loop and burst-fill density so astronaut reappears immediately.
            cancelAnimationFrame(raf);
            lastTime     = performance.now();
            lastMoveTime = 0;
            raf = requestAnimationFrame(loop);
            // Small delay so the loop is running before we write to FBOs
            setTimeout(burstReveal, 40);
          } else {
            // Pause sim at 50% visibility — preserves density much longer than 5%
            cancelAnimationFrame(raf);
          }
        });
      }, { threshold: 0.5 });
      io.observe(heroSection);
    }

    // Input
    bindEvents(wrapper);

    // Loop
    lastTime     = performance.now();
    lastMoveTime = lastTime;
    raf = requestAnimationFrame(loop);
  }

  // ----------------------------------------------------------
  // Resize
  // ----------------------------------------------------------
  function resize(wrapper) {
    const rect = wrapper.getBoundingClientRect();
    W = Math.round(rect.width)  || 512;
    H = Math.round(rect.height) || 288;
    renderer.setSize(W, H);
    // Override Three.js auto-style so CSS handles positioning
    const c = renderer.domElement;
    c.style.width  = '100%';
    c.style.height = '100%';
  }

  // ----------------------------------------------------------
  // Build all shader materials (once, update uniforms each frame)
  // ----------------------------------------------------------
  function buildMaterials() {
    const simTexel = new THREE.Vector2(1 / CFG.SIM_RES, 1 / CFG.SIM_RES);
    const dyeTexel = new THREE.Vector2(1 / CFG.DYE_RES, 1 / CFG.DYE_RES);

    splatMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_SPLAT,
      uniforms: {
        uTarget:     { value: null },
        aspectRatio: { value: 1 },
        point:       { value: new THREE.Vector2(0.5, 0.5) },
        color:       { value: new THREE.Vector3() },
        radius:      { value: CFG.SPLAT_RADIUS },
      },
      depthTest: false, depthWrite: false,
    });

    advectMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_ADVECT,
      uniforms: {
        uVelocity:   { value: null },
        uSource:     { value: null },
        texelSize:   { value: simTexel.clone() },
        dt:          { value: 0.016 },
        dissipation: { value: 1.0 },
      },
      depthTest: false, depthWrite: false,
    });

    divergenceMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_DIVERGENCE,
      uniforms: {
        uVelocity: { value: null },
        texelSize: { value: simTexel.clone() },
      },
      depthTest: false, depthWrite: false,
    });

    pressureMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_PRESSURE,
      uniforms: {
        uPressure:   { value: null },
        uDivergence: { value: divergenceFBO.texture },
        texelSize:   { value: simTexel.clone() },
      },
      depthTest: false, depthWrite: false,
    });

    gradientMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_GRADIENT,
      uniforms: {
        uPressure: { value: null },
        uVelocity: { value: null },
        texelSize: { value: simTexel.clone() },
      },
      depthTest: false, depthWrite: false,
    });

    displayMat = new THREE.ShaderMaterial({
      vertexShader: VERT, fragmentShader: FRAG_DISPLAY,
      uniforms: {
        uBase:      { value: baseTexture },
        uAstronaut: { value: astronautTexture },
        uDensity:   { value: null },
        maxReveal:  { value: CFG.MAX_REVEAL_MOUSE },
      },
      transparent: true,
      depthTest:   false,
      depthWrite:  false,
    });
  }

  // ----------------------------------------------------------
  // Input
  // ----------------------------------------------------------
  function bindEvents(wrapper) {
    // Global mouse — drives parallax (whole page)
    window.addEventListener('mousemove', e => {
      pTarget.x =  (e.clientX / window.innerWidth  - 0.5) * 2;
      pTarget.y = -(e.clientY / window.innerHeight - 0.5) * 2; // flip Y
    });

    // Wrapper mouse — drives fluid sim (relative to portrait)
    wrapper.addEventListener('mousemove', e => {
      const r = wrapper.getBoundingClientRect();
      mouse.px = mouse.x; mouse.py = mouse.y;
      mouse.x  = (e.clientX - r.left) / r.width;
      mouse.y  = 1.0 - (e.clientY - r.top) / r.height;
      mouse.moved = true;
      lastMoveTime = performance.now();
    });
    wrapper.addEventListener('mouseleave', () => { mouse.moved = false; });
    wrapper.addEventListener('touchmove', e => {
      if (window.heroLocked) e.preventDefault();
      const r = wrapper.getBoundingClientRect();
      const t = e.touches[0];
      mouse.px = mouse.x; mouse.py = mouse.y;
      mouse.x  = (t.clientX - r.left) / r.width;
      mouse.y  = 1.0 - (t.clientY - r.top) / r.height;
      mouse.moved = true;
      lastMoveTime = performance.now();
    }, { passive: false });
    wrapper.addEventListener('touchend', () => { mouse.moved = false; });
  }

  // ----------------------------------------------------------
  // Splat
  // ----------------------------------------------------------
  function splat(x, y, dx, dy, strength) {
    splatMat.uniforms.aspectRatio.value = W / H;
    splatMat.uniforms.point.value.set(x, y);
    splatMat.uniforms.radius.value = CFG.SPLAT_RADIUS;

    // Velocity
    splatMat.uniforms.uTarget.value = velocityFBO.read.texture;
    splatMat.uniforms.color.value.set(dx, dy, 0);
    renderTo(splatMat, velocityFBO.write);
    velocityFBO.swap();

    // Density
    splatMat.uniforms.uTarget.value = densityFBO.read.texture;
    splatMat.uniforms.color.value.set(strength, strength * 0.8, strength * 0.5);
    splatMat.uniforms.radius.value = CFG.SPLAT_RADIUS * 2.5;
    renderTo(splatMat, densityFBO.write);
    densityFBO.swap();
  }

  // ----------------------------------------------------------
  // Burst reveal — fires a ring of splats to re-fill density on scroll-back
  // ----------------------------------------------------------
  function burstReveal() {
    const count = 12;
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const ix = 0.5 + Math.cos(angle) * 0.28;
      const iy = 0.5 + Math.sin(angle) * 0.22;
      const dx = Math.cos(angle + Math.PI / 2) * 3.0;
      const dy = Math.sin(angle + Math.PI / 2) * 3.0;
      splat(ix, iy, dx, dy, 1.6);
    }
  }

  // ----------------------------------------------------------
  // Simulation step
  // ----------------------------------------------------------
  function step(dt) {
    const simTexel = new THREE.Vector2(1 / CFG.SIM_RES, 1 / CFG.SIM_RES);
    const dyeTexel = new THREE.Vector2(1 / CFG.DYE_RES, 1 / CFG.DYE_RES);

    // Advect velocity
    advectMat.uniforms.uVelocity.value   = velocityFBO.read.texture;
    advectMat.uniforms.uSource.value     = velocityFBO.read.texture;
    advectMat.uniforms.texelSize.value   = simTexel;
    advectMat.uniforms.dt.value          = dt;
    advectMat.uniforms.dissipation.value = CFG.VELOCITY_DISSIPATION;
    renderTo(advectMat, velocityFBO.write);
    velocityFBO.swap();

    // Divergence
    divergenceMat.uniforms.uVelocity.value = velocityFBO.read.texture;
    renderTo(divergenceMat, divergenceFBO);

    // Pressure — Jacobi iterations
    for (let i = 0; i < CFG.PRESSURE_ITER; i++) {
      pressureMat.uniforms.uPressure.value = pressureFBO.read.texture;
      renderTo(pressureMat, pressureFBO.write);
      pressureFBO.swap();
    }

    // Gradient subtract
    gradientMat.uniforms.uPressure.value = pressureFBO.read.texture;
    gradientMat.uniforms.uVelocity.value = velocityFBO.read.texture;
    renderTo(gradientMat, velocityFBO.write);
    velocityFBO.swap();

    // Advect density
    advectMat.uniforms.uVelocity.value   = velocityFBO.read.texture;
    advectMat.uniforms.uSource.value     = densityFBO.read.texture;
    advectMat.uniforms.texelSize.value   = dyeTexel;
    advectMat.uniforms.dissipation.value = CFG.DENSITY_DISSIPATION;
    renderTo(advectMat, densityFBO.write);
    densityFBO.swap();
  }

  // ----------------------------------------------------------
  // Render loop
  // ----------------------------------------------------------
  function loop() {
    raf = requestAnimationFrame(loop);
    if (contextLost) return;

    const now  = performance.now();
    const dt   = Math.min((now - lastTime) / 1000, 0.016);
    lastTime   = now;

    const idle = (now - lastMoveTime) > CFG.IDLE_TIMEOUT;

    // --- Multi-layer parallax lerp (Landon Norris depth technique) ---
    // Each layer has its own lerp speed — foreground settles faster, background drifts slowly.
    // Mouse is normalized -1 to +1. Depth factor × that = pixel offset.
    pBg.x  += (pTarget.x - pBg.x)  * 0.03;   // background: slowest settle
    pBg.y  += (pTarget.y - pBg.y)  * 0.03;
    pMid.x += (pTarget.x - pMid.x) * 0.055;  // midground: medium
    pMid.y += (pTarget.y - pMid.y) * 0.055;
    pFg.x  += (pTarget.x - pFg.x)  * 0.09;   // foreground: snappiest
    pFg.y  += (pTarget.y - pFg.y)  * 0.09;

    if (typeof gsap !== 'undefined') {
      // Starfield — moves opposite mouse (far background, depth factor 0.02)
      if (starfieldEl)  gsap.set(starfieldEl,  { x: -pBg.x  * 16,  y: -pBg.y  * 16  });
      // Porthole frame — subtle drift (depth factor 0.04)
      if (frameEl)      gsap.set(frameEl,      { x:  pMid.x * 10,  y:  pMid.y * 10  });
      // Interior — barely moves (depth factor 0.02), makes walls feel grounded
      if (interiorEl)   gsap.set(interiorEl,   { x:  pBg.x  * 5,   y:  pBg.y  * 5   });
      // Portrait — most displacement (depth factor 0.12)
      if (wrapperEl)    gsap.set(wrapperEl,    { x:  pFg.x  * 30,  y:  pFg.y  * 30  });
    }

    // --- Input → splats
    if (mouse.moved) {
      const dx = (mouse.x - mouse.px) * CFG.SPLAT_FORCE;
      const dy = (mouse.y - mouse.py) * CFG.SPLAT_FORCE;
      splat(mouse.x, mouse.y, dx, dy, 1.0);
      mouse.moved = false;
    } else if (idle) {
      idleAngle += CFG.IDLE_SPEED;
      // Slow organic orbit — gentle circular drift reveals the astronaut layer gradually
      const ix = 0.5 + Math.cos(idleAngle * 1.3) * 0.25;
      const iy = 0.5 + Math.sin(idleAngle) * 0.2;
      const dx = Math.cos(idleAngle * 1.3 + Math.PI / 2) * 0.5;
      const dy = Math.sin(idleAngle + Math.PI / 2) * 0.5;
      splat(ix, iy, dx, dy, 0.5);
    }

    // Sim
    step(dt);

    // Display — render to screen
    displayMat.uniforms.uDensity.value  = densityFBO.read.texture;
    displayMat.uniforms.maxReveal.value = idle ? CFG.MAX_REVEAL_IDLE : CFG.MAX_REVEAL_MOUSE;

    quad.material = displayMat;
    renderer.setRenderTarget(null);
    renderer.render(scene, camera);
  }

  // ----------------------------------------------------------
  // Public
  // ----------------------------------------------------------
  let _texturesPromise = null;

  // preload() — call immediately on page load, before loader finishes.
  // Kicks off texture loading in parallel so images are ready instantly.
  function preload() {
    if (isMobileHero || typeof THREE === 'undefined') return;
    const baseImg  = document.querySelector('.hero__layer--base');
    const astroImg = document.querySelector('.hero__layer--astronaut');
    if (!baseImg || !astroImg) return;

    const loader = new THREE.TextureLoader();
    _texturesPromise = Promise.all([
      new Promise((res, rej) => loader.load(baseImg.src,  res, undefined, rej)),
      new Promise((res, rej) => loader.load(astroImg.src, res, undefined, rej)),
    ]);
  }

  // start() — call after loader completes. Textures already loading/loaded.
  // Returns a Promise that resolves once the first frame is ready.
  function start() {
    if (isMobileHero) {
      // No WebGL on mobile — too heavy, causes layer detachment on pinch.
      // Hide canvas, show portrait layers directly since the canvas won't render them.
      const canvas = document.getElementById('hero-canvas');
      if (canvas) canvas.style.display = 'none';
      const base  = document.querySelector('.hero__layer--base');
      const astro = document.querySelector('.hero__layer--astronaut');
      if (base)  base.style.opacity  = '1';
      if (astro) astro.style.opacity = '0';

      // Looping crossfade — helmet on/off every 2 seconds
      if (astro && typeof gsap !== 'undefined') {
        gsap.to(astro, {
          opacity: 1,
          duration: 0.6,
          ease: 'power2.inOut',
          delay: 1.5,
          yoyo: true,
          repeat: -1,
          repeatDelay: 1.5,
        });
      }
      return Promise.resolve();
    }
    if (!_texturesPromise) preload();
    return _texturesPromise
      .then(([base, astro]) => {
        init(base, astro);
        // Wait one frame so the WebGL canvas renders before fade-in
        return new Promise(resolve => requestAnimationFrame(resolve));
      })
      .catch(err => {
        console.error('Hero: Texture load failed:', err);
      });
  }

  function destroy() {
    cancelAnimationFrame(raf);
    if (renderer) renderer.dispose();
  }

  return { preload, start, destroy };

})();
