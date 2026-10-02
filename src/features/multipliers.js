// Multiplicadores. El juego multiplica todos los modificadores activos de una
// clave (salud de la casa, ingresos, un trabajo, una propiedad…). El trainer
// añade UNO propio por clave (id "cor_trainer", permanente) que se puede cambiar
// o quitar sin tocar los del juego.
const { el, fmt } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const sel = require('core/selection')

const TRAINER_MOD_ID = 'cor_trainer'
const PERSONAL = { health: 'health', fertility: 'fertility', expenses: 'expenses', stewardship: 'stewardshipShort' }

// Clave elegida; fuera de build() para conservarla al cambiar de idioma.
let modKey = 'household_health'

module.exports = {
  id: 'multipliers',
  build({ body, ui }) {
    const { S, JOBS, MODS } = game

    // [[nombre del grupo, [[clave, nombre], …]], …]; incluye las claves personales
    // del personaje y la mascota elegidos en sus secciones.
    const modCatalog = () => {
      const out = [
        [t('household'), [['household_health', t('householdHealth')], ['revenue', t('revenue')], ['household_fertility', t('householdFertility')],
          ['household_expenses', t('householdExpenses')], ['household_stewardship', t('householdStewardship')]]],
      ]
      const ch = sel.character(), p = sel.pet()
      if (ch) out.push([t('personal') + ': ' + ch.praenomen, [['character_health_' + ch.id, t('personalHealth')], ['character_fertility_' + ch.id, t('personalFertility')],
        ['character_expenses_' + ch.id, t('personalExpenses')], ['character_stewardship_' + ch.id, t('personalStewardship')]]])
      if (p) out.push([t('petGroup') + ': ' + p.name, [['pet_health_' + p.id, t('petHealth')], ['pet_fertility_' + p.id, t('petFertility')],
        ['pet_expenses_' + p.id, t('petExpenses')]]])
      if (JOBS) out.push([t('jobs'), Object.keys(JOBS.types).map(j => ['job_' + j, t('jobPrefix') + ': ' + (JOBS.titles[j] || j)]).sort((a, b) => a[1].localeCompare(b[1]))])
      if (MODS) out.push([t('properties'), Object.keys(MODS.propTypes).map(k => ['property_' + k, t('propPrefix') + ': ' + (MODS.propTitles[k]?.title || k)]).sort((a, b) => a[1].localeCompare(b[1]))])
      return out
    }
    const modName = key => {
      for (const [, items] of modCatalog()) for (const [k, n] of items) if (k === key) return n
      const m = key.match(/^(character|pet)_(health|fertility|expenses|stewardship)_(.+)$/)
      if (m) {
        const who = m[1] === 'pet' ? game.pets()[m[3]]?.name : S().characters[m[3]]?.praenomen
        return t('xOfY', { x: t(PERSONAL[m[2]]), y: who || '?' })
      }
      return key
    }
    const trainerFactor = key => (S()?.current?.modifiers?.[key] || []).find(m => m.id === TRAINER_MOD_ID)?.factor
    const setTrainerFactor = (key, f) => {
      MODS.remove(key, TRAINER_MOD_ID)
      if (f && Math.abs(f - 1) > 1e-9) MODS.add(key, TRAINER_MOD_ID, Math.max(0.01, f), 'Trainer')
    }

    const modPick = ui.select(body, v => { modKey = v })
    let modSig = ''
    ui.onRefresh(() => {
      const cat = modCatalog()
      const now = cat.map(([g, items]) => g + items.length).join('|')
      if (now === modSig) return
      modSig = now
      modPick.innerHTML = ''
      for (const [g, items] of cat) {
        const og = el('optgroup', '', modPick)
        og.label = g
        for (const [k, n] of items) { const o = el('option', '', og); o.value = k; o.textContent = n }
      }
      if (![...modPick.options].some(o => o.value === modKey)) modKey = 'household_health'
      modPick.value = modKey
    })
    ui.addRow({
      label: t('trainerFactor'), get: () => trainerFactor(modKey) ?? 1, set: f => setTrainerFactor(modKey, f), enabled: () => !!MODS,
      extra: [['×2', () => setTrainerFactor(modKey, (trainerFactor(modKey) ?? 1) * 2)], [t('removeFactor'), () => setTrainerFactor(modKey, 1), t('removeFactorTip')]],
      suffix: () => t('total') + ': ×' + fmt(MODS?.value(modKey) ?? 1),
    }, body)
    ui.note(body, t('modNote'))

    // Lista de multiplicadores distintos de ×1 (clic = editarlo arriba).
    const activeBox = ui.group(body, t('activeNow'), 'multipliers.active')
    const active = el('div', 'font-size:12px;margin-top:2px', activeBox)
    const clearAll = el('div', 'display:flex;justify-content:flex-end;margin-top:4px', activeBox)
    ui.button(clearAll, t('removeAll'), () => {
      for (const key of Object.keys(S().current.modifiers || {})) MODS.remove(key, TRAINER_MOD_ID)
    })
    let activeSig = ''
    ui.onRefresh(force => {
      if (!MODS) { active.textContent = t('notAvailable'); return }
      const items = Object.keys(S()?.current?.modifiers || {})
        .map(k => [k, MODS.value(k), trainerFactor(k)])
        .filter(([, v]) => typeof v === 'number' && Math.abs(v - 1) > 0.005)
      const now = items.map(x => x.join(':')).join('|')
      if (now === activeSig && !force) return
      activeSig = now
      active.innerHTML = ''
      if (!items.length) { const n = el('span', 'opacity:.6', active); n.textContent = t('none') }
      for (const [k, v, tf] of items) {
        const row = el('div', 'display:flex;justify-content:space-between;gap:6px;cursor:pointer', active)
        row.title = t('clickToEdit')
        row.onclick = () => { modKey = k; modSig = ''; ui.refresh(true) }
        const name = el('span', '', row)
        name.textContent = modName(k) + (tf ? ' ★' : '')
        // verde = te favorece (en gastos, un factor menor que 1)
        const val = el('span', 'font-variant-numeric:tabular-nums;color:' + ((k.includes('expenses') ? v < 1 : v > 1) ? '#9fd38a' : '#e38a7a'), row)
        val.textContent = '×' + fmt(v)
      }
    })
    ui.note(activeBox, t('legend'))
  },
}
