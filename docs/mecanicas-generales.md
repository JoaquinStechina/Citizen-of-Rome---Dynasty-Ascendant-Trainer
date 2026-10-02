# Mecánicas generales

## Clase social

La clase de la familia depende de su **riqueza** (dinero + valor de las propiedades), salvo los senadores, que siempre son clase 7. `[5485]`

| Clase | Riqueza |
|---|---|
| 0 | menos de 1.100 |
| 1 | 1.100 – 2.500 |
| 2 | 2.500 – 5.000 |
| 3 | 5.000 – 7.500 |
| 4 | 7.500 – 10.000 |
| 5 | 10.000 – 25.000 |
| 6 | 25.000 o más |
| 7 | Clase senatorial (siempre) |

Muchas opciones (educación cara, cargos) piden una clase mínima.

## Escalado de costos por clase

Cuando un evento da o quita **dinero, prestigio o influencia**, el valor se multiplica por un factor que depende de la clase `[cfed]`:

```
factor = 1 + max(0, clase − 1) / 1,26
```

| Clase | Factor |
|---|---|
| 0–1 | ×1,00 |
| 2 | ×1,79 |
| 3 | ×2,59 |
| 4 | ×3,38 |
| 5 | ×4,17 |
| 6 | ×4,97 |
| 7 (senatorial) | ×5,76 |

Se aplica a pagos y recompensas de eventos (`applyStatChanges` `[2ee0]`). **No** se aplica a los modificadores mensuales de ingresos (por ejemplo, el gasto mensual de una escuela), que van tal cual. Algunos eventos además escalan por ingresos (`scaleByRevenue`).

## Calendario y edad

- El año tiene **13 meses** (calendario romano), con días distintos por mes. `[7de9]`
- La edad no se guarda: se calcula con mes y año de nacimiento, en años con decimales. `[9b55]`
- Cambiar la edad equivale a mover el año de nacimiento (es lo que hace el trainer).

## Habilidades de personajes

Cuatro habilidades: **inteligencia, administración (stewardship), elocuencia y combate**.

- **No hay un tope fijo**, pero muchas fórmulas se saturan hacia 27–30 (por ejemplo, las pruebas de banquete: `100 × (0,45 + habilidad/50)`, máx. 99%).
- Para subir una habilidad, el juego compara `aleatorio + habilidad_propia/45` (sin los bonus de rasgos) contra la velocidad de aprendizaje: **cuanto más alta, más cuesta subirla**, y hay un punto en que la probabilidad es 0. Ver [Educación](educacion.md#velocidad-de-aprendizaje).
- La administración de los miembros de la casa sube el **límite de propiedades** administrables. `[20e3]`

## Rasgos

- Se añaden y quitan con funciones propias del juego (`addTrait` `[a822]`, `removeTrait` `[cc6f]`) que **suman o restan los bonus de habilidad** del rasgo y **quitan los rasgos opuestos**.
- Hay rasgos **descubribles** (orientación sexual) que no se muestran hasta descubrirlos.

### Rasgos acumulables

82 rasgos tienen `isStackable` y pueden tenerse varias veces. Las copias se guardan en `traitStackCount[rasgo]` del personaje; 0 o nada significa una copia.

| Tipo | Ejemplos |
|---|---|
| Genéticos | *Strong*, *Weak*, *Brilliant*, *Simple Minded*, *Attractive*, *Unattractive*, *Giant*, *Short-Statured*, *Deformed* |
| Daños y estados | *Mangled*, *Severely Mangled*, *Wounded*, *Grievously Wounded*, *Ill*, *Stressed*, *Depressed*, *Malnourished*, *Obese*, *Drunkard*, *Disfigured*, *Stutter* |
| Personalidad | todos |
| Habilidades y honores | *Veteran*, *Gladiator*, *Horse Rider*, los "Former …" (ex magistrados), las coronas militares |
| Castigos | *Deserter*, *Barred From Senate*, *Barred from Ludi* |

- **Añadir** un rasgo que ya se tiene suma una copia `[a822]`. Cada copia extra suma el **10%** del bonus de habilidad (`traitStackMultiplier = 0.1` `[7de9]`): *Strong* (+3,5 combate) ×2 = +3,85, ×3 = +4,2.
- **Quitar** un rasgo resta una copia; con una sola, lo quita entero `[cc6f]`. Algunas curas lo quitan entero de una vez (`forceClearStack`).
- **Herencia**: los hijos heredan las copias de los padres y, con un 0,9% de probabilidad, nacen con 1–2 copias extra `[2ff7]`.
- **Efectos que no son habilidades** (salud, fertilidad, ingresos, gastos): `[4476]` calcula un factor ×(1 + copias × 0,1) que solo aparece en el **desglose**. El total que aplica el juego usa el valor del rasgo sin las copias. Por eso acumular *Strong* no da más salud. Parece un fallo del juego.
- El costo del médico sube con las copias de *Wounded* (×5 por copia de *Grievously Wounded*) `[0c3d]`.
- El logro *Cos Tertivm* pide *Former Consul* ×2 `[3bbd]`.
- El trainer tiene una sección **Rasgos acumulables** para cambiar las copias con las funciones del juego.

## Multiplicadores (modificadores)

- Se guardan en `current.modifiers[clave]` como una lista de entradas `{ factor, id, mes/año de fin, motivo }`. El valor total es el **producto** de las activas. `[fc68]`
- Claves: `household_health`, `revenue`, `household_fertility`, `household_expenses`, `household_stewardship`, `job_<oficio>`, `property_<tipo>`, `character_*_<id>`, `pet_*_<id>`.
- El juego **cachea** el total durante ~1 segundo.
- Una entrada sin fecha de fin es **permanente** (así funciona el factor del trainer).
- En gastos (`*_expenses`), un factor **menor que 1** es favorable.

## Logros y modo mods

- Activar los **mods** del juego (sistema DAAPI) marca la partida con `flagUsedMods` y **desactiva los logros** de esa partida para siempre.
- Los modos fácil y sandbox también impiden desbloquear logros de Steam.
- Ver [Logros](logros.md).

## Guardado

- Las partidas se guardan como archivos en `Documentos\CitizenOfRomeDynastyAscendant\saves` (IPC `saveGame` del proceso principal). Los mods van en `Documentos\CitizenOfRomeDynastyAscendant\mods`.
- Los **ajustes, la lista global de logros y el índice de partidas** se guardan en `localStorage.core` (función `[134d]`).
