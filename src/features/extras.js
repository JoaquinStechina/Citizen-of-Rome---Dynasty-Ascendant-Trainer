// Extras: lo que hacen los mods de ejemplo del juego (Give For Adoption, New
// Dynasty?, Play As, Divorce, Play a Scenario) y los temas de color del mod
// "theme", desde el panel y con botones dentro del juego (extras/ingame). Se usa
// la API de mods del juego sin activar el modo mods, así que los logros del juego y
// de Steam siguen activos. Los costos son los de los mods y se pueden desactivar.
const { el, CTRL_CSS } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const A = require('extras/actions')
const INGAME = require('extras/ingame')
const THEMES = require('extras/themes')
const SCENARIOS = require('extras/scenarios')

module.exports = {
  id: 'extras',
  build({ body, ui }) {
    const { S, DA } = game
    THEMES.apply(THEMES.current())
    if (!DA) { ui.note(body, t('notAvailable')); return }
    const store = () => game.store()

    const withAge = ch => A.name(ch) + ' (' + Math.floor(game.ageOf(ch)) + ')'
    const pickRow = parent => {
      const line = el('div', 'display:flex;gap:4px;align-items:center;margin:2px 0', parent)
      const s = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', line)
      s.onchange = () => ui.refresh(true)
      return { line, s }
    }
    const checkbox = (parent, text, checked, onchange) => {
      const label = el('label', 'display:flex;align-items:center;gap:6px;cursor:pointer;margin:2px 0', parent)
      const cb = el('input', 'margin:0;cursor:pointer', label)
      cb.type = 'checkbox'
      cb.checked = checked
      label.append(text)
      cb.onchange = () => { onchange(cb.checked); ui.refresh(true) }
      return cb
    }

    checkbox(body, t('xCosts'), A.costsOn(), A.setCostsOn)
    ui.note(body, t('xNote'))

    // --- Botones en el juego ------------------------------------------------------
    const gameBox = ui.group(body, t('xInGame'), 'extras.inGame')
    const gameGrid = el('div', 'display:grid;grid-template-columns:repeat(auto-fill,minmax(130px,1fr));column-gap:8px', gameBox)
    const TITLES = { theme: 'xTheme', playAs: 'xPlayAs', divorce: 'xDivorce', adopt: 'xAdopt', dynasty: 'xDynasty', scenario: 'xScenario' }
    for (const f of INGAME.FEATURES) checkbox(gameGrid, t(TITLES[f]), INGAME.enabled(f), v => INGAME.setEnabled(f, v))
    ui.note(gameBox, t('xInGameNote'))
    // Pone o quita los botones del juego en cada refresco (solo toca lo que cambia).
    ui.onRefresh(() => INGAME.sync())

    // --- Tema ---------------------------------------------------------------------
    const themeBox = ui.group(body, t('xTheme'), 'extras.theme')
    const theme = pickRow(themeBox)
    for (const id of ['', ...Object.keys(THEMES.LIST)]) {
      const o = el('option', '', theme.s)
      o.value = id
      o.textContent = id ? THEMES.LIST[id].name : t('xThemeGame')
    }
    theme.s.onchange = () => THEMES.apply(theme.s.value)
    const dark = ui.button(theme.line, '', () => store().dispatch('toggleSetting', { setting: 'darkMode' }), t('xDarkModeTip'))
    ui.onRefresh(() => {
      dark.textContent = '☾ ' + t('xDarkMode') + (S()?.settings?.darkMode ? ' ✓' : '')
      // El tema también se puede cambiar desde el botón del juego.
      if (document.activeElement !== theme.s) theme.s.value = THEMES.current()
    })
    ui.note(themeBox, t('xThemeNote'))

    // --- Jugar como ---------------------------------------------------------------
    const playBox = ui.group(body, t('xPlayAs'), 'extras.playAs')
    let playId = null, house = new Set()
    // Todos los vivos: primero los de la casa, luego el resto (parientes, etc.).
    const playable = () => {
      const s = S()
      if (!s) return []
      house = new Set(game.household().map(c => c.id))
      return Object.values(s.characters).filter(A.canPlayAs)
        .sort((a, b) => (house.has(b.id) - house.has(a.id)) || A.name(a).localeCompare(A.name(b)))
    }
    const play = pickRow(playBox)
    ui.rosterSelect(play.s, playable, () => playId, v => { playId = v }, ch => withAge(ch) + (house.has(ch.id) ? '' : ' · ' + t('xOutside')), t('xNobody'))
    play.s.onchange = () => { playId = play.s.value }
    ui.button(play.line, t('xPlayAsBtn'), () => {
      const ch = S().characters[playId]
      if (A.canPlayAs(ch) && confirm(t('xPlayAsConfirm', { name: A.name(ch) }))) A.playAs(ch.id)
    })
    ui.note(playBox, t('xPlayAsNote'))

    // --- Divorcio -----------------------------------------------------------------
    const divBox = ui.group(body, t('xDivorce'), 'extras.divorce')
    let divId = null
    // Una entrada por pareja de la casa.
    const couples = () => {
      const seen = new Set()
      return game.household().filter(ch => {
        const sp = A.spouseOf(ch)
        if (!sp || seen.has(ch.id)) return false
        seen.add(ch.id); seen.add(sp.id)
        return true
      })
    }
    const div = pickRow(divBox)
    ui.rosterSelect(div.s, couples, () => divId, v => { divId = v }, ch => A.name(ch) + ' ⚭ ' + A.name(A.spouseOf(ch)), t('xNoCouples'))
    div.s.onchange = () => { divId = div.s.value }
    ui.button(div.line, t('xDivorceBtn'), () => {
      const ch = S().characters[divId], sp = A.spouseOf(ch)
      if (!sp || !confirm(t('xDivorceConfirm', { a: A.name(ch), b: A.name(sp), cost: A.costText(A.DIVORCE_COST) }) + A.shortOf(A.DIVORCE_COST))) return
      A.charge(A.DIVORCE_COST)
      A.divorce(ch.id)
    })
    const divCost = ui.note(divBox, '')
    ui.onRefresh(() => { divCost.textContent = t('xCost') + ': ' + A.costText(A.DIVORCE_COST) })

    // --- Dar en adopción ----------------------------------------------------------
    const adoptBox = ui.group(body, t('xAdopt'), 'extras.adopt')
    let adoptId = null
    const adopt = pickRow(adoptBox)
    ui.rosterSelect(adopt.s, () => game.household().filter(A.canAdopt), () => adoptId, v => { adoptId = v }, withAge, t('xNoChildren'))
    adopt.s.onchange = () => { adoptId = adopt.s.value }
    ui.button(adopt.line, t('xAdoptBtn'), () => {
      const ch = S().characters[adoptId]
      if (!A.canAdopt(ch) || !confirm(t('xAdoptConfirm', { name: A.name(ch), cost: A.costText(A.ADOPT_COST) }) + A.shortOf(A.ADOPT_COST))) return
      A.charge(A.ADOPT_COST)
      A.adopt(ch.id)
    })
    const adoptCost = ui.note(adoptBox, '')
    ui.onRefresh(() => { adoptCost.textContent = t('xCost') + ': ' + A.costText(A.ADOPT_COST) + '. ' + t('xAdoptNote') })

    // --- Nueva dinastía -----------------------------------------------------------
    const dynBox = ui.group(body, t('xDynasty'), 'extras.dynasty')
    const field = (label, ph) => {
      const line = el('div', 'display:flex;gap:4px;align-items:center;margin:2px 0', dynBox)
      el('span', 'width:92px;flex-shrink:0', line).textContent = label
      const input = el('input', CTRL_CSS + ';flex:1;min-width:0;padding:1px 4px', line)
      input.placeholder = ph || ''
      return input
    }
    const nomen = field(t('xNomen')), cognomen = field(t('xCognomen'), t('xOptional'))
    const herLine = el('div', 'display:flex;gap:4px;align-items:center;margin:2px 0', dynBox)
    el('span', 'width:92px;flex-shrink:0', herLine).textContent = t('xHeritage')
    const heritage = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', herLine)
    for (const h of A.HERITAGES) { const o = el('option', '', heritage); o.value = h; o.textContent = t('xH_' + h) }
    // Los campos muestran tu dinastía actual hasta que los cambies.
    let dynSig = ''
    ui.onRefresh(() => {
      const d = game.dynasty()
      const now = d && d.id + d.nomen + d.cognomen + d.heritage
      if (!d || now === dynSig) return
      dynSig = now
      if (![nomen, cognomen, heritage].includes(document.activeElement)) {
        nomen.value = d.nomen || ''
        cognomen.value = d.cognomen || ''
        heritage.value = A.HERITAGES.includes(d.heritage) ? d.heritage : A.HERITAGES[0]
      }
    })
    const dynBtns = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', dynBox)
    ui.button(dynBtns, t('xDynastyBtn'), () => {
      if (!nomen.value.trim()) { alert(t('xNomenNeeded')); return }
      const full = (nomen.value.trim() + ' ' + cognomen.value.trim()).trim()
      if (confirm(t('xDynastyConfirm', { name: full }))) A.branchDynasty({ nomen: nomen.value, cognomen: cognomen.value, heritage: heritage.value })
    })
    ui.note(dynBox, t('xDynastyNote'))

    // --- Escenarios ---------------------------------------------------------------
    const scnBox = ui.group(body, t('xScenario'), 'extras.scenario')
    const scn = pickRow(scnBox)
    for (const sc of SCENARIOS.list) { const o = el('option', '', scn.s); o.value = sc.id; o.textContent = t('scn_' + sc.id) }
    const scnInfo = ui.note(scnBox, '')
    const paintInfo = () => { scnInfo.textContent = t('scn_' + scn.s.value + '_info') }
    scn.s.onchange = paintInfo
    paintInfo()
    ui.button(scn.line, t('xScenarioBtn'), () => {
      const id = scn.s.value
      if (confirm(t('xScenarioConfirm', { name: t('scn_' + id), year: A.scenarioYear(id) }))) A.playScenario(id)
    })
    ui.note(scnBox, t('xScenarioNote'))

    // Boda con Attica (escenario de Agrippa). Con el botón de escenarios activado en el
    // juego, aparece como ventana del juego; si no, aquí.
    const attica = el('div', 'display:none;margin-top:6px;padding:4px 6px;border:1px solid #5a4630;border-radius:6px', scnBox)
    el('div', '', attica).textContent = t('xAttica')
    const atticaBtns = el('div', 'display:flex;gap:4px;margin-top:4px;flex-wrap:wrap', attica)
    const atticaDecide = yes => {
      if (!A.atticaDue()) return
      const changes = A.atticaChanges(yes)
      if (yes) A.atticaWedding()
      game.DA.api().applyStatChanges(changes)
      A.atticaDone()
    }
    ui.button(atticaBtns, t('xAtticaYes'), () => atticaDecide(true))
    ui.button(atticaBtns, t('xAtticaNo'), () => atticaDecide(false))
    ui.onRefresh(() => { attica.style.display = !INGAME.enabled('scenario') && A.atticaDue() ? '' : 'none' })
  },
}
