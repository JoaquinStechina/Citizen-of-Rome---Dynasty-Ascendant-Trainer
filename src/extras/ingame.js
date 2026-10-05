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
const BANK = require('extras/bank')
const MM = require('extras/matchmaker')

const { t } = i18n
const KEY = 'corTrainerInGame'
// Firma de los botones: si cambia (otro idioma, o una versión nueva de este archivo)
// se rehacen; si no, se dejan como están para no redibujar a nadie.
const VERSION = 1
const sig = () => VERSION + ':' + i18n.lang()
// Bloques que se pueden mostrar en el juego, en el orden del panel.
const FEATURES = ['theme', 'playAs', 'divorce', 'adopt', 'dynasty', 'scenario', 'bank', 'matchmaker']
const CHARACTER = ['playAs', 'divorce', 'adopt', 'bank']
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
  // Como el mod: en el jugador, sin deuda y con menos de 500.
  bank: id => enabled('bank') && id === S().current.id && BANK.canBorrow(),
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
  bank: {
    visible: (_, { characterId }) => VISIBLE.bank(characterId),
    process() {
      if (!BANK.canBorrow()) return
      show({
        title: t('xBank'), image: ICONS.bank, message: t('xBankOffer', { rate: (BANK.RATE * 100).toFixed(1) }),
        options: [...BANK.amounts().map(n => ({
          text: t('xBankTake', { amount: fmt(n) }), statChanges: money(n), action: call('bank', 'borrow', { amount: n }),
        })), { text: t('xBankNo') }],
      })
    },
    // El dinero ya llegó con statChanges; aquí solo se anota la deuda.
    borrow: (_, { amount }) => { if (BANK.debt() <= 0) BANK.borrow(amount) },
    repay: (_, { amount }) => { BANK.repay(amount) },
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
  title: t({ playAs: 'xPlayAs', divorce: 'xDivorce', adopt: 'xAdopt', bank: 'xBankLoan' }[f]),
  icon: ICONS[f], isAvailable: true, hideWhenBusy: f === 'adopt' || f === 'bank',
})
const GLOBAL = {
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
  // Cobro anual del banco (una vez por año, en el mes del cobro). Sale aunque el
  // botón del préstamo esté desactivado: hay que pagar al menos el interés.
  const bill = BANK.dueBill()
  if (bill) {
    a.pushInteractionModalQueue({
      title: t('xBankBill'), image: ICONS.bank,
      message: t('xBankBillMsg', { debt: fmt(bill.principal), interest: fmt(bill.interest) }),
      options: [
        ...bill.extras.map(x => ({ text: t('xBankPayExtra', { extra: fmt(x.extra) }), statChanges: money(-x.total), action: call('bank', 'repay', { amount: x.extra }) })),
        { text: t('xBankPayAll'), statChanges: money(-bill.all), action: call('bank', 'repay', { amount: bill.principal }) },
        { text: t('xBankPayInterest'), statChanges: money(-bill.interest) },
      ],
    })
    a.processInteractionModalQueue()
  }
}

module.exports = { FEATURES, enabled, setEnabled, sync }
