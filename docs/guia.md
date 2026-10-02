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

## Otro puerto

Para usar otro puerto en vez del 9222, pon el mismo número en las opciones de lanzamiento del juego y en la variable `CDP_PORT`. En PowerShell:

```
$env:CDP_PORT=9333; node trainer.mjs
```

## Problemas frecuentes

| Mensaje o problema | Qué hacer |
|---|---|
| "No pude conectar con el juego en el puerto 9222" | El juego no está abierto, o le falta la opción de lanzamiento `--remote-debugging-port=9222`. Ciérralo, revisa la opción en Steam y vuelve a abrirlo. |
| "El juego aún no tiene una partida cargada" | Carga una partida: el panel aparece solo al recargar. |
| No veo el panel | Pulsa **F8**, que lo muestra u oculta. Comprueba que la ventana del trainer dice "Panel listo". |
| Una sección dice "No disponible" | Probablemente una actualización del juego cambió algo que usa esa sección. El resto del panel sigue funcionando. Ver [Desarrollo](desarrollo.md#si-una-actualización-del-juego-rompe-algo). |
| "El juego se cerró. Saliendo." | Es normal: el trainer termina al cerrar el juego. |
| "Node no se reconoce como comando" | Instala [Node.js](https://nodejs.org/) 22 o superior y abre una terminal nueva. |
