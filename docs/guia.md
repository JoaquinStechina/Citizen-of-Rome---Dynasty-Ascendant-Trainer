# Guía del trainer

Cómo funciona cada parte del panel y qué tener en cuenta al usarla. Para instalarlo, ver el [README](../README.md#instalación-y-uso).

## El panel

- **F8** muestra u oculta el panel.
- **Mover:** arrastra el título.
- **Redimensionar:** desde cualquier borde o esquina. Si el panel es ancho, las secciones se reparten en columnas.
- **Secciones:** se pliegan con un clic en su nombre y se reordenan arrastrando su cabecera o con ▲▼.
- **Bloques:** dentro de las secciones, los bloques (rasgos, grupos de propiedades, grupos de logros, eventos…) también se pliegan con un clic en su título.
- **⊟ / ⊞** pliegan o despliegan todo a la vez; **↺** restablece posición, tamaño y orden.
- **Idiomas:** español (Argentina), portugués (Brasil), inglés, ruso, francés y alemán, con las banderas de la cabecera. Los nombres de rasgos, trabajos y propiedades vienen del juego, que solo los trae en inglés.
- **Valores:** se pueden escribir a mano (Enter aplica, Esc cancela) o cambiar con los botones rápidos.

Idioma, posición, tamaño, orden y lo plegado se recuerdan entre sesiones. **Guarda la partida** después de hacer cambios para que se conserven.

## Recursos

Dinero, influencia y prestigio de la dinastía.

## Familia

Elige un miembro de la casa en el desplegable y cambia:

- **Edad.** El juego la calcula a partir de la fecha de nacimiento (año de 13 meses), así que el trainer mueve el año de nacimiento. Envejecer mucho a alguien aumenta su probabilidad de morir.
- **Habilidades:** inteligencia, administración, elocuencia y combate. En la mayoría de las fórmulas del juego, a partir de ~27–30 ya se llega al máximo. La excepción son los **sueldos**, que siguen subiendo con las habilidades (ver [Trabajos](trabajos.md#ingresos-de-un-trabajo-522c)).
- **Nivel de trabajo**, con un botón para ponerlo al máximo de su oficio.
- **Rasgos.** Se añaden y quitan con las funciones del juego, así que suman o restan sus bonus de habilidad y eliminan los rasgos opuestos.

## Rasgos acumulables

Algunos rasgos se pueden tener varias veces (*Strong*, *Veteran*, personalidades, heridas…). Esta sección muestra cuántas copias tiene el personaje elegido de cada uno, con + y −, y el bonus de habilidad que dan.

- Cada copia extra suma un **10%** del bonus de habilidad del rasgo.
- El juego **no** aplica las copias a salud, fertilidad ni ingresos ([detalles](mecanicas-generales.md#rasgos-acumulables)).
- Con 0 copias se quita el rasgo.

## Mascotas

Edad, aptitud, vigor, docilidad y rasgos de cada mascota de la casa. Qué hace cada habilidad: [Mascotas](mascotas.md).

## Propiedades de la casa

Las 22 propiedades (tierras, animales, barcos y fincas) con su límite administrable. El límite se marca en **amarillo** si te pasas y en **rojo** si pasas de 1,2 veces el límite.

- Se añaden **gratis**, sin descontar dinero.
- Por encima de 1,2 veces el límite, el juego puede provocar robos o enfermedades que te quitan parte ([detalles](propiedades.md#exceso-de-propiedades)).

## Multiplicadores

Un factor propio del trainer para salud, ingresos, fertilidad, gastos, administración, cada trabajo y cada propiedad, de la casa o de un personaje o mascota.

- El factor es **permanente**, se guarda con la partida y se multiplica con los del juego.
- En "Gastos" conviene un factor **menor que 1** (0,5 = mitad de gastos).
- "Activos ahora" muestra todos los multiplicadores en vigor, del juego y del trainer.

## Logros

Marca o quita logros, agrupados como en el juego, con buscador, filtro (todos, conseguidos, pendientes) y contador.

- **"Conseguido"** cambia la lista global del juego (la de su pantalla de logros). **"En esta partida"** se guarda con la partida.
- **"Desbloquear también en Steam"** (activado por defecto): al marcar un logro, o al añadir con el trainer un rasgo que tiene logro (coronas, heridas, *Veteran*, *Pedigreed*…), se desbloquea también en Steam. **Los logros de Steam no se pueden quitar.**
- **"Enviar a Steam los conseguidos"** desbloquea en Steam todos los de la lista del juego, por ejemplo los que marcaste antes solo en el juego.
- Quitar un logro solo lo quita en el juego.

Detalles: [Logros](logros.md#en-el-trainer).

## Eventos militares

Cuando Roma está en guerra pueden aparecer 8 eventos con árbol de decisiones. En casi todos se puede ganar una corona, y en varios se puede morir.

- **Sección Eventos militares:** el árbol completo de cada evento, con la probabilidad de morir y de ganar la corona, las heridas y los premios de cada opción, con las cifras reales de tu partida.
- **Consejo en el juego:** cuando aparece uno de estos eventos, se muestra un recuadro al lado de su ventana con lo que pasa en cada opción, y la recomendada se marca con ★ también en el juego. Si hay un camino con más probabilidad de corona, aparece una línea "A por la corona". Se puede desactivar con la casilla de la sección.
- **Forzar el resultado:** en las opciones con azar aparecen botones **🎲 Forzar**, uno por resultado posible (corona, victoria, muerte…). Al pulsar uno, el trainer elige esa opción con la tirada que da ese resultado. Lo demás lo hace el juego, incluidos los logros, que también se desbloquean en Steam.

La opción recomendada es la de menos riesgo de morir; a igual riesgo, la de más probabilidad de corona, menos heridas y más prestigio e influencia. Detalles y mejor camino de cada evento: [Eventos militares](eventos-militares.md).

## Extras

Lo que hacen los [mods de ejemplo oficiales](https://github.com/CitizenOfRomeDynastyAscendant/example-mods), el mod de temas de [Prahlad](https://github.com/prahlad-swarnkar/CORmods) y el banco y la casamentera de [peritiSumus](https://github.com/peritiSumus/CoR-Mods), pero desde el trainer.

Activar los mods en el juego desactiva los logros de la partida para siempre. El trainer no los activa: usa las mismas funciones que el propio juego usa internamente, así que **los logros del juego y de Steam siguen activos** ([detalles](mecanicas-generales.md#logros-y-modo-mods)).

Cada opción se puede usar desde el panel o **desde la interfaz del juego**, como en los mods originales:

- **En cada personaje:** botones de Jugar como, Divorcio y Dar en adopción, solo en quienes pueden usarlos.
- **En la ventana "Arrange Betrothal":** el botón de la Casamentera.
- **En la pantalla principal:** botones de Argentarius, Tema, Nueva dinastía y Escenarios.
- Los botones abren **ventanas del juego**, con los costos al lado de cada opción y su aviso "You may not be able to afford this" si no te alcanza.
- En el bloque **"Botones en el juego"** se elige cuáles mostrar; vienen todos activados.
- Los botones quedan guardados en la partida, pero **sin el trainer conectado no se muestran**, y vuelven al conectarlo.

| Bloque | Qué hace |
|---|---|
| **Tema** | 20 temas de color o los del juego, y un botón para el **modo oscuro** del juego (el mismo ajuste de Settings). Claros: *Green*, *Mono Mix* y *Vestalia* (del mod de Prahlad), *Imperial Purple*, *Marble & Gold*, *Pompeian Red*, *Mare Nostrum*, *Olive Grove*, *Legion* y *High Contrast*. Oscuros (marcados con ☾): *Saturnalia*, *Nox*, *Vesuvius*, *Catacombs*, *Tyrian Night*, *Sacred Grove*, *Bronze Age*, *Neptune* y *High Contrast Dark*. Todos se leen con o sin el modo oscuro. El trainer recuerda el tema elegido. |
| **Jugar como** | Pasas a controlar a otro personaje vivo, de la casa o de fuera. Su casa pasa a ser la tuya y tu personaje actual sigue en la partida. |
| **Divorcio** | Separa a una pareja de la casa. |
| **Dar en adopción** | Un hijo de hasta 15 años, sin pareja, que no esté estudiando ni de viaje, deja la familia. Como en el mod, el juego lo registra como una muerte y muestra la ventana del funeral. |
| **Nueva dinastía** | Funda una rama con otro nomen, cognomen y origen (plebeyo, *novus homo*, patricio o liberto), con el mismo prestigio. Pasan a ella tú y tus descendientes que llevan tu apellido; el resto de la familia lo conserva. El mod original, en cambio, renombra la dinastía entera. |
| **Escenarios** | Empiezas con la familia de Julio César (661 A.U.C.), Marco Agripa (716) o la madre de Marco Antonio (683). La fecha, el dinero, la influencia y las propiedades pasan a ser los del escenario. Tu familia actual sigue en la partida, pero ya no es tu casa. En el escenario de Agripa, a los 25½–26½ años aparece la ventana de la boda con Attica, como en el mod (en el panel, si desactivas el botón de Escenarios). |
| **Argentarius** (banco e inversiones) | Botón en la pantalla principal con el banco y tres formas históricas de invertir; ver [Argentarius](#argentarius). |
| **Casamentera** | Está en la ventana **"Arrange Betrothal"** del juego: el botón de los anillos, junto a "Pay to look for other matches". Abre un pedido a medida: pagas la tarifa de la casamentera (5% de tu dinero, mínimo 20 000) y un **extra por candidato** por cada cosa que pidas: más candidatos (3 a 6), edad (gratis), origen (*novus homo* o patricio), habilidad mínima en cada una de las 4 (10+ a 30+), hasta 2 rasgos (34 a elegir: genéticos buenos, educación, habilidades y personalidades; la lista tiene barra para recorrerla) y "sin rasgos malos". El precio del botón de pagar se actualiza al cambiar el pedido, con el desglose en su ayuda. Los candidatos los crea el generador del juego (con dote, personalidad y a veces un trato matrimonial o una mascota), se ajustan al pedido y aparecen **primeros en la lista**. Te casas desde ahí, con la ceremonia de siempre. Respeta la casilla de matrimonio matrilineal de la ventana. Como los candidatos del juego, se descartan a los 6 meses o al pagar por otras parejas. En el panel se ven los encargados que siguen disponibles. |

- **Costos.** Divorciar, dar en adopción y la casamentera cobran lo mismo que los mods (en la casamentera, la tarifa del mod más los extras del pedido). Lo de la casamentera son cantidades fijas. En el divorcio y la adopción, el juego multiplica la cantidad por tu factor de clase, y en el divorcio, el dinero también por tus ingresos. Por eso puede costar mucho; el panel muestra la cifra real y avisa si te quedarías en negativo. La casilla "Cobrar los costos de los mods originales" permite hacerlo gratis (el argentarius cobra siempre: es dinero prestado o invertido).
- **No se pueden deshacer.** Las acciones piden confirmación. Antes de jugar un escenario, guarda en otra ranura.
- Si tu partida va por un año posterior al del escenario, la fecha retrocede, como en el mod.

### Argentarius

El banquero romano: un botón en la pantalla principal que abre una ventana del juego con el banco y tres formas de invertir que usaban los romanos. Lo que puedes hacer depende de tu **clase social** (la que calcula el juego por tu patrimonio) y de los **atributos de tu personaje**:

| | Proletarii | Class V – II | Class I | Equites | Senatores |
|---|---|---|---|---|---|
| **Pedir prestado** | sí (poco) | sí | sí | sí | sí |
| **Prestar a otras familias** | — | — | sí | sí | sí |
| **Sociedades de publicanos** | — | — | participaciones chicas | sí | con testaferro |
| **Préstamo marítimo** | — | Class III y II | sí | sí | con testaferro |

Con esclavitud por deudas no se puede hacer nada, salvo pagar.

Los atributos del personaje **no tienen tope**. **20 es neutral**: por debajo penalizan, con un multiplicador de (atributo/20)^1,24 que no baja de ×0,1, y por encima mejoran sin límite.

| Valor | 0 | 5 | 10 | 15 | 20 | 30 | 40 | 60 |
|---|---|---|---|---|---|---|---|---|
| Penalización | ×0,10 | ×0,18 | ×0,42 | ×0,70 | — | — | — | — |
| Límites (administración) | ×0,10 | ×0,18 | ×0,42 | ×0,70 | ×1 | ×1,75 | ×2,5 | ×4 |
| Lo que cobras (administración) | ×0,10 | ×0,18 | ×0,42 | ×0,70 | ×1 | ×1,1 | ×1,2 | ×1,4 |
| Interés del banco para Equites (elocuencia) | 11,9% | 11,6% | 10,6% | 9,5% | 8,3% | 6,3% | 4,3% | 4% (mínimo) |
| Riesgo de Asia (inteligencia; base 6%) | 11,4% | 10,9% | 9,5% | 7,8% | 6% | 4% | 3% | 2% |
| Comisión de compra (elocuencia) | 9,5% | 9,1% | 7,9% | 6,5% | 5% | 2,5% | 1,7% | 1% |
| Precio de venta (elocuencia) | 50% | 53% | 64% | 77% | 90% | 95% | 97% | 98% |

| Atributo | Efecto |
|---|---|
| **Administración** | Límites de todo, lo que cobras (intereses, dividendos y la ganancia de los barcos) y menos impagos de quienes te deben. |
| **Elocuencia** | Interés del banco (hasta 4 puntos más por debajo de 20; 2 puntos menos por cada 10 de más), comisión al comprar participaciones y precio al venderlas. |
| **Inteligencia** | Riesgo de contratos y rutas, y lo exacto del riesgo que ves (con poca inteligencia, la cifra es aproximada). |
| **Combate** | De una deuda impaga recuperas 30% con 20; menos por debajo y 25 puntos más por cada 10 de más, hasta el 100%. |
| **Rasgos** | *Honorable*: medio punto menos de interés. *Greedy*: puedes prestar al 15%, pero hay más impagos. *Sly*: el testaferro cobra 10% en vez de 20%, y el riesgo de escándalo baja de 5% a 3%. |

Siguen los límites propios de la economía: el interés nunca baja del 4%, las probabilidades no pasan del 90%, y no se recupera más del 100% de una deuda ni se vende una participación por más de su valor. En la ventana del argentarius aparecen los atributos que tienes por debajo de 20, con su penalización.

- **Pedir prestado.** El interés va del 12% anual para los Proletarii (el tope legal romano, la *centesima*) al 8⅓% para Equites y Senatores (el *fenus unciarium* de las Doce Tablas), con elocuencia 20. Sube o baja según tu elocuencia, con un mínimo de 4%. El límite crece con la clase: 600 para los Proletarii y 40 000 para los Equites, con administración 20. El interés se cobra cada año en **Martius** (el mes 3, cuando el juego pasa sus eventos anuales), con una ventana del juego donde pagas al menos el interés o algo más. Lo que adelantes antes, desde la ventana o el panel, no paga interés. Si tenías deuda con el banco anterior, pasa al argentarius.
- **Prestar a otras familias.** Cada mes 3 familias piden dinero por 1 a 3 años. Eliges la tasa: 6%, 9% o 12% (15% con *Greedy*). Cuanto más alta, más probable el impago. Cada Martius pagan el interés, o no pagan y recuperas una parte.
- **Sociedades de publicanos.** Compras participaciones de 5 contratos del Estado: impuestos de Asia (8–20% anual, el más arriesgado), diezmos de Sicilia, minas de Hispania, obras públicas o abastecer al ejército (3–7% en paz, 10–24% en guerra). Cada Martius cobras el dividendo, o el contrato quiebra y pierdes una parte. Puedes vender las participaciones cuando quieras.
- **Préstamo marítimo.** Cada mes hay 3 viajes, por ejemplo a Alexandria, Gades o Rhodus: entre 20% y 35% de interés, de 3 a 5 meses y con riesgo de naufragio. En invierno (November a Mercedonius) el mar está "cerrado" y el riesgo se duplica. Puedes prestar en un solo barco (todo o nada) o repartirlo en 50 barcos, como Catón, con 5 puntos menos de interés y casi sin riesgo de perderlo todo.
- **Senatores.** Como en Roma, invierten en sociedades y préstamos marítimos con un testaferro: se queda con el 20% de lo que ganes, y cada año hay un 5% de riesgo de escándalo, que cuesta prestigio e influencia.
- **Resultados.** Los cobros del año (Martius) y los barcos que vuelven llegan en una ventana del juego, el "Informe del argentarius". En el panel (bloque Argentarius) se ven tu clase, lo que te permiten tus atributos y todas tus deudas e inversiones.

Los datos de los escenarios vienen de los mods de ejemplo de Sathvik Software Solutions, con licencia [CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/) y la condición *Commons Clause* (no se pueden vender). Los temas son del mod "theme" de Prahlad. La casamentera se basa en el mod "Coemptio" de peritiSumus, de dominio público. El argentarius reemplaza a su mod "Bank of Rome".

## Otro puerto

Para usar otro puerto en vez del 9222, pon el mismo número en las opciones de lanzamiento del juego y en la variable `CDP_PORT`. En PowerShell:

```
$env:CDP_PORT=9333; node trainer.mjs
```

## Problemas frecuentes

| Mensaje o problema | Qué hacer |
|---|---|
| "Esperando al juego en el puerto 9222..." | El juego no está abierto, o le falta la opción de lanzamiento `--remote-debugging-port=9222`. Ábrelo (o ciérralo, revisa la opción en Steam y vuelve a abrirlo): el trainer se conecta solo. |
| El juego se queda cargando la partida (y "El juego no responde" en el trainer) | Pasa con partidas guardadas con una versión anterior del trainer si se cargan sin él. Cierra el juego con el trainer abierto y vuelve a abrirlo: el trainer lo prepara antes de que cargue la partida y actualiza los botones. Guarda la partida, y desde entonces carga bien también sin el trainer. |
| "El juego aún no tiene una partida cargada" | Carga una partida: el panel aparece solo al recargar. |
| No veo el panel | Pulsa **F8**, que lo muestra u oculta. Comprueba que la ventana del trainer dice "Panel listo". |
| Una sección dice "No disponible" | Probablemente una actualización del juego cambió algo que usa esa sección. El resto del panel sigue funcionando. Ver [Desarrollo](desarrollo.md#si-una-actualización-del-juego-rompe-algo). |
| "El juego se cerró." | Es normal: el trainer espera a que vuelvas a abrirlo. **Ctrl+C** lo cierra. |
| "Node no se reconoce como comando" | Instala [Node.js](https://nodejs.org/) 22 o superior y abre una terminal nueva. |
