import { GLTFLoader } from '../vendor/GLTFLoader.js';
import { MeshoptDecoder } from '../vendor/meshopt_decoder.module.js';

let threePromise;
const loadThree = () => (threePromise ||= import('three').catch(() => null));
const hasWebGL2 = () => { try { return Boolean(document.createElement('canvas').getContext('webgl2')); } catch { return false; } };

async function loadMascotModel(url) {
  const gltf = await new GLTFLoader().loadAsync(url);
  if (!gltf.scene) throw new Error('O GLB do mascote não possui uma cena.');
  return gltf.scene;
}

function fitMascotCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr = Math.min(window.devicePixelRatio || 1, 1.6);
  const width = Math.max(1, Math.floor(rect.width * dpr));
  const height = Math.max(1, Math.floor(rect.height * dpr));
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  return { width, height, dpr };
}


function disposeObject(object) {
  object?.traverse?.(child => {
    child.geometry?.dispose?.();
    const materials = Array.isArray(child.material) ? child.material : [child.material];
    materials.filter(Boolean).forEach(material => {
      Object.values(material).forEach(value => value?.isTexture && value.dispose?.());
      material.dispose?.();
    });
  });
}

function fallbackCanvas(canvas, label) {
  const context = canvas?.getContext('2d');
  let active = true;
  const render = () => {
    if (!active || !context) return;
    const rect = canvas.getBoundingClientRect();
    const width = Math.max(1, Math.floor(rect.width));
    const height = Math.max(1, Math.floor(rect.height));
    if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    context.clearRect(0, 0, width, height);
    const glow = context.createRadialGradient(width / 2, height / 2, 8, width / 2, height / 2, Math.max(width, height) * .6);
    glow.addColorStop(0, 'rgba(227,198,121,.38)');
    glow.addColorStop(1, 'rgba(10,16,26,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#f4e9d7';
    context.font = `700 ${Math.max(15, width * .055)}px Georgia`;
    context.textAlign = 'center';
    context.fillText(label, width / 2, height / 2);
    requestAnimationFrame(render);
  };
  render();
  return { dispose: () => { active = false; }, setHeight() {}, setType() {} };
}

function simpleInstrument(THREE, type) {
  const group = new THREE.Group();
  const wood = new THREE.MeshStandardMaterial({ color: 0xa45122, roughness: .48 });
  const brass = new THREE.MeshStandardMaterial({ color: 0xd6a538, roughness: .25, metalness: .78 });
  const silver = new THREE.MeshStandardMaterial({ color: 0xd0d8df, roughness: .22, metalness: .8 });
  if (type === 'flauta') {
    const tube = new THREE.Mesh(new THREE.CylinderGeometry(.07, .07, 3.3, 20), silver);
    tube.rotation.z = Math.PI / 2;
    group.add(tube);
  } else if (type === 'trompete') {
    const loop = new THREE.Mesh(new THREE.TorusGeometry(.55, .065, 10, 30, Math.PI * 1.6), brass);
    loop.rotation.y = Math.PI / 2;
    const bell = new THREE.Mesh(new THREE.CylinderGeometry(.42, .12, .75, 22, 1, true), brass);
    bell.rotation.z = Math.PI / 2;
    bell.position.x = 1.05;
    group.add(loop, bell);
  } else if (type === 'timpano') {
    const bowl = new THREE.Mesh(new THREE.SphereGeometry(1.05, 28, 18, 0, Math.PI * 2, 0, Math.PI / 2), brass);
    bowl.scale.y = .55;
    bowl.position.y = -.25;
    const head = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, .08, 28), new THREE.MeshStandardMaterial({ color: 0xe9dec5, roughness: .65 }));
    group.add(bowl, head);
  } else if (type === 'xilofone') {
    for (let index = 0; index < 8; index += 1) {
      const bar = new THREE.Mesh(new THREE.BoxGeometry(1.15 + index * .14, .12, .3), wood);
      bar.position.y = (index - 3.5) * .23;
      group.add(bar);
    }
  } else {
    const lower = new THREE.Mesh(new THREE.SphereGeometry(.78, 24, 16), wood);
    lower.scale.set(.9, 1.1, .3);
    lower.position.y = -.62;
    const upper = new THREE.Mesh(new THREE.SphereGeometry(.62, 24, 16), wood);
    upper.scale.set(.82, 1.05, .28);
    upper.position.y = .36;
    const neck = new THREE.Mesh(new THREE.BoxGeometry(.16, 1.75, .11), new THREE.MeshStandardMaterial({ color: 0x32180d, roughness: .55 }));
    neck.position.y = 1.55;
    group.add(lower, upper, neck);
  }
  return group;
}

function resizeRenderer(renderer, camera, canvas) {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
  camera.aspect = rect.width / Math.max(1, rect.height);
  camera.updateProjectionMatrix();
}

function createWoodMaterial(THREE, color = 0xa64e1b) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.42, metalness: 0.05 });
}

function createMetalMaterial(THREE, color = 0xd5ad43) {
  return new THREE.MeshStandardMaterial({ color, roughness: 0.2, metalness: 0.82 });
}

function createStringInstrument(THREE, scale = 1, color = 0xa84f1d) {
  const group = new THREE.Group();
  const wood = createWoodMaterial(THREE, color);
  const dark = createWoodMaterial(THREE, 0x3e180d);
  const bodyTop = new THREE.Mesh(new THREE.SphereGeometry(0.62, 24, 16), wood);
  bodyTop.scale.set(0.82, 1.05, 0.28);
  bodyTop.position.y = 0.36;
  const bodyBottom = new THREE.Mesh(new THREE.SphereGeometry(0.78, 24, 16), wood);
  bodyBottom.scale.set(0.9, 1.12, 0.3);
  bodyBottom.position.y = -0.64;
  const waist = new THREE.Mesh(new THREE.SphereGeometry(0.48, 20, 14), wood);
  waist.scale.set(0.78, 0.9, 0.24);
  waist.position.y = -0.1;
  const neck = new THREE.Mesh(new THREE.BoxGeometry(0.16, 1.7, 0.10), dark);
  neck.position.y = 1.6;
  const pegbox = new THREE.Mesh(new THREE.SphereGeometry(0.2, 16, 12), wood);
  pegbox.scale.set(0.65, 1.2, 0.55);
  pegbox.position.y = 2.48;
  const bridge = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.08, 0.13), new THREE.MeshStandardMaterial({ color: 0xdfc58f, roughness: 0.8 }));
  bridge.position.set(0, -0.35, 0.29);
  group.add(bodyTop, bodyBottom, waist, neck, pegbox, bridge);
  const stringMaterial = new THREE.LineBasicMaterial({ color: 0xeae2cb });
  [-0.05, -0.017, 0.017, 0.05].forEach(x => {
    const geometry = new THREE.BufferGeometry().setFromPoints([
      new THREE.Vector3(x, 2.55, 0.08),
      new THREE.Vector3(x, -1.35, 0.32)
    ]);
    group.add(new THREE.Line(geometry, stringMaterial));
  });
  group.scale.setScalar(scale);
  return group;
}

function createFlute(THREE, scale = 1) {
  const group = new THREE.Group();
  const metal = createMetalMaterial(THREE, 0xcbd2d7);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 2.6, 20), metal);
  tube.rotation.z = Math.PI / 2;
  group.add(tube);
  for (let i = -4; i <= 4; i += 1) {
    const key = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.012, 8, 18), metal);
    key.rotation.y = Math.PI / 2;
    key.position.set(i * 0.24, 0.045, 0.045);
    group.add(key);
  }
  group.scale.setScalar(scale);
  return group;
}

function createTrumpet(THREE, scale = 1) {
  const group = new THREE.Group();
  const metal = createMetalMaterial(THREE, 0xd8aa2d);
  const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 1.65, 18), metal);
  tube.rotation.z = Math.PI / 2;
  tube.position.x = -0.2;
  group.add(tube);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.12, 0.65, 24, 1, true), metal);
  bell.rotation.z = Math.PI / 2;
  bell.position.x = 0.94;
  group.add(bell);
  const loop = new THREE.Mesh(new THREE.TorusGeometry(0.34, 0.045, 12, 32, Math.PI * 1.5), metal);
  loop.rotation.x = Math.PI / 2;
  loop.position.set(-0.35, -0.18, 0);
  group.add(loop);
  [-0.25, 0, 0.25].forEach(x => {
    const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.44, 16), metal);
    valve.position.set(x, 0.28, 0);
    group.add(valve);
  });
  group.scale.setScalar(scale);
  return group;
}

function createTimpani(THREE, scale = 1) {
  const group = new THREE.Group();
  const copper = createMetalMaterial(THREE, 0x9b4d22);
  const membrane = new THREE.MeshStandardMaterial({ color: 0xddd2bb, roughness: 0.92 });
  const bowl = new THREE.Mesh(new THREE.SphereGeometry(0.72, 28, 18, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2), copper);
  bowl.scale.y = 0.85;
  bowl.position.y = -0.5;
  group.add(bowl);
  const head = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.77, 0.06, 36), membrane);
  head.position.y = 0.06;
  group.add(head);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(0.77, 0.035, 12, 36), createMetalMaterial(THREE, 0xc8a24a));
  rim.rotation.x = Math.PI / 2;
  rim.position.y = 0.09;
  group.add(rim);
  group.scale.setScalar(scale);
  return group;
}

function createHorn(THREE, scale = 1) {
  const group = new THREE.Group();
  const metal = createMetalMaterial(THREE, 0xd2a02a);
  const ring = new THREE.Mesh(new THREE.TorusGeometry(0.58, 0.055, 12, 44), metal);
  group.add(ring);
  const bell = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.10, 0.55, 24, 1, true), metal);
  bell.rotation.z = Math.PI / 2;
  bell.position.set(0.72, 0.18, 0);
  group.add(bell);
  group.scale.setScalar(scale);
  return group;
}

function createStageScene(THREE, canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.6));

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x07080b, 0.048);
  const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 60);
  camera.position.set(0, 2.1, 10.7);
  camera.lookAt(0, 0.6, 0);

  const ambient = new THREE.HemisphereLight(0x9bb6d6, 0x190c06, 0.72);
  const spot = new THREE.SpotLight(0xf3c873, 90, 18, Math.PI / 5.2, 0.55, 1.4);
  spot.position.set(-2.4, 7.5, 5.8);
  spot.target.position.set(0, 0, 0);
  spot.castShadow = true;
  const rim = new THREE.SpotLight(0x7aa6d8, 34, 16, Math.PI / 4, 0.7, 1.3);
  rim.position.set(4.2, 4.5, -3.5);
  rim.target.position.set(0, 0.5, 0);
  scene.add(ambient, spot, spot.target, rim, rim.target);

  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(18, 12, 1, 1),
    new THREE.MeshStandardMaterial({ color: 0x311a12, roughness: 0.58, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.y = -1.78;
  floor.receiveShadow = true;
  scene.add(floor);

  const backdrop = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 12),
    new THREE.MeshBasicMaterial({ color: 0x050608 })
  );
  backdrop.position.set(0, 2, -5.5);
  scene.add(backdrop);

  const cello = createStringInstrument(THREE, 1.35, 0x9a3c12);
  cello.position.set(0, -0.1, 0.1);
  cello.rotation.y = -0.08;
  const violin = createStringInstrument(THREE, 0.72, 0xc5671f);
  violin.position.set(-2.1, -0.96, 0.62);
  violin.rotation.set(0.07, 0.26, -0.18);
  const flute = createFlute(THREE, 0.9);
  flute.position.set(-3.1, -1.18, 0.25);
  flute.rotation.set(0, -0.1, -0.18);
  const trumpet = createTrumpet(THREE, 0.84);
  trumpet.position.set(2.15, -0.9, 0.55);
  trumpet.rotation.set(-0.08, -0.32, 0.08);
  const horn = createHorn(THREE, 0.9);
  horn.position.set(2.85, 0.15, -0.45);
  horn.rotation.y = -0.5;
  const timpani = createTimpani(THREE, 1.1);
  timpani.position.set(1.8, -0.85, -1.35);

  [cello, violin, flute, trumpet, horn, timpani].forEach(object => {
    object.traverse(child => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });
    scene.add(object);
  });

  const dustGeometry = new THREE.BufferGeometry();
  const dustCount = 260;
  const positions = new Float32Array(dustCount * 3);
  for (let i = 0; i < dustCount; i += 1) {
    positions[i * 3] = (Math.random() - 0.5) * 9;
    positions[i * 3 + 1] = Math.random() * 7 - 1.5;
    positions[i * 3 + 2] = (Math.random() - 0.5) * 8;
  }
  dustGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const dust = new THREE.Points(dustGeometry, new THREE.PointsMaterial({ color: 0xf1d18a, size: 0.018, transparent: true, opacity: 0.35 }));
  scene.add(dust);

  const state = { pointerX: 0, pointerY: 0, active: true, open: false };
  const pointer = event => {
    const rect = canvas.getBoundingClientRect();
    state.pointerX = ((event.clientX - rect.left) / rect.width - 0.5) * 2;
    state.pointerY = ((event.clientY - rect.top) / rect.height - 0.5) * 2;
  };
  canvas.addEventListener('pointermove', pointer);

  const resize = () => {
    const rect = canvas.getBoundingClientRect();
    renderer.setSize(rect.width, rect.height, false);
    camera.aspect = rect.width / Math.max(rect.height, 1);
    camera.updateProjectionMatrix();
  };
  resize();
  window.addEventListener('resize', resize);

  const clock = new THREE.Clock();
  const render = () => {
    if (!state.active) return;
    const time = clock.getElapsedTime();
    const targetX = state.pointerX * 0.16;
    const targetY = 2.1 - state.pointerY * 0.09;
    camera.position.x += (targetX - camera.position.x) * 0.025;
    camera.position.y += (targetY - camera.position.y) * 0.025;
    camera.lookAt(0, 0.45, 0);
    cello.rotation.y = -0.08 + Math.sin(time * 0.25) * 0.015;
    violin.rotation.z = -0.18 + Math.sin(time * 0.32) * 0.012;
    dust.rotation.y = time * 0.014;
    spot.intensity = 82 + Math.sin(time * 0.65) * 5;
    renderer.render(scene, camera);
    requestAnimationFrame(render);
  };
  render();

  return {
    reveal() {
      state.open = true;
      const start = performance.now();
      const initialZ = 12.7;
      camera.position.z = initialZ;
      const animate = now => {
        const progress = Math.min(1, (now - start) / 2200);
        const eased = 1 - (1 - progress) ** 3;
        camera.position.z = initialZ - eased * 2;
        if (progress < 1) requestAnimationFrame(animate);
      };
      requestAnimationFrame(animate);
    },
    dispose() {
      state.active = false;
      window.removeEventListener('resize', resize);
      canvas.removeEventListener('pointermove', pointer);
      scene.traverse(object => {
        object.geometry?.dispose?.();
        if (Array.isArray(object.material)) object.material.forEach(material => material.dispose());
        else object.material?.dispose?.();
      });
      renderer.dispose();
    }
  };
}

export async function initStage(canvas) {
  const THREE = await loadThree();
  if (!THREE || !hasWebGL2()) {
    return { reveal() {}, dispose: fallbackCanvas(canvas, 'Palco virtual').dispose, mode: 'fallback' };
  }
  try {
    return { ...createStageScene(THREE, canvas), mode: 'three' };
  } catch (error) {
    console.warn('Palco 3D indisponível; usando ilustração de fallback.', error);
    return { reveal() {}, dispose: fallbackCanvas(canvas, 'Palco virtual').dispose, mode: 'fallback' };
  }
}

export async function initInstrumentExplorer(canvas, initial = 'violino') {
  const THREE = await loadThree();
  if (!canvas || !THREE || !hasWebGL2()) return fallbackCanvas(canvas, 'Explorador 3D');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5));
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(36, 1, .1, 50);
  camera.position.set(0, .25, 6.3);
  scene.add(new THREE.HemisphereLight(0xcadcf2, 0x30150d, 1.7));
  const key = new THREE.DirectionalLight(0xf4c568, 3.3);
  key.position.set(-3, 5, 5);
  scene.add(key);
  let object = simpleInstrument(THREE, initial);
  scene.add(object);
  let targetY = .2, dragging = false, pointerId = null, lastX = 0;
  const down = event => { if (event.button !== 0) return; dragging = true; pointerId = event.pointerId; lastX = event.clientX; canvas.setPointerCapture?.(pointerId); };
  const move = event => { if (!dragging || event.pointerId !== pointerId) return; targetY += (event.clientX - lastX) * .012; lastX = event.clientX; };
  const up = event => { if (event.pointerId === pointerId) { dragging = false; pointerId = null; } };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up);
  const resize = () => resizeRenderer(renderer, camera, canvas);
  resize(); window.addEventListener('resize', resize);
  let active = true;
  const render = () => { if (!active) return; if (!dragging) targetY += .003; object.rotation.y += (targetY - object.rotation.y) * .07; renderer.render(scene, camera); requestAnimationFrame(render); };
  render();
  return { setType(type) { scene.remove(object); disposeObject(object); object = simpleInstrument(THREE, type); scene.add(object); targetY = .2; }, dispose() { active = false; window.removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); disposeObject(object); renderer.dispose(); } };
}

function fallbackMascot(canvas) {
  const context = canvas.getContext('2d');
  let running = true;
  let phase = 0;
  const draw = () => {
    if (!running || !context) return;
    const { width, height } = fitMascotCanvas(canvas);
    context.clearRect(0, 0, width, height);
    const cx = width / 2;
    const cy = height * 0.52 + Math.sin(phase) * height * 0.015;
    const radius = Math.min(width, height) * 0.27;
    const glow = context.createRadialGradient(cx, cy, radius * 0.2, cx, cy, radius * 1.8);
    glow.addColorStop(0, 'rgba(227,198,121,.32)');
    glow.addColorStop(1, 'rgba(227,198,121,0)');
    context.fillStyle = glow;
    context.fillRect(0, 0, width, height);
    context.fillStyle = '#d7a778';
    context.beginPath();
    context.ellipse(cx, cy, radius * 0.82, radius, 0, 0, Math.PI * 2);
    context.fill();
    context.fillStyle = '#3b241e';
    context.beginPath();
    context.arc(cx, cy - radius * 0.48, radius * 0.77, Math.PI, Math.PI * 2);
    context.fill();
    context.fillStyle = '#161616';
    context.beginPath();
    context.arc(cx - radius * 0.27, cy - radius * 0.08, radius * 0.06, 0, Math.PI * 2);
    context.arc(cx + radius * 0.27, cy - radius * 0.08, radius * 0.06, 0, Math.PI * 2);
    context.fill();
    context.strokeStyle = '#5b1e2d';
    context.lineWidth = Math.max(2, radius * 0.045);
    context.beginPath();
    context.arc(cx, cy + radius * 0.26, radius * 0.28, 0.15, Math.PI - 0.15);
    context.stroke();
    context.fillStyle = 'rgba(255,255,255,.86)';
    context.font = `700 ${Math.max(12, width * 0.065)}px system-ui`;
    context.textAlign = 'center';
    context.fillText('Professor Marcio', cx, height - 16);
    phase += 0.035;
    requestAnimationFrame(draw);
  };
  draw();
  queueMicrotask(() => canvas.dispatchEvent(new CustomEvent('mascot-loaded')));
  return {
    dispose() {
      running = false;
    }
  };
}

export async function initMascot(canvas) {
  if (!canvas) return null;
  const THREE = await loadThree();
  if (!THREE || !hasWebGL2()) {
    return fallbackMascot(canvas);
  }

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x000000, 0);

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.01, 30);
    scene.add(new THREE.HemisphereLight(0xffe3bd, 0x172033, 2.15));
    const key = new THREE.DirectionalLight(0xffcf86, 3.8);
    key.position.set(-2.6, 3.5, 4.2);
    const rim = new THREE.DirectionalLight(0x8fb9ea, 2.4);
    rim.position.set(3.4, 1.8, -2.8);
    scene.add(key, rim);

    const root = new THREE.Group();
    scene.add(root);
    let model = null;
    let framingRadius = 1;
    let loaded = false;
    try {
      model = await loadMascotModel('./public/assets/models/man head 3d model.glb');
      const box = new THREE.Box3().setFromObject(model);
      const size = box.getSize(new THREE.Vector3());
      const center = box.getCenter(new THREE.Vector3());
      const maxDimension = Math.max(size.x, size.y, size.z) || 1;
      const modelScale = 1 / maxDimension;
      model.scale.setScalar(modelScale);
      model.position.copy(center).multiplyScalar(-modelScale);
      framingRadius = Math.max(box.getBoundingSphere(new THREE.Sphere()).radius * modelScale, 0.1);
      model.rotation.y = -0.12;
      model.traverse(child => {
        if (!child.isMesh) return;
        child.frustumCulled = true;
        const materials = Array.isArray(child.material) ? child.material : [child.material];
        materials.filter(Boolean).forEach(material => {
          material.roughness = Math.max(0.62, material.roughness ?? 0.72);
          material.metalness = Math.min(0.05, material.metalness ?? 0);
          material.needsUpdate = true;
        });
      });
      root.add(model);
      loaded = true;
      canvas.dispatchEvent(new CustomEvent('mascot-loaded'));
    } catch (error) {
      console.warn('Não foi possível carregar o modelo do mascote; usando ilustração alternativa.', error);
      renderer.dispose();
      return fallbackMascot(canvas);
    }

    let rotating = false;
    let rotationPointerId = null;
    let lastRotationX = 0;
    let lastRotationY = 0;
    let targetRotationY = -0.1;
    let targetRotationX = 0;
    let suppressMascotClick = false;
    const startRotation = event => {
      if (event.button !== 0) return;
      rotating = true;
      rotationPointerId = event.pointerId;
      lastRotationX = event.clientX;
      lastRotationY = event.clientY;
      canvas.classList.add('is-rotating');
      canvas.setPointerCapture?.(rotationPointerId);
      event.preventDefault();
    };
    const rotate = event => {
      if (!rotating || event.pointerId !== rotationPointerId) return;
      const deltaX = event.clientX - lastRotationX;
      const deltaY = event.clientY - lastRotationY;
      if (Math.abs(deltaX) + Math.abs(deltaY) > 3) suppressMascotClick = true;
      targetRotationY += deltaX * 0.012;
      targetRotationX = Math.max(-0.26, Math.min(0.26, targetRotationX + deltaY * 0.006));
      lastRotationX = event.clientX;
      lastRotationY = event.clientY;
    };
    const stopRotation = event => {
      if (!rotating || (event?.pointerId !== undefined && event.pointerId !== rotationPointerId)) return;
      rotating = false;
      canvas.classList.remove('is-rotating');
      canvas.releasePointerCapture?.(rotationPointerId);
      rotationPointerId = null;
    };
    const preventMenu = event => event.preventDefault();
    const preventAudioAfterRotation = event => {
      if (!suppressMascotClick) return;
      suppressMascotClick = false;
      event.preventDefault();
      event.stopPropagation();
    };
    canvas.addEventListener('pointerdown', startRotation);
    canvas.addEventListener('pointermove', rotate);
    canvas.addEventListener('pointerup', stopRotation);
    canvas.addEventListener('pointercancel', stopRotation);
    canvas.addEventListener('click', preventAudioAfterRotation, true);
    canvas.addEventListener('contextmenu', preventMenu);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const width = Math.max(1, rect.width);
      const height = Math.max(1, rect.height);
      const aspect = width / height;
      const halfHeight = framingRadius * 1.45;
      const halfWidth = halfHeight * aspect;
      renderer.setSize(width, height, false);
      camera.left = -halfWidth;
      camera.right = halfWidth;
      camera.top = halfHeight;
      camera.bottom = -halfHeight;
      camera.position.set(0, 0, 4);
      camera.lookAt(0, 0, 0);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let active = true;
    const clock = new THREE.Clock();
    const render = () => {
      if (!active) return;
      const time = clock.getElapsedTime();
      if (loaded && model) {
        root.rotation.y += (targetRotationY - root.rotation.y) * 0.075;
        root.rotation.x += (targetRotationX - root.rotation.x) * 0.075;
        root.position.y = Math.sin(time * 1.35) * 0.025;
      }
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();

    return {
      dispose() {
        active = false;
        canvas.removeEventListener('pointerdown', startRotation);
        canvas.removeEventListener('pointermove', rotate);
        canvas.removeEventListener('pointerup', stopRotation);
        canvas.removeEventListener('pointercancel', stopRotation);
        canvas.removeEventListener('contextmenu', preventMenu);
        window.removeEventListener('resize', resize);
        const textures = new Set(model?.userData?.embeddedTextures || []);
        model?.traverse(child => {
          child.geometry?.dispose?.();
          const materials = Array.isArray(child.material) ? child.material : [child.material];
          materials.filter(Boolean).forEach(material => {
            ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(key => {
              if (material[key]) textures.add(material[key]);
            });
            material.dispose?.();
          });
        });
        textures.forEach(texture => {
          texture.image?.close?.();
          texture.dispose?.();
        });
        renderer.dispose();
      }
    };
  } catch (error) {
    console.warn('Mascote 3D indisponível; usando fallback.', error);
    return fallbackMascot(canvas);
  }
}

export async function initDialogInstrumentViewer(canvas, modelUrl) {
  const THREE = await loadThree();
  if (!canvas || !modelUrl || !THREE || !hasWebGL2()) throw new Error('Visualização 3D indisponível neste navegador.');
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.5)); renderer.outputColorSpace = THREE.SRGBColorSpace; renderer.setClearColor(0, 0);
  const scene = new THREE.Scene(), camera = new THREE.PerspectiveCamera(34, 1, .01, 100), root = new THREE.Group();
  let framingRadius = 1;
  scene.add(new THREE.HemisphereLight(0xd7e8ff, 0x15101d, 2.3));
  const key = new THREE.DirectionalLight(0xffd184, 3.4); key.position.set(3.5, 5, 5);
  const rim = new THREE.DirectionalLight(0x9bb9ff, 2.2); rim.position.set(-4, 2, -3); scene.add(key, rim, root);
  let model, active = true, dragging = false, pointerId = null, lastX = 0, lastY = 0, targetY = .3, targetX = -.08, zoom = 1;
  const resize = () => {
    resizeRenderer(renderer, camera, canvas);
    const verticalHalfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const horizontalHalfFov = Math.atan(Math.tan(verticalHalfFov) * camera.aspect);
    const limitingHalfFov = Math.min(verticalHalfFov, horizontalHalfFov);
    camera.position.set(0, -.34, framingRadius / Math.sin(limitingHalfFov) * 1.30 / zoom);
  };
  const down = event => { if (event.button !== 0) return; dragging = true; pointerId = event.pointerId; lastX = event.clientX; lastY = event.clientY; canvas.classList.add('is-rotating'); canvas.setPointerCapture?.(pointerId); event.preventDefault(); };
  const move = event => { if (!dragging || event.pointerId !== pointerId) return; targetY += (event.clientX - lastX) * .012; targetX = Math.max(-.48, Math.min(.48, targetX + (event.clientY - lastY) * .007)); lastX = event.clientX; lastY = event.clientY; };
  const up = event => { if (event.pointerId === pointerId) { dragging = false; pointerId = null; canvas.classList.remove('is-rotating'); } };
  canvas.addEventListener('pointerdown', down); canvas.addEventListener('pointermove', move); canvas.addEventListener('pointerup', up); canvas.addEventListener('pointercancel', up); canvas.addEventListener('contextmenu', event => event.preventDefault());
  window.addEventListener('resize', resize);
  try {
    const loader = new GLTFLoader().setMeshoptDecoder(MeshoptDecoder);
    model = (await loader.loadAsync(modelUrl)).scene;
    const box = new THREE.Box3().setFromObject(model), center = box.getCenter(new THREE.Vector3()), size = box.getSize(new THREE.Vector3());
    const scale = 1 / (Math.max(size.x, size.y, size.z) || 1);
    model.position.copy(center).multiplyScalar(-scale); model.scale.setScalar(scale);
    framingRadius = Math.max(new THREE.Box3().setFromObject(model).getBoundingSphere(new THREE.Sphere()).radius, .1);
    root.add(model); resize();
  } catch (error) { active = false; window.removeEventListener('resize', resize); renderer.dispose(); throw error; }
  const render = () => { if (!active) return; if (!dragging) targetY += .004; root.rotation.y += (targetY - root.rotation.y) * .07; root.rotation.x += (targetX - root.rotation.x) * .07; renderer.render(scene, camera); requestAnimationFrame(render); };
  render();
  return { zoomIn() { zoom = Math.min(1.6, zoom + .15); resize(); }, zoomOut() { zoom = Math.max(.7, zoom - .15); resize(); }, dispose: () => { active = false; window.removeEventListener('resize', resize); canvas.removeEventListener('pointerdown', down); canvas.removeEventListener('pointermove', move); canvas.removeEventListener('pointerup', up); canvas.removeEventListener('pointercancel', up); disposeObject(model); renderer.dispose(); } };
}

export async function initHallScene(canvas) {
  const THREE = await loadThree();
  if (!canvas || !THREE || !hasWebGL2()) return fallbackCanvas(canvas, 'Sala de concertos');

  try {
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.45));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.setClearColor(0x081019, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x081019);
    scene.fog = new THREE.Fog(0x081019, 10, 29);

    const camera = new THREE.PerspectiveCamera(40, 1, 0.1, 70);
    camera.position.set(0, 2.5, 15.4);
    camera.lookAt(0, 1.5, -3.1);

    scene.add(new THREE.HemisphereLight(0xf3d39a, 0x170b08, 1.15));
    const warm = new THREE.PointLight(0xffbc5c, 38, 23);
    warm.position.set(0, 5.6, -1.5);
    scene.add(warm);
    const rim = new THREE.DirectionalLight(0x648db7, 1.8);
    rim.position.set(4, 5, 7);
    scene.add(rim);

    const roomMaterial = new THREE.MeshStandardMaterial({ color: 0x7b3d22, roughness: 0.82 });
    const darkWood = new THREE.MeshStandardMaterial({ color: 0x3c2418, roughness: 0.9 });
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(15.5, 26), darkWood);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, -1.6, -4.2);
    scene.add(floor);

    [-7.4, 7.4].forEach(x => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.55, 9, 26), roomMaterial);
      wall.position.set(x, 2.45, -4.2);
      scene.add(wall);
    });

    const stage = new THREE.Mesh(new THREE.BoxGeometry(8.6, 0.52, 4.2), roomMaterial);
    stage.position.set(0, -1.27, -9.1);
    scene.add(stage);

    const panels = [];
    for (let row = 0; row < 3; row += 1) {
      for (let col = 0; col < 5; col += 1) {
        const panel = new THREE.Mesh(
          new THREE.BoxGeometry(2.15, 0.18, 2.35),
          createWoodMaterial(THREE, 0xb96a28)
        );
        panel.position.set((col - 2) * 2.38, 5.2, -8.3 + row * 3.18);
        panel.userData.row = row;
        panel.userData.col = col;
        scene.add(panel);
        panels.push(panel);
      }
    }

    const seatGeometry = new THREE.BoxGeometry(0.34, 0.36, 0.42);
    const seatMaterial = new THREE.MeshStandardMaterial({ color: 0x6b1f17, roughness: 0.87 });
    for (let row = 0; row < 11; row += 1) {
      for (let col = 0; col < 16; col += 1) {
        const seat = new THREE.Mesh(seatGeometry, seatMaterial);
        seat.position.set((col - 7.5) * 0.6, -1.24 + row * 0.036, 3.3 - row * 0.72);
        scene.add(seat);
      }
    }

    // Animated golden sine lines. Their geometry is updated every frame to suggest propagation.
    const waves = [];
    for (let row = 0; row < 8; row += 1) {
      const geometry = new THREE.BufferGeometry();
      const positions = new Float32Array(90 * 3);
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      const material = new THREE.LineBasicMaterial({
        color: row < 3 ? 0xe7c97d : 0xc79a3e,
        transparent: true,
        opacity: 0.25 + row * 0.055,
        depthWrite: false
      });
      const line = new THREE.Line(geometry, material);
      line.userData.row = row;
      scene.add(line);
      waves.push(line);
    }

    let ceilingHeight = 0.5;
    const setHeight = value => {
      ceilingHeight = Math.max(0, Math.min(1, value));
      panels.forEach(panel => {
        panel.position.y = 3.95 + ceilingHeight * 3.25 + panel.userData.col * 0.012;
      });
    };
    setHeight(ceilingHeight);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      renderer.setSize(Math.max(1, rect.width), Math.max(1, rect.height), false);
      camera.aspect = rect.width / Math.max(1, rect.height);
      camera.updateProjectionMatrix();
    };
    resize();
    window.addEventListener('resize', resize);

    let active = true;
    const render = () => {
      if (!active) return;
      const time = performance.now() * 0.001;
      const ceilingY = 3.95 + ceilingHeight * 3.25;
      waves.forEach((line, index) => {
        const progress = index / Math.max(1, waves.length - 1);
        const attribute = line.geometry.getAttribute('position');
        const z = -7.6 + progress * 8.4;
        const yBase = -0.62 + progress * Math.min(3.25, ceilingY - 1.3);
        const amplitude = 0.13 + progress * 0.07;
        const cycles = 5.2 + progress * 2.8;
        for (let point = 0; point < attribute.count; point += 1) {
          const normalized = point / (attribute.count - 1);
          const x = -4.45 + normalized * 8.9;
          const y = yBase + Math.sin(normalized * Math.PI * 2 * cycles - time * (2.0 + progress)) * amplitude;
          attribute.setXYZ(point, x, y, z);
        }
        attribute.needsUpdate = true;
        line.material.opacity = 0.22 + progress * 0.34 + Math.sin(time * 1.6 - index * 0.38) * 0.06;
      });
      renderer.render(scene, camera);
      requestAnimationFrame(render);
    };
    render();

    return {
      mode: 'webgl',
      setHeight,
      getHeight() { return ceilingHeight; },
      dispose() {
        active = false;
        window.removeEventListener('resize', resize);
        scene.traverse(object => {
          object.geometry?.dispose?.();
          if (Array.isArray(object.material)) object.material.forEach(material => material.dispose?.());
          else object.material?.dispose?.();
        });
        renderer.dispose();
      }
    };
  } catch (error) {
    console.warn('Sala 3D indisponível; usando fallback.', error);
    return fallbackCanvas(canvas, 'Sala de concertos');
  }
}
