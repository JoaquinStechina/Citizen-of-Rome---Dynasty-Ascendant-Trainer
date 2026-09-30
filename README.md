# CoRDA - Trainer

Trainer para **Citizen of Rome - Dynasty Ascendant** (Steam). Añade un panel flotante dentro del juego para editar la partida en tiempo real.

El juego es una app de Electron (JavaScript/Vue), así que el trainer no toca la memoria del proceso. Se conecta por el puerto de depuración de Chrome y modifica directamente el estado del juego, usando sus propias funciones internas cuando existen: para rasgos, nivel de trabajo y multiplicadores.

## Requisitos

- **Node.js 22 o superior.** Usa `fetch` y `WebSocket` nativos, sin dependencias ni `npm install`.
- El juego lanzado con el puerto de depuración remota.

## Uso

1. En Steam: clic derecho en el juego → **Propiedades** → **Opciones de lanzamiento**:
   ```
   --remote-debugging-port=9222
   ```
2. Abre el juego y carga tu partida.
3. Ejecuta el trainer y deja la ventana abierta:
   ```
   node trainer.mjs
   ```
4. Dentro del juego, **F8** muestra u oculta el panel.

Si el juego recarga la página, el trainer vuelve a inyectar el panel automáticamente. Para usar otro puerto, define la variable de entorno `CDP_PORT` (en PowerShell: `$env:CDP_PORT=9333; node trainer.mjs`).

| Opción | Qué hace |
|---|---|
| `node trainer.mjs --dev` | Modo desarrollo: reinyecta el panel cada vez que guardas un archivo de `src/` o `locales/` |
| `node trainer.mjs --check` | Comprueba `src/` y `locales/` (sintaxis, JSON, claves de idioma) sin abrir el juego |

> Mientras la opción de lanzamiento esté puesta, cualquier programa de tu PC puede controlar el juego por ese puerto (solo en local). Quítala cuando no uses el trainer.

## Qué se puede editar

| Sección | Contenido |
|---|---|
| **Recursos** | Dinero, influencia y prestigio de la dinastía |
| **Familia** | Edad, las 4 habilidades, nivel de trabajo y rasgos de cada miembro de la casa |
| **Mascotas** | Edad, aptitud, vigor, docilidad y rasgos de cada mascota |
| **Propiedades de la casa** | Las 22 propiedades, con su límite administrable |
| **Multiplicadores** | Factor propio del trainer para salud, ingresos, fertilidad, gastos, trabajos, propiedades, etc. |

Todos los valores se pueden escribir a mano (Enter aplica, Esc cancela) o cambiar con botones rápidos.

## Panel

- **Idiomas:** español (Argentina), portugués (Brasil), inglés, ruso, francés y alemán. Se cambian con las banderas de la cabecera. Los nombres de rasgos, trabajos y propiedades vienen del juego, que solo los trae en inglés.
- **Mover:** se arrastra desde el título.
- **Redimensionar:** desde cualquier borde o esquina.
- **Secciones:** se pliegan con un clic en su nombre y se reordenan arrastrando la cabecera o con ▲▼. Si el panel es ancho, las secciones se reparten en columnas.
- **↺** restablece posición, tamaño y orden.

Idioma, posición, tamaño, orden y secciones plegadas se recuerdan entre sesiones.

## Estructura del código

```
trainer.mjs            Node: conexión con el juego, empaquetado de src/, --dev y --check
src/
├─ main.js             punto de entrada dentro del juego (construye el panel, F8)
├─ game.js             ÚNICO archivo con los identificadores internos del juego
├─ core/
│  ├─ panel.js         ventana: mover, redimensionar, cabecera, rejilla de secciones
│  ├─ ui.js            piezas reutilizables: filas, edad, editor de rasgos, desplegables
│  ├─ i18n.js          t('clave'), idioma actual
│  ├─ flags.js         banderas (SVG) y orden de los idiomas
│  ├─ selection.js     personaje y mascota elegidos (compartidos entre secciones)
│  ├─ storage.js       preferencias en localStorage
│  └─ dom.js           el(), fmt(), estilos comunes
└─ features/           una sección del panel por archivo
   ├─ index.js         lista y orden por defecto de las secciones
   └─ resources.js, family.js, pets.js, estate.js, multipliers.js
locales/               un JSON de textos por idioma (es, pt, en, ru, fr, de)
```

El código de `src/` **se ejecuta dentro del juego**, no en Node. `trainer.mjs` lo junta en un solo script con un cargador mínimo tipo CommonJS:

- cada archivo es un módulo cuyo id es su ruta sin `.js` (`src/core/ui.js` → `'core/ui'`);
- se usa con `require('core/ui')` y `module.exports`;
- los textos llegan como el módulo `'locales'`.

No hay paso de compilación: el script se arma de nuevo en cada inyección.

### Añadir una sección

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

Piezas disponibles en `ui` (ver `src/core/ui.js`): `addRow` (fila numérica con botones, nota, colores…), `ageRow`, `traitEditor`, `select`, `rosterSelect`, `button`, `note`, `subheading` y `onRefresh` (función que se ejecuta cada 500 ms). La selección de personaje o mascota está en `core/selection` (`sel.character()`, `sel.pet()`).

Si una sección lanza un error al construirse, el resto del panel sigue funcionando y esa sección muestra "No disponible".

### Añadir un idioma

1. Copia `locales/es.json` a `locales/<código>.json` y traduce los valores. No cambies las claves; `langName` es el nombre que aparece al pasar el ratón sobre la bandera.
2. Añade la bandera en `src/core/flags.js`, con el mismo código.
3. `node trainer.mjs --check` avisa si a algún idioma le faltan o le sobran claves (las que falten se muestran en español).

### Si una actualización del juego rompe algo

Los identificadores internos del juego (`'50ab'`, `'a822'`, `'fc68'`…) están **solo en `src/game.js`**, agrupados por tema (rasgos, trabajos, mascotas, propiedades, multiplicadores). Si un grupo no carga, el panel muestra "No disponible en esta versión del juego" en lo que dependa de él, y la consola del juego (F12, o las DevTools por el puerto de depuración) muestra `[trainer] <grupo> no disponible`.

## Notas

- **Logros:** el trainer no activa el modo mods del juego, que es lo que desactiva los logros de la partida.
- **Habilidades:** a partir de ~27–30 las fórmulas del juego ya dan el máximo; valores mucho mayores no aportan nada.
- **Rasgos:** se añaden y quitan con las funciones del juego, así que suman o restan sus bonus de habilidad y eliminan los rasgos opuestos.
- **Edad:** el juego la calcula a partir de la fecha de nacimiento (calendario de 13 meses); el trainer mueve el año de nacimiento. Envejecer mucho a alguien aumenta su probabilidad de morir.
- **Propiedades:** por encima de 1,2× el límite administrable, el juego puede provocar robos o enfermedades que te quitan parte. Se añaden gratis, sin descontar dinero.
- **Multiplicadores:** el factor del trainer es permanente, se guarda con la partida y se multiplica con los del juego. En "Gastos" conviene un factor menor que 1.
- **Guarda la partida** después de hacer cambios para que se conserven.
- Probado con la versión 1.6.36 del juego.
