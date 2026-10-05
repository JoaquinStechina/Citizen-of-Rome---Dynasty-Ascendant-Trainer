// Casamentera: basada en el mod "coemptio" de peritiSumus (github.com/peritiSumus/CoR-Mods,
// dominio público), pero dentro de la ventana "Arrange Betrothal" del juego y con
// pedido a medida: pagas su tarifa y un extra por lo que quieras que tengan los
// candidatos (cantidad, edad, origen, habilidades mínimas, rasgos, sin rasgos malos).
//
// Los candidatos los crea el generador del propio juego (game.SPOUSES: dinastía,
// dote, personalidad, a veces mascota y trato matrimonial) y después se ajustan al
// pedido. Aparecen primeros en la lista de la ventana y te casas por el flujo
// normal del juego. Como los del juego, se descartan a los 6 meses o al pagar por
// "otras parejas".
const game = require('game')

const SKILLS = ['intelligence', 'stewardship', 'eloquence', 'combat']
const FLAG = 'flagTrainerMatchmaker'
// Opciones del pedido (índices de los desplegables).
const COUNTS = [3, 4, 5, 6]
const AGES = [[16, 20], [18, 25], [21, 30], [16, 35]]
const HERITAGES = ['', 'roman_freedman', 'roman_plebian', 'roman_novus_homo', 'roman_patrician']
const SKILL_MINS = [0, 10, 15, 20, 25, 30]
const TRAIT_SLOTS = 2
// Extras, en tarifas de la casamentera, por candidato del pedido base de 3.
const HERITAGE_COST = { roman_novus_homo: 0.5, roman_patrician: 1.5 }
const TRAIT_COST = { goodGenetic: 2, good: 1, education: 0.75, skill: 0.75, personality: 0.5 }
const EXTRA_CANDIDATE = 0.25
const NO_BAD = 1
const skillCost = m => 0.25 * (m / 10) ** 2
// Prestigio extra de la dinastía como hace el juego al generar un patricio o novus homo.
const HERITAGE_PRESTIGE = { roman_novus_homo: 750, roman_patrician: 3000 }

const S = () => game.S()
const rint = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min

// Tarifa de la casamentera: 5% de tu dinero, mínimo 20 000 (como el mod).
const fee = () => Math.round(Math.max(20000, S().current.cash * 0.05))

// Rasgos que se pueden pedir: los de los grupos con precio, ordenados por grupo y nombre.
const orderable = () => {
  if (!game.TR) return []
  const groups = Object.keys(TRAIT_COST), title = id => game.TR.titles[id]?.title || id
  return Object.keys(game.TR.list).filter(id => groups.includes(game.TR.list[id].group))
    .sort((a, b) => groups.indexOf(game.TR.list[a].group) - groups.indexOf(game.TR.list[b].group) || title(a).localeCompare(title(b)))
}

const defaultSpec = () => ({ count: 0, age: 1, heritage: 0, skills: { intelligence: 0, stewardship: 0, eloquence: 0, combat: 0 }, traits: Array(TRAIT_SLOTS).fill(''), noBad: false })

// Precio del pedido: tarifa + extras. Los extras de los candidatos cuentan por
// candidato (el precio de la lista es para 3).
function quote(spec) {
  const f = fee(), n = COUNTS[spec.count], per = n / 3, items = []
  items.push(['fee', f])
  if (n > 3) items.push(['count', f * EXTRA_CANDIDATE * (n - 3)])
  const her = HERITAGES[spec.heritage]
  if (HERITAGE_COST[her]) items.push(['heritage', f * HERITAGE_COST[her] * per])
  for (const k of SKILLS) { const m = SKILL_MINS[spec.skills[k]]; if (m) items.push([k, f * skillCost(m) * per]) }
  for (const tr of spec.traits) { const g = tr && game.TR?.list[tr]?.group; if (g) items.push(['trait:' + tr, f * TRAIT_COST[g] * per]) }
  if (spec.noBad) items.push(['noBad', f * NO_BAD * per])
  const out = items.map(([key, cost]) => ({ key, cost: Math.round(cost) }))
  return { items: out, total: out.reduce((a, x) => a + x.cost, 0) }
}

// Ajusta un candidato generado por el juego al pedido.
function fit(c, spec) {
  const s = S(), [lo, hi] = AGES[spec.age]
  c.birthYear = s.year - rint(lo, hi)
  c.birthMonth = rint(0, 12)
  // Origen: dinastía propia con ese origen (la del juego puede ser de otra familia).
  const her = HERITAGES[spec.heritage], dyn = s.dynasties[c.dynastyId]
  if (her && dyn && dyn.heritage !== her) {
    const id = game.DA.newId()
    game.setReactive(s.dynasties, id, { ...JSON.parse(JSON.stringify(dyn)), id, heritage: her,
      prestige: (dyn.prestige || 0) + (HERITAGE_PRESTIGE[her] || 0) })
    c.dynastyId = id
    c.inheritance = s.dynasties[id].prestige / 7 * (0.25 + Math.random()) // dote, como el juego
  }
  if (game.TR) {
    if (spec.noBad) for (const tr of [...c.traits]) if (['bad', 'badGenetic'].includes(game.TR.list[tr]?.group)) game.TR.remove(c, tr)
    for (const tr of spec.traits) if (tr && !c.traits.includes(tr)) game.TR.add(c, tr)
  }
  // Las habilidades mínimas, después de los rasgos (que suman sus bonus).
  for (const k of SKILLS) {
    const m = SKILL_MINS[spec.skills[k]]
    if (m && (c.skills[k] || 0) < m) c.skills[k] = m + rint(0, 4)
  }
  game.setReactive(c, FLAG, true)
}

// Encarga el pedido para `targetId`: crea los candidatos y los pone primeros en la
// lista de la ventana. El precio lo cobra quien llama.
function order(targetId, isMatrilineal, spec) {
  const s = S()
  if (!game.SPOUSES || !s.characters[targetId]) return []
  const ids = game.SPOUSES.generate(COUNTS[spec.count], targetId, isMatrilineal)
  for (const id of ids) fit(s.characters[id], spec)
  const list = s.current.generatedPotentialSpouseCharacterIds
  s.current.generatedPotentialSpouseCharacterIds = [...ids, ...list.filter(id => !ids.includes(id))]
  game.store().dispatch('forceUpdateStore')
  return ids
}

// Candidatos de la casamentera que siguen disponibles para `targetId`.
const ordered = targetId => {
  const s = S()
  return (s.current.generatedPotentialSpouseCharacterIds || []).map(id => s.characters[id])
    .filter(c => c && c[FLAG] && c.flagGeneratedPotentialSpouse?.targetCharacterId === targetId && game.SPOUSES?.valid(c))
}

module.exports = { SKILLS, COUNTS, AGES, HERITAGES, SKILL_MINS, TRAIT_SLOTS, fee, orderable, defaultSpec, quote, order, ordered }
