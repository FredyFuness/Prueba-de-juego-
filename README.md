# NOCTURNE: Ciudad de Sombras 🌃

**Un prototipo jugable de aventura y acción 3D para teléfonos y computadoras.**

Un héroe original recorre una ciudad nocturna, recupera archivos tecnológicos, se enfrenta a hostiles, salta, planea y utiliza un gancho para alcanzar las azoteas. Está inspirado en el *género* de aventuras de superhéroes, pero no utiliza personajes, imágenes, música ni recursos de Batman: Arkham Knight.

## ▶️ Jugar

El juego se publica desde la rama **main**, carpeta **/ (root)**, mediante GitHub Pages en:

**https://fredyfuness.github.io/Prueba-de-juego-/**

La configuración actual es **Settings → Pages → Build and deployment → Source: Deploy from a branch → main → / (root)**. GitHub publica los cambios de `main` automáticamente. Si la página aún no carga, espera a que termine el proceso **pages build and deployment** en la pestaña Actions.

### En el teléfono 📱

- **Joystick izquierdo:** caminar por la ciudad.
- **Deslizar sobre el escenario:** girar la cámara.
- **ATAQUE:** golpear al enemigo más cercano.\n- **ESQUIVAR:** maniobra corta para evitar ataques.
- **SALTAR:** alcanzar alturas e iniciar un salto.
- **PLANEAR:** activar o desactivar el planeo mientras estás en el aire.
- **GANCHO:** subir rápidamente hasta la azotea de un edificio cercano en la dirección de la cámara.
- **Pausa (Ⅱ):** mostrar el menú.

Se recomienda Safari actualizado en iPhone o Chrome actualizado en Android. Puedes añadir la página a la pantalla de inicio desde el menú del navegador.

### En computadora 🖥️

| Acción | Controles |
|---|---|
| Moverse | W / A / S / D o flechas |
| Correr | Shift mientras caminas |
| Girar cámara | Arrastrar con mouse |
| Saltar | Espacio |
| Atacar | J o K |\n| Esquivar | L o Control |
| Planear | G |
| Gancho | F |
| Pausa | P o Escape |

## 🎯 Misión

- Recupera **3 núcleos de datos** (cristales luminosos celestes).
- Neutraliza **5 hostiles** (enemigos rojos); requieren tres golpes.
- Evita perder toda la integridad.
- Completa ambos objetivos para asegurar el distrito.

## ✨ Edición definitiva 3.0 — acción y estilo cinematográfico

Esta actualización renueva el aspecto gráfico del prototipo, manteniendo las mecánicas y controles existentes:

- **Pavimento húmedo:** textura de asfalto generada proceduralmente, charcos, trazos luminosos y materiales físicamente basados (PBR).
- **Edificios detallados:** fachadas con marcos, cornisas, estructura metálica, puertas, persianas, azoteas y elementos industriales.
- **Ciudad viva:** vehículos estacionados originales, paradas urbanas, semáforos, pasos peatonales, bolardos y mobiliario callejero.
- **Iluminación nocturna:** letreros de neón ficticios, reflejos estilizados, luces cálidas, bruma urbana, estrellas y nubes.
- **Personaje original completamente rediseñado:** mallas curvas, armadura de varias piezas, casco con visor, capa de tejido procedural con animación en tiempo real, brazos y piernas articulados.\n- **Cámara cinematográfica:** plano sobre el hombro, seguimiento suave, mayor cercanía al héroe y protección básica para evitar que atraviese edificios.\n- **Combate mejorado:** enemigos con mallas más suaves, animaciones de impacto, esquiva con breve invulnerabilidad, sacudida de cámara y efectos visuales.\n- **Lluvia visible:** trazos tridimensionales en movimiento en lugar de partículas puntuales.
- **Tres calidades en el menú de pausa:** **Fluidez**, **Equilibrado** y **Cinemático**. El teléfono inicia en Equilibrado y puede cambiar automáticamente a Fluidez ante una caída sostenida de FPS.
- **Optimización:** geometría repetida con `InstancedMesh`, límites de resolución según pantalla, texturas generadas localmente y materiales reutilizados.
- **PWA:** los archivos nuevos entran en el caché para futuras visitas desde el teléfono.

**Importante:** es una mejora visual sustancial de un juego web ligero; los reflejos en el piso son efectos aproximados, no trazado de rayos. Los modelos de personajes siguen siendo geométricos, todavía no hay mocap ni los recursos de un juego AAA. Si el teléfono se calienta, elige **Fluidez** en el menú de pausa.

## 🛠️ Tecnologías

- **JavaScript moderno** (sin compilación ni instalación de Node para jugar)
- **Three.js** mediante CDN para renderizado 3D/WebGL
- **HTML + CSS** responsive, optimizados para pantallas táctiles
- **Service Worker + Web Manifest** para instalación tipo PWA
- **GitHub Pages** para hosting estático gratuito
- **Web Audio** para efectos sonoros sintetizados

El proyecto está diseñado sin motores pesados ni descargas de grandes assets. La primera conexión necesita internet para cargar Three.js; el navegador puede almacenar los recursos del juego para posteriores visitas.

## Estructura

```text
Prueba-de-juego-/
├── .github/workflows/tests.yml\n├── tests/smoke.mjs
├── assets/
│   ├── icon.svg
│   └── premium-ui.css
├── src/
│   ├── game.js
│   └── premium-graphics.js
├── index.html
├── styles.css
├── manifest.webmanifest
├── sw.js
├── .nojekyll
└── README.md
```

## Ejecutar en Visual Studio Code

Abre el repositorio en VS Code y usa una extensión como **Live Server**, o desde la terminal:

```bash
python -m http.server 8000
```

Visita http://localhost:8000/ desde la computadora. Para probarlo en el teléfono dentro de la misma red Wi-Fi, utiliza la dirección IP local de tu computadora y un servidor que escuche en `0.0.0.0`. En iOS, algunos permisos de PWA necesitan un origen HTTPS, por eso GitHub Pages es la opción recomendada.

> NOCTURNE 2.0 sigue siendo un **prototipo independiente** de aventura en tercera persona y no un juego AAA completo. Próximos hitos: personajes GLTF originales con rig y animaciones, materiales PBR detallados, combate con combos/evasivas, más misiones, sonidos ambientales y progreso persistente.

### Créditos

Proyecto creado para el repositorio **FredyFuness/Prueba-de-juego-**. Personajes, ciudad y objetos son originales y se generan mediante geometrías y materiales procedurales.
