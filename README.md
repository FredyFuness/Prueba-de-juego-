# NOCTURNE 5.0 — Ciudad de Sombras

Juego **original de aventura y acción 3D**, en tercera persona, publicado para navegador de computadora y teléfono. Su atmósfera es de thriller urbano nocturno; NO se utilizan imágenes, personajes ni música de Batman: Arkham Knight.

## 🎮 Jugar ahora

**https://fredyfuness.github.io/Prueba-de-juego-/**

Publicado por GitHub Pages desde `main` (raíz del repositorio). En iPhone, abre el enlace en Safari y gira el teléfono horizontalmente. También puedes elegir «Añadir a pantalla de inicio».

## Campaña de acción 5.0

- **ACTO I – La caída del distrito:** derrota patrullas de tres clases y recupera tres archivos luminosos. Los enemigos **exploradores** persiguen rápidamente, los **pesados** resisten golpes y anuncian ataques contundentes, y los **tiradores** lanzan proyectiles a distancia.
- **ACTO II – El Centinela:** aparece un jefe volador con barra de vida, disparos, ataque radial telegrafiado y segunda fase de mayor dificultad cuando pierde la mitad de su integridad.
- **Combos de golpes:** hasta ×12 golpes encadenados y multiplicadores de puntuación por combos más largos. Los ataques especiales de una secuencia causan daño extra.
- **EMP:** habilidad cargable con los golpes, los archivos recuperados y la esquiva perfecta. Aturde y daña a enemigos cercanos, limpia proyectiles y puede afectar al jefe.
- **Esquiva perfecta:** evita ataques enemigos en su ventana de aviso para obtener energía EMP y puntuación adicional.
- **Botiquines:** aparecen después de determinados enfrentamientos y antes del jefe, recuperando 24 puntos de vida.
- **Récords locales:** guarda mejores puntuaciones, partidas disputadas y victorias en el navegador. Este registro es local a cada dispositivo.
- **Interfaz móvil:** seis botones táctiles, barra del jefe, estado EMP y multiplicador de combo.

Esta campaña es un capítulo corto de un juego indie web. No es equivalente en duración, contenido, animación ni calidad a un título AAA.

## Reconstrucción visual 4.0

| Fase | Implementación |
|---|---|
| **1. Personajes** | Modelo Soldier 3D con esqueleto, texturas y animaciones específicas Idle/Walk/Run, guardado localmente. Casco, visor y capa propios; enemigos con materiales diferenciados. Si falla, usa CesiumMan o el personaje procedural. |
| **2. Ciudad** | Atlas de texturas generado proceduralmente, fachadas con ventanas, marcos y piedra; cornisas, balcones, escaleras externas, calles comerciales, maquinaria y siluetas de tejados variadas. |
| **3. Atmósfera** | Lluvia 3D, cielo nocturno, neones, charcos estilizados, iluminación cálida, bruma, coches, vegetación y detalles urbanos. |
| **4. Jugabilidad** | Cámara sobre el hombro con suavizado y prevención básica de colisiones, ataque, esquiva, gancho, salto, planeo, vida, enemigos y tres núcleos de datos. |
| **5. Teléfono y publicación** | Joystick y cinco botones táctiles, estilos horizontal/vertical, modos Fluidez/Equilibrado/Cinemático, PWA con caché del modelo 3D, pruebas automáticas y GitHub Pages. |

### Ajustes 4.1 basados en pruebas reales de iPhone

- **Vehículos menos geométricos:** la carrocería se genera con perfiles curvos y extrusión biselada; incluye cristales laterales, faros, ruedas y espejos.
- **Misiones desplegables en móvil:** el progreso se mantiene en una pequeña barra y el panel completo se abre con «OBJETIVOS», evitando que tape el joystick.
- **Cámara más cercana en móvil:** ligeramente menos campo de visión para dar mayor protagonismo al personaje.
- **Pantalla despejada:** se retira el rótulo constante «GANCHO DISPONIBLE» cuando se juega con controles táctiles.

La fase 1 utiliza una malla humana animada REAL y un recurso GLB local, no un humanoide construido únicamente con cubos. Es un modelo de muestra rediseñado con materiales de NOCTURNE, **no un modelo cinematográfico AAA de un superhéroe**. Las fachadas son detalladas, pero la ciudad sigue siendo una demostración compacta y no un mapa abierto de gran escala. Los reflejos y efectos atmosféricos son aproximaciones aptas para móvil, no ray tracing.

### Controles en teléfono

- **Joystick izquierdo**: caminar y controlar la dirección.
- **Deslizar sobre la pantalla**: mover la cámara en tercera persona.
- **ATAQUE**: atacar para formar combos y cargar el EMP.
- **ESQUIVAR**: desplazamiento evasivo con breve protección.
- **SALTAR**: saltar o iniciar planeo desde una altura.
- **PLANEAR**: activar la capa al estar en el aire.
- **GANCHO**: desplazarse a una azotea cercana.
- **Pausa (Ⅱ)**: reanudar, reiniciar o cambiar calidad gráfica.

### Controles en computadora

| Acción | Control |
|---|---|
| Caminar | W, A, S, D o flechas |
| Correr | Shift |
| Cámara | Arrastrar mouse |
| Atacar | J o K |\n| Impulso EMP | E |
| Esquivar | L o Control izquierdo |
| Saltar | Espacio |
| Planear | G |
| Gancho | F |
| Pausa | P o Escape |

### Misión inicial y jefe\n\nRecupera **3 núcleos de datos** y derrota **5 enemigos**. Después, dirígete al norte para enfrentarte al Centinela. Esquiva su onda de choque, evita los disparos y ataca su núcleo. La campaña termina con una victoria o derrota; puedes volver a jugar y superar tu récord.

## Tecnologías

- **Three.js** con `GLTFLoader` y `SkeletonUtils`, WebGL y animación de mallas con esqueleto.
- **HTML, CSS y JavaScript ES Modules**. Sin compilación obligatoria.
- **CanvasTexture + PBR**, `InstancedMesh`, cielo procedural y efectos.
- **Service Worker / Web Manifest** para instalar como aplicación web.
- **GitHub Actions** para revisar código, probar el inicio en navegador y publicar mediante GitHub Pages.

### Ejecutarlo localmente

Desde la raíz del repositorio:

```bash
python -m http.server 8000
```

Abre `http://localhost:8000/` desde una computadora. No abras `index.html` directamente como archivo: el motor necesita un servidor HTTP para cargar módulos y modelos 3D.

### Estructura

```text
Prueba-de-juego-/
├── .github/workflows/
│   ├── tests.yml
│   └── vendor-characters.yml
├── assets/
│   ├── icon.svg
│   ├── premium-ui.css
│   └── models/
│       ├── cesium-man.glb
│       ├── soldier.glb
│       └── README.md
├── src/
│   ├── encounter.js\n│   ├── game.js
│   ├── actors.js
│   ├── hero.js
│   ├── premium-graphics.js
│   └── city-v4.js
├── tests/
│   ├── smoke.mjs
│   └── browser.cjs
├── index.html
├── styles.css
├── sw.js
└── manifest.webmanifest
```

## Licencias y atribución

**Soldier.glb**, modelo con animaciones Idle/Walk/Run usado en los ejemplos oficiales de [Three.js](https://github.com/mrdoob/three.js/blob/r164/examples/models/gltf/Soldier.glb) (colaborador Mugen87); se utiliza con los avisos y términos del proyecto fuente. El modelo secundario **CesiumMan** es © **Cesium (2017)** bajo **CC BY 4.0**, distribuido por Khronos glTF Sample Assets, y solo se usa si el primero no puede cargarse. Ambos se modifican en tiempo de ejecución; se conserva el reconocimiento a los autores. Revisa las condiciones y enlaces en [avisos del modelo](./assets/models/README.md).

Los elementos urbanos, superficies y detalles procedurales originales están implementados en este repositorio.
