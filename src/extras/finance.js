// Finanzas romanas: el banco (argentarius) y tres formas históricas de invertir.
//   - Pedir prestado al banco: todas las clases (con esclavitud por deudas, solo pagar).
//   - Prestar a otras familias: desde Class I.
//   - Sociedades de publicanos (contratos del Estado): Class I participaciones chicas,
//     Equites sin límite especial, Senatores solo con testaferro.
//   - Préstamo marítimo (fenus nauticum): desde Class III; Senatores con testaferro.
// Lo que tiene tu personaje cuenta (habilidades con sus rasgos, sin tope). 20 es neutral:
// por debajo penaliza (×(v/20)^1,24: 15 → ×0,70; 10 → ×0,42; mínimo ×0,1) y por encima
// mejora sin límite, según las decenas de más (30 → 1, 40 → 2…).
//   Administración = montos más altos, más de lo que cobras (intereses, dividendos,
//     ganancias de los barcos) y menos impagos de quienes te deben.
//   Elocuencia = menos interés al pedir, mejor precio al comprar y vender participaciones.
//   Inteligencia = menos riesgo (contratos y rutas) y riesgo mostrado más exacto.
//   Combate = recuperas más de una deuda impaga.
// Siguen los límites de la economía: interés mínimo 4%, probabilidades hasta 90%, no se
// recupera más del 100% de una deuda ni se vende una participación por más de su valor.
//   Honorable = −0,5 puntos de interés; Greedy = puedes cobrar 15% pero hay más impagos;
//   Sly = testaferro más barato (comisión 10%, escándalo 3%).
// Se guarda con la partida en current.modFlags.trainerFinance (y el banco anterior,
// trainerBank, pasa aquí). El cobro y los resultados anuales llegan en Martius (mes 3),
// cuando el juego pasa sus eventos anuales; los barcos, al cumplirse su viaje.
const game = require('game')

const FLAG = 'trainerFinance'
const OLD_BANK = 'trainerBank'
const YEAR_MONTH = 3 // Martius
const WINTER = [11, 12, 0, 1, 2] // November–Mercedonius: mare clausum
const MONTHS_PER_YEAR = 13

// Por clase: Proletarii, V, IV, III, II, I, Equites, Senatores.
const BANK_LIMIT = [600, 1500, 3000, 5000, 8000, 15000, 40000, 100000]
const BANK_RATE = [12, 11.5, 11, 10.5, 10, 9, 8.33, 8.33] // % anual (12% = centesima; 8⅓% = Doce Tablas)
const LEND_LIMIT = [0, 0, 0, 0, 0, 10000, 25000, 60000]
const SHARE_LIMIT = [0, 0, 0, 0, 0, 5000, 30000, 30000]
const SEA_LIMIT = [0, 0, 0, 2000, 3000, 6000, 15000, 30000]
const MIN_CLASS = { lend: 5, shares: 5, sea: 3 }

// Contratos del Estado: rendimiento anual (%), riesgo anual de quiebra y lo que se pierde.
const CONTRACTS = {
  asia: { min: 8, max: 20, risk: 0.06, loss: 0.7 },
  sicily: { min: 5, max: 11, risk: 0.02, loss: 0.5 },
  mines: { min: 6, max: 16, risk: 0.04, loss: 0.6 },
  works: { min: 4, max: 8, risk: 0.01, loss: 0.4 },
  army: { min: 3, max: 7, risk: 0.02, loss: 0.6, war: { min: 10, max: 24, risk: 0.06 } },
}
const ROUTES = ['Alexandria', 'Carthago', 'Gades', 'Massilia', 'Rhodus', 'Antiochia', 'Ostia', 'Puteoli']
const POOL_SHIPS = 50

const S = () => game.S()
const rnd = (a, b) => a + Math.random() * (b - a)
const rint = (a, b) => Math.floor(rnd(a, b + 1))
const round10 = n => Math.max(0, Math.round(n / 10) * 10)
const nowAbs = () => S().year * MONTHS_PER_YEAR + S().month

// --- Personaje y clase ---------------------------------------------------------------
const player = () => game.player()
const PIVOT = 20
const skillValue = k => Math.max(0, parseFloat(player()?.skills?.[k]) || 0)
// Penalización por debajo de 20 (1 desde 20).
const penalty = k => { const v = skillValue(k); return v >= PIVOT ? 1 : Math.max(0.1, (v / PIVOT) ** 1.24) }
// Decenas por encima de 20, sin tope (30 → 1, 40 → 2).
const above = k => Math.max(0, skillValue(k) - PIVOT) / 10
// Factor para algo bueno (montos, cobros): la penalización abajo de 20; arriba, +rate por decena.
const better = (k, rate) => skillValue(k) < PIVOT ? penalty(k) : 1 + rate * above(k)
// Factor para algo malo (riesgos, comisiones, impagos): crece abajo de 20; arriba se divide.
const worse = (k, rate) => skillValue(k) < PIVOT ? 2 - penalty(k) : 1 / (1 + rate * above(k))
const has = tr => !!player()?.traits?.includes(tr)
const cls = () => Math.max(0, Math.min(7, S().current.class || 0))
const isSenator = () => cls() >= 7
const debtSlave = () => !!S().current.flagIsDebtSlave
const size = () => better('stewardship', 0.75) // 15 → ×0,70; 20 → ×1; 30 → ×1,75; 40 → ×2,5
const gains = () => better('stewardship', 0.1) // intereses, dividendos y ganancias de barcos
// Testaferro (Senatores): comisión sobre lo que ganes y riesgo anual de escándalo.
const proxy = () => isSenator() ? { commission: has('sly') ? 0.1 : 0.2, scandal: has('sly') ? 0.03 : 0.05 } : null

// --- Datos guardados -----------------------------------------------------------------
function data() {
  const api = game.DA.api()
  let d = api.getGlobalFlag({ flag: FLAG })
  if (!d) {
    d = { debt: { principal: 0, rate: 0, billedYear: null }, lent: [], shares: [], voyages: [], offers: {}, yearDone: null, monthDone: null }
    const old = api.getGlobalFlag({ flag: OLD_BANK }) // banco anterior (mod de peritiSumus)
    if (old?.principal > 0) d.debt = { principal: old.principal, rate: old.rate || 0.083, billedYear: old.billedYear ?? null }
    api.setGlobalFlag({ flag: FLAG, data: d })
  }
  return d
}
const save = d => game.DA.api().setGlobalFlag({ flag: FLAG, data: d })
const sum = (list, k = 'amount') => list.reduce((a, x) => a + (x[k] || 0), 0)

// --- Disponibilidad ------------------------------------------------------------------
// '' = disponible; si no, el motivo (clave de texto).
function why(kind) {
  if (debtSlave()) return 'finDebtSlave'
  if (kind === 'bank') return ''
  return cls() >= MIN_CLASS[kind] ? '' : 'finMinClass_' + kind
}

// --- Banco: pedir prestado -----------------------------------------------------------
// Elocuencia: abajo de 20 hasta +4 puntos; arriba, −2 puntos por decena.
const eloPoints = () => skillValue('eloquence') < PIVOT ? 4 * (1 - penalty('eloquence')) : -2 * above('eloquence')
const bankRate = () => Math.max(4, BANK_RATE[cls()] + eloPoints() - (has('honorable') ? 0.5 : 0)) / 100
const bankLimit = () => round10(BANK_LIMIT[cls()] * size())
const debt = () => Math.max(0, data().debt.principal)
const debtRate = () => data().debt.rate || bankRate()
const interest = () => Math.ceil(debt() * debtRate())
const bankRoom = () => Math.max(0, bankLimit() - debt())
const borrowOffers = () => [0.25, 0.5, 0.75, 1].map(f => round10(bankRoom() * f)).filter((n, i, a) => n >= 50 && a.indexOf(n) === i)

// El dinero lo da quien llama (panel: directo; ventana del juego: statChanges).
function borrow(amount) {
  const d = data(), s = S(), p = d.debt.principal, r = bankRate()
  d.debt.rate = p > 0 ? (p * d.debt.rate + amount * r) / (p + amount) : r
  d.debt.principal = p + amount
  if (p <= 0) d.debt.billedYear = s.month >= YEAR_MONTH ? s.year : s.year - 1 // primer cobro en el próximo Martius
  save(d)
}
function repay(amount) { const d = data(); d.debt.principal = Math.max(0, d.debt.principal - amount); save(d) }

// Cobro anual del banco: una vez por año, desde Martius. Devuelve las opciones o null.
function dueBill() {
  if (busy()) return null
  const d = data(), s = S()
  if (d.debt.principal <= 0 || s.month < YEAR_MONTH || (d.debt.billedYear ?? -Infinity) >= s.year) return null
  d.debt.billedYear = s.year
  save(d)
  const i = Math.ceil(d.debt.principal * d.debt.rate)
  return { interest: i, principal: d.debt.principal, rate: d.debt.rate,
    extras: [100, 500, 1000, 2500, 5000].filter(x => d.debt.principal > x).map(x => ({ extra: x, total: x + i })), all: d.debt.principal + i }
}

// --- Prestar a otras familias --------------------------------------------------------
const lendLimit = () => round10(LEND_LIMIT[cls()] * size())
const lendRoom = () => Math.max(0, lendLimit() - sum(data().lent))
const lendRates = () => has('greedy') ? [6, 9, 12, 15] : [6, 9, 12]
// Probabilidad anual de impago según la tasa: más interés, más impagos.
const defaultChance = (req, ratePct) => Math.min(0.9, (1 - req.reliability) * (0.3 + 0.1 * (ratePct - 4)) * worse('stewardship', 0.5) * (has('greedy') ? 1.2 : 1))
// De una deuda impaga recuperas 30% con combate 20; menos por debajo y +25 puntos por
// decena por encima (hasta el 100%).
const recovery = () => skillValue('combat') < PIVOT ? 0.3 * penalty('combat') : Math.min(1, 0.3 + 0.25 * above('combat'))
// Lo que ves: una estimación (±60% con inteligencia 20; más exacta cuanto más inteligencia).
const shown = (real, fuzz) => Math.max(0, real * (1 + fuzz * worse('intelligence', 1)))

// Ofertas del mes (solicitudes de préstamo, contratos, viajes): se rehacen cada mes.
function offers(kind, make) {
  const d = data(), key = kind, now = nowAbs()
  if (d.offers[key]?.at !== now) { d.offers[key] = { at: now, list: make() }; save(d) }
  return d.offers[key].list
}
function takeOffer(kind, id) { const d = data(); d.offers[kind].list = (d.offers[kind]?.list || []).filter(o => o.id !== id); save(d) }

const lendRequests = () => why('lend') ? [] : offers('lend', () => {
  const mine = player()?.dynastyId
  const dyns = Object.values(S().dynasties).filter(x => x && x.id !== mine && x.nomen)
  const room = lendRoom()
  return Array.from({ length: 3 }, (_, i) => {
    const dy = dyns[rint(0, dyns.length - 1)] || {}
    return { id: 'l' + nowAbs() + i, family: [dy.nomen, dy.cognomen].filter(Boolean).join(' ') || 'Ignotus',
      amount: round10(room * rnd(0.15, 0.6)), years: rint(1, 3), reliability: rnd(0.85, 0.99), fuzz: rnd(-0.6, 0.6) }
  }).filter(r => r.amount >= 100)
})
function lend(reqId, ratePct) {
  const req = lendRequests().find(r => r.id === reqId)
  if (!req || req.amount > lendRoom()) return false
  const d = data()
  d.lent.push({ id: req.id, family: req.family, amount: req.amount, rate: ratePct / 100, endYear: S().year + req.years, reliability: req.reliability })
  save(d)
  takeOffer('lend', reqId)
  return req
}

// --- Sociedades de publicanos --------------------------------------------------------
const atWar = () => !!S().current.flagRomeAtWar
const contract = id => { const c = CONTRACTS[id]; return atWar() && c.war ? { ...c, ...c.war } : c }
const contractRisk = id => Math.min(0.9, contract(id).risk * worse('intelligence', 0.5))
const shareLimit = () => round10(SHARE_LIMIT[cls()] * size())
const shareRoom = () => Math.max(0, shareLimit() - sum(data().shares))
const shareFee = () => 0.05 * worse('eloquence', 1) // comisión al comprar: 5% con elocuencia 20
// Al vender: 90% con elocuencia 20; menos por debajo; por encima se acerca al 100%.
const sellFactor = () => skillValue('eloquence') < PIVOT ? 0.9 * (0.5 + 0.5 * penalty('eloquence')) : 1 - 0.1 / (1 + above('eloquence'))
// Estimación de riesgo de cada contrato, distinta cada año.
const contractFuzz = () => offers('contracts', () => Object.fromEntries(Object.keys(CONTRACTS).map(k => [k, rnd(-0.6, 0.6)])))
const shownContractRisk = id => shown(contractRisk(id), contractFuzz()[id] || 0)
function buyShares(cid, amount) {
  if (!CONTRACTS[cid] || amount > shareRoom()) return false
  const d = data()
  d.shares.push({ id: 's' + nowAbs() + '_' + d.shares.length, contract: cid, amount, since: S().year })
  save(d)
  return true
}
function sellShares(id) {
  const d = data(), sh = d.shares.find(x => x.id === id)
  if (!sh) return 0
  d.shares = d.shares.filter(x => x.id !== id)
  save(d)
  return Math.round(sh.amount * sellFactor())
}

// --- Préstamo marítimo (fenus nauticum) ----------------------------------------------
const seaLimit = () => round10(SEA_LIMIT[cls()] * size())
const seaRoom = () => Math.max(0, seaLimit() - sum(data().voyages))
const isWinter = () => WINTER.includes(S().month)
const voyageOffers = () => why('sea') ? [] : offers('sea', () => {
  const pool = [...ROUTES].sort(() => Math.random() - 0.5).slice(0, 3)
  return pool.map((route, i) => ({ id: 'v' + nowAbs() + i, route, rate: rint(20, 35), months: rint(3, 5), risk: rnd(0.1, 0.2), fuzz: rnd(-0.6, 0.6) }))
})
const voyageRisk = o => Math.min(0.9, o.risk * (isWinter() ? 2 : 1) * worse('intelligence', 0.5))
// Repartido entre 50 barcos (método de Catón): 5 puntos menos de interés.
const voyageRate = (o, pooled) => (o.rate - (pooled ? 5 : 0)) / 100
function sail(offerId, amount, pooled) {
  const o = voyageOffers().find(x => x.id === offerId)
  if (!o || amount > seaRoom()) return false
  const d = data()
  d.voyages.push({ id: o.id, route: o.route, amount, rate: voyageRate(o, pooled), risk: voyageRisk(o), pooled: !!pooled, due: nowAbs() + o.months })
  save(d)
  takeOffer('sea', offerId)
  return true
}

// El juego está pasando de mes: lo procesa en un Worker sobre una copia del estado y
// al terminar aplica los cambios, así que lo que se pague ahora podría perderse.
const busy = () => !!S()?.current?.showSpinner

// --- Resultados: barcos (cada mes) y el año (en Martius) -----------------------------
// Aplica el dinero y devuelve las líneas del informe ([] si no pasó nada).
function tick() {
  if (busy()) return []
  const s = S(), d = data(), now = nowAbs(), lines = [], px = proxy()
  const pay = n => { s.current.cash += n }
  if (d.monthDone !== now) {
    d.monthDone = now
    for (const v of d.voyages.filter(x => x.due <= now)) {
      // Lo que llega: el capital de los barcos que llegan más su interés; el interés
      // (la ganancia) se multiplica por la administración y paga la comisión del testaferro.
      let ok = 0, n = v.pooled ? POOL_SHIPS : 1
      for (let i = 0; i < n; i++) if (Math.random() >= v.risk) ok++
      const capital = v.amount * ok / n
      let profit = capital * v.rate * gains()
      if (px) profit *= 1 - px.commission
      const back = Math.round(capital + profit)
      pay(back)
      if (v.pooled) lines.push({ key: 'finSeaPool', vars: { route: v.route, ok, n, amount: back } })
      else if (ok) lines.push({ key: 'finSeaOk', vars: { route: v.route, amount: back } })
      else lines.push({ key: 'finSeaLost', vars: { route: v.route, amount: v.amount } })
    }
    d.voyages = d.voyages.filter(x => x.due > now)
  }
  if (s.month >= YEAR_MONTH && d.yearDone !== s.year) {
    d.yearDone = s.year
    // Préstamos a familias: interés, devolución al final o impago.
    for (const l of [...d.lent]) {
      if (Math.random() < defaultChance(l, l.rate * 100)) {
        const back = Math.round(l.amount * recovery())
        pay(back)
        lines.push({ key: 'finLendDefault', vars: { family: l.family, amount: back } })
        d.lent = d.lent.filter(x => x !== l)
        continue
      }
      const i = Math.round(l.amount * l.rate * gains())
      pay(i)
      if (s.year >= l.endYear) {
        pay(l.amount)
        lines.push({ key: 'finLendDone', vars: { family: l.family, amount: l.amount + i } })
        d.lent = d.lent.filter(x => x !== l)
      } else lines.push({ key: 'finLendPaid', vars: { family: l.family, amount: i } })
    }
    // Sociedades: dividendo o quiebra del contrato.
    for (const sh of d.shares) {
      const c = contract(sh.contract)
      if (Math.random() < contractRisk(sh.contract)) {
        const lost = Math.round(sh.amount * c.loss)
        sh.amount -= lost
        lines.push({ key: 'finShareLoss', vars: { contract: sh.contract, amount: lost } })
      } else {
        let div = sh.amount * rnd(c.min, c.max) / 100 * gains()
        if (px) div *= 1 - px.commission
        pay(Math.round(div))
        lines.push({ key: 'finShareDiv', vars: { contract: sh.contract, amount: div } })
      }
    }
    d.shares = d.shares.filter(x => x.amount >= 1)
    // Testaferro: si se descubre, el senador pierde prestigio e influencia.
    if (px && (d.shares.length || d.voyages.length) && Math.random() < px.scandal) {
      const dyn = game.dynasty()
      const p = Math.round((dyn?.prestige || 0) * 0.05), inf = Math.round(Math.max(0, s.current.influence) * 0.1)
      if (dyn) dyn.prestige -= p
      s.current.influence -= inf
      lines.push({ key: 'finScandal', vars: { prestige: p, influence: inf } })
    }
  }
  save(d)
  return lines
}

module.exports = {
  CONTRACTS, MIN_CLASS, ROUTES, POOL_SHIPS,
  PIVOT, cls, isSenator, proxy, skillValue, penalty, size, gains, why, data,
  bankRate, bankLimit, bankRoom, borrowOffers, debt, debtRate, interest, borrow, repay, dueBill,
  lendLimit, lendRoom, lendRates, lendRequests, defaultChance, shown, lend,
  contract, contractRisk, shownContractRisk, shareLimit, shareRoom, shareFee, sellFactor, buyShares, sellShares, atWar,
  seaLimit, seaRoom, isWinter, voyageOffers, voyageRisk, voyageRate, sail,
  busy, tick,
}
