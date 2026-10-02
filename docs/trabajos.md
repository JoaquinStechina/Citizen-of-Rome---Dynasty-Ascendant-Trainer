# Trabajos

Hay 90 trabajos, de seis tipos: `apprentice` (oficios que se aprenden), `random`, `appointed` (nombrados: funcionarios, senador, sacerdotes), `elected` (magistraturas), `appointedMagistrate` (pro-magistraturas) y `military`. `[0262]`

**Ningún trabajo da más salud o más vida por ejercerlo.** Los beneficios son los de abajo.

## Oficios mejor pagados

| Oficio | Ingresos base | Nivel máximo |
|---|---|---|
| Lawyer | 20,1 | 200 |
| Judge | 18,8 | 50 |
| Philosophy Tutor | 16,3 | 125 |
| Physician | 15,7 | 150 |
| Scribe (funcionario) | 15,7 | 50 |
| Rhetor | 15,3 | 125 |
| Clerk (funcionario) | 14,4 | 50 |
| Lictor (funcionario) | 12,6 | 50 |
| Grammaticus | 12,2 | 125 |
| Herald (funcionario) | 10,7 | 50 |
| Secretary | 10,2 | 40 |
| Figure Painter | 9,4 | 300 |

El juego muestra los ingresos de cada trabajo "por mes". El nivel sube solo con el tiempo, con cierta probabilidad, hasta el máximo de cada oficio `[904c]`; la función que lo fija lo limita a `[0, nivel_máx]` `[6cf7]`. (La fórmula exacta de ingresos por nivel no se verificó.)

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
