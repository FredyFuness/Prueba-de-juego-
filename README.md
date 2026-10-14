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
- **ATAQUE:** golpear al enemigo más cercano.
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
| Atacar | J o K |
| Planear | G |
| Gancho | F |
| Pausa | P o Escape |

## 🎯 Misión

- Recupera **3 núcleos de datos** (cristales luminosos celestes).
- Neutraliza **5 hostiles** (enemigos rojos); requieren tres golpes.
- Evita perder toda la integridad.
- Completa ambos objetivos para asegurar el distrito.

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
│   └── icon.svg
├── src/
│   └── game.js
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

> Este es un **primer prototipo** de una aventura en tercera persona; no es un juego AAA completo. Próximos pasos sugeridos: modelos GLTF originales, animaciones, combos y evasiones, optimización, más misiones y guardado de progreso.

### Créditos

Proyecto creado para el repositorio **FredyFuness/Prueba-de-juego-**. Personajes, ciudad y objetos son originales y se generan mediante geometrías y materiales procedurales.
