// Rasgos acumulables: cuántas copias tiene un personaje de cada rasgo que el
// juego permite acumular (Strong, Mangled, Veteran, personalidades…). Cada copia
// extra suma un 10% del bonus de habilidad del rasgo (ver game.TR.setStacks).
// Comparte el personaje elegido con Familia.
const { CTRL_CSS, el, fmt } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const sel = require('core/selection')

const SKILLS = ['intelligence', 'stewardship', 'eloquence', 'combat']

module.exports = {
  id: 'traitStacks',
  build({ body, ui }) {
    const { S, TR } = game
    if (!TR?.stackable) { ui.note(body, t('notAvailable')); return }
    const selected = sel.character
    const title = id => TR.titles[id]?.title || id
    const describe = id => TR.titles[id]?.description || ''

    const pick = ui.select(body, v => { sel.charId = v })
    ui.rosterSelect(pick, game.household, () => sel.charId, v => { sel.charId = v },
      ch => ch.praenomen + (ch.id === S().current.id ? ' ' + t('you') : ''), t('noFamily'))

    // Bonus de habilidad que el juego ha sumado con n copias (lo que suma addTrait).
    const bonusText = (id, n) => {
      const skills = TR.list[id]?.modifiers?.skills || {}
      const f = n > 1 ? 1 + (n - 1) * TR.stackMultiplier : 1
      return SKILLS.filter(k => skills[k]).map(k => t(k) + ' ' + (skills[k] > 0 ? '+' : '') + fmt(skills[k] * f)).join(' · ')
    }

    const list = el('div', '', body)
    const addLine = el('div', 'display:flex;gap:4px;margin-top:6px', body)
    const addPick = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', addLine)
    ui.button(addLine, t('add'), () => { const ch = selected(); if (ch && addPick.value) TR.setStacks(ch, addPick.value, 1) }, t('addTip'))
    ui.note(body, t('stackNote'))

    // Las filas se rehacen cuando cambia el personaje o sus rasgos acumulables;
    // los números se actualizan en cada refresco.
    let sig = '', rows = []
    ui.onRefresh(() => {
      const ch = selected()
      const owned = TR.stackable.filter(id => ch?.traits?.includes(id))
      const now = (ch?.id || '') + ':' + owned.join(',')
      if (now !== sig) {
        sig = now
        list.innerHTML = ''
        rows = []
        if (!owned.length) { const n = el('div', 'opacity:.6;margin:4px 0', list); n.textContent = ch ? t('noStackable') : '—' }
        for (const id of owned) rows.push(stackRow(id))
        ui.fillTraitSelect(addPick, ch ? TR.stackable.filter(id => !owned.includes(id)) : [], TR.list, title, describe)
      }
      for (const r of rows) {
        const n = TR.stacks(ch, r.id)
        if (document.activeElement !== r.input) r.input.value = n
        r.bonus.textContent = bonusText(r.id, n)
      }
    })

    function stackRow(id) {
      const wrap = el('div', 'margin:4px 0', list)
      const row = el('div', 'display:flex;align-items:center;gap:4px', wrap)
      const label = el('span', 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap', row)
      label.textContent = title(id)
      label.title = describe(id)
      const set = n => { const ch = selected(); if (ch) TR.setStacks(ch, id, n) }
      ui.button(row, '−', () => set(TR.stacks(selected(), id) - 1), t('stackMinusTip'))
      const input = el('input', CTRL_CSS + ';width:44px;flex:none;padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums', row)
      input.type = 'number'
      input.min = '0'
      input.title = t('stackCopies')
      input.addEventListener('change', () => { const v = parseInt(input.value, 10); if (!Number.isNaN(v)) set(v); ui.refresh(true) })
      input.addEventListener('keydown', e => {
        if (e.key === 'Enter') input.blur()
        else if (e.key === 'Escape') { input.value = TR.stacks(selected(), id); input.blur() }
      })
      ui.button(row, '+', () => set(TR.stacks(selected(), id) + 1), t('stackPlusTip'))
      const bonus = el('div', 'font-size:11px;opacity:.7', wrap)
      return { id, input, bonus }
    }
  },
}
