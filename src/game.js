// Acceso al juego. Es el ÚNICO archivo que conoce los identificadores internos
// del juego (módulos de webpack) y la forma de su estado Vuex: si una
// actualización del juego rompe algo, se arregla aquí.
//
// Se usan las mismas funciones que usa el juego (rasgos, nivel de trabajo,
// multiplicadores…), así se aplican sus efectos secundarios. No activa el
// modo mods, así que los logros siguen activos.

// --- Estado Vuex ---------------------------------------------------------------
const store = () => document.querySelector('#app')?.__vue__?.$store
const S = () => store()?.state
const player = () => { const s = S(); return s?.characters?.[s.current.id] }
const dynasty = () => { const s = S(), p = player(); return p && s.dynasties?.[p.dynastyId] }

// Asignar una clave que el objeto aún no tiene, de forma que Vue la vea (Vue 2).
const setReactive = (obj, key, value) => {
  if (key in obj) obj[key] = value
  else store()._vm.$set(obj, key, value)
}

// Miembros vivos de la casa (tú primero).
const household = () => {
  const s = S()
  if (!s) return []
  const ids = [s.current.id, ...(s.current.householdCharacterIds || [])]
  return [...new Set(ids)].map(id => s.characters[id]).filter(c => c && !c.isDead)
}

// Todas las mascotas conocidas, y las vivas de la casa y de sus miembros.
const pets = () => S()?.current?.pets || {}
const householdPets = () => {
  const s = S()
  if (!s) return []
  const ids = [...(s.current.petIds || []), ...(s.current.householdPetIds || [])]
  household().forEach(ch => ids.push(...(ch.petIds || [])))
  return [...new Set(ids)].map(id => pets()[id]).filter(p => p && !p.isDead)
}

// --- Módulos internos (webpack) --------------------------------------------------
// Se registra un "chunk" falso para obtener la función require de webpack.
function gameRequire() {
  if (window.__corReq) return window.__corReq
  const key = Object.keys(window).find(k => /^webpackJsonp/.test(k))
  if (!key) return null
  const mid = '__cor' + Date.now()
  window[key].push([[mid], { [mid]: (m, e, r) => { window.__corReq = r } }, [[mid]]])
  return window.__corReq || null
}
// Cada grupo es null si no se pudo cargar (p. ej. otra versión del juego).
const load = (what, fn) => { try { return fn(gameRequire()) } catch (e) { console.warn('[trainer] ' + what + ' no disponible', e); return null } }

// Rasgos de personajes: definiciones, títulos y las funciones del juego para
// añadir/quitar (aplican los bonus de habilidad y quitan los opuestos).
// Rasgos acumulables (isStackable): volver a añadir uno que ya se tiene suma
// copias en ch.traitStackCount, y cada copia extra suma traitStackMultiplier (10%)
// del bonus de habilidad; quitarlo sin forzar resta una copia.
const TR = load('rasgos', req => {
  const defs = req('50ab').default()
  const addTrait = req('a822').a, removeTrait = req('cc6f').a
  const discoverable = defs.discoverable || []
  const add = (ch, id) => {
    addTrait(S(), ch.id, id)
    // Los rasgos "descubribles" no se muestran en el juego hasta descubrirlos.
    if (discoverable.includes(id)) {
      ch.discoveredTraits = ch.discoveredTraits || []
      if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
    }
  }
  const remove = (ch, id) => removeTrait(S(), ch.id, id, true)
  // Copias que tiene: 0 si no lo tiene; el juego guarda 0 o nada cuando hay una.
  const stacks = (ch, id) => ch?.traits?.includes(id) ? Math.max(1, ch.traitStackCount?.[id] || 0) : 0
  const setStacks = (ch, id, n) => {
    n = Math.max(0, Math.min(99, Math.floor(n)))
    let cur = stacks(ch, id)
    if (n === cur) return
    if (n === 0) return remove(ch, id)
    if (cur === 0) { add(ch, id); cur = 1 }
    if (n > cur) addTrait(S(), ch.id, id, n - cur)
    else for (; cur > n; cur--) removeTrait(S(), ch.id, id, false)
  }
  return { list: defs.list, titles: req('7073').default(), discoverable, add, remove,
    stackable: Object.keys(defs.list).filter(id => defs.list[id].isStackable),
    stackMultiplier: req('7de9').default.traitStackMultiplier, stacks, setStacks }
})

// Edad en años a partir de mes/año de nacimiento (calendario de 13 meses).
const AGE = load('edad', req => req('9b55').default)

// Trabajos: definiciones (maxLevel), nombres y la función que fija el nivel
// (lo limita a [0, maxLevel] y recalcula al personaje).
const JOBS = load('trabajos', req => ({ types: req('0262').default.types, titles: req('c9c8').default.titles || {}, set: req('6cf7').a }))

// Mascotas: tipos (especie, edad adulta, esperanza de vida), rasgos y sus funciones.
const PETS = load('mascotas', req => {
  const P = req('ed26').a
  return { types: P.types || {}, traitList: P.traits.list, traitTitles: req('c7db').default.traits || {},
    add: (p, id) => req('d6d3').a({ state: S(), petId: p.id, trait: id }),
    remove: (p, id) => req('d217').a({ state: S(), petId: p.id, trait: id, forceClearStack: true }) }
})

// Propiedades: tipos, grupos, nombres y el límite administrable de cada una.
const PROPS = load('propiedades', req => {
  const P = req('08e5').default, L = req('5785').default
  return { types: P.types, groups: P.groups, titles: L.types || {}, groupTitles: L.groups || {}, max: k => req('40cf').default(S(), k) }
})

// Multiplicadores (modificadores): añadir/quitar por clave e id, y el valor total
// (producto de los activos; el juego lo cachea ~1 s).
const MODS = load('multiplicadores', req => ({
  add: (key, id, factor, description) => req('dbe5').default(S(), { key, id, factor, description }),
  remove: (key, id) => req('f761').a(S(), key, id),
  value: key => req('fc68').a(S(), { key }),
  propTypes: req('08e5').default.types, propTitles: req('5785').default.types || {},
}))

// Logros: lista, grupos y nombres. Los conseguidos están en state.achievements
// (global, el juego lo guarda en localStorage.core) y los de la partida actual en
// current.flagAchievementsThisRun (se guarda con la partida).
const ACH = load('logros', req => {
  const D = req('06d5').a, L = req('a550').default
  return { list: D.list, groups: D.groups, titles: typeof L === 'function' ? L() : L }
})

// Marca o desmarca logros como conseguidos SOLO dentro del juego. No se usa la
// acción addAchievement del juego porque además los desbloquea en Steam, y los
// logros de Steam no se pueden quitar.
const setAchievements = (ids, on) => {
  const list = S().achievements
  for (const id of ids) {
    const i = list.indexOf(id)
    if (on && i < 0) list.push(id)
    if (!on && i >= 0) list.splice(i, 1)
  }
  // Se guarda como hace el juego al guardar partida, pero solo la lista de logros.
  try {
    const core = JSON.parse(localStorage.core || '{}')
    core.achievements = [...list]
    localStorage.core = JSON.stringify(core)
  } catch (e) { console.warn('[trainer] no se pudo guardar la lista de logros', e) }
}

// Marca o desmarca un logro como conseguido en la partida actual.
const setAchievementThisRun = (id, on) => {
  const c = S().current
  if (!c.flagAchievementsThisRun) setReactive(c, 'flagAchievementsThisRun', [])
  if (!c.flagAchievementsThisRunCount) setReactive(c, 'flagAchievementsThisRunCount', {})
  const list = c.flagAchievementsThisRun, i = list.indexOf(id)
  if (on && i < 0) {
    list.push(id)
    setReactive(c.flagAchievementsThisRunCount, id, Math.max(1, c.flagAchievementsThisRunCount[id] || 0))
  }
  if (!on && i >= 0) {
    list.splice(i, 1)
    store()._vm.$delete(c.flagAchievementsThisRunCount, id)
  }
}

// Edad actual en años de un personaje o mascota.
const ageOf = x => AGE ? AGE(S(), x.birthMonth, x.birthYear) : S().year - x.birthYear

// A partir de ~27 las fórmulas del juego ya dan el máximo (99%) en habilidades.
const SKILL_MAX = 30

module.exports = {
  store, S, player, dynasty, setReactive, household, pets, householdPets, ageOf,
  setAchievements, setAchievementThisRun,
  TR, AGE, JOBS, PETS, PROPS, MODS, ACH, SKILL_MAX,
}
