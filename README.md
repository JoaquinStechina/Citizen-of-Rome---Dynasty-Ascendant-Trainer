# CoR:DA - Trainer

Trainer para **Citizen of Rome - Dynasty Ascendant** (Steam). Añade un panel flotante **dentro del juego** para editar tu partida en tiempo real, y te aconseja en los eventos militares. No toca la memoria del proceso: se conecta al juego por su puerto de depuración.

Probado con la versión **1.6.36** del juego.

## Funciones

| Sección | Qué puedes hacer |
|---|---|
| [Recursos](docs/guia.md#recursos) | Cambiar dinero, influencia y prestigio |
| [Familia](docs/guia.md#familia) | Edad, habilidades, nivel de trabajo y rasgos de cada miembro de la casa |
| [Rasgos acumulables](docs/guia.md#rasgos-acumulables) | Cuántas copias tiene un personaje de cada rasgo acumulable (*Strong*, *Veteran*…) |
| [Mascotas](docs/guia.md#mascotas) | Edad, aptitud, vigor, docilidad y rasgos de cada mascota |
| [Propiedades de la casa](docs/guia.md#propiedades-de-la-casa) | Las 22 propiedades, con su límite administrable |
| [Multiplicadores](docs/guia.md#multiplicadores) | Un factor propio para salud, ingresos, fertilidad, gastos, trabajos, propiedades… |
| [Logros](docs/guia.md#logros) | Marcar o quitar logros, también en Steam |
| [Eventos militares](docs/guia.md#eventos-militares) | Qué pasa con cada opción de los eventos de guerra (muerte, corona, heridas, premios), con un consejo junto a la ventana del evento y botones para **forzar el resultado** |
| [Extras](docs/guia.md#extras) | Lo que hacen los mods del juego (temas de color y modo oscuro, jugar como otro personaje, divorcio, dar en adopción, nueva dinastía, escenarios históricos, un argentarius con banco, inversiones romanas, depósito en un templo y comercio de grano según tu clase y tus atributos, gobierno de provincias para los pro-magistrados de la casa, y una casamentera a medida en la ventana "Arrange Betrothal"), desde el panel o con botones dentro del juego, **sin activar los mods**, así que los logros siguen activos |

El panel está en 6 idiomas (español, portugués, inglés, ruso, francés y alemán), se mueve, se redimensiona y sus secciones se pliegan y reordenan. **F8** lo muestra u oculta.

## Requisitos

- **Windows** con el juego instalado desde Steam.
- **[Node.js](https://nodejs.org/) 22 o superior.** No hace falta `npm install`.

## Instalación y uso

1. Descarga este repositorio (botón **Code → Download ZIP**, y descomprímelo) o clónalo con git.
2. En Steam: clic derecho en el juego → **Propiedades** → **General** → **Opciones de lanzamiento**, y escribe:
   ```
   --remote-debugging-port=9222
   ```
3. En la carpeta del trainer, abre una terminal y ejecuta:
   ```
   node trainer.mjs
   ```
   Deja la ventana abierta mientras juegas. Si el juego todavía no está abierto, el trainer lo espera.
4. Abre el juego y carga tu partida. Abrir el trainer antes que el juego es lo más seguro: así lo prepara antes de que cargue la partida (ver [problemas frecuentes](docs/guia.md#problemas-frecuentes)).
5. Dentro del juego, pulsa **F8** para mostrar u ocultar el panel.
6. **Guarda la partida** después de hacer cambios.

¿Algo no funciona? Mira los [problemas frecuentes](docs/guia.md#problemas-frecuentes).

## Antes de usarlo

- Mientras la opción de lanzamiento esté puesta, cualquier programa de tu PC puede controlar el juego. Quítala cuando no uses el trainer.
- Por defecto, los logros que consigue el trainer **se desbloquean también en Steam, y ahí no se pueden quitar**. Se puede desactivar en la sección Logros.
- Haz una copia de tus partidas antes de cambios grandes.

Más detalles en [Avisos](docs/avisos.md).

## Documentación

- [Guía del trainer](docs/guia.md): cada sección del panel en detalle y problemas frecuentes.
- [Avisos](docs/avisos.md): puerto de depuración, logros de Steam y copias de seguridad.
- [Estrategia](docs/estrategia.md): cómo jugar para tener herederos con habilidades altas y una familia rica, según el código del juego.
- [Mecánicas del juego](docs/README.md): cómo funciona el juego por dentro (educación, trabajos, mascotas, eventos militares…).
- [Desarrollo](docs/desarrollo.md): cómo está hecho el trainer y cómo añadir secciones o idiomas.
