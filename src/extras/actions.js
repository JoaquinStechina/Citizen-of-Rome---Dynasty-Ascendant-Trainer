// Acciones de los mods (Play As, Divorce, Give For Adoption, New Dynasty?, Play a
// Scenario) hechas con la API de mods del juego sin activar el modo mods (game.DA).
// Las usan el panel (features/extras) y los botones dentro del juego (extras/ingame).
// Los costos no se cobran aquí: el panel los cobra con charge() y las ventanas del
// juego con sus statChanges, que el juego aplica igual que en el mod.
const { t } = require('core/i18n')
const ls = require('core/storage')
const game = require('game')
const SCENARIOS = require('extras/scenarios')

const COSTS_KEY = 'corTrainerExtrasCosts'
const HERITAGES = ['roman_plebian', 'roman_novus_homo', 'roman_patrician', 'roman_freedman']
// Costos de los mods (applyStatChanges [2ee0]: × factor de clase; scaleByRevenue además × ingresos).
const ADOPT_COST = { cash: -50, prestige: -100, influence: -500 }
const DIVORCE_COST = { cash: -500, prestige: -25, influence: -300, scaleByRevenue: ['cash'] }
// Causa de muerte del mod: el juego la muestra dentro de su frase en inglés
// ("<nombre> has died <causa> at the age of <edad>").
const ADOPT_CAUSE = '...maybe, who knows?, after being given up for adoption'

const api = () => game.DA.api()
const S = () => game.S()
const store = () => game.store()

// --- Costos -------------------------------------------------------------------------
const costsOn = () => ls.get(COSTS_KEY, true)
const setCostsOn = v => ls.set(COSTS_KEY, !!v)
// Lo que cobra el juego de verdad (con el escalado de tu partida).
const real = (changes, k) => game.STATS ? game.STATS.real(k, changes[k], (changes.scaleByRevenue || []).includes(k)) : changes[k]
const costText = changes => !costsOn() ? t('xFree') : ['cash', 'prestige', 'influence'].filter(k => changes[k])
  .map(k => Math.round(real(changes, k)).toLocaleString() + ' ' + t(k).toLowerCase()).join(', ')
// Aviso si el costo deja el dinero en negativo (el juego tiene eventos de deudas).
const shortOf = changes => costsOn() && S().current.cash + real(changes, 'cash') < 0 ? '\n\n' + t('xNotEnough') : ''
const charge = changes => { if (costsOn()) api().applyStatChanges(changes) }
// statChanges para una opción de ventana del juego ({} si no se cobra).
const statChanges = changes => costsOn() ? { ...changes } : {}

// --- Personajes ---------------------------------------------------------------------
const name = ch => {
  const d = S().dynasties[ch.dynastyId] || {}
  return [ch.praenomen, d.nomen, d.cognomen, ch.agnomen].filter(s => s && s.trim()).join(' ')
}
// Enlace a un personaje en los mensajes del juego.
const link = ch => '[c|' + ch.id + '|' + name(ch) + ']'
const spouseOf = ch => { const sp = ch && S().characters[ch.spouseId]; return sp && !sp.isDead ? sp : null }
const inHousehold = ch => game.household().includes(ch)

const canPlayAs = ch => !!ch && !ch.isDead && ch.id !== S().current.id
// Como el mod: miembro de la casa con pareja viva.
const canDivorce = ch => !!ch && !ch.isDead && !!spouseOf(ch) && inHousehold(ch)
// Como el mod: de la casa, hasta 15 años, sin pareja y sin estar ocupado ni de viaje.
const canAdopt = ch => !!ch && !ch.isDead && ch.id !== S().current.id && inHousehold(ch) &&
  !ch.spouseId && !ch.flagIsBusy && !ch.flagIsAway && game.ageOf(ch) <= 15

function playAs(id) {
  if (!canPlayAs(S().characters[id])) return false
  api().setCurrentCharacter({ characterId: id })
  store().dispatch('forceUpdateStore')
  return true
}

function divorce(id) {
  const ch = S().characters[id], sp = spouseOf(ch)
  if (!sp) return false
  const a = api()
  a.updateCharacter({ characterId: sp.id, character: { spouseId: false } })
  a.updateCharacter({ characterId: ch.id, character: { spouseId: false } })
  return true
}

function adopt(id) {
  if (!canAdopt(S().characters[id])) return false
  api().kill({ characterId: id, deathCause: ADOPT_CAUSE })
  return true
}

// --- Nueva dinastía -----------------------------------------------------------------
// El mod original renombra la dinastía para todos sus miembros (copia su id). Aquí
// se hace lo que promete: una rama nueva, con el mismo prestigio, para el jugador
// y sus descendientes que llevan su apellido; el resto de la familia lo conserva.
function branchDynasty({ nomen, cognomen, heritage }) {
  const s = S(), old = game.dynasty(), id = game.DA.newId()
  nomen = (nomen || '').trim()
  if (!old || !nomen) return 0
  game.setReactive(s.dynasties, id, { ...JSON.parse(JSON.stringify(old)), id, nomen,
    cognomen: (cognomen || '').trim(), heritage: HERITAGES.includes(heritage) ? heritage : old.heritage })
  const moved = []
  const walk = ch => {
    if (!ch || ch.dynastyId !== old.id || moved.includes(ch.id)) return
    ch.dynastyId = id
    moved.push(ch.id)
    ;(ch.childrenIds || []).forEach(k => walk(s.characters[k]))
  }
  walk(game.player())
  moved.forEach(k => store().dispatch('forceUpdateCharacter', k))
  store().dispatch('forceUpdateStore')
  return moved.length
}

// --- Escenarios ---------------------------------------------------------------------
function playScenario(scId) {
  const sc = SCENARIOS.list.find(x => x.id === scId)
  if (!sc) return false
  const data = sc.data(), a = api(), s = S()
  a.setDate(data.date)
  // Como el mod: se crean los personajes y luego se enlazan con sus ids reales.
  const ids = {}
  for (const tmp in data.characters) {
    ids[tmp] = a.generateCharacter({ characterFeatures: { ...data.characters[tmp] }, dynastyFeatures: data.dynasties[data.characters[tmp].dynastyId] })
  }
  for (const tmp in ids) {
    const c = { ...data.characters[tmp], id: ids[tmp] }
    c.fatherId = ids[c.fatherId] || false
    c.motherId = ids[c.motherId] || false
    c.spouseId = ids[c.spouseId] || false
    c.childrenIds = (c.childrenIds || []).map(k => ids[k]).filter(Boolean)
    a.updateCharacter({ characterId: ids[tmp], character: c })
  }
  a.setCurrentCharacter({ characterId: ids[data.characterId] })
  a.setGlobalFlag({ flag: 'playingScenario', data: sc.id })
  // Dinero, influencia y propiedades quedan en los valores del escenario.
  s.current.cash = data.cash
  s.current.influence = data.influence
  const det = s.current.propertyDetails
  for (const k of new Set([...Object.keys(det), ...Object.keys(data.property)])) game.setReactive(det, k, data.property[k] || 0)
  store().dispatch('forceUpdateStore')
  return true
}
const scenarioYear = scId => SCENARIOS.list.find(x => x.id === scId)?.data().date.year

// Evento del escenario de Agrippa (marry_attica): a los 25½–26½ años, si no está
// casado, puede casarse con Attica o negarse, con premios y castigos del mod.
const atticaDue = () => {
  const p = game.player()
  if (!p?.flagPlayScenarioModIsMarcusAgrippa || p.modFlags?.marcus_attica_engagement_over) return false
  const age = game.ageOf(p)
  return age > 25.5 && age < 26.5 && !spouseOf(p)
}
const atticaChanges = yes => {
  const f = api().calculateScaleByClassFactor()
  return yes ? { cash: -6000 / f, prestige: 2000 / f, influence: 4000 / f, property: { insulae: 1, horse: 1 } }
    : { prestige: -500 / f, influence: -2000 / f }
}
const atticaDone = () => api().setCharacterFlag({ characterId: S().current.id, flag: 'marcus_attica_engagement_over', data: true })
// La boda (los premios y castigos los aplica quien llama).
function atticaWedding() {
  const a = api(), id = a.generateCharacter(SCENARIOS.attica())
  a.performMarriage({ characterId: S().current.id, spouseId: id, isMatrilineal: false })
}

module.exports = {
  HERITAGES, ADOPT_COST, DIVORCE_COST,
  costsOn, setCostsOn, costText, shortOf, charge, statChanges,
  name, link, spouseOf, inHousehold, canPlayAs, canDivorce, canAdopt,
  playAs, divorce, adopt, branchDynasty, playScenario, scenarioYear,
  atticaDue, atticaChanges, atticaDone, atticaWedding,
}
