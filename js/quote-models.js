/* ============================================================
   QUOTE SECTION — 3D Background Models (GLTFLoader with textures)
   Asteroid (top-left) + Ultima Thule (bottom-right)
   ============================================================ */

import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

function createScene(canvas) {
  const w = canvas.clientWidth  || canvas.offsetWidth  || 400;
  const h = canvas.clientHeight || canvas.offsetHeight || 400;

  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(w, h, false);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const scene  = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, w / h, 0.01, 100);
  camera.position.set(0, 0, 3.5);

  // Lighting — bright so asteroids pop against dark bg
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));
  const key = new THREE.DirectionalLight(0xffffff, 2.5);
  key.position.set(3, 4, 5);
  scene.add(key);
  const fill = new THREE.DirectionalLight(0xaaddff, 1.0);
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

  return { renderer, scene, camera };
}

function loadModel(url, scene, rotOffset, callback) {
  const loader = new GLTFLoader();
  loader.load(
    url,
    (gltf) => {
      const model = gltf.scene;

      // Centre and normalise scale
      const box    = new THREE.Box3().setFromObject(model);
      const centre = new THREE.Vector3();
      box.getCenter(centre);
      model.position.sub(centre);

      const size   = new THREE.Vector3();
      box.getSize(size);
      const maxDim = Math.max(size.x, size.y, size.z);
      const baseScale = 1.8 / maxDim;
      const scale = baseScale * (rotOffset.s || 1);
      model.scale.setScalar(scale);

      // Initial tilt
      model.rotation.x = rotOffset.x;
      model.rotation.z = rotOffset.z;

      scene.add(model);
      if (callback) callback(model);
    },
    undefined,
    (err) => console.warn('quote-models: failed to load', url, err)
  );
}

function init() {
  const canvasTL = document.getElementById('quote-model-tl');
  const canvasTR = document.getElementById('quote-model-tr');
  const canvasBR = document.getElementById('quote-model-br');
  if (!canvasTL || !canvasTR || !canvasBR) return;

  const tlScene = createScene(canvasTL);
  const trScene = createScene(canvasTR);
  const brScene = createScene(canvasBR);

  let tlModel = null;
  let trModel = null;
  let brModel = null;

  loadModel('assets/models/asteroid.glb', tlScene.scene, { x:  0.3,  z: -0.2,  s: 1.0  }, m => { tlModel = m; });
  loadModel('assets/models/asteroid.glb', trScene.scene, { x: -0.2,  z:  0.3,  s: 0.7  }, m => { trModel = m; });
  loadModel('assets/models/asteroid.glb', brScene.scene, { x: -0.25, z:  0.15, s: 1.3  }, m => { brModel = m; });

  function animate() {
    requestAnimationFrame(animate);
    if (tlModel) { tlModel.rotation.y += 0.003;  tlModel.rotation.x += 0.0008; }
    if (trModel) { trModel.rotation.y += 0.002;  trModel.rotation.z -= 0.0007; }
    if (brModel) { brModel.rotation.y -= 0.0025; brModel.rotation.z += 0.0006; }
    tlScene.renderer.render(tlScene.scene, tlScene.camera);
    trScene.renderer.render(trScene.scene, trScene.camera);
    brScene.renderer.render(brScene.scene, brScene.camera);
  }
  animate();
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}
