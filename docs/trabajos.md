# Trabajos

Hay 90 trabajos, de seis tipos: `apprentice` (oficios que se aprenden), `random`, `appointed` (nombrados: funcionarios, senador, sacerdotes), `elected` (magistraturas), `appointedMagistrate` (pro-magistraturas) y `military`. `[0262]`

**Ningún trabajo da más salud o más vida por ejercerlo.** Los beneficios son los de abajo.

## Ingresos de un trabajo `[522c]`

```
ingreso = base × (1 + nivel / mín(13,5, nivel_máx)) × multiplicador
multiplicador = job_<oficio> × ingresos (modificadores y rasgos) × habilidades   [7ec1]
habilidades   = 1 + Σ (habilidad × peso del oficio) / 135
```

- **Cada nivel suma un 7,4% del sueldo base** (1/13,5), sin tope hasta el nivel máximo. Por eso el **nivel máximo pesa más que el sueldo base**: a nivel máximo se cobra `base × (1 + nivel_máx / 13,5)`.
- Las **habilidades no tienen tope** en esta fórmula. Con 30 en las habilidades del oficio, el sueldo se multiplica por 1,4–2,1; con habilidades mucho mayores, por mucho más.
- No cobra quien está muerto, se mudó, está fuera o desaparecido. En modo fácil, ×1,25.
- *Vestal Virgin* tiene nivel máximo 0: la fórmula da `0/0` y el juego le paga **0**.

## Oficios mejor pagados

Ordenados por el sueldo a nivel máximo (sin multiplicadores ni habilidades). La última columna añade 30 en las habilidades que usa el oficio.

| Oficio | Base | Nivel máx. | A nivel 20 | A nivel máx. | Máx. + habilidades 30 | Habilidades (peso) |
|---|---|---|---|---|---|---|
| Lawyer | 20,1 | 200 | 49,8 | **317,7** | **656,6** | inteligencia 1,8 · elocuencia 3 |
| Figure Painter | 9,4 | 300 | 23,4 | 218,7 | 366,9 | inteligencia 2 · elocuencia 1,05 |
| Physician | 15,7 | 150 | 38,9 | 190,1 | 325,2 | inteligencia 2 · elocuencia 1,2 |
| Philosophy Tutor | 16,3 | 125 | 40,5 | 167,4 | 316,2 | inteligencia 2,5 · elocuencia 1,5 |
| Rhetor | 15,3 | 125 | 37,9 | 156,5 | 295,6 | inteligencia 2,5 · elocuencia 1,5 |
| Grammaticus | 12,2 | 125 | 30,3 | 125,2 | 236,5 | inteligencia 2,5 · elocuencia 1,5 |
| Bestiarius | 2,6 | 625 | 6,5 | 123,1 | 205,2 | inteligencia 1 · combate 2 |
| Jeweler | 6,3 | 250 | 15,6 | 122,5 | 258,7 | inteligencia 1,5 · administración 2 · elocuencia 1,5 |
| Painter | 6,3 | 250 | 15,6 | 122,5 | 205,6 | inteligencia 2 · elocuencia 1,05 |
| Theater Performer | 2,8 | 500 | 6,9 | 106,1 | 200,5 | inteligencia 1,5 · elocuencia 2,5 |
| Barber | 2,5 | 500 | 6,2 | 95,5 | 146,5 | inteligencia 1,2 · elocuencia 1,2 |
| Judge | 18,8 | 50 | 46,7 | 88,6 | 157,5 | inteligencia 1,5 · elocuencia 2 |
| Scribe (funcionario) | 15,7 | 50 | 38,9 | 73,8 | 147,6 | inteligencia 1,5 · administración 1 · elocuencia 2 |
| Trader | 5,6 | 150 | 14,0 | 68,4 | 136,8 | inteligencia 1 · administración 2 · elocuencia 1,5 |
| Clerk (funcionario) | 14,4 | 50 | 35,8 | 67,9 | 135,8 | inteligencia 1,5 · administración 1 · elocuencia 2 |
| Litterator | 6,6 | 125 | 16,4 | 67,8 | 128,1 | inteligencia 2,5 · elocuencia 1,5 |
| Stone Mason | 5,0 | 150 | 12,5 | 60,8 | 101,4 | inteligencia 1 · combate 2 |
| Lictor (funcionario) | 12,6 | 50 | 31,2 | 59,1 | 98,4 | inteligencia 1 · combate 2 |
| Herald (funcionario) | 10,7 | 50 | 26,5 | 50,2 | 106,0 | inteligencia 1 · administración 1 · elocuencia 3 |
| Carpenter | 5,0 | 100 | 12,5 | 42,2 | 88,7 | inteligencia 1,5 · administración 1,2 · combate 1 · elocuencia 1,25 |
| Secretary | 10,2 | 40 | 25,3 | 40,4 | 85,2 | inteligencia 1,5 · administración 1,5 · elocuencia 2 |

Más abajo, con menos de 35 a nivel máximo: Scribe (oficio), Haruspex, Cobbler, Clerk (oficio), Blacksmith, Weaver, Victimarii, Shepherd, Wet Nurse, Farm Hand y Laborer. 33 de los 90 trabajos pagan dinero; los cargos dan prestigio e influencia (ver abajo).

- *Judge* y los funcionarios pagan mucho **desde el principio** (a nivel 20, *Judge* es el segundo), pero se quedan en el nivel 50.
- *Bestiarius*, *Theater Performer* y *Barber* tienen sueldo base bajísimo y niveles máximos enormes: solo rinden a niveles muy altos. *Theater Performer* además **resta** prestigio e influencia.
- *Physician* es el tercero y además protege la salud de la familia (ver abajo).

## Subir de nivel `[904c]`

En cada comprobación, el nivel sube en 1 con probabilidad:

```
(1 + inteligencia/5) / 13 / 5 / (nivel/5, mínimo 1) × multiplicador_sin_modificadores / 3
```

- `multiplicador_sin_modificadores` es el de arriba sin `job_<oficio>` ni el de ingresos: rasgos y habilidades del oficio.
- **Cada nivel cuesta más que el anterior** (la probabilidad baja en proporción al nivel), así que llegar a 200 o 300 lleva muchísimo tiempo. La **inteligencia** y las habilidades del oficio lo aceleran mucho. *Ambitious* ×1,25; *Content* ÷1,25.
- Al llegar al nivel máximo (si es 10 o más) se consigue el logro `topBoss`.
- La función que fija el nivel lo limita a `[0, nivel_máx]` `[6cf7]`. En el trainer: Familia → Nivel trabajo → **Máx**.

## Magistraturas y cargos: prestigio e influencia

No dan dinero, pero sí prestigio e influencia **cada mes**. El juego suma lo de **todos los miembros de la casa** con trabajo:

```
prestigio/mes  += prestigio_del_trabajo  × (1 + 2 × nivel / nivel_máx)
influencia/mes += influencia_del_trabajo × (1 + 2 × nivel / nivel_máx)
```

(En los cargos, que no tienen niveles, `nivel_máx` cuenta como 10 y el nivel suele ser 0, así que se aplica el valor base.) Valores base:

| Cargo | Tipo | Prestigio | Influencia |
|---|---|---|---|
| Pontifex Maximus | elected | 1.200 | 700 |
| Consul | elected | 500 | 1.000 |
| Censor | elected | 720 | 360 |
| Pro-Consul | appointedMagistrate | 250 | 600 |
| Praetor | elected | 250 | 500 |
| Aedile | elected | 210 | 400 |
| Pro-Praetor | appointedMagistrate | 150 | 450 |
| Tribune of the Plebs | elected | 150 | 450 |
| Quaestor | elected | 100 | 300 |
| Pro-Quaestor / Pro-Aedile | appointedMagistrate | 100 | 250 |
| Hastatus Prior Tesserarius | military | 10 | 30 |
| Vigintisexviri | elected | 5 | 25 |
| Military Tribune | elected | 5 | 20 |
| Senator | appointed | 5 | 15 |

- Al dejar el cargo queda un rasgo "ex" (*Former Consul*, etc.). **Haber sido magistrado da +7,5% en las elecciones** `[0439]`.
- *Theater Performer* es el único oficio que **resta** prestigio e influencia.

## Oficios que benefician a la familia

| Oficio | Beneficio para la familia | Condición | Código |
|---|---|---|---|
| **Physician** | Nadie de la casa sufre el evento "Really Sick! / Really Injured!" (enfermedad o herida que **empeora** y obliga a pagar un médico o arriesgarse) | Que viva en casa, no esté fuera y esté sano | `[0c3d]` |
| **Physician** o **Wet Nurse** | Algunos traen **salud de la casa ×1,0–1,5** ("and their Expertise") | Solo personajes generados por el juego (p. ej. candidatos a matrimonio), ~5% | `[6d52]` |
| **Magistrados y sacerdotes** | Su prestigio e influencia mensuales se suman a los de la familia | Que lo ejerza cualquier miembro de la casa (vivo y que no se haya mudado) | cálculo de prestigio/influencia mensual |
| **Cualquier oficio compartido** | Multiplicador de ingresos de ese oficio (ver abajo) | ≥2 personas y >⅓ de los que trabajan | `[af06]` |

### Bonus por oficio compartido `[af06]`

- Cuenta a los miembros de la casa que trabajan en un oficio de tipo `apprentice` o `appointed` (no cuentan cargos electos ni militares, ni quien está ocupado, fuera, desaparecido o en guerra).
- Si un oficio lo ejercen **al menos 2 personas** y **más de un tercio** de los que trabajan, ese oficio recibe un multiplicador `job_<oficio>`.
- Empieza en ×1 y sube **+0,05 cada 5 años** (+1% al año), con un tope de ×5 (en la práctica inalcanzable).
- Ejemplo real: *Painter* tras ~15 años → ×1,16.
- Conviene con oficios bien pagados (dos *Lawyer*, dos *Physician*…).

### Al buscar pareja `[6d52]`

Los personajes que genera el juego pueden traer, con cierta probabilidad, un modificador que se aplica a la casa mientras vivan en ella:

- *Physician* o *Wet Nurse*: salud de la casa ×1,0–1,5.
- *Greedy* o administración > 15: gastos de la casa ×0,9–1,0.
- Con oficio: ±20% en los ingresos de su oficio.

Se ven en el trainer en Multiplicadores → Activos ahora.

## Desventaja: reclutamiento en guerra `[dab4]`

- En guerra, quien sea **Consul, Pro-Consul, Praetor, Pro-Praetor o Military Tribune** es **llamado siempre a dirigir las legiones y no puede evadirse**.
- El resto de varones de 16 a 46 años pueden ser reclutados al azar (más probable con más combate, menos con la edad). No pueden ser reclutados quienes estén enfermos, heridos, mutilados, ciegos, etc.
- Cuando reclutan a un familiar, la casa gana +20 influencia y +20 prestigio (escalados).

## Eventos propios de un oficio (solo para quien lo ejerce)

| Oficio | Evento | Código |
|---|---|---|
| Physician | "Mysterious Illness": investigación; si sale bien, +400 dinero, +60 influencia, +40 prestigio (escalados) | `[jobs/common/physician]` |
| Stone Mason | 70% de lucirse en la lucha de los *Ludi Plebeii* | `[3ca9]` |
| Jeweller | Ventaja en el tiro con arco de los *Ludi Apollinares* | `[c911]` |
| Artesanos (Blacksmith, Carpenter, Cobbler, Jeweller, Painter, Stone Mason, Bestiarius) | "A good opportunity": ocasiones de ganar dinero | `[1624]` |
| Oficios de enseñanza | "Education": aceptar alumnos (rechazar baja el nivel y la reputación) | `[jobs/common/education]` |
| Magistrados | Eventos del cargo (inundaciones del cónsul, juegos del edil, etc.) | `[election/*]` |

## Recomendaciones

- **Salud de la familia**: un hijo **médico que siga viviendo en casa**.
- **Poder político**: que cualquier familiar ocupe una **magistratura alta** (Consul, Pontifex Maximus), sabiendo que en guerra irá al frente.
- **Dinero a largo plazo**: **dos o más familiares con el mismo oficio bien pagado**, por ejemplo abogados.
