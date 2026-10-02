# CoR:DA - Trainer

Trainer para **Citizen of Rome - Dynasty Ascendant** (Steam). Añade un panel flotante **dentro del juego** para editar tu partida en tiempo real: dinero, familia, rasgos, mascotas, propiedades, logros… Además, te aconseja en los eventos militares y puede forzar su resultado.

El juego es una app de Electron (JavaScript/Vue), así que el trainer **no toca la memoria del proceso**. Se conecta por el puerto de depuración de Chrome y cambia el estado del juego directamente. Cuando existen, usa las propias funciones internas del juego, así se aplican sus efectos igual que al jugar.

Probado con la versión **1.6.36** del juego.

## Características

| Sección | Qué puedes hacer |
|---|---|
| **Recursos** | Cambiar dinero, influencia y prestigio de la dinastía |
| **Familia** | Edad, inteligencia, administración, elocuencia, combate, nivel de trabajo y rasgos de cada miembro de la casa |
| **Rasgos acumulables** | Cuántas copias tiene un personaje de cada rasgo acumulable (*Strong*, *Veteran*, personalidades…), con el bonus que dan |
| **Mascotas** | Edad, aptitud, vigor, docilidad y rasgos de cada mascota |
| **Propiedades de la casa** | Las 22 propiedades (tierras, animales, barcos, fincas), con su límite administrable |
| **Multiplicadores** | Un factor propio para salud, ingresos, fertilidad, gastos, trabajos, propiedades… |
| **Logros** | Marcar o quitar logros, con buscador y filtro; opcionalmente también en Steam |
| **Eventos militares** | El árbol de decisiones de los 8 eventos de guerra con corona: probabilidad de morir y de ganar la corona, heridas y premios de cada opción |

**Consejo en los eventos militares.** Cuando aparece uno de estos eventos, el trainer muestra al lado de la ventana qué pasa con cada opción, con las cifras reales de tu partida, y marca la recomendada. En las opciones con azar puedes **forzar el resultado**: corona, victoria, muerte…

Todos los valores se pueden escribir a mano (Enter aplica, Esc cancela) o cambiar con botones rápidos.

### El panel

- **6 idiomas:** español (Argentina), portugués (Brasil), inglés, ruso, francés y alemán. Se cambian con las banderas de la cabecera. Los nombres de rasgos, trabajos y propiedades vienen del juego, que solo los trae en inglés.
- **Se puede mover** arrastrando el título y **redimensionar** desde cualquier borde o esquina.
- **Secciones y bloques plegables.** Las secciones se reordenan arrastrando su cabecera o con ▲▼. **⊟ / ⊞** pliegan o despliegan todo y **↺** restablece posición, tamaño y orden.
- **F8** muestra u oculta el panel.
- Idioma, posición, tamaño, orden y lo plegado se recuerdan entre sesiones.

## Requisitos

- **Windows** con el juego instalado desde Steam.
- **[Node.js](https://nodejs.org/) 22 o superior.** El trainer no tiene dependencias: no hace falta `npm install`.

## Instalación y uso

1. Descarga este repositorio (botón **Code → Download ZIP**, y descomprímelo) o clónalo con git.
2. En Steam: clic derecho en el juego → **Propiedades** → **General** → **Opciones de lanzamiento**, y escribe:
   ```
   --remote-debugging-port=9222
   ```
3. Abre el juego y carga tu partida.
4. En la carpeta del trainer, abre una terminal y ejecuta:
   ```
   node trainer.mjs
   ```
   Deja la ventana abierta mientras juegas. Si el juego recarga la página, el trainer vuelve a poner el panel solo; al cerrar el juego, el trainer termina.
5. Dentro del juego, pulsa **F8** para mostrar u ocultar el panel.
6. **Guarda la partida** después de hacer cambios para que se conserven.

Para usar otro puerto, define la variable de entorno `CDP_PORT` (en PowerShell: `$env:CDP_PORT=9333; node trainer.mjs`) y pon el mismo número en las opciones de lanzamiento.

## Avisos importantes

- **Puerto de depuración.** Mientras la opción de lanzamiento esté puesta, cualquier programa de tu PC puede controlar el juego por ese puerto; desde fuera de tu PC no. Quítala cuando no uses el trainer.
- **Logros de Steam.** Con "Desbloquear también en Steam" activado, que es lo que viene por defecto, se desbloquean en Steam:
  - los logros que marca el trainer;
  - los de los rasgos que añade (coronas, heridas, *Veteran*, *Pedigreed*…);
  - los que da un resultado forzado.

  **Los logros de Steam no se pueden quitar.** Si no lo quieres, desactiva la casilla en la sección Logros. Igual que el juego, no se envía nada en modo fácil, sandbox o con mods.
- **Haz una copia de tus partidas** antes de cambios grandes. Están en `Documentos\CitizenOfRomeDynastyAscendant\saves`. Hay cambios que no tienen vuelta atrás, como forzar la muerte de un personaje.
- El trainer **no activa el modo mods** del juego, que es lo que desactiva los logros de la partida.
- Proyecto de fans, sin relación con los desarrolladores del juego. Úsalo bajo tu responsabilidad.

## Notas de uso

- **Habilidades:** a partir de ~27–30, las fórmulas del juego ya dan el máximo; valores mucho mayores no aportan nada.
- **Rasgos:** se añaden y quitan con las funciones del juego, así que suman o restan sus bonus de habilidad y eliminan los rasgos opuestos.
- **Rasgos acumulables:** cada copia extra suma un 10% del bonus de habilidad. El juego no las aplica a salud, fertilidad ni ingresos (ver [docs](docs/mecanicas-generales.md#rasgos-acumulables)). Con 0 copias se quita el rasgo.
- **Edad:** el juego la calcula a partir de la fecha de nacimiento (año de 13 meses), así que el trainer mueve el año de nacimiento. Envejecer mucho a alguien aumenta su probabilidad de morir.
- **Propiedades:** se añaden gratis. Por encima de 1,2 veces el límite administrable, el juego puede provocar robos o enfermedades que te quitan parte.
- **Multiplicadores:** el factor del trainer es permanente, se guarda con la partida y se multiplica con los del juego. En "Gastos" conviene un factor menor que 1.
- **Logros:** "Conseguido" cambia la lista global del juego (la de su pantalla de logros); "En esta partida" se guarda con la partida. "Enviar a Steam los conseguidos" desbloquea en Steam todos los de la lista del juego ([detalles](docs/logros.md#en-el-trainer)).
- **Eventos militares:** la opción recomendada es la de menos riesgo de morir; a igual riesgo, la de más probabilidad de corona, menos heridas y más prestigio e influencia ([detalles](docs/eventos-militares.md#en-el-trainer)).

## Mecánicas del juego

La carpeta [`docs/`](docs/README.md) reúne lo descubierto en el código del juego, con la fórmula y el módulo de donde sale cada dato:

- [Mecánicas generales](docs/mecanicas-generales.md): clases, costos, calendario, habilidades, rasgos, multiplicadores.
- [Educación](docs/educacion.md): qué escuela conviene, el papel de la inteligencia, retórica judicial o deliberativa.
- [Trabajos](docs/trabajos.md): oficios mejor pagados, cargos y oficios que benefician a toda la familia.
- [Mascotas](docs/mascotas.md), [Propiedades](docs/propiedades.md) y [Logros](docs/logros.md).
- [Eventos militares](docs/eventos-militares.md): el mejor camino en cada evento de guerra.

## Para desarrolladores

| Comando | Qué hace |
|---|---|
| `node trainer.mjs` | Conecta con el juego e inyecta el panel |
| `node trainer.mjs --dev` | Además, vuelve a inyectar el panel cada vez que guardas un archivo de `src/` o `locales/` |
| `node trainer.mjs --check` | Comprueba `src/` y `locales/` (sintaxis, JSON, claves de idioma) sin abrir el juego |

### Estructura

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
└─ features/           una sección del panel por archivo
   ├─ index.js         lista y orden por defecto de las secciones
   └─ resources.js, family.js, traitStacks.js, pets.js, estate.js, multipliers.js, achievements.js, warEvents.js
locales/               un JSON de textos por idioma (es, pt, en, ru, fr, de)
docs/                  mecánicas del juego descubiertas en su código
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

Piezas disponibles en `ui` (ver `src/core/ui.js`):
- **Filas y controles:**
  - `addRow`: fila numérica con botones, nota, colores…
  - `ageRow`, `traitEditor`, `select`, `rosterSelect`, `button`.
  - `fillTraitSelect`: desplegable de rasgos agrupados.
- **Textos y bloques:**
  - `note` y `subheading`.
  - `group`: bloque plegable que se recuerda por una clave, por ejemplo `ui.group(body, t('traits'), 'ejemplo.rasgos')`.
- **Refresco:** `onRefresh` registra una función que se ejecuta cada 500 ms.

La selección de personaje o mascota está en `core/selection` (`sel.character()`, `sel.pet()`). Si una sección lanza un error al construirse, el resto del panel sigue funcionando y esa sección muestra "No disponible".

### Añadir un idioma

1. Copia `locales/es.json` a `locales/<código>.json` y traduce los valores. No cambies las claves; `langName` es el nombre que aparece al pasar el ratón sobre la bandera.
2. Añade la bandera en `src/core/flags.js`, con el mismo código.
3. `node trainer.mjs --check` avisa si a algún idioma le faltan o le sobran claves (las que falten se muestran en español).

### Si una actualización del juego rompe algo

- **Identificadores internos.** Los del juego (`'50ab'`, `'a822'`, `'fc68'`…) están **solo en `src/game.js`**, agrupados por tema. Si un grupo no carga, el panel muestra "No disponible en esta versión del juego" en lo que dependa de él. La consola del juego (F12, o las DevTools por el puerto de depuración) muestra `[trainer] <grupo> no disponible`.
- **Eventos militares.** Sus árboles, con las tiradas que fuerzan cada resultado, están copiados del código del juego en `src/war/events.js`. Si una actualización cambia un evento, hay que corregirlo ahí.
