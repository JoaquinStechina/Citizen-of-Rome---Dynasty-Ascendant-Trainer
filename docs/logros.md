# Logros

## Dónde se guardan

| Qué | Dónde | Cuándo se guarda |
|---|---|---|
| Logros conseguidos (global, la pantalla de logros) | `state.achievements` y `localStorage.core.achievements` | Al guardar partida (`[134d]`) |
| Conseguidos en esta partida | `current.flagAchievementsThisRun` (+ contador) | Con la partida |
| Conseguidos por cada personaje | `characters[id].flagAchievementsWhenPlayed` (+ contador) | Con la partida |

- Hay **110 logros** en 10 grupos: Basics, Family, Genetic, Health, Education, Military, Ludi, Economy, Power, Special. `[06d5]`
- Algunos logros están en **dos grupos** (por ejemplo, *A Wedding* en Basics y Family).
- Nombres y descripciones: `[a550]` (solo inglés).

## Cómo se desbloquea un logro `[c391]`

La acción del juego `addAchievement`:

1. Con algo de probabilidad, quita *Depression* o *Stress* al personaje actual (mucho menos si el logro ya se tenía).
2. Lo marca en "esta partida" y en "este personaje", y suma sus contadores.
3. **Si la partida no es fácil, sandbox ni con mods**, y la opción de logros de API está activa, lo envía a **Steam** (IPC `achievementGet` → `steamworks.achievement.activate`).
4. Si es nuevo en la lista global, lo añade y muestra la notificación.

**Los logros de Steam no se pueden quitar**: el juego no tiene ninguna función para eso.

El identificador de Steam es el mismo que el del juego, y el proceso principal no activa dos veces un logro que ya está activado.

Algunos **rasgos tienen un logro con el mismo id**:
- Personajes: las seis coronas, *Veteran*, *One Handed*, *Arm-less*, *One Legged*, *Legless*, *Malnourished*, *Obese* y *Novus Homo*.
- Mascotas: *Malnourished*, *Blessed* y *Pedigreed*.

## En el trainer

La sección **Logros** marca y desmarca directamente en esas listas, **sin llamar a `addAchievement`**, para evitar sus efectos secundarios (puntos 1 y 2):

- "Conseguido": lista global, guardada al momento en `localStorage.core`.
- "En esta partida": se guarda con la partida.
- Un logro que aparece en dos grupos se muestra en ambos pero se cuenta una vez.

**Steam**: con la casilla "Desbloquear también en Steam" activada (lo está por defecto), el trainer envía el mismo mensaje que el juego (`achievementGet`) cuando:

- se marca un logro como conseguido (uno o "Marcar los mostrados", con confirmación);
- se añade con el trainer un rasgo que tiene logro, a un personaje o a una mascota;
- se pulsa "Enviar a Steam los conseguidos", que desbloquea en Steam todos los de la lista del juego (por ejemplo, los marcados antes solo en el juego).

Como el juego, no envía nada en modo fácil, sandbox o con mods, ni con los logros de API desactivados en los ajustes; en ese caso la sección lo avisa. Quitar un logro solo lo quita en el juego.

Los resultados forzados de los [eventos militares](eventos-militares.md#en-el-trainer) pasan por las funciones del propio juego, que desbloquea sus logros con `addAchievement`.
