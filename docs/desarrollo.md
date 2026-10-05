# Desarrollo

Cómo está hecho el trainer y cómo ampliarlo.

## Cómo funciona

El juego es una app de Electron (JavaScript/Vue). El trainer no toca la memoria del proceso:

1. `trainer.mjs` (Node) se conecta al juego por el protocolo de depuración de Chrome (puerto 9222).
2. Junta el código de `src/` en un solo script y lo ejecuta dentro de la página del juego.
3. Ese script lee y cambia el estado de Vuex del juego y, cuando existen, usa las funciones internas del juego (rasgos, nivel de trabajo, multiplicadores…), así se aplican sus efectos igual que al jugar.

Si el juego recarga la página, el trainer vuelve a inyectar el panel.

## Comandos

| Comando | Qué hace |
|---|---|
| `node trainer.mjs` | Conecta con el juego e inyecta el panel |
| `node trainer.mjs --dev` | Además, vuelve a inyectar el panel cada vez que guardas un archivo de `src/` o `locales/` |
| `node trainer.mjs --check` | Comprueba `src/` y `locales/` (sintaxis, JSON, claves de idioma) sin abrir el juego |

## Estructura

```
trainer.mjs            Node: conexión con el juego, empaquetado de src/, --dev y --check
src/
├─ main.js             punto de entrada dentro del juego (construye el panel, F8)
├─ game.js             ÚNICO archivo con los identificadores internos del juego
├─ core/
│  ├─ panel.js         ventana: mover, redimensionar, cabecera, rejilla de secciones
│  ├─ ui.js            piezas reutilizables: filas, edad, editor de rasgos, desplegables
│  ├─ achievements.js  logros que consigue el trainer (en el juego y en Steam)
│  ├─ i18n.js          t('clave'), idioma actual
│  ├─ flags.js         banderas (SVG) y orden de los idiomas
│  ├─ selection.js     personaje y mascota elegidos (compartidos entre secciones)
│  ├─ storage.js       preferencias en localStorage
│  └─ dom.js           el(), fmt(), estilos comunes
├─ war/
│  ├─ events.js        árboles de decisión de los eventos militares (copiados del juego)
│  └─ analyze.js       probabilidades, efectos y opción recomendada de cada opción
├─ extras/
│  ├─ actions.js       acciones de los mods (jugar como, divorcio, adopción, dinastía, escenarios)
│  ├─ ingame.js        botones y ventanas de esas acciones dentro del juego
│  ├─ bank.js          préstamos del Banco de Roma (del mod de peritiSumus)
│  ├─ matchmaker.js    pedido a la casamentera (basada en el mod "coemptio" de peritiSumus)
│  ├─ themes.js        temas de color (del mod "theme" de Prahlad)
│  ├─ scenarios.js     datos de los escenarios (del mod oficial "Play a Scenario")
│  └─ icons.js         iconos de los botones (de los mods de ejemplo)
└─ features/           una sección del panel por archivo
   ├─ index.js         lista y orden por defecto de las secciones
   └─ resources.js, family.js, traitStacks.js, pets.js, estate.js, multipliers.js, achievements.js, warEvents.js, extras.js
locales/               un JSON de textos por idioma (es, pt, en, ru, fr, de)
docs/                  guías del trainer y mecánicas del juego
```

El código de `src/` **se ejecuta dentro del juego**, no en Node. `trainer.mjs` lo junta en un solo script con un cargador mínimo tipo CommonJS:

- cada archivo es un módulo cuyo id es su ruta sin `.js` (`src/core/ui.js` → `'core/ui'`);
- se usa con `require('core/ui')` y `module.exports`;
- los textos llegan como el módulo `'locales'`.

No hay paso de compilación: el script se arma de nuevo en cada inyección.

## Añadir una sección

1. Crea `src/features/<nombre>.js`:
   ```js
   // Ejemplo: sección con un valor editable.
   const { t } = require('core/i18n')
   const game = require('game')

   module.exports = {
     id: 'ejemplo',          // también es la clave del título en locales/*.json
     // fullWidth: true,     // opcional: ocupar todo el ancho del panel
     build({ body, ui }) {
       ui.addRow({
         label: t('cash'),
         get: () => game.S()?.current.cash,
         set: v => { game.S().current.cash = v },
         steps: [100, 1000],
       }, body)
     },
   }
   ```
2. Añádela a la lista de `src/features/index.js`.
3. Añade sus textos (al menos `"ejemplo": "Título"`) en cada `locales/*.json`.
4. Con `node trainer.mjs --dev` corriendo, verás la sección al guardar.

Piezas disponibles en `ui` (ver `src/core/ui.js`):

- **Filas y controles:**
  - `addRow`: fila numérica con botones, nota, colores…
  - `ageRow`, `traitEditor`, `select`, `rosterSelect`, `button`.
  - `fillTraitSelect`: desplegable de rasgos agrupados.
- **Textos y bloques:**
  - `note` y `subheading`.
  - `group`: bloque plegable que se recuerda por una clave, por ejemplo `ui.group(body, t('traits'), 'ejemplo.rasgos')`. Con un cuarto parámetro `true` empieza plegado.
- **Refresco:** `onRefresh` registra una función que se ejecuta cada 500 ms.

La selección de personaje o mascota está en `core/selection` (`sel.character()`, `sel.pet()`). Si una sección lanza un error al construirse, el resto del panel sigue funcionando y esa sección muestra "No disponible".

## Añadir un idioma

1. Copia `locales/es.json` a `locales/<código>.json` y traduce los valores. No cambies las claves; `langName` es el nombre que aparece al pasar el ratón sobre la bandera.
2. Añade la bandera en `src/core/flags.js`, con el mismo código.
3. `node trainer.mjs --check` avisa si a algún idioma le faltan o le sobran claves (las que falten se muestran en español).

## Si una actualización del juego rompe algo

- **Identificadores internos.** Los del juego (`'50ab'`, `'a822'`, `'fc68'`…) están **solo en `src/game.js`**, agrupados por tema. Si un grupo no carga, el panel muestra "No disponible en esta versión del juego" en lo que dependa de él. La consola del juego (F12, o las DevTools por el puerto de depuración) muestra `[trainer] <grupo> no disponible`.
- **API de mods.** La sección Extras usa `game.DA.api()`: la API `daapi` del juego `[6174]` creada con `isDAAPI: false`, como en los eventos del propio juego. Nunca hay que llamar a `setupDAAPI` ni poner `settings.enableMods`, porque marcan la partida con `flagUsedMods` y desactivan sus logros para siempre.
- **Botones en el juego.** Los botones y ventanas del juego llaman a sus métodos por nombre de evento, a través de `invokeMethod` `[bc91]` y del contexto de eventos `[baa2]`. `game.HOOK` envuelve ese contexto en la caché de webpack para que los eventos `trainer/<nombre>` lleguen a las funciones registradas con `HOOK.register`; los demás eventos no cambian. Cada botón lleva un `preCheck` del trainer, y sin el trainer cargado ese `preCheck` falla y el juego oculta el botón. Si se cambian los botones, sube `VERSION` en `extras/ingame.js` para que se rehagan.
- **Ventana "Arrange Betrothal".** El botón de la casamentera se agrega al DOM de esa vista del juego (`game.betrothalView()`) y se vuelve a poner si el juego la redibuja. Sus candidatos se crean con el generador del juego (`game.SPOUSES`) y se ponen al principio de `current.generatedPotentialSpouseCharacterIds`, que es de donde la vista saca su lista.
- **Eventos militares.** Sus árboles, con las tiradas que fuerzan cada resultado, están copiados del código del juego en `src/war/events.js`. Si una actualización cambia un evento, hay que corregirlo ahí.
- **Mecánicas.** Las notas de [docs](README.md) indican el módulo de cada fórmula, para volver a comprobarlas.
