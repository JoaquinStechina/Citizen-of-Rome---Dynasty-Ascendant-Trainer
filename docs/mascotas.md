# Mascotas

Las mascotas son animales con nombre que pertenecen a un miembro de la familia. Se guardan en `current.pets`. No dan dinero directamente: sirven para la **salud** y el **ánimo** de la casa, y se pueden **criar y vender**. `[ed26]`

## Habilidades

| Habilidad | Para qué sirve |
|---|---|
| **Aptitud** | Acelera el aprendizaje de todas sus habilidades; recuperarse de enfermedad, estrés y desnutrición; bendición de Esculapio |
| **Vigor** | Control de plagas; protege de la desnutrición. **Aumenta** el riesgo de que ataque a su dueño |
| **Docilidad** | Alivia el estrés del dueño; **reduce** el riesgo de ataque; bendición de Esculapio |

## Beneficios

| Efecto | Mascotas | Depende de | Qué hace | Código |
|---|---|---|---|---|
| Alivio del estrés ("Feel the love") | Todas | Docilidad: `(1 + docilidad/25)` | Quita *Stress* o *Depression* al dueño | `[9c81]` |
| Control de plagas ("Pest free") | Serpientes, perros, gatos, hurones | Vigor: `(1 + vigor/30)` | Salud de la casa hasta +25%; la mascota gana *Hunter* | `[e4e4]` |
| Bendición de Esculapio | Solo serpiente de Esculapio, si el dueño está enfermo | `0,5 + aptitud/45 + docilidad/30` | Salud personal hasta ×2,25, salud de la casa hasta +42%; la serpiente gana *Blessed* | `[01af]` |
| Crianza | Todas | Especie (fertilidad, tamaño de camada) | Crías que se pueden vender | `[7497]` `[3bb1]` |

## Costos y riesgos

- **Gasto**: proporcional a `factor_de_clase × 6,543 × 0,18 × factor_de_la_especie × multiplicador de gastos de la casa`, y la mitad mientras no es adulta. El factor de la especie va de 0,1 (paloma, serpiente) a 1,5 (caballo) y **25 (elefante)**. El factor de clase es el de [Mecánicas generales](mecanicas-generales.md#escalado-de-costos-por-clase).
- **Ataque al dueño** `[e321]`: probabilidad `(1 + vigor/45 − docilidad/25)`; deja al dueño herido o estresado, con un 20% de probabilidad de enfermar.
- La mascota puede enfermar, herirse, estresarse o desnutrirse `[faaf]` `[9c3d]` `[56ea]` `[524f]`, lo que baja su precio.

## Aptitud en detalle

| Uso | Efecto | Código |
|---|---|---|
| Aprendizaje | Todas sus habilidades crecen ×(1 + aptitud/25) | `[78b0]` |
| Curarse de una enfermedad | ×(1 + aptitud/39,6) | `[faaf]` |
| Quitarse el estrés | ×(1 + aptitud/60) | `[56ea]` |
| Desnutrición | Con el vigor: la probabilidad de desnutrirse se divide por 10×(vigor + aptitud) y se recupera antes | `[524f]` |
| Curarse una herida | ×(1 + aptitud/400) (casi nada) | `[9c3d]` |

## Cómo "aprende" una mascota `[78b0]`

No hay escuelas ni entrenamiento pagado: sus habilidades suben solas durante toda su vida.

```
velocidad = (1 + aptitud / 25) / 450        ÷1,5 si hay austeridad
sube aptitud    si aleatorio + mejora_aptitud/45   < velocidad / 7
sube vigor      si aleatorio + mejora_vigor/45     < velocidad / 3
sube docilidad  si aleatorio + mejora_docilidad/45 < velocidad / 2  (con dueño)
                                                     velocidad / 5  (sin dueño)
```

- `mejora_*` es cuánto ha subido **por encima de lo normal en su especie** (sin contar rasgos) `[d9f0]`: cuanto más ha mejorado, más le cuesta.
- La **docilidad** sube 2,5 veces más rápido si tiene dueño; la **aptitud** es la más lenta.
- La edad **no** influye.
- Es un proceso lento: un punto de vez en cuando.

## Rasgos

| Rasgo | Cómo se consigue | Bonus | Precio |
|---|---|---|---|
| *Hunter* | Evento "Pest free" | +5 vigor, +1 aptitud | ×1,5 |
| *Blessed* | Evento "Aesculapian blessing" | +2 aptitud | **×100** |
| *Pedigreed* | Al nacer (0,5%) | — | ×5 |
| Personalidad (*Mischievous*, *Well Behaved*, *Friendly*, *Loner*) | Al nacer (75%) | — | — |
| Genética (*Strong*, *Weak*, *Deformed*) | Al nacer, poco frecuente; *Strong*/*Weak* ocultos hasta adulta | — | *Strong* ×1,2, *Weak* ×0,7, *Deformed* ×0,6 |
| *Learned Tricks* | **Ningún evento lo da** (v1.6.36) | +1 aptitud, +3 vigor, +3 docilidad | ×1,7 |
| *Mimics Speech* | **Ningún evento lo da** | +1 aptitud, +5 docilidad | ×3 |
| *Warrior Spirit* | **Ningún evento lo da** | +1 aptitud, +5 vigor, −5 docilidad | ×2 |

*Learned Tricks*, *Mimics Speech* y *Warrior Spirit* están definidos pero ningún código los añade: solo se consiguen con mods o con el trainer.

Rasgos negativos y su efecto en el precio: *Ill* ×0,35, *Wounded* ×0,4, *Mangled* ×0,4, *Malnourished* ×0,8, *Blind* ×0,8, *Deaf* ×0,8, *Disfigured* ×0,7, *Accident Deformed* ×0,7.

## Especies

| Especie | Grupo | Rareza | Precio | Gasto (factor) | Esperanza de vida | Camada |
|---|---|---|---|---|---|---|
| Molossian (perro) | dogs | uncommon | 120 | 0,4 | 8 | 3 |
| Shaggy (perro) | dogs | local | 25 | 0,25 | 13,2 | 3 |
| Cave canem (perro) | dogs | uncommon | 35 | 0,25 | 13,2 | 3 |
| Maltese (perro) | dogs | exotic | 480 | 0,4 | 13,3 | 2 |
| Lab (perro) | dogs | uncommon | 50 | 0,3 | 12,6 | 3 |
| Greyhound (perro) | dogs | local | 40 | 0,3 | 13,2 | 3 |
| Mau (gato) | cats | exotic | 210 | 0,24 | 15 | 4 |
| Orange (gato) | cats | uncommon | 60 | 0,2 | 15 | 4 |
| Polecat (hurón) | ferrets | uncommon | 40 | 0,24 | 6 | 5 |
| Elephant | elephants | rare | 13.000 | 25 | 50 | 1 |
| Aesculapian snake | snakes | local | 35 | 0,1 | 25 | 5 |
| Barbary ape | monkeys | exotic | 300 | 0,4 | 25 | 1 |
| Maremma (caballo, 2 capas) | horses | uncommon | 150 | 1,5 | 25 | 1 |
| Peafowl (pavo real) | birds | exotic | 1.300 | 0,2 | 15 | 4 |
| Pigeon | birds | local | 15 | 0,1 | 6 | 3 |
| Parakeet | birds | exotic | 750 | 0,4 | 15 | 2 |
| Goldfinch | birds | uncommon | 90 | 0,15 | 15 | 3 |
| Blackbird | birds | uncommon | 90 | 0,15 | 12 | 3 |

## Recomendaciones

- La **docilidad** es la habilidad más útil (más alivio del estrés y menos ataques).
- Una **serpiente de Esculapio** es barata (35), cuesta casi nada mantenerla, vive 25 años, controla plagas y puede bendecir a su dueño enfermo; si recibe *Blessed*, vale ×100.
- Para vender, *Blessed* (×100) y *Pedigreed* (×5) son lo que más rinde; mantenerla sana evita que el precio caiga.
