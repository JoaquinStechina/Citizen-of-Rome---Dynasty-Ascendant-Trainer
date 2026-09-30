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
const TR = load('rasgos', req => {
  const defs = req('50ab').default()
  return { list: defs.list, titles: req('7073').default(), discoverable: defs.discoverable || [],
    add: (ch, id) => req('a822').a(S(), ch.id, id), remove: (ch, id) => req('cc6f').a(S(), ch.id, id, true) }
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

// Edad actual en años de un personaje o mascota.
const ageOf = x => AGE ? AGE(S(), x.birthMonth, x.birthYear) : S().year - x.birthYear

// A partir de ~27 las fórmulas del juego ya dan el máximo (99%) en habilidades.
const SKILL_MAX = 30

module.exports = {
  store, S, player, dynasty, setReactive, household, pets, householdPets, ageOf,
  TR, AGE, JOBS, PETS, PROPS, MODS, SKILL_MAX,
}
