// The home hero, live: money runs from the shop to the bank on three lanes; one lane leaks until it is sealed.
// Built by `npm run build` into /js/hero.js. The model is art/flow.glb, from tools/art/build.py (Blender).
// Loaded only after the page has finished, never with reduced motion or Save-Data (see studio.js).
import {
  WebGLRenderer, Scene, OrthographicCamera, PMREMGenerator, Group, Mesh, CylinderGeometry, TorusGeometry,
  BoxGeometry, MeshStandardMaterial, MeshPhysicalMaterial, Vector3, Color, DirectionalLight, SRGBColorSpace,
  NeutralToneMapping, MathUtils,
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';

const T = 9;                         // one loop, seconds
const SEAL_AT = 5.2, OPEN_AT = 8.6;  // the plate drops, then lifts
const LANES = [0.95, -0.1, -1.15];   // z of each lane (Blender y, negated); the middle one leaks
const TOP = 0.4, START = -1.9, END = 1.72, SPEED = 0.85, EVERY = 1.15;
const HOLE = { x: -0.08, from: -0.47, to: 0.32 };

export default async function hero(stage) {
  const poster = stage.querySelector('img');
  const renderer = new WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'low-power' });
  renderer.setPixelRatio(Math.min(devicePixelRatio, innerWidth < 700 ? 1.5 : 2));
  renderer.outputColorSpace = SRGBColorSpace;
  renderer.toneMapping = NeutralToneMapping;
  renderer.toneMappingExposure = 1.05;
  const canvas = renderer.domElement;
  canvas.setAttribute('aria-hidden', 'true');
  stage.appendChild(canvas);

  const scene = new Scene();
  const pmrem = new PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new DirectionalLight(new Color('#fff1dc'), 1.6);
  sun.position.set(-4, 10, 7);
  scene.add(sun);

  // the same camera as the Blender render, so the still and the live scene line up
  const target = new Vector3(0, 0.35, 0);
  const cam = new OrthographicCamera(-1, 1, 1, -1, 0.1, 100);
  cam.position.copy(target).add(new Vector3(9, 8.2, 9));
  cam.lookAt(target);

  const world = new Group();
  scene.add(world);
  const gltf = await new GLTFLoader().loadAsync(stage.dataset.model);
  world.add(gltf.scene);
  const find = (p) => { const out = []; gltf.scene.traverse((o) => { if (o.isMesh && o.name.startsWith(p)) out.push(o); }); return out; };

  // glass is cheaper as a faint transparent film than as real transmission
  for (const m of find('lens')) if (!m.name.startsWith('lens-rim')) m.material = new MeshPhysicalMaterial({ color: '#ffffff', transparent: true, opacity: 0.18, roughness: 0.05, metalness: 0 });
  const glowMats = find('glow').map((m) => (m.material = m.material.clone()));
  const magnifier = [...find('lens'), ...find('rod')];
  const magBase = magnifier.map((m) => m.position.y);

  // coins
  const gold = new MeshStandardMaterial({ color: '#d4922a', metalness: 1, roughness: 0.28 });
  const coinGeo = new CylinderGeometry(0.34, 0.34, 0.09, 36);
  const rimGeo = new TorusGeometry(0.25, 0.018, 8, 36);
  const makeCoin = () => {
    const g = new Group();
    g.add(new Mesh(coinGeo, gold));
    const r = new Mesh(rimGeo, gold); r.rotation.x = Math.PI / 2; r.position.y = 0.046; g.add(r);
    world.add(g);
    return g;
  };
  const PER = Math.ceil((END - START) / SPEED / EVERY) + 2;
  const coins = LANES.map(() => Array.from({ length: PER }, makeCoin));

  // the plate that seals the leak
  const plate = new Mesh(new BoxGeometry(HOLE.to - HOLE.from + 0.02, 0.06, 0.5), gold);
  plate.position.set((HOLE.from + HOLE.to) / 2, TOP - 0.03, LANES[1]);
  world.add(plate);

  // the labels that say what the picture shows
  const labels = [...stage.querySelectorAll('[data-at]')].map((el) => ({ el, at: new Vector3(...el.dataset.at.split(',').map(Number)) }));

  function size() {
    const w = stage.clientWidth, h = stage.clientHeight, half = 8.6 / 2, aspect = w / h;
    // match Blender's ortho_scale (the wider side spans 8.6 units)
    if (aspect >= 1) { cam.left = -half; cam.right = half; cam.top = half / aspect; cam.bottom = -half / aspect; }
    else { cam.top = half; cam.bottom = -half; cam.left = -half * aspect; cam.right = half * aspect; }
    cam.updateProjectionMatrix();
    renderer.setSize(w, h, false);
  }
  size();
  new ResizeObserver(size).observe(stage);

  let px = 0, py = 0, tx = 0, ty = 0;
  stage.addEventListener('pointermove', (e) => {
    const r = stage.getBoundingClientRect();
    tx = ((e.clientX - r.left) / r.width - 0.5) * 2; ty = ((e.clientY - r.top) / r.height - 0.5) * 2;
  }, { passive: true });
  stage.addEventListener('pointerleave', () => { tx = ty = 0; });

  const v = new Vector3();
  function frame(now) {
    const t = now / 1000, k = t % T;
    const sealed = k > SEAL_AT && k < OPEN_AT;

    // the plate falls in, rests, then lifts away
    const down = MathUtils.smoothstep(k, SEAL_AT - 0.6, SEAL_AT), up = MathUtils.smoothstep(k, OPEN_AT, OPEN_AT + 0.35);
    plate.position.y = TOP - 0.03 + (1 - down) * 1.6 + up * 1.6;
    plate.visible = k > SEAL_AT - 0.6 && k < OPEN_AT + 0.35;
    const red = sealed ? 0.15 : 0.75 + 0.25 * Math.sin(t * 6);
    for (const m of glowMats) m.emissiveIntensity = red * 9;

    // the glass bobs while it looks
    magnifier.forEach((m, i) => { m.position.y = magBase[i] + Math.sin(t * 1.6) * 0.04; });

    coins.forEach((lane, li) => lane.forEach((c, i) => {
      const age = (t + i * EVERY + li * 0.37) % (PER * EVERY);
      let x = START + age * SPEED, y = TOP + 0.05, tilt = 0, s = 1;
      if (li === 1 && x > HOLE.from + 0.1 && x < HOLE.to + 0.4 && !sealed) {
        // over the gap with no plate: it tips and drops through
        const fall = Math.max(0, x - (HOLE.from + 0.1));
        x = Math.min(x, HOLE.x + 0.05); y = TOP + 0.05 - fall * fall * 6; tilt = Math.min(1.2, fall * 5);
        s = MathUtils.clamp(1 + (y - TOP) * 2.2, 0, 1);
      }
      if (x > END - 0.25) s = Math.min(s, MathUtils.clamp((END - x) / 0.25, 0, 1));   // into the bank
      if (x < START + 0.2) s = Math.min(s, MathUtils.clamp((x - START) / 0.2, 0, 1));  // out of the shop
      c.position.set(x, y, LANES[li]); c.rotation.z = -tilt; c.scale.setScalar(Math.max(s, 0.0001));
    }));

    // a little life under the pointer
    px += (tx - px) * 0.06; py += (ty - py) * 0.06;
    world.rotation.y = px * 0.12 + Math.sin(t * 0.25) * 0.03;
    world.rotation.x = py * 0.04;

    renderer.render(scene, cam);
    for (const l of labels) {
      v.copy(l.at).applyMatrix4(world.matrixWorld).project(cam);
      l.el.style.left = (v.x + 1) * 50 + '%'; l.el.style.top = (1 - v.y) * 50 + '%';
    }
  }

  // run only while seen, and never in a hidden tab
  let on = false, raf = 0;
  const loop = (now) => { frame(now); raf = requestAnimationFrame(loop); };
  const play = (yes) => { if (yes && !on) { on = true; raf = requestAnimationFrame(loop); } else if (!yes && on) { on = false; cancelAnimationFrame(raf); } };
  let seen = false;
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; play(seen && !document.hidden); }).observe(stage);
  document.addEventListener('visibilitychange', () => play(seen && !document.hidden));

  frame(performance.now());
  stage.classList.add('live');            // the canvas fades in over the still; the still stays for no-WebGL
  if (poster) poster.setAttribute('aria-hidden', 'true');
}
