// Familia: edad, habilidades, nivel de trabajo y rasgos de cada miembro de la casa.
const { el } = require('core/dom')
const { t } = require('core/i18n')
const game = require('game')
const sel = require('core/selection')

const SKILLS = ['intelligence', 'stewardship', 'eloquence', 'combat']

module.exports = {
  id: 'family',
  build({ body, ui }) {
    const { S, JOBS, TR, SKILL_MAX } = game
    const selected = sel.character

    const pick = ui.select(body, v => { sel.charId = v })
    ui.rosterSelect(pick, game.household, () => sel.charId, v => { sel.charId = v },
      ch => ch.praenomen + (ch.id === S().current.id ? ' ' + t('you') : ''), t('noFamily'))
    ui.ageRow(selected, body)

    SKILLS.forEach(key => ui.addRow({
      label: t(key), get: () => selected()?.skills?.[key], set: v => { selected().skills[key] = v }, steps: [1, 5],
    }, body))
    const bulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', body)
    ui.button(bulk, t('allTo') + ' ' + SKILL_MAX, () => { for (const k of SKILLS) selected().skills[k] = SKILL_MAX })
    ui.button(bulk, t('familyAllTo') + ' ' + SKILL_MAX, () => game.household().forEach(ch => { for (const k of SKILLS) ch.skills[k] = SKILL_MAX }))

    // Nivel de trabajo: la función del juego lo limita al máximo de cada trabajo.
    const jobMax = () => { const ch = selected(); return (ch?.job && JOBS?.types[ch.job]?.maxLevel) || 0 }
    const setJobLevel = v => {
      const ch = selected()
      if (!ch?.job) return
      if (JOBS) JOBS.set(S(), { characterId: ch.id, jobLevel: v })
      else ch.jobLevel = Math.max(0, v)
    }
    ui.addRow({
      label: t('jobLevel'),
      get: () => selected()?.job ? selected().jobLevel : undefined,
      set: setJobLevel,
      enabled: () => !!selected()?.job,
      steps: [1, 5],
      extra: [[t('max'), () => setJobLevel(jobMax()), t('maxTip')]],
      suffix: () => {
        const ch = selected()
        if (!ch?.job) return t('noJob')
        return (JOBS?.titles[ch.job] || ch.job) + ' · ' + t('maxShort') + ' ' + jobMax()
      },
    }, body)

    ui.subheading(body, t('traits'))
    ui.traitEditor(body, {
      available: !!TR, entity: selected, list: () => TR.list,
      title: id => TR.titles[id]?.title || id, describe: id => TR.titles[id]?.description || '',
      add: (ch, id) => {
        TR.add(ch, id)
        // Los rasgos "descubribles" no se muestran en el juego hasta descubrirlos.
        if (TR.discoverable.includes(id)) {
          ch.discoveredTraits = ch.discoveredTraits || []
          if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
        }
      },
      remove: (ch, id) => TR.remove(ch, id),
    })
  },
}
