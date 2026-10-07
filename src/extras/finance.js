// Finanzas romanas: el banco (argentarius) y tres formas históricas de invertir.
//   - Pedir prestado al banco: todas las clases (con esclavitud por deudas, solo pagar).
//   - Prestar a otras familias: desde Class I.
//   - Sociedades de publicanos (contratos del Estado): Class I participaciones chicas,
//     Equites sin límite especial, Senatores solo con testaferro.
//   - Préstamo marítimo (fenus nauticum): desde Class III; Senatores con testaferro.
//   - Depósito en el templo de Cástor: todas las clases. Lo depositado no es efectivo,
//     así que el juego no se lo lleva por pasar del tope (ver game.WEALTH); cobra una
//     custodia anual y no cuenta para la clase.
//   - Grano en los horrea: todas las clases. Se compra barato tras la cosecha
//     (Quintilis–September) y se vende caro antes de la siguiente (Aprilis–Iunius); se
//     pudre, lo comen las ratas o lo roban, y el edil a veces reparte grano barato.
// Lo que tiene tu personaje cuenta (habilidades con sus rasgos, sin tope). 20 es neutral:
// por debajo penaliza (×(v/20)^1,24: 15 → ×0,70; 10 → ×0,42; mínimo ×0,1) y por encima
// mejora sin límite, según las decenas de más (30 → 1, 40 → 2…).
//   Administración = montos más altos, más de lo que cobras (intereses, dividendos,
//     ganancias de los barcos) y menos impagos de quienes te deben.
//   Elocuencia = menos interés al pedir, mejor precio al comprar y vender participaciones.
//   Inteligencia = menos riesgo (contratos y rutas) y riesgo mostrado más exacto.
//   Combate = recuperas más de una deuda impaga y cuidas mejor el granero.
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
// Todas aceptan otro personaje (ch); por defecto es el tuyo.
const skillValue = (k, ch = player()) => Math.max(0, parseFloat(ch?.skills?.[k]) || 0)
// Penalización por debajo de 20 (1 desde 20).
const penalty = (k, ch) => { const v = skillValue(k, ch); return v >= PIVOT ? 1 : Math.max(0.1, (v / PIVOT) ** 1.24) }
// Decenas por encima de 20, sin tope (30 → 1, 40 → 2).
const above = (k, ch) => Math.max(0, skillValue(k, ch) - PIVOT) / 10
// Factor para algo bueno (montos, cobros): la penalización abajo de 20; arriba, +rate por decena.
const better = (k, rate, ch) => skillValue(k, ch) < PIVOT ? penalty(k, ch) : 1 + rate * above(k, ch)
// Factor para algo malo (riesgos, comisiones, impagos): crece abajo de 20; arriba se divide.
const worse = (k, rate, ch) => skillValue(k, ch) < PIVOT ? 2 - penalty(k, ch) : 1 / (1 + rate * above(k, ch))
const has = (tr, ch = player()) => !!ch?.traits?.includes(tr)
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
  // Partes que llegaron después (datos guardados con una versión anterior).
  if (!d.deposit) d.deposit = { amount: 0, feeYear: null }
  if (!d.grain) d.grain = { modii: 0, paid: 0, harvest: null, next: null }
  if (!d.provinces) d.provinces = {}
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

// --- Depósito en el templo de Cástor -----------------------------------------------
// Custodia anual: 1% con elocuencia 20 (menos con más elocuencia, nunca menos de 0,1%).
// Un incendio del templo (muy raro) quema parte de lo depositado.
const TEMPLE_FIRE = { risk: 0.004, loss: 0.25 }
const depositFee = () => Math.max(0.001, 0.01 * worse('eloquence', 1))
const deposited = () => Math.max(0, data().deposit.amount)
const cashCap = () => game.WEALTH?.cashCap() ?? Infinity
const excessCash = () => Math.max(0, Math.floor(S().current.cash - cashCap()))
// Clase que quedaría si sacas `amount` del efectivo (para avisar antes de depositar).
const classAfter = amount => game.WEALTH ? game.WEALTH.classFor(S().current.cash - amount) : cls()
function deposit(amount) {
  const d = data()
  if (d.deposit.amount <= 0) d.deposit.feeYear = S().month >= YEAR_MONTH ? S().year : S().year - 1 // primera custodia en el próximo Martius
  d.deposit.amount += amount
  save(d)
}
// Saca hasta `amount`; devuelve lo que sacó.
function withdraw(amount) {
  const d = data(), n = Math.min(amount, d.deposit.amount)
  d.deposit.amount -= n
  save(d)
  return n
}

// --- Grano en los horrea -------------------------------------------------------------
// Precio de un modius: base 1 × estación × cosecha del año × guerra × un poco cada mes.
// La cosecha se conoce en Quintilis (mes 7) y vale hasta el Iunius siguiente; desde
// Martius se puede estimar la próxima (más exacto cuanto más inteligencia). Una cosecha
// muy mala es hambruna: el grano vale 1,5 veces más, pero vender caro en una hambruna
// cuesta prestigio (o se puede vender al pueblo a precio justo y ganar influencia).
const SEASON = [1.08, 1.11, 1.14, 1.17, 1.2, 1.22, 1.14, 0.88, 0.85, 0.9, 0.96, 1, 1.04] // Ianuarius…December
const HARVEST_MONTH = 7 // Quintilis
const OWN_HARVEST = [7, 8, 9] // con tierras de cereal se compra más barato
const GRAIN_LIMIT = [1000, 2500, 5000, 8000, 12000, 25000, 60000, 100000] // modii por clase
const GRAIN_RISK = {
  rot: 0.006, // pérdida por mes (humedad, gorgojo)
  rats: { risk: 0.02, min: 0.08, max: 0.2 }, // por mes
  theft: { risk: 0.015, loss: 0.12 }, // por mes
  dole: 0.12, // por mes, Martius–Iunius: el edil reparte grano barato (precio ×0,75)
  famine: 1.18, // cosecha desde la que hay hambruna
}
const CEREAL = ['farmland', 'primeFarmland', 'latifundiumFood']
const grain = () => data().grain
const rollHarvest = () => ({ factor: rnd(0.8, 1.25), fuzz: rnd(-0.6, 0.6) })
// Cosecha que vale ahora; desde Martius también se tira la próxima (para estimarla).
function harvest() {
  const d = data(), g = d.grain, s = S()
  const year = s.month >= HARVEST_MONTH ? s.year : s.year - 1 // la cosecha que se está comiendo
  if (g.harvest?.year !== year) {
    const roll = g.next?.year === year ? g.next : rollHarvest()
    g.harvest = { year, factor: roll.factor }
    g.next = null
    save(d)
  }
  if (s.month >= YEAR_MONTH && s.month < HARVEST_MONTH && g.next?.year !== s.year) { g.next = { year: s.year, ...rollHarvest() }; save(d) }
  return g.harvest
}
const famine = () => harvest().factor >= GRAIN_RISK.famine
const doleNow = () => offers('dole', () => S().month >= YEAR_MONTH && S().month < HARVEST_MONTH && Math.random() < GRAIN_RISK.dole)
const grainPrice = () => {
  const noise = offers('grainNoise', () => rnd(0.94, 1.06))
  return SEASON[S().month] * harvest().factor * (famine() ? 1.5 : 1) * (atWar() ? 1.15 : 1) * noise * (doleNow() ? 0.75 : 1)
}
// Estimación de la próxima cosecha (null fuera de Martius–Iunius).
const harvestForecast = () => { harvest(); const n = grain().next; return n ? shown(n.factor, n.fuzz * 0.5) : null }
const ownsCereal = () => CEREAL.some(k => (S().current.propertyDetails?.[k] || 0) > 0)
// Al comprar pagas una comisión (3% con elocuencia 20); con tierras de cereal, en la
// cosecha, 10% menos. Al vender te pagan el 95% (con elocuencia 20; con 10, el 89%;
// por encima se acerca al 100%).
const grainBuyPrice = () => grainPrice() * (1 + 0.03 * worse('eloquence', 1)) * (ownsCereal() && OWN_HARVEST.includes(S().month) ? 0.9 : 1)
const grainSellFactor = () => skillValue('eloquence') < PIVOT ? 0.95 * (0.8 + 0.2 * penalty('eloquence')) : 1 - 0.05 / (1 + above('eloquence'))
const grainSellPrice = () => grainPrice() * grainSellFactor()
const grainLimit = () => Math.round(GRAIN_LIMIT[cls()] * size())
const grainRoom = () => Math.max(0, grainLimit() - grain().modii)
function buyGrain(modii, paid) {
  if (modii > grainRoom()) return false
  const d = data()
  d.grain.modii += modii
  d.grain.paid += paid
  save(d)
  return true
}
// Vende `modii` (o lo que quede); devuelve cuántos vendió.
function sellGrain(modii) {
  const d = data(), n = Math.min(modii, d.grain.modii)
  if (n <= 0) return 0
  d.grain.paid *= 1 - n / d.grain.modii
  d.grain.modii -= n
  save(d)
  return n
}
// Vender caro en una hambruna: prestigio que se pierde (más cuanto más vendes; doble
// para los senadores). Vender al pueblo a precio justo (1 por modius): influencia.
const hoardPenalty = modii => { const p = game.dynasty()?.prestige || 0; return Math.round(p * Math.min(0.1, 0.02 * modii / 1000) * (isSenator() ? 2 : 1)) }
const fairSaleInfluence = modii => Math.round(modii / 20)

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
    // Grano: se pudre un poco cada mes; a veces ratas o ladrones.
    const g = d.grain
    if (g.modii > 0) {
      const lose = (frac, key) => {
        const n = Math.min(g.modii, Math.round(g.modii * frac))
        if (n <= 0) return
        g.paid *= 1 - n / g.modii
        g.modii -= n
        if (key) lines.push({ key, vars: { amount: n } })
      }
      lose(GRAIN_RISK.rot * worse('stewardship', 0.5))
      if (Math.random() < Math.min(0.9, GRAIN_RISK.rats.risk * worse('intelligence', 0.5))) lose(rnd(GRAIN_RISK.rats.min, GRAIN_RISK.rats.max), 'finGrainRats')
      if (Math.random() < Math.min(0.9, GRAIN_RISK.theft.risk * worse('combat', 0.5))) lose(GRAIN_RISK.theft.loss, 'finGrainTheft')
    }
    // La cosecha nueva, si tienes grano o ya lo usaste.
    if (s.month === HARVEST_MONTH && (g.modii > 0 || g.harvest)) {
      const h = harvest().factor
      lines.push({ key: h >= GRAIN_RISK.famine ? 'finGrainFamine' : h > 1.05 ? 'finGrainPoor' : h < 0.92 ? 'finGrainGood' : 'finGrainNormal', vars: {} })
    }
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
    // Depósito: custodia del año y, muy raro, un incendio en el templo.
    if (d.deposit.amount > 0 && (d.deposit.feeYear ?? -Infinity) < s.year) {
      d.deposit.feeYear = s.year
      const fee = Math.ceil(d.deposit.amount * depositFee())
      d.deposit.amount -= fee
      lines.push({ key: 'finDepositFee', vars: { amount: fee, left: d.deposit.amount } })
      if (Math.random() < TEMPLE_FIRE.risk) {
        const lost = Math.round(d.deposit.amount * TEMPLE_FIRE.loss)
        d.deposit.amount -= lost
        lines.push({ key: 'finTempleFire', vars: { amount: lost } })
      }
    }
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
  depositFee, deposited, cashCap, excessCash, classAfter, deposit, withdraw, TEMPLE_FIRE,
  SEASON, GRAIN_RISK, grain, harvest, famine, doleNow, grainPrice, harvestForecast, ownsCereal, grainBuyPrice, grainSellPrice,
  grainLimit, grainRoom, buyGrain, sellGrain, hoardPenalty, fairSaleInfluence,
  better, worse, has, rnd, nowAbs, YEAR_MONTH,
  busy, tick,
}
