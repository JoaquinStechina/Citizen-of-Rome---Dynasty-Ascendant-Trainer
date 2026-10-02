# Propiedades y ganado

Las propiedades se guardan en `current.propertyDetails` como **número de unidades por tipo**. Hay 22 tipos en cuatro grupos: tierras, animales, barcos y edificios o fincas. `[08e5]`

## Rendimiento

Cada unidad tiene un precio (`value`) y un ingreso (`revenue`). Al vender se recupera el 90% (`saleRate`).

### Tierras

| Tipo | Precio | Ingreso | Rendimiento |
|---|---|---|---|
| Farmlands | 250 | 1,75 | 0,70% |
| Vineyards | 360 | 2,53 | 0,70% |
| Orchards | 420 | 2,79 | 0,66% |
| Prime Farmlands | 2.700 | 17,25 | 0,64% |
| Prime Vineyards | 3.300 | 21,98 | 0,67% |
| Prime Orchards | 3.900 | 27,03 | 0,69% |

### Ganado

| Animal | Precio | Ingreso | Rendimiento |
|---|---|---|---|
| Chicken | 10 | 0,072 | 0,72% |
| Duck | 15 | 0,104 | 0,69% |
| Pig | 26 | 0,202 | 0,78% |
| Donkey | 28 | 0,216 | 0,77% |
| Goat | 32 | 0,230 | 0,72% |
| Sheep | 36 | 0,252 | 0,70% |
| Cattle | 40 | 0,288 | 0,72% |
| **Horse** | **125** | 0,324 | **0,26%** |

- Tierras y ganado rinden parecido (~0,7% de su precio); **el caballo es la peor inversión**.
- Los ingresos se pueden subir con los multiplicadores `property_<tipo>` (en el trainer: Multiplicadores → Propiedades).

## Límite administrable `[40cf]`

```
límite = base_del_grupo × capacidad_de_la_casa
```

| Grupo | Base |
|---|---|
| Animales | 1,251 |
| Tierras | 0,45 |
| Edificios y fincas | 0,18 |
| Barcos | 0,126 |

- La **capacidad de la casa** `[20e3]` suma un aporte por cada miembro de la casa `[a37c]` más la **administración del encargado** (*caretaker*), ajustada por la clase y por los multiplicadores de administración (`household_stewardship`, `character_stewardship_*`). Mínimo 5.
- El límite de **animales es casi 3 veces el de tierras**, así que se pueden tener muchas más unidades.
- Las propiedades **comerciales** (barcos mercantes) tienen límite **0 para familias senatoriales**.

## Exceso de propiedades

- Si una propiedad pasa de **1,2 veces su límite**, el juego puede lanzar eventos que **quitan parte de lo que sobra**: para animales, enfermedades o robos ("unable to properly care for all of them").
- La probabilidad crece con el cuadrado de `unidades / límite`; es 25 veces menor en modo fácil y 10 veces menor si el jugador tiene menos de 13 años.
- Hay márgenes de tiempo: desde que empieza el exceso pasan ~0,33 años antes del primer evento, y entre un evento y el siguiente ~0,25 años. **En guerra los márgenes son más largos** (~1 año y ~0,75 años).
- El juego ofrece "vender todo lo que no se puede administrar" (acción `propertySellExcess`) al 90% de su precio.

## En el trainer

La sección **Propiedades de la casa** muestra cada tipo con su límite, en amarillo si se pasa del límite y en rojo si pasa de 1,2×. Las propiedades se añaden **gratis**, sin descontar dinero.
