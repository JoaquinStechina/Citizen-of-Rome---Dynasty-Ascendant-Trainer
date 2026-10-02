# Educación

## Resumen

- El **tipo de escuela casi nunca cambia el título** que se obtiene al terminar: cambia **lo rápido que el niño gana habilidades** mientras estudia (y el costo, prestigio e influencia). La excepción es el **rhetor**, donde la elección decide el título.
- **Ningún estudio exige inteligencia**: los requisitos son edad, título anterior y clase de la familia.
- Los pagos iniciales, prestigio e influencia se multiplican por la [clase](mecanicas-generales.md#escalado-de-costos-por-clase) (×5,76 para senadores). El gasto mensual no.
- Cada título **reemplaza** al anterior (Literate → Educated → Orador), salvo *Philosopher*, que **se suma** al de orador.

## Etapas

### 1. Ludus litterarius → *Literate* `[3a31]` `[5686]`

Se puede inscribir entre los **4 y 6 años**; termina a los **9**.

| Opción | Requisito | Pago inicial | Gasto/mes | Prestigio | Influencia | Aprendizaje |
|---|---|---|---|---|---|---|
| Tutor privado | clase ≥ 3 | 15 | −32 | +10 | +20 | ×5 |
| Ludus renombrado | clase ≥ 2 | 9 | −15 | +1 | +5 | ×3,5 |
| Ludus más cercano | — | 3 | −7 | — | — | ×2 |
| "Seguir con su educación moral" | — | — | — | — | — | ×1 |

Las tres primeras dan el mismo título. **Si no se inscribe antes de los 6 años, la opción desaparece**, y sin *Literate* no puede ir al grammaticus (ni después al rhetor o a filosofía).

### 2. Grammaticus → *Educated* `[ed1b]` `[e2851]`

Entre los **9 y 10 años** (requiere *Literate* y clase ≥ 2); termina a los **12**.

| Opción | Requisito | Pago inicial | Gasto/mes | Prestigio | Influencia | Aprendizaje |
|---|---|---|---|---|---|---|
| El más renombrado | clase ≥ 4 | 100 | −100 | +20 | +50 | ×8 |
| Uno reputado | — | 50 | −50 | +10 | +20 | ×5 |
| Cualquiera | — | 40 | −30 | +5 | +10 | ×3 |

Mientras estudia con un grammaticus, cada vez que sube la elocuencia hay un 20% de probabilidad de un punto extra.

### 3. Rhetor → *Orador deliberativo* u *Orador judicial* `[007e]` `[3853]`

Entre los **12 y 13 años** (requiere *Educated* y clase ≥ 3); termina a los **16**.

| Opción | Requisito | Pago inicial | Gasto/mes | Prestigio | Influencia | Aprendizaje | Título |
|---|---|---|---|---|---|---|---|
| Retórica deliberativa | clase ≥ 3 | 150 | −120 | +40 | +45 | ×9,75 | Orador deliberativo |
| Retórica judicial | clase ≥ 4 | 180 | −120 | +35 | +40 | ×8,75 | Orador judicial |

### 4. Filosofía → *Philosopher* `[a955]` `[6590]`

Entre los **16 y 17 años** (requiere ser orador y clase ≥ 4); termina a los **20**. Una sola opción: ir a **Grecia**.

- Pago inicial 1.000, gasto −250/mes, +200 prestigio, +500 influencia.
- Aprendizaje ×10,08, y además ×1,35 por estar fuera de casa.
- **Abandonarla** cuesta −500 prestigio y −1.000 influencia (escalados).

### Alternativa: aprendiz de un oficio `[403b]` `[e902]`

Desde los **7 años**. Aprendizaje ×9. Al terminar empieza en ese trabajo con nivel aleatorio entre 1 y `1 + inteligencia/18` (máximo `nivel_máx/1,5`), y con un extra si **el padre tiene el mismo oficio**. No da título de educación.

### Abandonar a mitad

Quitar a un hijo de un estudio cuesta −1 prestigio y −5 influencia (escalados por ingresos), salvo filosofía (ver arriba).

## Títulos

| Título | Inteligencia | Elocuencia | Administración | Combate | Otros |
|---|---|---|---|---|---|
| Literate | +0,5 | +3 | +2 | +1 | — |
| Educated | +1 | +4 | +3 | +2 | — |
| Orador deliberativo | +2 | +6 | +4 | +3 | ingresos ×1,02, gastos ×1,05, fertilidad ×1,6 |
| Orador judicial | +2 | +5 | +5 | +2 | ingresos ×1,04, gastos ×1,06, fertilidad ×1,4 |
| Philosopher | +3 | +4 | +3 | +3 | ingresos ×1,03, gastos ×1,08, fertilidad ×1,1 |

Opuestos: Literate, Educated y los dos oradores se excluyen entre sí; Philosopher solo excluye a Literate y Educated.

## Velocidad de aprendizaje

Cada cierto tiempo, cada personaje tiene una probabilidad de subir un punto en cada habilidad `[f0c5]`:

```
velocidad = (5,4 + inteligencia / 6,543) / 180
velocidad ×= escuela (tablas de arriba)   ×1,35 si está fuera de casa   ÷1,5 si hay austeridad
si edad ≥ 25: velocidad ÷= edad
sube administración si  aleatorio + administración/45 < velocidad / 1,8
sube elocuencia     si  aleatorio + elocuencia/45     < velocidad / 1,5
sube combate        si  aleatorio + combate/45        < velocidad / 2
sube inteligencia   si  aleatorio + inteligencia/45   < velocidad / 3
```

(La habilidad que se compara es la efectiva, con los bonus de rasgos `[a396]`.)

Consecuencias:

- Orden de rapidez: **elocuencia > administración > combate > inteligencia**.
- Cuanto más alta está una habilidad, menos probable es subirla; llega un punto en que es imposible. Ese **techo es proporcional a la velocidad**: la escuela y la inteligencia deciden **hasta dónde** llega, no solo lo rápido.
- Los adultos (25+) apenas aprenden.
- No se pudo confirmar cada cuánto se ejecuta exactamente este cálculo (depende del procesamiento por lotes del juego), así que no se dan techos absolutos.

## Influencia de la inteligencia

La inteligencia entra en la base de la fórmula, así que **acelera las cuatro habilidades**:

| Inteligencia | Velocidad frente a inteligencia 0 |
|---|---|
| 0 | ×1,00 |
| 5 | ×1,14 |
| 10 | ×1,28 |
| 15 | ×1,42 |
| 20 | ×1,57 |
| 30 | ×1,85 |

- Se retroalimenta: la inteligencia también sube con los estudios (es la más lenta), y cada punto acelera el resto.
- En el aprendizaje de un oficio, sube el nivel inicial del trabajo (efecto pequeño).
- **Consejo**: subirle la inteligencia a un niño **antes del ludus** (con el trainer: Familia → Inteligencia) mejora toda su educación.

## ¿Retórica judicial o deliberativa?

**En general conviene la deliberativa**, sobre todo en familias que hacen carrera política.

- **Elecciones**: en la elección de Vigintisexviri, la probabilidad base es `(administración + inteligencia)/80 + elocuencia/45` (máx. 75%), más bonus por influencia; al hacer campaña `[0439]` se suman bonus por rasgos. Un punto de **elocuencia vale casi el doble** que uno de administración. Con los bonus de habilidad y de título (deliberativo +7,5%, judicial +6%), el deliberativo saca unos **2,5 puntos más** de probabilidad en cada elección.
- **Aprende más rápido** en esos 4 años (×9,75 frente a ×8,75) y la elocuencia es la que más sube.
- **Más fertilidad** (×1,6), **más barata** y algo más de prestigio e influencia al empezar.

**Judicial** solo si el hijo no hará política y se busca dinero: **+4% de ingresos** en vez de +2%, y un punto más de administración (sube un poco el límite de propiedades).

Ambas dan igual acceso a filosofía, el mismo bonus como escriba (×1,4) y los mismos bonus en oficios de enseñanza.
