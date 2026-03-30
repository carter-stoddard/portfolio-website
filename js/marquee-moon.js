/* ============================================================
   MARQUEE SECTION — 3D Moon (GLTFLoader)
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function init() {
  const canvas = document.getElementById('marquee-moon');
  if (!canvas) return;

  const w = canvas.clientWidth  || 300;
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
  camera.position.set(0, 0, 3.5);

  // Lighting — moderate so textures show through
  scene.add(new THREE.AmbientLight(0xffffff, 0.5));
  const key = new THREE.DirectionalLight(0xffffff, 1.2);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaddff, 0.3);
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

  let moonModel = null;

  const loader = new GLTFLoader();
  loader.load(
    'assets/models/the_moon.glb',
    (gltf) => {
      const model = gltf.scene;
      const box = new THREE.Box3().setFromObject(model);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      model.position.sub(centre);

      const size = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      model.scale.setScalar(1.8 / maxDim);

      // Force all materials fully opaque
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          child.material.transparent = false;
          child.material.opacity = 1.0;
          child.material.depthWrite = true;
        }
      });

      scene.add(model);
      moonModel = model;
    },
    undefined,
    (err) => console.warn('marquee-moon: failed to load', err)
  );

  function animate() {
    requestAnimationFrame(animate);
    if (moonModel) {
      moonModel.rotation.y += 0.002;
    }
    renderer.render(scene, camera);
  }
  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
