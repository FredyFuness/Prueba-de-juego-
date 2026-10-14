import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = path => readFileSync(join(root, path), 'utf8');
const html = read('index.html');
const js = read('src/game.js');
const css = read('styles.css');
const manifest = JSON.parse(read('manifest.webmanifest'));
const sw = read('sw.js');

const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
const references = [...js.matchAll(/\$\('([^']+)'\)/g)].map(match => match[1]);
for (const id of references) {
  assert(ids.has(id), 'JavaScript hace referencia a un elemento HTML faltante: ' + id);
}
for (const action of ['attack', 'jump', 'glide', 'grapple']) {
  assert(html.includes('data-action="' + action + '"'), 'Falta botón táctil: ' + action);
  assert(js.includes("action==='" + action + "'"), 'Falta controlador táctil: ' + action);
}
for (const path of ['src/game.js', 'styles.css', 'manifest.webmanifest', 'assets/icon.svg', 'sw.js']) {
  assert(existsSync(join(root, path)), 'Falta archivo: ' + path);
}
assert(html.includes('<meta name="viewport"'), 'Falta viewport móvil');
assert(html.includes('name="theme-color"'), 'Falta color de interfaz móvil');
assert(html.includes('type="importmap"'), 'Falta import map de Three.js');
assert(css.includes('@media(pointer:coarse)'), 'Faltan estilos de controles táctiles');
assert(css.includes('touch-action:none'), 'Falta protección de gestos para controles');
assert(js.includes('Math.min(devicePixelRatio || 1, MOBILE ? 1.5 : 2)'), 'Falta límite de resolución móvil');
assert(sw.includes('THREE_CDN'), 'Falta estrategia de caché para motor 3D');
assert(manifest.display === 'standalone', 'La PWA no está configurada como app');
assert(manifest.start_url === './', 'La PWA no usa ruta relativa de GitHub Pages');
assert(/src="\.\/src\/game\.js"/.test(html), 'No se carga el módulo del juego');
assert(existsSync(join(root, 'src/premium-graphics.js')), 'Falta motor gráfico premium');
assert(existsSync(join(root, 'assets/premium-ui.css')), 'Falta hoja de estilos cinematográficos');
const premium = read('src/premium-graphics.js');
assert(html.includes('assets/premium-ui.css'), 'La interfaz no carga los estilos premium');
assert(js.includes("from './premium-graphics.js'"), 'El motor no importa el módulo premium');
assert(js.includes('installPremiumGraphics({scene,camera,renderer,buildings,player,mobile:MOBILE})'), 'El motor premium no se inicializa');
assert(js.includes('premiumGraphics.update('), 'La escena cinematográfica no se anima');
assert(html.includes('EDICIÓN CINEMATOGRÁFICA · 4.0'), 'Falta identificación de edición 4.0');
for (const mode of ['eco', 'balanced', 'cinematic']) {
  assert(html.includes('data-quality="' + mode + '"'), 'Falta control gráfico: '+mode);
}
assert(premium.includes('createAtmosphere('), 'Falta cielo nocturno procedimental');
assert(premium.includes('makeWetStreets('), 'Faltan materiales de asfalto mojado');
assert(premium.includes('neonDistrict('), 'Falta iluminación urbana');
assert(premium.includes('createVehicles('), 'Faltan vehículos urbanos');
assert(premium.includes('addHeroArmor('), 'Falta armadura detallada');
assert(sw.includes('premium-graphics.js'), 'La caché no incluye el motor premium');
assert(sw.includes('hero.js'), 'La caché no incluye el personaje 3D original');
assert(existsSync(join(root,'src/hero.js')), 'Falta el personaje 3D premium');
assert(js.includes("from './hero.js'"), 'Falta carga del personaje 3D premium');
assert(js.includes('heroRig.animate('), 'Faltan animaciones del personaje');
assert(js.includes('function doDodge()'), 'Falta sistema de esquiva');
assert(html.includes('data-action="dodge"'), 'Falta botón móvil para esquivar');
assert(js.includes('new THREE.LineSegments'), 'Faltan partículas de lluvia realistas');
assert(js.includes('function updateCamera(dt)'), 'Falta cámara cinematográfica');
assert(sw.includes('premium-ui.css'), 'La caché no incluye los estilos premium');
for(const path of ['src/actors.js','src/city-v4.js','assets/models/cesium-man.glb','assets/models/README.md']){
  assert(existsSync(join(root,path)), 'Falta recurso de la reconstrucción: '+path);
}
const model=readFileSync(join(root,'assets/models/cesium-man.glb'));
assert(model.byteLength>300000, 'El modelo 3D real está incompleto');
assert(model.subarray(0,4).toString('ascii')==='glTF','El modelo 3D no es un glTF binario válido');
assert(html.includes('three/addons/'), 'No está configurado GLTFLoader en el import map');
assert(js.includes("from './actors.js'"), 'No se usa el modelo humanoide real');
assert(js.includes('actorSystem.start()'), 'No se inicializa el modelo humanoide');
assert(premium.includes("from './city-v4.js'"), 'No se cargan fachadas detalladas');
assert(sw.includes('cesium-man.glb'), 'La PWA no cachea el modelo 3D local');
assert(sw.includes('city-v4.js'), 'La PWA no cachea el nuevo entorno');
assert(sw.includes('actors.js'), 'La PWA no cachea los actores animados');
assert(existsSync(join(root,'src/vehicles.js')), 'Falta carrocería curvada de vehículos');
const vehicles=read('src/vehicles.js');
assert(vehicles.includes('ExtrudeGeometry'), 'Los vehículos siguen siendo cajas sin carrocería curva');
assert(premium.includes("from './vehicles.js'"), 'La escena aún no integra vehículos detallados');
assert(!premium.includes('function createVehicles(scene,glow)'), 'Quedan vehículos geométricos antiguos');
assert(sw.includes('vehicles.js'), 'La caché móvil no incluye vehículos');
assert(html.includes('id="mission-toggle"'), 'Falta botón de misión compacta');
assert(html.includes('id="quick-progress"'), 'Falta marcador de misión compacto');
assert(js.includes("mission-panel').classList.toggle('expanded')"), 'Los objetivos no se pueden expandir');
assert(html.includes('id="start-button"'), 'No hay forma de iniciar una partida');
console.log('✓ Smoke test: DOM, controles móviles, recursos, PWA y motor 3D OK');
