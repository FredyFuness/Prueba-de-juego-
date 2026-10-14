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
assert(html.includes('id="start-button"'), 'No hay forma de iniciar una partida');
console.log('✓ Smoke test: DOM, controles móviles, recursos, PWA y motor 3D OK');
