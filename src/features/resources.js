// Recursos: dinero, influencia y prestigio de la dinastía.
const { t } = require('core/i18n')
const game = require('game')

module.exports = {
  id: 'resources',
  build({ body, ui }) {
    const { S, dynasty } = game
    ;[
      { label: t('cash'),      get: () => S()?.current.cash,      set: v => { S().current.cash = v },      steps: [1000, 10000] },
      { label: t('influence'), get: () => S()?.current.influence, set: v => { S().current.influence = v }, steps: [1000, 10000] },
      { label: t('prestige'),  get: () => dynasty()?.prestige,    set: v => { dynasty().prestige = v },    steps: [1000, 10000] },
    ].forEach(c => ui.addRow(c, body))
  },
}
