// Qué puede pasar al elegir cada opción de un evento militar. Para las opciones
// que llevan a otra ventana se supone que después se elige la recomendada
// (better); crownPath da además el resultado jugando a por la corona (crownFirst).
// Las cifras son valores esperados y ya están escaladas como lo hace el juego.
const { EVENTS, SCALED } = require('war/events')
const game = require('game')

const KIND = { pr: 'prestige', inf: 'influence', cash: 'cash' }
const STAT_KEYS = ['pr', 'inf', 'cash']

const empty = () => ({ death: 0, crown: 0, crownId: null, pr: 0, inf: 0, cash: 0, traits: {}, endWar: 0, endTerm: 0, exile: 0 })

// Valor real de unos cambios del árbol ({ pr, inf, cash, sc }).
function stats(st, into = empty()) {
  const sc = st.sc || SCALED
  for (const k of STAT_KEYS) {
    if (st[k]) into[k] += game.STATS ? game.STATS.real(KIND[k], st[k], sc.includes(KIND[k])) : st[k]
  }
  return into
}

// a += b × p
function add(a, b, p) {
  for (const k of ['death', 'crown', 'pr', 'inf', 'cash', 'endWar', 'endTerm', 'exile']) a[k] += b[k] * p
  for (const [id, q] of Object.entries(b.traits)) a.traits[id] = (a.traits[id] || 0) + q * p
  a.crownId = a.crownId || b.crownId
  return a
}

// Mejor primero: menos riesgo de morir, más probabilidad de corona, menos
// heridas o rasgos malos, y más prestigio + influencia (+ dinero/10).
const EPS = 0.0005
const badTraits = s => Object.entries(s.traits).filter(([id]) => !/^corona/.test(id)).reduce((n, [, q]) => n + q, 0)
function better(a, b) {
  if (Math.abs(a.death - b.death) > EPS) return a.death < b.death
  if (Math.abs(a.crown - b.crown) > EPS) return a.crown > b.crown
  if (Math.abs(badTraits(a) - badTraits(b)) > EPS) return badTraits(a) < badTraits(b)
  return a.pr + a.inf + a.cash / 10 > b.pr + b.inf + b.cash / 10
}
// Para quien busca la corona: primero la probabilidad de corona.
function crownFirst(a, b) {
  if (Math.abs(a.crown - b.crown) > EPS) return a.crown > b.crown
  return better(a, b)
}
const bestIndex = (summaries, cmp = better) => summaries.reduce((best, s, i) => best < 0 || cmp(s, summaries[best]) ? i : best, -1)

const prob = (b, ch) => typeof b.p === 'function' ? b.p(ch) : (b.p ?? 1)
const traitsOf = (b, ch) => typeof b.traits === 'function' ? b.traits(ch) : (b.traits || [])

// Efectos propios de una rama (sin lo que venga después).
function branchEffects(b, ch) {
  const s = stats(b)
  if (b.death) s.death = 1
  if (b.crown) { s.crown = 1; s.crownId = b.crown }
  for (const id of traitsOf(b, ch)) s.traits[id] = (s.traits[id] || 0) + 1
  if (b.crown) s.traits[b.crown] = (s.traits[b.crown] || 0) + 1
  for (const k of ['endWar', 'endTerm', 'exile']) if (b[k]) s[k] = 1
  return s
}

// Ramas de un paso con su probabilidad para este personaje.
const branches = (evId, key, ch) => (EVENTS[evId]?.steps[key] || [])
  .map(b => ({ b, p: Math.max(0, Math.min(1, prob(b, ch))) })).filter(x => x.p > 0)

// `cmp` decide qué se elige en las ventanas siguientes (better o crownFirst).
function stepSummary(evId, key, ch, cmp = better, depth = 0) {
  const out = empty()
  if (depth > 40) return out
  for (const { b, p } of branches(evId, key, ch)) add(out, branchSummary(evId, b, ch, cmp, depth), p)
  return out
}

// Una rama con lo que venga después (eligiendo según `cmp`).
function branchSummary(evId, b, ch, cmp = better, depth = 0) {
  const s = branchEffects(b, ch)
  if (b.options?.length) {
    const subs = b.options.map(o => optionSummary(evId, o, ch, cmp, depth + 1))
    add(s, subs[bestIndex(subs, cmp)], 1)
  }
  return s
}

// Opción del árbol: { text, to, st }.
function optionSummary(evId, opt, ch, cmp = better, depth = 0) {
  const s = opt.st ? stats(opt.st) : empty()
  return opt.to ? add(s, stepSummary(evId, opt.to, ch, cmp, depth), 1) : s
}

// Lo mismo jugando a por la corona; null si así no hay más probabilidad de corona.
function crownPath(evId, opt, ch, recSummary) {
  if (!opt.to) return null
  const s = optionSummary(evId, opt, ch, crownFirst)
  return s.crown > recSummary.crown + EPS ? s : null
}

// Paso al que lleva una acción del juego ({ event, method, context }).
function stepKey(evId, action) {
  const ctx = action.context?.examine ?? action.context?.type
  const steps = EVENTS[evId]?.steps || {}
  return ctx != null && steps[action.method + ':' + ctx] ? action.method + ':' + ctx : action.method
}

// statChanges del juego → valores reales.
function liveStats(sc) {
  if (!sc) return empty()
  const scaled = sc.scaleByRevenue || []
  const s = empty()
  for (const [k, kind] of Object.entries(KIND)) {
    if (sc[kind]) s[k] += game.STATS ? game.STATS.real(kind, sc[kind], scaled.includes(kind)) : sc[kind]
  }
  return s
}

// Ventana abierta en el juego → { evId, ev, options: [{ text, summary, crown }], rec }
// o null si no es un evento militar conocido. `crown` es el resumen jugando a por
// la corona cuando difiere del recomendado.
function analyzeModal(m, ch) {
  if (!m?.show || !m.options?.length) return null
  let evId = m.options.map(o => o.action?.event).find(e => EVENTS[e])
  if (!evId) evId = Object.keys(EVENTS).find(id => EVENTS[id].title === m.title)
  if (!evId) return null
  const options = m.options.map(o => {
    const a = o.action
    const live = cmp => {
      const s = liveStats(o.statChanges)
      if (a?.event === evId) add(s, stepSummary(evId, stepKey(evId, a), ch, cmp), 1)
      else if (a?.event === 'lifeAndDeath/death' && a.method === 'kill') s.death = 1
      return s
    }
    const summary = live(better), crown = live(crownFirst)
    return { text: o.text, summary, crown: crown.crown > summary.crown + EPS ? crown : null }
  })
  return { evId, ev: EVENTS[evId], options, rec: options.length > 1 ? bestIndex(options.map(o => o.summary)) : -1 }
}

module.exports = { EVENTS, analyzeModal, optionSummary, crownPath, branches, branchEffects, bestIndex }
