# Mecánicas de Citizen of Rome - Dynasty Ascendant

Notas sobre cómo funciona el juego por dentro, sacadas de su código (versión **1.6.36**) mientras se desarrollaba el trainer. Sirven para jugar mejor y para mantener el trainer.

| Documento | Contenido |
|---|---|
| [Mecánicas generales](mecanicas-generales.md) | Clase social, escalado de costos, calendario y edad, habilidades, rasgos, multiplicadores, guardado |
| [Educación](educacion.md) | Etapas (ludus, grammaticus, rhetor, filosofía, aprendiz), opciones y costos, velocidad de aprendizaje, inteligencia, retórica judicial o deliberativa |
| [Trabajos](trabajos.md) | Oficios mejor pagados, magistraturas, qué oficios benefician a la familia, médico en casa, bonus por oficio compartido, reclutamiento |
| [Mascotas](mascotas.md) | Para qué sirven, aptitud, vigor y docilidad, aprendizaje, rasgos, precios, especies |
| [Propiedades y ganado](propiedades.md) | Rendimiento de tierras y animales, límite administrable, penalización por exceso |
| [Logros](logros.md) | Dónde se guardan, grupos, relación con Steam |

## Cómo leer estas notas

- Las **fórmulas** se copian tal como están en el código y se explican en palabras. Entre corchetes va el identificador del módulo de webpack donde están (p. ej. `[f0c5]`), para poder volver a comprobarlas si el juego se actualiza.
- Cuando algo **no se pudo confirmar** (por ejemplo, cada cuánto exacto se procesa un evento), se indica.
- Los nombres de rasgos, trabajos y propiedades se dejan **en inglés**, como los muestra el juego.
- Los textos con cifras de dinero, prestigio o influencia son **valores base**: el juego los multiplica según la clase de la familia (ver [Mecánicas generales](mecanicas-generales.md#escalado-de-costos-por-clase)).
