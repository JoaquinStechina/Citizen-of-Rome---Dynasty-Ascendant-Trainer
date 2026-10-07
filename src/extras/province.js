// Gobierno de provincias. En el juego, los pro-magistrados (proConsul, proPraetor,
// proAedile, proQuaestor) no cobran sueldo [0262]: el Senado nombra a un senador que ya
// tuvo el cargo [e195] (flagProMagistracyAppointment = { post, year, month: 3 }) y el
// mandato termina al Martius siguiente [3ca4]. En Roma, gobernar una provincia era la
// forma de hacerse rico (y de terminar juzgado de repetundis).
//
// Al empezar un mandato de alguien de tu casa eliges cómo gobierna:
//   honesto  = solo lo que le corresponde; al terminar gana prestigio e influencia.
//   moderado = lo que se esperaba de un gobernador.
//   rapaz    = el triple, con mucho más riesgo de juicio (Greedy: un 20% más).
// Lo que saca se junta cada mes y llega al terminar el mandato. Si quien gobierna
// muere, su familia se queda con lo juntado y no hay juicio. Si no, puede haber una
// acusación de repetundis (ley Calpurnia, 149 a. C.): te defiendes solo, contratas a un
// orador o sobornas al jurado; si te condenan, devuelves el doble (ley Acilia, 123 a. C.)
// y pierdes prestigio e influencia.
// Cuentan los atributos de quien gobierna: administración = cuánto saca; inteligencia =
// lo oculta mejor (menos acusaciones); elocuencia = se defiende mejor en el juicio.
// Honorable = la mitad de acusaciones.
const game = require('game')
const FIN = require('extras/finance')

const POSTS = { proConsul: 1500, proPraetor: 1000, proQuaestor: 450, proAedile: 300 } // por mes, moderado
const LEVELS = {
  honest: { take: 0.25, trial: 0.03 },
  moderate: { take: 1, trial: 0.15 },
  rapacious: { take: 3, trial: 0.45 },
}
const PROVINCES = {
  proConsul: ['Asia', 'Macedonia', 'Africa', 'Hispania Ulterior', 'Gallia Cisalpina', 'Syria'],
  proPraetor: ['Sicilia', 'Sardinia et Corsica', 'Hispania Citerior', 'Achaia', 'Cilicia', 'Gallia Narbonensis'],
}
PROVINCES.proQuaestor = PROVINCES.proPraetor
PROVINCES.proAedile = ['Ostia (annona)', 'Puteoli (annona)', 'Campania']
// Juicio: condena sin ayuda (con elocuencia 20) y lo que hace cada defensa.
const CONVICT = 0.5
const DEFENSES = {
  self: { cost: 0, factor: 1 },
  orator: { cost: 0.1, factor: 0.5 }, // un gran orador cobra el 10% de lo juntado
  bribe: { cost: 0.25, factor: 0.3, exposed: 0.25 }, // sobornar al jurado: puede saberse
}
const RESTITUTION = 2
const PENALTY = { prestige: 0.1, influence: 0.25, bribe: 0.05 }
const HONEST_REWARD = { prestige: 0.03, influence: 0.05 }

const S = () => game.S()
const data = () => FIN.data()
const save = d => game.DA.api().setGlobalFlag({ flag: 'trainerFinance', data: d })
const keyOf = (ch, flag) => ch.id + ':' + flag.post + ':' + flag.year
// Miembros de la casa con un mandato en curso.
const governors = () => game.household().filter(ch => POSTS[ch.job] && ch.flagProMagistracyAppointment?.post === ch.job)

const monthly = (post, level, ch) => POSTS[post] * LEVELS[level].take * FIN.better('stewardship', 0.25, ch) *
  (level === 'rapacious' && FIN.has('greedy', ch) ? 1.2 : 1) * (S().current.flagRomeAtWar && ch.flagAtWar ? 1.5 : 1)
const trialChance = (level, ch) => Math.min(0.9, LEVELS[level].trial * FIN.worse('intelligence', 0.5, ch) * (FIN.has('honorable', ch) ? 0.5 : 1))
const convictChance = (ch, defense) => Math.min(0.95, CONVICT * FIN.worse('eloquence', 1, ch) * DEFENSES[defense].factor)
const defenseCost = (rec, defense) => Math.round(rec.accrued * DEFENSES[defense].cost)
// Estimación para las opciones de la ventana (un año de mandato).
const estimate = (rec, level) => { const ch = S().characters[rec.id]; return ch ? { year: Math.round(monthly(rec.post, level, ch) * 13), trial: trialChance(level, ch) } : null }

// Cada mes: mandatos nuevos (para preguntar cómo gobernar), lo juntado y los que
// terminan. Devuelve { ask: [rec], ended: [{ rec, trial }] }.
function check() {
  const out = { ask: [], ended: [] }
  if (FIN.busy()) return out
  const d = data(), now = FIN.nowAbs(), s = S()
  let changed = false
  for (const ch of governors()) {
    const key = keyOf(ch, ch.flagProMagistracyAppointment)
    if (!d.provinces[key]) {
      const list = PROVINCES[ch.job]
      d.provinces[key] = { key, id: ch.id, post: ch.job, province: list[Math.floor(Math.random() * list.length)], level: null, accrued: 0, month: now, ended: false }
      changed = true
    }
    const rec = d.provinces[key]
    if (!rec.level && !rec.asked) { rec.asked = true; out.ask.push(rec); changed = true }
    if (rec.month < now) { // un mes más de mandato
      rec.accrued += monthly(rec.post, rec.level || 'moderate', ch) * FIN.rnd(0.8, 1.2) * (now - rec.month)
      rec.month = now
      changed = true
    }
  }
  // Terminaron: quien gobernaba ya no tiene ese mandato (o murió).
  const active = new Set(governors().map(ch => keyOf(ch, ch.flagProMagistracyAppointment)))
  for (const rec of Object.values(d.provinces)) {
    if (rec.ended || active.has(rec.key)) continue
    rec.ended = true
    rec.accrued = Math.round(rec.accrued)
    s.current.cash += rec.accrued
    const ch = s.characters[rec.id], level = rec.level || 'moderate'
    const trial = !!ch && !ch.isDead && Math.random() < trialChance(level, ch)
    if (trial) rec.trial = true
    else if (level === 'honest' && ch && !ch.isDead) {
      const dyn = game.dynasty(), p = Math.round((dyn?.prestige || 0) * HONEST_REWARD.prestige), inf = Math.round(Math.max(0, s.current.influence) * HONEST_REWARD.influence)
      if (dyn) dyn.prestige += p
      s.current.influence += inf
      rec.reward = { prestige: p, influence: inf }
    }
    out.ended.push({ rec, trial })
    changed = true
  }
  // Se olvidan los mandatos de hace más de 5 años.
  for (const [k, rec] of Object.entries(d.provinces)) if (rec.ended && !rec.trial && now - rec.month > 65) { delete d.provinces[k]; changed = true }
  if (changed) save(d)
  return out
}

function choose(key, level) {
  const d = data(), rec = d.provinces[key]
  if (!rec || !LEVELS[level] || rec.ended) return null
  rec.level = level
  save(d)
  return rec
}

// Resuelve el juicio (el costo de la defensa lo cobra la ventana). Devuelve el resultado.
function trial(key, defense) {
  const d = data(), rec = d.provinces[key], s = S()
  if (!rec?.trial || !DEFENSES[defense]) return null
  const ch = s.characters[rec.id]
  rec.trial = false
  const out = { rec, defense, convicted: Math.random() < convictChance(ch, defense), exposed: defense === 'bribe' && Math.random() < DEFENSES.bribe.exposed }
  const dyn = game.dynasty()
  let prestige = 0, influence = 0
  if (out.convicted) {
    out.restitution = Math.round(rec.accrued * RESTITUTION)
    s.current.cash -= out.restitution
    prestige += (dyn?.prestige || 0) * PENALTY.prestige
    influence += Math.max(0, s.current.influence) * PENALTY.influence
  }
  if (out.exposed) prestige += (dyn?.prestige || 0) * PENALTY.bribe
  out.prestige = Math.round(prestige)
  out.influence = Math.round(influence)
  if (dyn) dyn.prestige -= out.prestige
  s.current.influence -= out.influence
  save(d)
  return out
}

// Mandatos para el panel: en curso y juicios pendientes.
const list = () => Object.values(data().provinces).filter(r => !r.ended || r.trial)
const pendingTrials = () => Object.values(data().provinces).filter(r => r.trial)

module.exports = { POSTS, LEVELS, DEFENSES, RESTITUTION, PENALTY, check, choose, trial, estimate, convictChance, defenseCost, list, pendingTrials }
