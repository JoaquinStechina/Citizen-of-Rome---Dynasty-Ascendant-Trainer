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

## Notas

- **Logros:** el trainer no activa el modo mods del juego, que es lo que desactiva los logros de la partida.
- **Habilidades:** a partir de ~27–30 las fórmulas del juego ya dan el máximo; valores mucho mayores no aportan nada.
- **Rasgos:** se añaden y quitan con las funciones del juego, así que suman o restan sus bonus de habilidad y eliminan los rasgos opuestos.
- **Edad:** el juego la calcula a partir de la fecha de nacimiento (calendario de 13 meses); el trainer mueve el año de nacimiento. Envejecer mucho a alguien aumenta su probabilidad de morir.
- **Propiedades:** por encima de 1,2× el límite administrable, el juego puede provocar robos o enfermedades que te quitan parte. Se añaden gratis, sin descontar dinero.
- **Multiplicadores:** el factor del trainer es permanente, se guarda con la partida y se multiplica con los del juego. En "Gastos" conviene un factor menor que 1.
- **Guarda la partida** después de hacer cambios para que se conserven.
- El trainer depende de identificadores internos del juego (probado con la versión 1.6.36). Una actualización del juego puede romper alguna sección; en ese caso el panel muestra "No disponible en esta versión del juego".
