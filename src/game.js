import * as THREE from 'three';
import { installPremiumGraphics } from './premium-graphics.js';

const $ = id => document.getElementById(id);
const canvas = $('game-canvas');
const ui = {
  hud: $('hud'), start: $('start-screen'), pause: $('pause-screen'), finish: $('finish-screen'),
  health: $('health-value'), healthFill: $('health-fill'), energy: $('energy-value'),
  energyFill: $('energy-fill'), score: $('score-value'), intel: $('intel-count'),
  enemies: $('enemy-count'), toast: $('toast'), hint: $('objective-hint'),
  target: $('target-label'), minimap: $('minimap')
};
const MOBILE = matchMedia('(pointer: coarse)').matches;
const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;
const lerp = THREE.MathUtils.lerp;
const state = {
  active: false, paused: false, finished: false, health: 100, score: 0,
  data: 0, defeated: 0, grappleCooldown: 0, attackCooldown: 0, damageCooldown: 0,
  glide: false, grounded: true, velocityY: 0, grapple: null, time: 0, toastTime: 0,
  camYaw: 0, camPitch: 0.36, introYaw: 0, lastMap: 0
};
const moveInput = { x: 0, z: 0 };
const keys = new Set();
let renderer, scene, camera, player, cape, leftArm, rightArm, leftLeg, rightLeg;
let premiumGraphics=null;
let qualityAuto=true, qualityTimer=0, qualityFrames=0, slowIntervals=0;
let rain, rainPositions, grappleLine, grapplePositions, playerLight;
let buildings = [], enemies = [], intelItems = [], effects = [];
let audioContext = null;
const playerPosition = new THREE.Vector3(0, 0, 0);
const nextPosition = new THREE.Vector3();
const cameraGoal = new THREE.Vector3();
const center = new THREE.Vector3();
const moving = new THREE.Vector3();
const tmp = new THREE.Object3D();
const cube = new THREE.BoxGeometry(1, 1, 1);
const ball = new THREE.SphereGeometry(1, 10, 8);
const material = (color, emissive = 0, intensity = 0) =>
  new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: intensity, roughness: 0.76, metalness: 0.22 });

function mesh(geo, mat, parent, x = 0, y = 0, z = 0) {
  const obj = new THREE.Mesh(geo, mat);
  obj.position.set(x, y, z);
  parent.add(obj);
  return obj;
}
function block(parent, color, size, pos, glow = 0, glowStrength = 0) {
  const obj = mesh(cube, material(color, glow, glowStrength), parent, ...pos);
  obj.scale.set(...size);
  return obj;
}
function rand2(a, b) {
  const val = Math.sin(a * 123.47 + b * 78.233 + 41.87) * 43758.5453;
  return val - Math.floor(val);
}
function chime(freq = 460, duration = 0.1, wave = 'sine', gain = 0.055) {
  try {
    if (!audioContext) audioContext = new (window.AudioContext || window.webkitAudioContext)();
    if (audioContext.state === 'suspended') audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const volume = audioContext.createGain();
    oscillator.type = wave;
    oscillator.frequency.setValueAtTime(freq, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(Math.max(80, freq * 0.7), audioContext.currentTime + duration);
    volume.gain.setValueAtTime(gain, audioContext.currentTime);
    volume.gain.exponentialRampToValueAtTime(0.0001, audioContext.currentTime + duration);
    oscillator.connect(volume).connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  } catch (_) { /* Audio is optional on restricted mobile browsers. */ }
}
function notify(text, seconds = 2.7) {
  ui.toast.textContent = text;
  ui.toast.classList.add('visible');
  state.toastTime = seconds;
}
function updateHUD() {
  ui.health.textContent = Math.ceil(state.health);
  ui.healthFill.style.width = state.health + '%';
  const charge = clamp((1 - state.grappleCooldown / 4.5) * 100, 0, 100);
  ui.energyFill.style.width = charge + '%';
  ui.energy.textContent = state.grappleCooldown <= 0 ? 'LISTO' : Math.ceil(state.grappleCooldown) + ' s';
  ui.score.textContent = String(state.score).padStart(4, '0');
  ui.intel.textContent = state.data + ' / 3';
  ui.enemies.textContent = state.defeated + ' / 5';
}
function setupScene() {
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#07111e');
  scene.fog = new THREE.FogExp2(0x07111e, MOBILE ? 0.015 : 0.011);
  camera = new THREE.PerspectiveCamera(62, innerWidth / innerHeight, 0.1, 160);
  renderer = new THREE.WebGLRenderer({ canvas, antialias: !MOBILE, alpha: false, powerPreference: 'high-performance' });
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2));
  renderer.setSize(innerWidth, innerHeight, false);
  renderer.shadowMap.enabled = !MOBILE;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.35;
  scene.add(new THREE.HemisphereLight(0x6687bc, 0x08101a, 2.15));
  const moon = new THREE.DirectionalLight(0xa5cfff, 2.5);
  moon.position.set(-30, 75, -48);
  moon.castShadow = !MOBILE;
  moon.shadow.mapSize.set(1024, 1024);
  Object.assign(moon.shadow.camera, { left: -65, right: 65, top: 65, bottom: -65, near: 1, far: 170 });
  moon.shadow.camera.updateProjectionMatrix();
  scene.add(moon);
  const moonDisc = mesh(new THREE.SphereGeometry(5, 20, 14),
    new THREE.MeshBasicMaterial({ color: 0xadd9f7 }), scene, -73, 72, -91);
  moonDisc.material.fog = false;
  createCity();
  createPlayer();
  createEnemies();
  createIntel();
  createRain();
  createGrapple();
  premiumGraphics=installPremiumGraphics({scene,camera,renderer,buildings,player,mobile:MOBILE});
  window.addEventListener('resize', resize);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden && state.active && !state.paused && !state.finished) pauseGame();
  });
  updateHUD();
}
function createCity() {
  const ground = mesh(new THREE.PlaneGeometry(180, 180),
    material(0x101d2b), scene);
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = !MOBILE;
  const streetMat = material(0x111b27);
  const sidewalkMat = material(0x344557);
  const stripeMat = new THREE.MeshBasicMaterial({ color: 0x617381 });
  for (const avenue of ['x', 'z']) {
    const mainRoad = mesh(cube, streetMat, scene, 0, 0.017, 0);
    mainRoad.scale.set(avenue === 'x' ? 12 : 166, .02, avenue === 'z' ? 12 : 166);
  }
  for (let i = -70; i <= 70; i += 20) {
    const roadX = mesh(cube, streetMat, scene, i, 0.012, 0);
    roadX.scale.set(6.5, 0.015, 166);
    const roadZ = mesh(cube, streetMat, scene, 0, 0.014, i);
    roadZ.scale.set(166, 0.015, 6.5);
  }
  for (let i = -72; i <= 72; i += 8) {
    for (let line = -60; line <= 60; line += 20) {
      const mark = mesh(cube, stripeMat, scene, line, 0.038, i);
      mark.scale.set(0.14, 0.012, 2.5);
      const mark2 = mesh(cube, stripeMat, scene, i, 0.04, line);
      mark2.scale.set(2.5, 0.012, 0.14);
    }
  }
  const windowEntries = [];
  const cityPalette = [0x152b3b, 0x1d3345, 0x202e3f, 0x172b39, 0x253b4a];
  const coords = [-60, -40, -20, 20, 40, 60];
  for (const x of coords) {
    for (const z of coords) {
      const seed = rand2(x, z);
      const width = 12 + seed * 3.4;
      const depth = 12 + rand2(z + 8, x + 2) * 3.3;
      const height = 11 + Math.floor(rand2(x * 2, z + 17) * 8) * 3.2;
      const b = { x, z, width, depth, height };
      buildings.push(b);
      const base = mesh(cube, material(cityPalette[Math.floor(seed * cityPalette.length)]), scene,
        x, height / 2, z);
      base.scale.set(width, height, depth);
      base.castShadow = !MOBILE;
      base.receiveShadow = !MOBILE;
      const ledge = mesh(cube, sidewalkMat, scene, x, height + 0.15, z);
      ledge.scale.set(width + 0.65, 0.35, depth + 0.65);
      const roof = mesh(cube, material(0x122a38), scene, x, height + 0.36, z);
      roof.scale.set(width - 1.7, 0.08, depth - 1.7);
      const ac = mesh(cube, material(0x395365), scene, x + width * 0.2, height + 0.95, z);
      ac.scale.set(2.8, 1.1, 2.2);
      // A fixed instanced window batch keeps draw calls low even on mobile GPUs.
      for (let floor = 2.4; floor < height - 1.4; floor += 3.1) {
        for (let index = -1; index <= 1; index++) {
          const wx = x + index * width * .245;
          const wz = z + index * depth * .245;
          const lit = rand2(index * 19 + floor, x + z) > 0.39;
          windowEntries.push([wx, floor, z + depth / 2 + .025, 0, lit]);
          windowEntries.push([wx, floor, z - depth / 2 - .025, Math.PI, rand2(floor, index + x) > 0.48]);
          windowEntries.push([x + width / 2 + .025, floor, wz, Math.PI / 2, rand2(index + z, floor) > 0.46]);
          windowEntries.push([x - width / 2 - .025, floor, wz, -Math.PI / 2, lit]);
        }
      }
    }
  }
  const lit = windowEntries.filter(e => e[4]);
  const dim = windowEntries.filter(e => !e[4]);
  function windowBatch(entries, color, emissive) {
    const glass = new THREE.MeshStandardMaterial({
      color, emissive, emissiveIntensity: 1.6, side: THREE.DoubleSide, roughness: 0.32
    });
    const batch = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.85, 1.27), glass, entries.length);
    entries.forEach((w, i) => {
      tmp.position.set(w[0], w[1], w[2]);
      tmp.rotation.set(0, w[3], 0);
      tmp.scale.set(1, 1, 1);
      tmp.updateMatrix();
      batch.setMatrixAt(i, tmp.matrix);
    });
    batch.instanceMatrix.needsUpdate = true;
    scene.add(batch);
  }
  windowBatch(lit, 0x86cee2, 0x39738d);
  windowBatch(dim, 0x172d40, 0x0d1720);
  for (let i = -60; i <= 60; i += 20) {
    for (const sign of [-1, 1]) {
      const z = sign * 9.5;
      createLamp(i + 7, z);
      createLamp(z, i + 6, true);
    }
  }
  for (const point of [{x: 0, z: -60}, {x: 0, z: 60}, {x: 60, z: 0}, {x: -60, z: 0}]) {
    const post = mesh(cube, material(0x284653), scene, point.x, 4.1, point.z);
    post.scale.set(0.25, 8.2, 0.25);
    const light = mesh(new THREE.OctahedronGeometry(0.73),
      new THREE.MeshBasicMaterial({color: 0x29e5ff}), scene, point.x, 8.4, point.z);
    light.rotation.y = .5;
  }
  const outerRoad = mesh(new THREE.TorusGeometry(79, .11, 4, 72), 
    new THREE.MeshBasicMaterial({ color: 0x1a81a8, transparent: true, opacity: .43 }), scene, 0, .09, 0);
  outerRoad.rotation.x = Math.PI / 2;
}
function createLamp(x, z, rotate = false) {
  const pole = mesh(cube, material(0x496579), scene, x, 2.5, z);
  pole.scale.set(.13, 5, .13);
  const arm = mesh(cube, material(0x45677a), scene, x + (rotate ? 0 : .8), 4.96, z + (rotate ? .8 : 0));
  arm.scale.set(rotate ? .13 : 1.65, .13, rotate ? 1.65 : .13);
  const lamp = mesh(ball, new THREE.MeshBasicMaterial({ color: 0xffd6a1 }), scene,
    x + (rotate ? 0 : 1.52), 4.84, z + (rotate ? 1.52 : 0));
  lamp.scale.set(.23, .15, .23);
}
function createPlayer() {
  player = new THREE.Group();
  player.position.copy(playerPosition);
  scene.add(player);
  const armor = material(0x172b3b, 0x071321, .25);
  const detail = material(0x355065);
  const bright = new THREE.MeshBasicMaterial({ color: 0x75edff });
  const suit = mesh(new THREE.CylinderGeometry(.55, .46, 1.12, 7), armor, player, 0, 1.45, 0);
  suit.rotation.y = Math.PI / 7;
  block(player, 0x273f50, [1.14, .2, .55], [0, 1.86, 0]);
  block(player, 0x25475b, [.45, .16, .07], [0, 1.78, -.49], 0x126d90, .6);
  block(player, 0x5be4fc, [.21, .055, .045], [0, 1.78, -.532], 0x3bd3ff, 1.4);
  const belt = block(player, 0x708b96, [1.12, .17, .8], [0, .94, 0]);
  const helmet = mesh(new THREE.SphereGeometry(.38, 9, 8), armor, player, 0, 2.33, 0);
  helmet.scale.set(1, 1.13, .98);
  block(player, 0x172b3b, [.15, .31, .16], [-.23, 2.65, 0]);
  block(player, 0x172b3b, [.15, .31, .16], [.23, 2.65, 0]);
  block(player, 0x96f4ff, [.19, .065, .025], [-.155, 2.37, -.354], 0x45c9f0, 1.5);
  block(player, 0x96f4ff, [.19, .065, .025], [.155, 2.37, -.354], 0x45c9f0, 1.5);
  leftArm = new THREE.Group(); rightArm = new THREE.Group();
  leftArm.position.set(-.65, 1.85, 0); rightArm.position.set(.65, 1.85, 0);
  player.add(leftArm, rightArm);
  block(leftArm, 0x1f3748, [.35, 1.04, .42], [0, -.52, 0]);
  block(rightArm, 0x1f3748, [.35, 1.04, .42], [0, -.52, 0]);
  block(leftArm, 0x61798b, [.43, .32, .46], [0, -.72, 0]);
  block(rightArm, 0x61798b, [.43, .32, .46], [0, -.72, 0]);
  leftLeg = new THREE.Group(); rightLeg = new THREE.Group();
  leftLeg.position.set(-.28, .91, 0); rightLeg.position.set(.28, .91, 0);
  player.add(leftLeg, rightLeg);
  block(leftLeg, 0x182c3c, [.42, .9, .48], [0, -.43, 0]);
  block(rightLeg, 0x182c3c, [.42, .9, .48], [0, -.43, 0]);
  block(leftLeg, 0x3b5264, [.46, .25, .63], [0, -.82, -.09]);
  block(rightLeg, 0x3b5264, [.46, .25, .63], [0, -.82, -.09]);
  const capeGeo = new THREE.BufferGeometry();
  capeGeo.setAttribute('position', new THREE.Float32BufferAttribute([
    -.52, 1.95, .24, -.96, .06, .62, -.35, .25, .69,
    -.52, 1.95, .24, -.35, .25, .69, 0, .03, .95,
    -.52, 1.95, .24, 0, .03, .95, .52, 1.95, .24,
    .52, 1.95, .24, 0, .03, .95, .35, .25, .69,
    .52, 1.95, .24, .35, .25, .69, .96, .06, .62
  ], 3));
  capeGeo.computeVertexNormals();
  const capeBaseX = Array.from(capeGeo.attributes.position.array).filter((_, i) => i % 3 === 0);
  capeGeo.userData.baseX = capeBaseX;
  cape = mesh(capeGeo, new THREE.MeshStandardMaterial({
    color: 0x0b1b2c, side: THREE.DoubleSide, roughness: .86, metalness: .1
  }), player);
  playerLight = new THREE.PointLight(0x1acaff, 1.2, 7);
  playerLight.position.set(0, 2.1, -1);
  player.add(playerLight);
}
function createEnemy(x, z, index) {
  const root = new THREE.Group();
  root.position.set(x, 0, z);
  scene.add(root);
  const dark = material(0x44313b, 0x1c080b, .15);
  block(root, 0x34252e, [.85, 1.2, .61], [0, 1.1, 0]);
  block(root, 0x65434d, [.95, .3, .7], [0, 1.53, 0]);
  block(root, 0x39252d, [.62, .55, .59], [0, 1.96, 0]);
  block(root, 0xff625b, [.55, .13, .08], [0, 1.99, -.33], 0xff4433, 1.5);
  block(root, 0x41313b, [.26, .85, .28], [-.53, 1.05, 0]);
  block(root, 0x41313b, [.26, .85, .28], [.53, 1.05, 0]);
  block(root, 0x28232b, [.3, .65, .35], [-.23, .36, 0]);
  block(root, 0x28232b, [.3, .65, .35], [.23, .36, 0]);
  const ring = mesh(new THREE.TorusGeometry(1.15, .035, 4, 28),
    new THREE.MeshBasicMaterial({ color: 0xff5c69, transparent: true, opacity: .7 }), scene, x, .1, z);
  ring.rotation.x = Math.PI / 2;
  const entity = { root, ring, x, z, hp: 3, alive: true, cd: index * .22, hit: 0, phase: index * 2.1 };
  enemies.push(entity);
}
function createEnemies() {
  [[0,-18], [0,-51], [28,0], [-30,0], [0,48]].forEach((pos,i) => createEnemy(pos[0],pos[1],i));
}
function createIntel() {
  [[0,-35], [38,0], [-42,0]].forEach(([x,z],i) => {
    const root = new THREE.Group();
    root.position.set(x, 1.48, z);
    scene.add(root);
    const crystal = mesh(new THREE.OctahedronGeometry(.79, 0),
      new THREE.MeshStandardMaterial({ color: 0x9ceaff, emissive: 0x11bfff, emissiveIntensity: 2, metalness: .4, roughness: .2 }), root);
    const halo = mesh(new THREE.TorusGeometry(1.25, .055, 5, 32),
      new THREE.MeshBasicMaterial({ color: 0x65e1ff }), root);
    halo.rotation.x = Math.PI / 2;
    const beacon = mesh(new THREE.CylinderGeometry(.025, .025, 5, 6),
      new THREE.MeshBasicMaterial({ color: 0x31cafa, transparent: true, opacity: .28 }), root, 0, 3, 0);
    intelItems.push({ root, crystal, halo, x, z, taken: false, phase: i * 1.8 });
  });
}
function createRain() {
  const count = MOBILE ? 250 : 550;
  rainPositions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    rainPositions[i*3] = (Math.random() - .5) * 54;
    rainPositions[i*3+1] = Math.random() * 36 + 2;
    rainPositions[i*3+2] = (Math.random() - .5) * 54;
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(rainPositions, 3));
  rain = new THREE.Points(geo,
    new THREE.PointsMaterial({ color: 0x7ab5dc, size: .065, transparent: true, opacity: .47, depthWrite: false }));
  scene.add(rain);
}
function createGrapple() {
  grapplePositions = new Float32Array(6);
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(grapplePositions, 3));
  grappleLine = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0x8bebff }));
  grappleLine.visible = false;
  scene.add(grappleLine);
}
function isBlocked(x, z, y) {
  if (Math.abs(x) > 76 || Math.abs(z) > 76) return true;
  for (const b of buildings) {
    if (y < b.height - .05 &&
      Math.abs(x-b.x) < b.width/2 + .54 &&
      Math.abs(z-b.z) < b.depth/2 + .54) return true;
  }
  return false;
}
function floorAt(x, z, previousY, newY) {
  let floor = 0;
  for (const b of buildings) {
    if (Math.abs(x-b.x) < b.width/2 + .20 &&
        Math.abs(z-b.z) < b.depth/2 + .20 &&
        previousY >= b.height - .4 && newY <= b.height + .36) {
      floor = Math.max(floor, b.height + .36);
    }
  }
  return floor;
}
function targetBuilding() {
  const forwardX = -Math.sin(state.camYaw);
  const forwardZ = -Math.cos(state.camYaw);
  let result = null;
  let best = Infinity;
  for (const b of buildings) {
    const dx = b.x - playerPosition.x;
    const dz = b.z - playerPosition.z;
    const distance = Math.hypot(dx, dz);
    const dot = (dx * forwardX + dz * forwardZ) / Math.max(1, distance);
    const rise = b.height - playerPosition.y;
    if (distance < 46 && distance > 7 && rise > 1 && dot > -.23) {
      const score = distance * .7 + (1-dot) * 13 - rise * .05;
      if (score < best) { best = score; result = b; }
    }
  }
  return result;
}
function doJump() {
  if (!state.active || state.paused || state.finished || state.grapple) return;
  if (state.grounded) {
    state.velocityY = 12.5;
    state.grounded = false;
    state.glide = false;
    chime(205, .16, 'triangle', .06);
  }
}
function doGlide() {
  if (!state.active || state.paused || state.finished) return;
  if (state.grounded) {
    notify('SALTA PRIMERO PARA PLANEAR');
    return;
  }
  state.glide = !state.glide;
  if (state.glide) {
    state.grapple = null;
    grappleLine.visible = false;
    notify('MODO PLANEO ACTIVADO');
    chime(610, .15);
  }
}
function doGrapple() {
  if (!state.active || state.paused || state.finished) return;
  if (state.grappleCooldown > 0 || state.grapple) {
    notify('GANCHO RECARGANDO');
    return;
  }
  const b = targetBuilding();
  if (!b) {
    notify('MIRA HACIA UN EDIFICIO CERCANO');
    return;
  }
  state.grapple = { target: new THREE.Vector3(b.x, b.height + 1.8, b.z), start: playerPosition.clone(), progress: 0 };
  state.grappleCooldown = 4.5;
  state.velocityY = 0;
  state.glide = false;
  state.grounded = false;
  grappleLine.visible = true;
  chime(780, .23, 'sawtooth', .04);
  notify('GANCHO CONECTADO', 1);
}
function emitParticles(x, y, z, color = 0x77e8ff, count = 12) {
  const dots = [];
  const mat = new THREE.MeshBasicMaterial({ color });
  for (let i = 0; i < count; i++) {
    const obj = mesh(ball, mat, scene, x, y, z);
    obj.scale.setScalar(.06 + Math.random() * .075);
    dots.push({
      obj, velocity: new THREE.Vector3((Math.random()-.5)*8, 2+Math.random()*5, (Math.random()-.5)*8),
      life: .5 + Math.random()*.25
    });
  }
  effects.push(...dots);
}
function doAttack() {
  if (!state.active || state.paused || state.finished || state.attackCooldown > 0) return;
  state.attackCooldown = .44;
  rightArm.rotation.x = -1.4;
  chime(115, .12, 'triangle', .09);
  const candidates = enemies.filter(e => e.alive && playerPosition.distanceTo(e.root.position) < 4.1
    && Math.abs(playerPosition.y - e.root.position.y) < 3.0);
  candidates.sort((a,b) => playerPosition.distanceTo(a.root.position) - playerPosition.distanceTo(b.root.position));
  const target = candidates[0];
  if (!target) return;
  target.hp -= 1;
  target.hit = .2;
  target.root.position.x += (target.x - playerPosition.x) * .05;
  target.root.position.z += (target.z - playerPosition.z) * .05;
  emitParticles(target.root.position.x, 1.4, target.root.position.z, 0xff9b62, 9);
  state.score += 35;
  chime(180, .1, 'square', .035);
  if (target.hp <= 0) {
    target.alive = false;
    scene.remove(target.root, target.ring);
    state.defeated++;
    state.score += 200;
    notify('HOSTIL NEUTRALIZADO  +200');
    chime(480, .27, 'triangle');
    checkFinished();
  }
  updateHUD();
}
function hurt(amount) {
  if (state.damageCooldown > 0 || state.finished) return;
  state.health = Math.max(0, state.health - amount);
  state.damageCooldown = 1.4;
  notify('¡ATAQUE RECIBIDO!  -' + amount + ' INTEGRIDAD', 1.2);
  chime(140, .25, 'sawtooth', .07);
  updateHUD();
  if (state.health <= 0) endGame(false);
}
function checkFinished() {
  if (state.data >= 3 && state.defeated >= 5) endGame(true);
}
function endGame(won) {
  state.finished = true;
  state.active = false;
  state.grapple = null;
  grappleLine.visible = false;
  $('result-tag').textContent = won ? 'MISIÓN COMPLETADA' : 'MISIÓN FALLIDA';
  $('result-title').textContent = won ? 'Distrito recuperado.' : 'La ciudad te necesita.';
  $('result-description').textContent = won
    ? 'Recuperaste los archivos y detuviste a los hostiles. Esta noche, Ciudad de Sombras está a salvo.'
    : 'La patrulla ha terminado. Reagrúpate y vuelve a intentarlo.';
  $('final-score').textContent = String(state.score).padStart(4, '0');
  $('final-enemies').textContent = state.defeated + ' / 5';
  ui.finish.classList.remove('hidden');
  ui.hud.classList.add('hidden');
  chime(won ? 880 : 180, .45, 'triangle', .09);
}
function resetGame() {
  playerPosition.set(0, 0, 0);
  state.health=100; state.score=0; state.data=0; state.defeated=0;
  state.grappleCooldown=0; state.attackCooldown=0; state.damageCooldown=0;
  state.glide=false; state.grounded=true; state.velocityY=0; state.grapple=null;
  state.camYaw=0; state.camPitch=.36; state.time=0; state.finished=false;
  for (const e of enemies) { scene.remove(e.root, e.ring); }
  for (const item of intelItems) scene.remove(item.root);
  for (const effect of effects) scene.remove(effect.obj);
  enemies=[]; intelItems=[]; effects=[];
  createEnemies(); createIntel();
  grappleLine.visible=false;
  player.position.copy(playerPosition);
  player.rotation.y=0;
  ui.finish.classList.add('hidden'); ui.pause.classList.add('hidden');
  ui.start.classList.add('hidden'); ui.hud.classList.remove('hidden');
  state.active=true; state.paused=false;
  updateHUD();
  notify('MISIÓN INICIADA · RECUPERA LOS 3 NÚCLEOS', 3.7);
}
function pauseGame() {
  if (!state.active || state.finished) return;
  state.paused = true;
  ui.pause.classList.remove('hidden');
  keys.clear();
  moveInput.x=0; moveInput.z=0;
}
function resumeGame() {
  if (state.finished) return;
  state.paused=false;
  ui.pause.classList.add('hidden');
}
function updatePlayer(dt) {
  const grapple = state.grapple;
  if (grapple) {
    grapple.progress += dt * .8;
    const direction = grapple.target.clone().sub(playerPosition);
    const distance = direction.length();
    if (distance < 1.1) {
      playerPosition.copy(grapple.target);
      state.grapple = null;
      state.velocityY = 0;
      grappleLine.visible = false;
    } else {
      direction.normalize();
      playerPosition.addScaledVector(direction, Math.min(distance, dt * 30));
      state.velocityY = 0;
      player.rotation.y = Math.atan2(-direction.x, -direction.z);
    }
  } else {
    const forward = (+keys.has('KeyW') || +keys.has('ArrowUp')) - (+keys.has('KeyS') || +keys.has('ArrowDown'));
    const sideways = (+keys.has('KeyD') || +keys.has('ArrowRight')) - (+keys.has('KeyA') || +keys.has('ArrowLeft'));
    const mx = clamp(sideways + moveInput.x, -1, 1);
    const mz = clamp(forward - moveInput.z, -1, 1);
    const magnitude = Math.min(1, Math.hypot(mx, mz));
    const angle = state.camYaw;
    moving.set(Math.cos(angle) * mx - Math.sin(angle) * mz, 0, -Math.sin(angle) * mx - Math.cos(angle) * mz);
    if (moving.lengthSq() > 0.001) moving.normalize();
    let speed = keys.has('ShiftLeft') || keys.has('ShiftRight') ? 10.4 : 7.5;
    if (state.glide) speed = 11.4;
    const dx = moving.x * speed * magnitude * dt;
    const dz = moving.z * speed * magnitude * dt;
    const newX = playerPosition.x + dx, newZ = playerPosition.z + dz;
    if (!isBlocked(newX, playerPosition.z, playerPosition.y)) playerPosition.x = newX;
    if (!isBlocked(playerPosition.x, newZ, playerPosition.y)) playerPosition.z = newZ;
    if (magnitude > .06) {
      const facing = Math.atan2(-moving.x, -moving.z);
      let deltaAngle = (facing - player.rotation.y + Math.PI * 3) % TAU - Math.PI;
      player.rotation.y += deltaAngle * Math.min(1, dt * 11);
    }
    const oldY = playerPosition.y;
    const gravity = state.glide && state.velocityY <= 0 ? 3.7 : 25;
    state.velocityY -= gravity * dt;
    if (state.glide && state.velocityY < -3.5) state.velocityY = -3.5;
    playerPosition.y += state.velocityY * dt;
    const floorY = floorAt(playerPosition.x, playerPosition.z, oldY, playerPosition.y);
    if (playerPosition.y <= floorY && state.velocityY <= 0) {
      playerPosition.y = floorY;
      state.velocityY = 0;
      state.grounded=true;
      state.glide=false;
    } else {
      state.grounded=false;
    }
    const stride = Math.sin(state.time * 13.7) * (magnitude > .06 && state.grounded ? .44 : .05);
    leftLeg.rotation.x = stride; rightLeg.rotation.x = -stride;
    leftArm.rotation.x = -stride * .65;
    rightArm.rotation.x = state.attackCooldown > 0 ? -1.35 * (state.attackCooldown/.44) : stride * .65;
    player.position.y = playerPosition.y + (state.grounded && magnitude > .06 ? Math.abs(stride) * .06 : 0);
  }
  player.position.x = playerPosition.x;
  player.position.z = playerPosition.z;
  if (state.grapple) player.position.y = playerPosition.y;
  const vertices = cape.geometry.attributes.position;
  for (let i = 0; i < vertices.count; i++) {
    const y = vertices.getY(i);
    if (y < 1.5) {
      const x = cape.geometry.userData.baseX[i];
      const baseZ = Math.abs(x) > .75 ? .62 : Math.abs(x) < .1 ? .95 : .69;
      vertices.setZ(i, baseZ + (state.glide ? .75 : Math.sin(state.time * 7 + x * 2) * .09));
      vertices.setX(i, state.glide ? x * 1.8 : x);
    }
  }
  vertices.needsUpdate = true;
  cape.geometry.computeVertexNormals();
  if (state.grapple) {
    const pos = grappleLine.geometry.attributes.position;
    pos.setXYZ(0, playerPosition.x, playerPosition.y + 1.9, playerPosition.z);
    pos.setXYZ(1, state.grapple.target.x, state.grapple.target.y, state.grapple.target.z);
    pos.needsUpdate = true;
    grappleLine.geometry.computeBoundingSphere();
  }
}
function updateEnemies(dt) {
  for (const e of enemies) {
    if (!e.alive) continue;
    const dx = playerPosition.x - e.root.position.x;
    const dz = playerPosition.z - e.root.position.z;
    const dist = Math.hypot(dx, dz);
    e.cd -= dt;
    e.hit = Math.max(0, e.hit-dt);
    e.ring.material.opacity = e.hit > 0 ? 1 : .4 + Math.sin(state.time * 3 + e.phase) * .15;
    e.ring.position.set(e.root.position.x, .1, e.root.position.z);
    if (dist < 22 && dist > 2.0 && playerPosition.y < 3) {
      const step = dt * (e.hit > 0 ? 0 : 2.4);
      const nx = e.root.position.x + (dx / dist) * step;
      const nz = e.root.position.z + (dz / dist) * step;
      if (!isBlocked(nx, e.root.position.z, 0)) e.root.position.x = nx;
      if (!isBlocked(e.root.position.x, nz, 0)) e.root.position.z = nz;
    }
    if (dist < 2.1 && playerPosition.y < 3.1 && e.cd <= 0) {
      e.cd = 2.1;
      hurt(12);
    }
    e.root.rotation.y = Math.atan2(-dx, -dz);
    e.root.position.y = Math.sin(state.time*2.8+e.phase)*.045;
  }
}
function updateIntel(dt) {
  for (const item of intelItems) {
    if (item.taken) continue;
    item.root.rotation.y += dt * .7;
    item.crystal.position.y = Math.sin(state.time*2.2 + item.phase) * .18;
    const d = Math.hypot(playerPosition.x-item.x, playerPosition.z-item.z);
    if (d < 2.3 && playerPosition.y < 4.5) {
      item.taken = true;
      scene.remove(item.root);
      state.data++;
      state.score += 350;
      emitParticles(item.x,1.4,item.z,0x5becff,17);
      notify('NÚCLEO RECUPERADO  +350');
      chime(660, .27, 'sine', .095);
      updateHUD();
      checkFinished();
    }
  }
}
function updateEffects(dt) {
  for (let i=effects.length-1;i>=0;i--) {
    const p=effects[i];p.life-=dt;
    p.velocity.y-=16*dt;
    p.obj.position.addScaledVector(p.velocity,dt);
    if (p.life<=0) {scene.remove(p.obj); effects.splice(i,1);}
  }
}
function updateRain(dt) {
  const a=rain.geometry.attributes.position;
  const n=a.count;
  for(let i=0;i<n;i++) {
    let y=a.getY(i)-dt*(15+(i%5)*2);
    if(y<0)y=25+Math.random()*12;
    a.setY(i,y);
  }
  a.needsUpdate=true;
  rain.position.x=playerPosition.x;
  rain.position.z=playerPosition.z;
}
function updateCamera(dt) {
  if (!state.active) {
    state.introYaw += dt*.055;
    camera.position.set(42 + Math.sin(state.introYaw)*4, 27, 48 + Math.cos(state.introYaw)*4);
    camera.lookAt(0,12,0);
    return;
  }
  const yaw=state.camYaw;
  const distance = MOBILE ? 10.2 : 10.8;
  const height=3.25 + Math.sin(state.camPitch)*distance;
  cameraGoal.set(
    playerPosition.x+Math.sin(yaw)*distance*Math.cos(state.camPitch),
    playerPosition.y+height,
    playerPosition.z+Math.cos(yaw)*distance*Math.cos(state.camPitch)
  );
  if (camera.position.distanceToSquared(cameraGoal)>1500) camera.position.copy(cameraGoal);
  camera.position.lerp(cameraGoal,Math.min(1,dt*6.4));
  center.set(playerPosition.x,playerPosition.y+1.7,playerPosition.z);
  camera.lookAt(center);
}
function drawMinimap() {
  const canvas=ui.minimap, ctx=canvas.getContext('2d');
  const size=canvas.width, mid=size/2, scale=1.52;
  ctx.clearRect(0,0,size,size);
  ctx.save();
  ctx.beginPath();ctx.arc(mid,mid,mid-3,0,TAU);ctx.clip();
  ctx.fillStyle='#071726';ctx.fillRect(0,0,size,size);
  ctx.translate(mid,mid);
  ctx.strokeStyle='#325068';ctx.lineWidth=8;
  for(let i=-80;i<=80;i+=20) {
    ctx.beginPath();ctx.moveTo((i-playerPosition.x)*scale,-150);ctx.lineTo((i-playerPosition.x)*scale,150);ctx.stroke();
    ctx.beginPath();ctx.moveTo(-150,(i-playerPosition.z)*scale);ctx.lineTo(150,(i-playerPosition.z)*scale);ctx.stroke();
  }
  ctx.fillStyle='#112d42';
  for(const b of buildings) {
    ctx.fillRect((b.x-b.width/2-playerPosition.x)*scale,(b.z-b.depth/2-playerPosition.z)*scale,b.width*scale,b.depth*scale);
  }
  for(const item of intelItems) if(!item.taken) {
    ctx.fillStyle='#78efff';ctx.shadowColor='#78efff';ctx.shadowBlur=10;
    ctx.beginPath();ctx.arc((item.x-playerPosition.x)*scale,(item.z-playerPosition.z)*scale,4,0,TAU);ctx.fill();
  }
  ctx.shadowBlur=0;
  for(const e of enemies) if(e.alive){
    ctx.fillStyle='#ff6977';
    ctx.beginPath();ctx.arc((e.root.position.x-playerPosition.x)*scale,(e.root.position.z-playerPosition.z)*scale,3.5,0,TAU);ctx.fill();
  }
  ctx.rotate(player.rotation.y);
  ctx.fillStyle='#fff';ctx.shadowColor='#7beaff';ctx.shadowBlur=8;
  ctx.beginPath();ctx.moveTo(0,-8);ctx.lineTo(-5,6);ctx.lineTo(5,6);ctx.closePath();ctx.fill();
  ctx.restore();
  ctx.strokeStyle='#75daef66';ctx.lineWidth=2;
  ctx.beginPath();ctx.arc(mid,mid,mid-3,0,TAU);ctx.stroke();
}
function updateMissionHint() {
  const objective = intelItems.filter(e=>!e.taken);
  if (objective.length) {
    objective.sort((a,b)=>Math.hypot(a.x-playerPosition.x,a.z-playerPosition.z)-Math.hypot(b.x-playerPosition.x,b.z-playerPosition.z));
    const nearest=objective[0];
    ui.hint.textContent = 'Núcleo más cercano: ' + Math.ceil(Math.hypot(nearest.x-playerPosition.x,nearest.z-playerPosition.z)) + ' m';
  } else {
    ui.hint.textContent='Elimina a los hostiles restantes para asegurar la zona.';
  }
  const near=targetBuilding();
  ui.target.classList.toggle('hidden', !(near && state.grappleCooldown<=0 && !state.grapple && state.active && !state.paused));
}
function resize() {
  if (!renderer) return;
  const w=innerWidth,h=innerHeight;
  camera.aspect=w/h;camera.updateProjectionMatrix();
  renderer.setSize(w,h,false);
}
function syncQualityButtons(){
  const active=premiumGraphics?.getQuality();
  for(const b of document.querySelectorAll('[data-quality]')){
    const selected=b.dataset.quality===active;
    b.classList.toggle('active',selected);
    b.setAttribute('aria-pressed',String(selected));
  }
}
function bindInput() {
  $('start-button').addEventListener('click', resetGame);
  $('pause-button').addEventListener('click',pauseGame);
  $('resume-button').addEventListener('click',resumeGame);
  $('restart-button').addEventListener('click',resetGame);
  $('replay-button').addEventListener('click',resetGame);
  for(const button of document.querySelectorAll('[data-quality]')){
    button.addEventListener('click',()=>{
      if(!premiumGraphics)return;
      qualityAuto=false;
      premiumGraphics.setQuality(button.dataset.quality);
      syncQualityButtons();
      notify('GRÁFICOS: '+button.textContent.trim().toUpperCase());
    });
  }
  syncQualityButtons();
  window.addEventListener('keydown',event=>{
    const movement=['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
    if(movement.includes(event.code)) event.preventDefault();
    if(event.repeat)return;
    keys.add(event.code);
    if(event.code==='Space')doJump();
    if(event.code==='KeyJ'||event.code==='KeyK')doAttack();
    if(event.code==='KeyG')doGlide();
    if(event.code==='KeyF')doGrapple();
    if(event.code==='Escape'||event.code==='KeyP')state.paused?resumeGame():pauseGame();
  });
  window.addEventListener('keyup',event=>keys.delete(event.code));
  window.addEventListener('blur',()=>{keys.clear();moveInput.x=moveInput.z=0;});
  const joystick=$('joystick'),knob=$('joystick-knob');
  let joystickPointer=null;
  function moveJoystick(event) {
    const rect=joystick.getBoundingClientRect();
    const radius=rect.width*.34;
    const cx=rect.left+rect.width/2,cy=rect.top+rect.height/2;
    const dx=event.clientX-cx,dy=event.clientY-cy;
    const length=Math.max(1,Math.hypot(dx,dy));
    const amount=Math.min(1,length/radius);
    moveInput.x=dx/length*amount;
    moveInput.z=dy/length*amount;
    knob.style.transform='translate('+moveInput.x*radius+'px,'+moveInput.z*radius+'px)';
  }
  joystick.addEventListener('pointerdown',e=>{
    e.preventDefault();e.stopPropagation();joystickPointer=e.pointerId;
    joystick.setPointerCapture(e.pointerId);moveJoystick(e);
  });
  joystick.addEventListener('pointermove',e=>{
    if(e.pointerId===joystickPointer){e.preventDefault();moveJoystick(e);}
  });
  function releaseJoystick(e) {
    if(e.pointerId!==joystickPointer)return;
    joystickPointer=null;moveInput.x=moveInput.z=0;knob.style.transform='';
  }
  joystick.addEventListener('pointerup',releaseJoystick);
  joystick.addEventListener('pointercancel',releaseJoystick);
  for(const button of document.querySelectorAll('[data-action]')){
    button.addEventListener('pointerdown',e=>{
      e.preventDefault();e.stopPropagation();
      const action=button.dataset.action;
      if(action==='jump')doJump();
      else if(action==='glide')doGlide();
      else if(action==='grapple')doGrapple();
      else if(action==='attack')doAttack();
      button.classList.add('pressed');
    });
    for(const type of ['pointerup','pointercancel','pointerleave']){
      button.addEventListener(type,()=>button.classList.remove('pressed'));
    }
  }
  let cameraDrag=null;
  canvas.addEventListener('pointerdown',e=>{
    if(!state.active||state.paused)return;
    cameraDrag={id:e.pointerId,x:e.clientX,y:e.clientY};
    canvas.setPointerCapture(e.pointerId);
  });
  canvas.addEventListener('pointermove',e=>{
    if(!cameraDrag||cameraDrag.id!==e.pointerId)return;
    const dx=e.clientX-cameraDrag.x,dy=e.clientY-cameraDrag.y;
    state.camYaw-=dx*(MOBILE?.0065:.004);
    state.camPitch=clamp(state.camPitch+dy*(MOBILE?.0048:.0035),-.07,.83);
    cameraDrag.x=e.clientX;cameraDrag.y=e.clientY;
  });
  const clearDrag=e=>{if(cameraDrag?.id===e.pointerId)cameraDrag=null;};
  canvas.addEventListener('pointerup',clearDrag);
  canvas.addEventListener('pointercancel',clearDrag);
}
function tick() {
  requestAnimationFrame(tick);
  const now=performance.now();
  let dt=Math.min(.038,(now-(tick.last||now))/1000);
  tick.last=now;
  if(state.active && !state.paused && !state.finished){
    state.time+=dt;
    state.grappleCooldown=Math.max(0,state.grappleCooldown-dt);
    state.attackCooldown=Math.max(0,state.attackCooldown-dt);
    state.damageCooldown=Math.max(0,state.damageCooldown-dt);
    updatePlayer(dt);
    updateEnemies(dt);
    updateIntel(dt);
    updateEffects(dt);
    updateRain(dt);
    if(state.toastTime>0) {
      state.toastTime-=dt;
      if(state.toastTime<=0)ui.toast.classList.remove('visible');
    }
    state.lastMap+=dt;
    if(state.lastMap>.12) {
      state.lastMap=0;
      drawMinimap();updateMissionHint();updateHUD();
    }
  } else if(!state.paused) {
    state.time+=dt*.3;
    updateRain(dt*.35);
  }
  updateCamera(dt);
  if(premiumGraphics){
    premiumGraphics.update(dt,state.time,playerPosition,state.glide);
    if(MOBILE && qualityAuto && state.active && !state.paused){
      qualityTimer+=dt;qualityFrames++;
      if(qualityTimer>=2.8){
        const fps=qualityFrames/qualityTimer;
        slowIntervals=fps<27?slowIntervals+1:0;
        if(slowIntervals>=2 && premiumGraphics.getQuality()!=='eco'){
          premiumGraphics.setQuality('eco');syncQualityButtons();
          qualityAuto=false;notify('MODO AHORRO ACTIVADO PARA MÁS FLUIDEZ',3);
        }
        qualityTimer=0;qualityFrames=0;
      }
    }
  }
  renderer.render(scene,camera);
}
try {
  setupScene();
  bindInput();
  tick();
} catch(error) {
  console.error('NOCTURNE could not initialize:',error);
  const el=$('load-error');
  if(el){el.textContent='No se pudo iniciar el motor 3D. Prueba con Chrome o Safari actualizado y comprueba tu conexión a internet.';el.classList.remove('hidden');}
}
