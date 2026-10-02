# Eventos militares

Mientras Roma está en guerra y tu personaje sirve en ella, pueden aparecer ocho eventos con árbol de decisiones. En casi todos se puede ganar una **corona** (un honor militar con su rasgo y su logro), y en varios **se puede morir**. El trainer tiene una sección **Eventos militares** con todos los árboles, y muestra un consejo junto a la ventana del evento cuando aparece.

## La guerra

El inicio y el fin de la guerra están en `[ca8b]`.

- **Empieza** a partir del año 10 de la partida, si no hay guerra y pasaron más de 2 años desde la última, entre los meses 1 y 9. La probabilidad por comprobación es `1/(13 × 7,56)`, ×9 si tu personaje es tribuno militar, pretor, propretor, cónsul o procónsul.
- **Dura** de 2 a 6 años; con un 10% de probabilidad, hasta 5 años más.
- **Termina** en el año previsto (a partir del mes 2, 4/13 por comprobación) y da fertilidad de la casa ×1,25 durante 3 meses.
- Varios finales de evento **adelantan el fin** (`endWar`): fijan el año de fin al actual.
- Otros **terminan tu servicio militar** (`endTerm`, de `war/conscription` `[dab4]`).

## Cómo se escalan los premios

Las cifras de los eventos son de base. Al aplicarse (`applyStatChanges` `[2ee0]`):

```
dinero      × ingresos            (si el evento lo pide)   × factor de clase
influencia  × ingresos / 8        (si el evento lo pide)   × factor de clase
prestigio   × ingresos / 10       (si el evento lo pide)   × factor de clase
```

`ingresos` es el ingreso mensual (`[14ef]`: ingreso anual / 13, entre 0,9 y 20) y el factor de clase es el de [Mecánicas generales](mecanicas-generales.md#escalado-de-costos-por-clase). Casi todos los eventos militares escalan prestigio e influencia, no el dinero. Con ingresos al máximo y clase senatorial, el prestigio sale ×11,5 y la influencia ×14,4.

## Resumen

| Evento (título) | Quién | Corona | Mejor camino | Para la corona |
|---|---|---|---|---|
| *War: At Battle* `[2b96]` | soldado | Civica | "To each their own": no pasa nada | 9% de corona, **70% de morir** |
| *War: At Sea* `[c393]` | comandante | Rostrata | Agree → Wait → Curb → Dig → artillería: **50%** de corona | igual |
| *At War: Campaign* `[d03a]` | ambos | Castrensis | Soldado: Stay → "Destroy their camps!": **50%**, sin riesgo. Comandante: cualquiera → reinforcement → attack (sin corona) | igual |
| *At War: Seige* `[15d0]` | soldado | Muralis | "Burn incense": 5% de morir, 13,5% de corona | 27% de corona, 10% de morir, pierdes ojo y mano |
| *For my Legionnaires* `[7ab4]` | comandante | Obsidionalis | No ir al senado, o "I did my part": no pasa nada | 40% de corona, **60% de morir** |
| *A Call for Help* `[6aeb]` | comandante | de Hierba* | "Rush to aid" y, si sale mal, retirarse: sin riesgo | depende de tus habilidades |
| *At War: Invasion* `[b782]` | comandante | Triumphalis | → hire → transfugi: **58,8%** de corona, 75% *Severely Mangled* | igual |
| *Triumphator* `[7837]` | tras la Triumphalis | — | Paintings → **Ivory** → … → Games and a Banquet | — |

\* El juego da el rasgo y el logro de la Corona Obsidionalis.

## Detalles

### War: At Battle (Corona Civica)
- "Assist them!" → "Stand my ground": **70% de morir**. Si sobrevives, 30% de corona; en total, **9%**.
- "Let the fellow soldier die a martyr": te deja *Depressed*.

### War: At Sea (Corona Rostrata)
- Atacar con la tormenta, o cualquier camino que no sea Curb → Dig → artillería, es **derrota segura**: −2.000 prestigio, −1.500 influencia y una herida (*Mangled* o una pierna).
- La artillería pesada gana el 50% de las veces (+2.500 / +2.800 y la corona). **Siempre pierdes una mano.**
- Si el personaje ya no tiene piernas, la herida es `severlyMangled`, un rasgo mal escrito que no existe, así que no hay herida.

### At War: Campaign (Corona Castrensis)
- **Soldado**: "Stay and help set up camp" → "Destroy their camps!" da 50% de corona y nunca mueres. Ofrecerse voluntario tiene un **50% de morir** antes de llegar a esa elección.
- **Comandante**: la primera opción da igual. "Send reinforcement" → "Attack the enemy camps!" da +3.000 / +1.500; rechazar los refuerzos o ignorar el campamento resta.

### At War: Seige (Corona Muralis)
- Cargar con el amigo herido: **70% de morir**.
- Si te capturan, **"Carefully sneak past the guard" es muerte segura**; estrangular al guardia, 10%.
- Para la corona: aceptar el tratado (pierdes un ojo y una mano, quedas *Wounded*) → ir a la batalla → dejar los cadáveres ("Let them hang"): 30%.
- Si puedes escapar a caballo, no pasa nada.

### For my Legionnaires (Corona Obsidionalis)
- Llevar el caso al senado y "Continue to plead" o pagar de tu bolsillo (−76.000 dinero) te obliga a una misión: esperar da 40% de corona y **60% de morir**; atacar o unirte al ejército débil, **muerte segura**.
- "I did my part" o ignorar a los hombres: no pasa nada.

### A Call for Help (Corona de Hierba)
- Cargar tiene éxito si `aleatorio + (combate + elocuencia)/100 > 0,8`; con *Strong*, siempre. Dividir las tropas, si `aleatorio + (inteligencia + combate)/100 > 0,8`.
- Si falla, retirarse cuesta solo −20 / −20. Seguir luchando necesita `aleatorio/3 + (combate + elocuencia)/120 > 0,95`; si falla, puedes huir (desertor o muerte) o resistir (desertor si `aleatorio + combate/100 > 0,8`, si no, muerte).
- Desertor: −2.000 / −2.000 y **5 años de exilio**.

### At War: Invasion (Corona Triumphalis)
- La primera opción da igual: el mejor camino siempre es contratar a alguien para matar al inventor y pactar con los *transfugi*. Si no contestan, escribirles personalmente (−6.700 dinero).
- Al ganar: 75% de quedar *Severely Mangled*; la corona llega el 58,8% de las veces en total.
- Perseverar sin el pacto o hablar con los soldados acaba en *Depressed* o en grandes pérdidas (hasta −7.500 de prestigio y −6.500 de influencia).
- Ganar la corona activa más tarde el desfile *Triumphator*.

### Triumphator (desfile)
- Las pinturas y maquetas de **marfil** cuestan más (−12.000 y −9.000 dinero), pero el desfile da **+30.000 / +25.000** en vez de +3.000 / +2.500 con madera.
- Clemencia: +17.000 / +19.000; sacrificio: +19.000 / +15.000.
- "Games and a Banquet" (−60.000 dinero, +29.000 / +23.000) es lo que más da.
- Al final: +15.000 dinero y un solar para tu mansión.

## En el trainer

La sección **Eventos militares** muestra cada árbol con la probabilidad y los efectos de cada opción, ya escalados para tu partida, y marca con ★ la recomendada.

La recomendada es la de menos riesgo de morir; a igual riesgo, la de más corona, menos heridas y más prestigio e influencia. Cuando hay un camino con más probabilidad de corona, aparece además una línea "A por la corona". Los datos están en `src/war/events.js`.
