/* ============================================================
   ABOUT SECTION — Discovery Space Shuttle (3D + ScrollTrigger)
   Flies across during horizontal scroll, then launches off at the end.
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function init() {
  const canvas  = document.getElementById('about-shuttle');
  const section = document.getElementById('about');
  if (!canvas || !section) return;

  // Wait for GSAP + ScrollTrigger
  if (typeof gsap === 'undefined' || typeof ScrollTrigger === 'undefined') {
    console.warn('about-shuttle: GSAP not ready, retrying...');
    setTimeout(init, 500);
    return;
  }

  const w = canvas.clientWidth  || 400;
  const h = canvas.clientHeight || 300;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
  camera.position.set(0, 0, 4);

  // Lighting
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const key = new THREE.DirectionalLight(0xffffff, 1.8);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaddff, 0.5);
  fill.position.set(-3, -2, 2);
  scene.add(fill);

  const ro = new ResizeObserver(() => {
    const nw = canvas.clientWidth;
    const nh = canvas.clientHeight;
    renderer.setSize(nw, nh, false);
    camera.aspect = nw / nh;
    camera.updateProjectionMatrix();
  });
  ro.observe(canvas);

  let shuttleModel = null;

  // Debug: add a test cube to verify renderer works
  const testGeo = new THREE.BoxGeometry(0.5, 0.5, 0.5);
  const testMat = new THREE.MeshStandardMaterial({ color: 0xCCFF00 });
  const testCube = new THREE.Mesh(testGeo, testMat);
  scene.add(testCube);
  console.log('about-shuttle: test cube added, canvas size:', w, h);

  const loader = new GLTFLoader();
  loader.load(
    'assets/models/space_shuttle.glb',
    (gltf) => {
      console.log('about-shuttle: GLB loaded successfully');
      scene.remove(testCube); // remove test cube

      const model = gltf.scene;

      // Centre and normalise
      const box = new THREE.Box3().setFromObject(model);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      model.position.sub(centre);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      console.log('about-shuttle: model size', size.x, size.y, size.z, 'maxDim', maxDim);
      model.scale.setScalar(2.0 / maxDim);

      // Tilt shuttle so it faces right (flying direction)
      model.rotation.y = -Math.PI / 2;
      model.rotation.z = 0.1;

      scene.add(model);
      shuttleModel = model;

      // Set up ScrollTrigger animation on the canvas element
      setupScrollAnimation();
    },
    (progress) => {
      console.log('about-shuttle: loading...', Math.round((progress.loaded / progress.total) * 100) + '%');
    },
    (err) => console.warn('about-shuttle: failed to load', err)
  );

  function setupScrollAnimation() {
    const track = section.querySelector('.about__track');
    if (!track) return;

    // Phase 1: Shuttle flies across with the horizontal scroll (left to right)
    gsap.fromTo(canvas,
      { left: '5%' },
      {
        left: '85%',
        ease: 'none',
        scrollTrigger: {
          trigger: section,
          start: 'top top',
          end: () => `+=${(track.scrollWidth - window.innerWidth) * 0.85}`,
          scrub: 2,
          invalidateOnRefresh: true,
        },
      }
    );

    // Phase 2: At end of horizontal scroll, shuttle launches upward and disappears
    gsap.fromTo(canvas,
      { y: 0, opacity: 0.8 },
      {
        y: '-120vh',
        opacity: 0,
        ease: 'power2.in',
        scrollTrigger: {
          trigger: section,
          start: () => `top+=${(track.scrollWidth - window.innerWidth) * 0.85} top`,
          end: () => `top+=${track.scrollWidth - window.innerWidth} top`,
          scrub: 1.5,
          invalidateOnRefresh: true,
        },
      }
    );

    // Subtle rotation during flight — slight nose-up as it flies
    gsap.to(canvas, {
      rotation: -8,
      ease: 'none',
      scrollTrigger: {
        trigger: section,
        start: 'top top',
        end: () => `+=${(track.scrollWidth - window.innerWidth) * 0.85}`,
        scrub: 2,
        invalidateOnRefresh: true,
      },
    });

    // Launch angle — nose up sharply when blasting off
    gsap.to(canvas, {
      rotation: -35,
      ease: 'power1.in',
      scrollTrigger: {
        trigger: section,
        start: () => `top+=${(track.scrollWidth - window.innerWidth) * 0.85} top`,
        end: () => `top+=${track.scrollWidth - window.innerWidth} top`,
        scrub: 1.5,
        invalidateOnRefresh: true,
      },
    });
  }

  // Gentle idle rotation
  function animate() {
    requestAnimationFrame(animate);
    if (shuttleModel) {
      shuttleModel.rotation.x += 0.001;
    }
    renderer.render(scene, camera);
  }
  animate();
}

// Wait a tick for GSAP to be available (loaded before as regular script)
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => setTimeout(init, 100));
} else {
  setTimeout(init, 100);
}
