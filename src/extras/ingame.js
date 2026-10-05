// Botones de los mods dentro de la interfaz del juego, como los ponen los mods
// originales: en cada personaje (Jugar como, Divorcio, Dar en adopción) y en la
// pantalla principal (Tema, Nueva dinastía, Escenarios). Abren ventanas del juego.
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

const { t } = i18n
const KEY = 'corTrainerInGame'
// Firma de los botones: si cambia (otro idioma, o una versión nueva de este archivo)
// se rehacen; si no, se dejan como están para no redibujar a nadie.
const VERSION = 1
const sig = () => VERSION + ':' + i18n.lang()
// Bloques que se pueden mostrar en el juego, en el orden del panel.
const FEATURES = ['theme', 'playAs', 'divorce', 'adopt', 'dynasty', 'scenario']
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
          options: ids.map(id => ({ label: id ? THEMES.LIST[id].name : t('xThemeGame'), value: id })),
          onChange: call('theme', 'pick'),
        }],
        options: [{ text: '☾ ' + t('xDarkModeToggle'), action: call('theme', 'dark') }, { text: t('xOk') }],
      })
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
  }
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
}

module.exports = { FEATURES, enabled, setEnabled, sync }
