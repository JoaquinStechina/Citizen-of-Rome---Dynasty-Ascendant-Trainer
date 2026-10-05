// Botones de los mods dentro de la interfaz del juego, como los ponen los mods
// originales: en cada personaje (Jugar como, Divorcio, Dar en adopción, Casamentera,
// y Pedir un préstamo en el jugador) y en la pantalla principal (Tema, Nueva
// dinastía, Escenarios). Abren ventanas del juego. El cobro anual del banco también
// es una ventana del juego.
//
// Los botones se guardan en la partida (characters[id].actions, current.actions)
// como cualquier acción del juego, pero sus métodos son eventos 'trainer/...' que
// solo existen con el trainer cargado (game.HOOK). Cada botón lleva un preCheck que
// el juego evalúa al dibujarlo: sin el trainer falla y el juego oculta el botón.
// Ni las acciones ni las ventanas activan el modo mods (isDAAPI: false).
const i18n = require('core/i18n')
const ls = require('core/storage')
const game = require('game')
const A = require('extras/actions')
const THEMES = require('extras/themes')
const SCENARIOS = require('extras/scenarios')
const ICONS = require('extras/icons')
const FIN = require('extras/finance')
const MM = require('extras/matchmaker')

const { t } = i18n
const KEY = 'corTrainerInGame'
// Firma de los botones: si cambia (otro idioma, o una versión nueva de este archivo)
// se rehacen; si no, se dejan como están para no redibujar a nadie.
const VERSION = 1
const sig = () => VERSION + ':' + i18n.lang()
// Bloques que se pueden mostrar en el juego, en el orden del panel.
const FEATURES = ['theme', 'playAs', 'divorce', 'adopt', 'dynasty', 'scenario', 'bank', 'matchmaker']
const CHARACTER = ['playAs', 'divorce', 'adopt']
const ACTION = f => 'trainer_' + f // clave de la acción en el juego

const enabled = f => ls.get(KEY, {})[f] ?? true
const setEnabled = (f, v) => { const o = ls.get(KEY, {}); o[f] = !!v; ls.set(KEY, o) }

const api = () => game.DA.api()
const S = () => game.S()
const ev = name => game.HOOK.event(name)
const call = (name, method, context) => ({ event: ev(name), method, context })
// Abre una ventana del juego (si ya hay otra abierta, la del trainer la reemplaza, como en el mod Play As).
const show = modal => api().displayInteractionModal({ isManualOnly: true, ...modal })
const cancel = () => ({ text: t('xCancel') })

// Puede mostrarse el botón (también lo comprueba el juego al dibujarlo, con preCheck).
const VISIBLE = {
  playAs: id => enabled('playAs') && A.canPlayAs(S().characters[id]),
  divorce: id => enabled('divorce') && A.canDivorce(S().characters[id]),
  adopt: id => enabled('adopt') && A.canAdopt(S().characters[id]),
}
const fmt = n => Math.round(n).toLocaleString()
const traitName = id => game.TR?.titles[id]?.title || id

// Formulario del pedido a la casamentera, como desplegables de la ventana del juego.
// Cada entrada: [campo, título, opciones [{ label, value }]].
const orderFields = () => {
  const any = t('xMmAny')
  const fields = [
    ['count', t('xMmCount'), MM.COUNTS.map((n, i) => ({ label: String(n), value: i }))],
    ['age', t('age'), MM.AGES.map(([a, b], i) => ({ label: a + '–' + b, value: i }))],
    ['heritage', t('xHeritage'), MM.HERITAGES.map((h, i) => ({ label: h ? t('xH_' + h) : any, value: i }))],
    ...MM.SKILLS.map(k => ['skill:' + k, t(k) + ' ' + t('xMmMin'), MM.SKILL_MINS.map((m, i) => ({ label: m ? m + '+' : any, value: i }))]),
  ]
  const traits = [{ label: '—', value: '' }, ...MM.orderable().map(id => ({ label: traitName(id) + ' (' + t('g_' + game.TR.list[id].group) + ')', value: id }))]
  for (let i = 0; i < MM.TRAIT_SLOTS; i++) fields.push(['trait:' + i, t('xMmTrait') + ' ' + (i + 1), traits])
  fields.push(['noBad', t('xMmNoBad'), [{ label: t('xNo'), value: false }, { label: t('xYes'), value: true }]])
  return fields
}
const specGet = (spec, field) => {
  const [k, sub] = field.split(':')
  return k === 'skill' ? spec.skills[sub] : k === 'trait' ? spec.traits[sub] : spec[k]
}
const specSet = (spec, field, v) => {
  const [k, sub] = field.split(':')
  if (k === 'skill') spec.skills[sub] = v
  else if (k === 'trait') spec.traits[sub] = v
  else spec[k] = v
}
// Texto del precio: total y desglose.
const quoteText = q => q.items.map(({ key, cost }) => {
  const [k, sub] = key.split(':')
  const name = k === 'fee' ? t('xMmFeeItem') : k === 'count' ? t('xMmCount') : k === 'heritage' ? t('xHeritage') :
    k === 'noBad' ? t('xMmNoBad') : k === 'trait' ? traitName(sub) : t(k)
  return name + ' ' + fmt(cost)
}).join(' · ')

// --- Eventos ------------------------------------------------------------------------
// El juego llama a methods[m](contextoDelStore, { ...context, ...params }).
const EVENTS = {
  playAs: {
    visible: (_, { characterId }) => VISIBLE.playAs(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId]
      if (!A.canPlayAs(ch)) return
      show({
        title: t('xPlayAs'), image: ICONS.playAs,
        message: t('xPlayAsConfirm', { name: A.link(ch) }),
        options: [{ variant: 'info', text: t('xYes'), action: call('playAs', 'confirm', { characterId }) }, cancel()],
      })
    },
    confirm: (_, { characterId }) => { A.playAs(characterId) },
  },
  divorce: {
    visible: (_, { characterId }) => VISIBLE.divorce(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId], sp = A.spouseOf(ch)
      if (!sp) return
      show({
        title: t('xDivorce'), image: ICONS.divorce,
        message: t('xDivorceMsg', { a: A.link(ch), b: A.link(sp) }),
        options: [{ variant: 'danger', text: t('xDivorceYes'), tooltip: t('xIrreversible'),
          statChanges: A.statChanges(A.DIVORCE_COST), action: call('divorce', 'confirm', { characterId }) }, cancel()],
      })
    },
    confirm: (_, { characterId }) => { A.divorce(characterId) },
  },
  adopt: {
    visible: (_, { characterId }) => VISIBLE.adopt(characterId),
    process(_, { characterId }) {
      const ch = S().characters[characterId]
      if (!A.canAdopt(ch)) return
      show({
        title: t('xAdopt'), image: ICONS.adopt,
        message: t('xAdoptMsg', { name: A.link(ch) }),
        options: [{ variant: 'danger', text: t('xAdoptYes', { name: ch.praenomen }), tooltip: t('xIrreversible'),
          statChanges: A.statChanges(A.ADOPT_COST), action: call('adopt', 'confirm', { characterId }) },
        { text: t('xAdoptNo', { name: ch.praenomen }) }],
      })
    },
    confirm: (_, { characterId }) => { A.adopt(characterId) },
  },
  theme: {
    visible: () => enabled('theme'),
    process() {
      const ids = ['', ...Object.keys(THEMES.LIST)]
      show({
        title: t('xTheme'), image: ICONS.theme, message: t('xThemeMsg'),
        dropdowns: [{
          title: t('xTheme'), selected: Math.max(0, ids.indexOf(THEMES.current())),
          options: ids.map(id => ({ label: id ? THEMES.label(id) : t('xThemeGame'), value: id })),
          onChange: call('theme', 'pick'),
        }],
        options: [{ text: '☾ ' + t('xDarkModeToggle'), action: call('theme', 'dark') }, { text: t('xOk') }],
      })
      setTimeout(orderStyle, 50) // barra en la lista de temas
    },
    pick: (_, { option }) => THEMES.apply(option?.value || ''),
    dark: ({ dispatch }) => dispatch('toggleSetting', { setting: 'darkMode' }),
  },
  dynasty: {
    visible: () => enabled('dynasty'),
    // Lo que se va escribiendo en la ventana (el juego llama a onChange en cada cambio).
    draft: null,
    process() {
      const d = game.dynasty()
      if (!d) return
      const heritage = A.HERITAGES.includes(d.heritage) ? d.heritage : A.HERITAGES[0]
      EVENTS.dynasty.draft = { nomen: d.nomen || '', cognomen: d.cognomen || '', heritage }
      show({
        title: t('xDynasty'), image: ICONS.dynasty, message: t('xDynastyMsg'),
        inputs: [
          { type: 'text', title: t('xNomen'), value: d.nomen || '', onChange: call('dynasty', 'set', { field: 'nomen' }) },
          { type: 'text', title: t('xCognomen'), value: d.cognomen || '', onChange: call('dynasty', 'set', { field: 'cognomen' }) },
        ],
        dropdowns: [{
          title: t('xHeritage'), selected: A.HERITAGES.indexOf(heritage),
          options: A.HERITAGES.map(h => ({ label: t('xH_' + h), value: h })),
          onChange: call('dynasty', 'set', { field: 'heritage' }),
        }],
        options: [{ variant: 'info', text: t('xDynastyBtn'), action: call('dynasty', 'confirm') }, cancel()],
      })
    },
    set(_, { field, input, option }) {
      const draft = EVENTS.dynasty.draft
      if (draft) draft[field] = field === 'heritage' ? option?.value : input?.value
    },
    confirm() {
      const draft = EVENTS.dynasty.draft
      EVENTS.dynasty.draft = null
      if (draft) A.branchDynasty(draft)
    },
  },
  scenario: {
    visible: () => enabled('scenario'),
    process() {
      show({
        title: t('xScenario'), image: ICONS.scenario, message: t('xScenarioMsg'),
        options: [...SCENARIOS.list.map(sc => ({
          text: t('scn_' + sc.id), tooltip: t('scn_' + sc.id + '_info'), action: call('scenario', 'play', { id: sc.id }),
        })), { text: t('xNotNow') }],
      })
    },
    play: (_, { id }) => { A.playScenario(id) },
    // Boda con Attica (escenario de Agrippa): los premios y castigos van en statChanges.
    attica: (_, { yes }) => { if (yes) A.atticaWedding() },
  },
  // Argentarius: el banco y las inversiones (extras/finance). Cada ventana lleva a la
  // siguiente por la cola del juego (se abre al cerrarse la anterior). El dinero lo
  // mueven los statChanges de cada opción; si la acción no se puede hacer (algo cambió
  // entre medio), se devuelve.
  bank: {
    visible: () => enabled('bank'),
    process() { show(finHub()) },
    hub() { next(finHub()) },
    borrowMenu() { next(finBorrow()) },
    borrow: (_, { amount }) => { FIN.borrow(amount) },
    repayMenu() { next(finRepay()) },
    repay: (_, { amount }) => { FIN.repay(amount) },
    lendMenu() { next(finLend()) },
    lendRate: (_, { id }) => { next(finLendRate(id)) },
    lend: (_, { id, rate, amount }) => { if (!FIN.lend(id, rate)) refund(amount) },
    sharesMenu() { next(finShares()) },
    buyMenu: (_, { cid }) => { next(finBuy(cid)) },
    buy: (_, { cid, amount, paid }) => { if (!FIN.buyShares(cid, amount)) refund(paid) },
    sellMenu() { next(finSell()) },
    sell: (_, { id, value }) => { if (!FIN.sellShares(id)) refund(-value) },
    seaMenu() { next(finSea()) },
    seaAmount: (_, { id }) => { next(finSeaAmount(id)) },
    sail: (_, { id, amount, pooled }) => { if (!FIN.sail(id, amount, pooled)) refund(amount) },
    portfolio() { next(finPortfolio()) },
  },
  // Casamentera: se abre desde su botón en la ventana "Arrange Betrothal".
  matchmaker: {
    // Pedido en curso (lo que se va eligiendo en los desplegables).
    draft: null,
    process(_, { characterId, isMatrilineal }) {
      const ch = S().characters[characterId]
      if (!ch || !game.SPOUSES?.valid(ch)) return
      const spec = EVENTS.matchmaker.draft?.characterId === characterId ? EVENTS.matchmaker.draft.spec : MM.defaultSpec()
      EVENTS.matchmaker.draft = { characterId, isMatrilineal, spec }
      show({
        title: t('xMatchmaker'), image: ICONS.matchmaker,
        message: t('xMmOrderMsg', { name: A.link(ch) }) + (isMatrilineal ? ' ' + t('xMmMatrilineal') : ''),
        dropdowns: orderFields().map(([field, title, options]) => ({
          title, options, selected: Math.max(0, options.findIndex(o => o.value === specGet(spec, field))),
          onChange: call('matchmaker', 'set', { field }),
        })),
        options: [payOption(), cancel()],
      })
      setTimeout(orderStyle, 50) // la ventana se abre en el siguiente ciclo
    },
    // Cambio en un desplegable: se guarda y se actualiza el precio del botón de pagar.
    set(_, { field, option }) {
      const d = EVENTS.matchmaker.draft, m = S().interactionModal
      if (!d || !option) return
      specSet(d.spec, field, option.value)
      if (m?.options?.[0]?.action?.method === 'order') {
        const pay = payOption()
        // El juego avisa "You may not be able to afford this" solo al abrir; aquí al cambiar.
        Object.assign(m.options[0], pay, { cantAfford: !!pay.statChanges.cash && -pay.statChanges.cash * api().calculateScaleByClassFactor() > S().current.cash })
      }
    },
    order() {
      const d = EVENTS.matchmaker.draft
      if (d) MM.order(d.characterId, d.isMatrilineal, d.spec)
    },
  },
}

// Botón de pagar el pedido, con el total y su desglose (o gratis).
function payOption() {
  const d = EVENTS.matchmaker.draft, q = MM.quote(d.spec), n = MM.COUNTS[d.spec.count]
  const cost = A.costsOn() ? q.total : 0
  return {
    variant: 'info', text: t('xMmOrderPay', { n, total: cost ? fmt(cost) : t('xFree') }),
    tooltip: A.costsOn() ? quoteText(q) : t('xFree'),
    statChanges: cost ? money(-cost) : {}, action: call('matchmaker', 'order'),
  }
}

// Dinero en statChanges: el juego lo multiplica por el factor de clase, así que se
// divide antes para que se cobre (o dé) exactamente `real`.
function money(real) { return { cash: real / api().calculateScaleByClassFactor() } }

// --- Ventanas del argentarius ---------------------------------------------------------
// La siguiente ventana, desde la acción de otra: va a la cola y se abre al cerrarse esa.
function next(modal) {
  api().pushInteractionModalQueue({ isManualOnly: true, image: ICONS.bank, ...modal })
  api().processInteractionModalQueue()
}
function refund(n) { if (n) S().current.cash += n }
const pct = x => (Math.round(x * 1000) / 10).toLocaleString() + '%'
const className = () => game.CLASSES?.[FIN.cls()] || String(FIN.cls())
const back = (method = 'hub') => ({ text: t('finBack'), action: call('bank', method) })
const close = () => ({ text: t('finClose') })
// Opción del menú principal: deshabilitada (con el motivo) si no está disponible.
const menuOption = (kind, text, method) => {
  const why = FIN.why(kind)
  return why ? { text, disabled: true, showDisabledWithTooltip: true, tooltip: t(why, { cls: game.CLASSES?.[FIN.MIN_CLASS[kind]] || '' }) }
    : { text, action: call('bank', method) }
}
// Nota del testaferro para los senadores.
const proxyNote = () => { const p = FIN.proxy(); return p ? ' ' + t('finProxyNote', { commission: pct(p.commission), scandal: pct(p.scandal) }) : '' }

// Atributos por debajo de 20, con su penalización ('' si no hay).
function lowSkills() {
  const low = ['stewardship', 'eloquence', 'intelligence', 'combat'].filter(k => FIN.penalty(k) < 1)
  return low.length ? ' ' + t('finHubPenalty', { list: low.map(k => t(k) + ' ' + Math.round(FIN.skillValue(k)) + ' (×' + FIN.penalty(k).toFixed(2) + ')').join(', ') }) : ''
}

function finHub() {
  const debt = FIN.debt()
  return {
    title: t('finTitle'), image: ICONS.bank,
    message: t('finHubMsg', { cls: className(), rate: pct(FIN.bankRate()), limit: fmt(FIN.bankLimit()) }) +
      (debt > 0 ? ' ' + t('finHubDebt', { debt: fmt(debt), rate: pct(FIN.debtRate()), interest: fmt(FIN.interest()) }) : '') + lowSkills(),
    options: [
      menuOption('bank', t('finBorrow'), 'borrowMenu'),
      ...(debt > 0 ? [{ text: t('finRepay', { debt: fmt(debt) }), action: call('bank', 'repayMenu') }] : []),
      menuOption('lend', t('finLend'), 'lendMenu'),
      menuOption('shares', t('finShares'), 'sharesMenu'),
      menuOption('sea', t('finSea'), 'seaMenu'),
      { text: t('finPortfolio'), action: call('bank', 'portfolio') },
      close(),
    ],
  }
}

function finBorrow() {
  const offers = FIN.borrowOffers()
  return {
    title: t('finBorrow'),
    message: t('finBorrowMsg', { rate: pct(FIN.bankRate()), limit: fmt(FIN.bankLimit()), room: fmt(FIN.bankRoom()) }),
    options: [...offers.map(n => ({ text: t('finBorrowAmt', { amount: fmt(n) }), statChanges: money(n), action: call('bank', 'borrow', { amount: n }) })), back()],
  }
}

function finRepay() {
  const debt = FIN.debt()
  return {
    title: t('finRepayTitle'), message: t('finRepayMsg', { debt: fmt(debt) }),
    options: [...[...new Set([1000, 5000, debt])].filter(n => n <= debt).map(n => ({
      text: n === debt ? t('finPayOff', { amount: fmt(n) }) : t('finPay', { amount: fmt(n) }), statChanges: money(-n), action: call('bank', 'repay', { amount: n }),
    })), back()],
  }
}

function finLend() {
  const reqs = FIN.lendRequests()
  return {
    title: t('finLend'),
    message: (reqs.length ? t('finLendMsg', { room: fmt(FIN.lendRoom()) }) : t('finLendNone')) + ' ' + t('finSkillsLend'),
    options: [...reqs.map(r => ({
      text: t('finLendReq', { family: r.family, amount: fmt(r.amount), years: r.years }),
      tooltip: t('finDefaultEst', { risk: pct(FIN.shown(FIN.defaultChance(r, 9), r.fuzz)) }),
      action: call('bank', 'lendRate', { id: r.id }),
    })), back()],
  }
}

function finLendRate(id) {
  const r = FIN.lendRequests().find(x => x.id === id)
  if (!r) return finLend()
  return {
    title: t('finLend'), message: t('finLendRateMsg', { family: r.family, amount: fmt(r.amount), years: r.years }),
    options: [...FIN.lendRates().map(rate => ({
      text: t('finLendAt', { rate }), tooltip: t('finDefaultEst', { risk: pct(FIN.shown(FIN.defaultChance(r, rate), r.fuzz)) }),
      statChanges: money(-r.amount), action: call('bank', 'lend', { id, rate, amount: r.amount }),
    })), back('lendMenu')],
  }
}

function finShares() {
  const holdings = FIN.data().shares
  return {
    title: t('finShares'),
    message: t('finSharesMsg', { room: fmt(FIN.shareRoom()), fee: pct(FIN.shareFee()) }) + (FIN.atWar() ? ' ' + t('finAtWar') : '') + proxyNote() + ' ' + t('finSkillsShares'),
    options: [
      ...Object.keys(FIN.CONTRACTS).map(cid => {
        const c = FIN.contract(cid)
        return { text: t('fin_c_' + cid) + ' · ' + t('finYield', { min: c.min, max: c.max }),
          tooltip: t('finRiskEst', { risk: pct(FIN.shownContractRisk(cid)) }), action: call('bank', 'buyMenu', { cid }) }
      }),
      ...(holdings.length ? [{ text: t('finSellMenu', { n: holdings.length }), action: call('bank', 'sellMenu') }] : []),
      back(),
    ],
  }
}

function finBuy(cid) {
  const room = FIN.shareRoom(), fee = FIN.shareFee()
  const amounts = [...new Set([0.25, 0.5, 1].map(f => Math.round(room * f / 10) * 10))].filter(n => n >= 100)
  return {
    title: t('fin_c_' + cid), message: t('finBuyMsg', { room: fmt(room), fee: pct(fee) }),
    options: [...amounts.map(n => {
      const paid = Math.round(n * (1 + fee))
      return { text: t('finInvest', { amount: fmt(n) }), statChanges: money(-paid), action: call('bank', 'buy', { cid, amount: n, paid }) }
    }), back('sharesMenu')],
  }
}

function finSell() {
  return {
    title: t('finSellTitle'), message: t('finSellMsg', { factor: pct(FIN.sellFactor()) }),
    options: [...FIN.data().shares.map(sh => {
      const value = Math.round(sh.amount * FIN.sellFactor())
      return { text: t('finSellFor', { contract: t('fin_c_' + sh.contract), amount: fmt(sh.amount), value: fmt(value) }),
        statChanges: money(value), action: call('bank', 'sell', { id: sh.id, value }) }
    }), back('sharesMenu')],
  }
}

function finSea() {
  const offers = FIN.voyageOffers()
  return {
    title: t('finSea'),
    message: t('finSeaMsg', { room: fmt(FIN.seaRoom()) }) + (FIN.isWinter() ? ' ' + t('finWinter') : '') + proxyNote() + ' ' + t('finSkillsSea'),
    options: [...offers.map(o => ({
      text: t('finVoyage', { route: o.route, rate: o.rate, months: o.months }),
      tooltip: t('finWreckEst', { risk: pct(FIN.shown(FIN.voyageRisk(o), o.fuzz)) }),
      action: call('bank', 'seaAmount', { id: o.id }),
    })), back()],
  }
}

function finSeaAmount(id) {
  const o = FIN.voyageOffers().find(x => x.id === id)
  if (!o) return finSea()
  const room = FIN.seaRoom()
  const amounts = [...new Set([0.25, 0.5, 1].map(f => Math.round(room * f / 10) * 10))].filter(n => n >= 100)
  const opts = []
  for (const n of amounts) {
    opts.push({ text: t('finSail', { amount: fmt(n), rate: o.rate }), tooltip: t('finSailTip'), statChanges: money(-n), action: call('bank', 'sail', { id, amount: n, pooled: false }) })
    opts.push({ text: t('finSailPool', { amount: fmt(n), rate: o.rate - 5, n: FIN.POOL_SHIPS }), tooltip: t('finSailPoolTip'), statChanges: money(-n), action: call('bank', 'sail', { id, amount: n, pooled: true }) })
  }
  return { title: t('finVoyage', { route: o.route, rate: o.rate, months: o.months }), message: t('finSeaAmountMsg', { room: fmt(room) }), options: [...opts, back('seaMenu')] }
}

function finPortfolio() {
  const d = FIN.data(), parts = []
  if (FIN.debt() > 0) parts.push(t('finPfDebt', { debt: fmt(FIN.debt()), rate: pct(FIN.debtRate()) }))
  for (const l of d.lent) parts.push(t('finPfLent', { family: l.family, amount: fmt(l.amount), rate: pct(l.rate), year: l.endYear }))
  for (const sh of d.shares) parts.push(t('finPfShare', { contract: t('fin_c_' + sh.contract), amount: fmt(sh.amount) }))
  for (const v of d.voyages) parts.push(t('finPfVoyage', { route: v.route, amount: fmt(v.amount), rate: pct(v.rate), pooled: v.pooled ? ' (' + t('finPooled') + ')' : '' }))
  return { title: t('finPortfolio'), message: parts.length ? parts.join(' · ') : t('finPfEmpty'), options: [back(), close()] }
}

// Informe de resultados (barcos que vuelven, cobros del año): una ventana del juego.
function finReport(lines) {
  const text = lines.map(({ key, vars }) => t(key, Object.fromEntries(Object.entries(vars).map(([k, v]) =>
    [k, k === 'contract' ? t('fin_c_' + v) : typeof v === 'number' ? fmt(v) : v])))).join(' · ')
  api().pushInteractionModalQueue({ isManualOnly: true, title: t('finReport'), image: ICONS.bank, message: text, options: [{ text: t('xOk') }] })
  api().processInteractionModalQueue()
}

// Desplegables largos de las ventanas del trainer (rasgos del pedido, temas): con un
// alto máximo y barra vertical para recorrerlos. Solo mientras está abierta una
// ventana del trainer con desplegables (clase en <body>), para no cambiar las del juego.
const MM_CLASS = 'cor-trainer-mm-open', MM_STYLE = 'cor-trainer-mm-style'
const isOrderOpen = () => {
  const m = S()?.interactionModal
  return !!m?.show && !!m.dropdowns?.some(d => (d.onChange?.event || '').startsWith(ev('')))
}
function orderStyle() {
  if (!document.getElementById(MM_STYLE)) {
    const st = document.createElement('style')
    st.id = MM_STYLE
    st.textContent = `
body.${MM_CLASS} #interactionModal .dropdown-menu{max-height:min(45vh,420px);overflow-y:auto;overscroll-behavior:contain;scrollbar-width:auto}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar{width:12px}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-track{background:rgba(0,0,0,.12);border-radius:6px}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-thumb{background:#8a7350;border-radius:6px;border:2px solid transparent;background-clip:padding-box}
body.${MM_CLASS} #interactionModal .dropdown-menu::-webkit-scrollbar-thumb:hover{background-color:#b08d57}`
    document.head.appendChild(st)
  }
  document.body.classList.toggle(MM_CLASS, isOrderOpen())
}

// Botón de la casamentera en "Arrange Betrothal", junto a "Pay to look for other
// matches". La vista es del juego, así que el botón se vuelve a poner si el juego
// la redibuja.
const BTN_ID = 'cor-trainer-matchmaker'
function betrothalButton() {
  const view = game.betrothalView(), old = document.getElementById(BTN_ID)
  if (!view || !view.actions || !enabled('matchmaker') || !game.SPOUSES) { old?.remove(); return }
  if (old && old.parentElement === view.actions) return
  old?.remove()
  const b = document.createElement('button')
  b.id = BTN_ID
  b.className = 'btn btn-outline-secondary btn-sm'
  b.title = t('xMatchmakerBtn')
  const img = document.createElement('img')
  img.className = 'img-fluid img-icon-action'
  img.src = ICONS.matchmaker
  img.setAttribute('aria-hidden', 'true')
  b.appendChild(img)
  b.onclick = () => {
    const v = game.betrothalView()
    if (v) EVENTS.matchmaker.process(null, { characterId: v.targetId, isMatrilineal: v.isMatrilineal })
  }
  view.actions.appendChild(b)
}

// Los métodos del juego van en "methods"; visible() se usa como preCheck.
for (const [name, e] of Object.entries(EVENTS)) {
  const methods = {}
  for (const [k, fn] of Object.entries(e)) if (typeof fn === 'function') methods[k] = fn
  game.HOOK?.register(name, { methods })
}

// --- Sincronizar los botones ---------------------------------------------------------
// Pone o quita los botones según lo activado y quién puede usarlos. Solo toca a los
// personajes que cambian (cada cambio redibuja a ese personaje en el juego).
const characterAction = f => ({
  title: t({ playAs: 'xPlayAs', divorce: 'xDivorce', adopt: 'xAdopt' }[f]),
  icon: ICONS[f], isAvailable: true, hideWhenBusy: f === 'adopt',
})
const GLOBAL = {
  bank: () => ({ title: t('finTitle'), icon: ICONS.bank }),
  theme: () => ({ title: t('xTheme'), icon: ICONS.theme }),
  dynasty: () => ({ title: t('xDynasty'), icon: ICONS.dynasty }),
  scenario: () => ({ title: t('xScenario'), icon: ICONS.scenario }),
}
function sync() {
  const s = S()
  if (!s || !game.DA || !game.HOOK) return
  const a = api(), now = sig()
  for (const f of Object.keys(GLOBAL)) {
    const key = ACTION(f), cur = s.current.actions?.[key]
    if (enabled(f) && cur?.sig !== now) {
      a.addGlobalAction({ key, action: { ...GLOBAL[f](), sig: now, isAvailable: true, preCheck: call(f, 'visible'), process: call(f, 'process') } })
    } else if (!enabled(f) && cur) a.deleteGlobalAction({ key })
  }
  for (const ch of Object.values(s.characters)) {
    if (!ch) continue
    for (const f of CHARACTER) {
      const key = ACTION(f), cur = ch.actions?.[key], want = VISIBLE[f](ch.id)
      if (want && cur?.sig !== now) {
        a.addCharacterAction({ characterId: ch.id, key, action: { ...characterAction(f), sig: now,
          preCheck: call(f, 'visible', { characterId: ch.id }), process: call(f, 'process', { characterId: ch.id }) } })
      } else if (!want && cur) a.deleteCharacterAction({ characterId: ch.id, key })
    }
    // Botones del trainer que ya no existen (p. ej. la casamentera, que ahora está en
    // la ventana "Arrange Betrothal").
    for (const key of Object.keys(ch.actions || {})) {
      if (key.startsWith('trainer_') && !CHARACTER.includes(key.slice(8))) a.deleteCharacterAction({ characterId: ch.id, key })
    }
  }
  betrothalButton()
  orderStyle()
  // Boda con Attica: una ventana del juego, como en el mod (una sola vez).
  if (enabled('scenario') && A.atticaDue()) {
    const p = game.player()
    A.atticaDone()
    a.pushInteractionModalQueue({
      title: t('xAtticaTitle'), image: ICONS.scenario, message: t('xAttica'),
      options: [
        { text: t('xAtticaYes'), tooltip: t('xAtticaYesTip'), statChanges: A.atticaChanges(true), action: call('scenario', 'attica', { yes: true, characterId: p.id }) },
        { text: t('xAtticaNo'), tooltip: t('xAtticaNoTip'), statChanges: A.atticaChanges(false) },
      ],
    })
    a.processInteractionModalQueue()
  }
  // Finanzas: barcos que vuelven y resultados del año (informe), y el cobro anual del
  // banco. Salen aunque el botón del argentarius esté desactivado: lo invertido sigue
  // corriendo y hay que pagar al menos el interés.
  const lines = FIN.tick()
  if (lines.length) finReport(lines)
  const bill = FIN.dueBill()
  if (bill) {
    a.pushInteractionModalQueue({
      title: t('finBill'), image: ICONS.bank, requireChoice: true,
      message: t('finBillMsg', { debt: fmt(bill.principal), rate: pct(bill.rate), interest: fmt(bill.interest) }),
      options: [
        ...bill.extras.map(x => ({ text: t('finPayExtra', { extra: fmt(x.extra) }), statChanges: money(-x.total), action: call('bank', 'repay', { amount: x.extra }) })),
        { text: t('finPayAll'), statChanges: money(-bill.all), action: call('bank', 'repay', { amount: bill.principal }) },
        { text: t('finPayInterest'), statChanges: money(-bill.interest) },
      ],
    })
    a.processInteractionModalQueue()
  }
}

// Abre el argentarius en el juego (desde el panel).
const openFinance = () => EVENTS.bank.process()

module.exports = { FEATURES, enabled, setEnabled, sync, openFinance }
