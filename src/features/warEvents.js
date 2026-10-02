// Eventos militares: el árbol de decisiones de cada evento de guerra del juego,
// con lo que puede pasar en cada opción (muerte, corona, heridas, prestigio…).
// Además, cuando uno de estos eventos aparece en el juego, muestra un consejo al
// lado de la ventana y marca la opción recomendada (ver war/analyze).
const { el } = require('core/dom')
const { t } = require('core/i18n')
const ls = require('core/storage')
const game = require('game')
const { EVENTS, analyzeModal, optionSummary, crownPath, branches, branchEffects, bestIndex } = require('war/analyze')

const ADVISOR_ID = 'cor-war-advisor'
const ADVISOR_KEY = 'corTrainerWarAdvisor'
const GOLD = '#e0c07a'

const pct = p => p >= 0.995 ? '100%' : p < 0.005 ? '<1%' : Math.round(p * 100) + '%'
const big = v => {
  const a = Math.abs(v)
  const s = a >= 1e6 ? (a / 1e6).toFixed(a >= 1e7 ? 0 : 1) + 'M' : a >= 1e3 ? (a / 1e3).toFixed(a >= 1e4 ? 0 : 1) + 'K' : String(Math.round(a))
  return (v < 0 ? '−' : '+') + s
}
const traitTitle = id => game.TR?.titles[id]?.title || id

// Resumen → partes de texto con color, p. ej. "☠ 70% muerte", "Prestigio +23K".
function parts(s) {
  const out = []
  if (s.death >= 0.005) out.push(['☠ ' + pct(s.death) + ' ' + t('warDeath'), '#e38a7a'])
  if (s.crown >= 0.005) out.push(['👑 ' + pct(s.crown) + ' ' + traitTitle(s.crownId), GOLD])
  for (const [k, label] of [['pr', 'prestige'], ['inf', 'influence'], ['cash', 'cash']]) {
    if (Math.abs(s[k]) >= 0.5) out.push([t(label) + ' ' + big(s[k]), s[k] > 0 ? '#9fd39a' : '#e38a7a'])
  }
  for (const [id, q] of Object.entries(s.traits)) {
    if (q >= 0.005 && !/^corona/.test(id)) out.push([traitTitle(id) + (q < 0.995 ? ' ' + pct(q) : ''), '#e0a070'])
  }
  for (const [k, key] of [['endWar', 'warEndsWar'], ['endTerm', 'warEndsTerm'], ['exile', 'warExile']]) {
    if (s[k] >= 0.005) out.push([t(key) + (s[k] < 0.995 ? ' ' + pct(s[k]) : ''), ''])
  }
  if (!out.length) out.push([t('warNothing'), ''])
  return out
}
function partsLine(parent, s, prefix) {
  const line = el('div', 'font-size:11px;line-height:1.35', parent)
  if (prefix) { const p = el('span', 'opacity:.75', line); p.textContent = prefix + ' ' }
  parts(s).forEach(([text, color], i) => {
    if (i) line.append(' · ')
    const sp = el('span', color ? 'color:' + color : 'opacity:.75', line)
    sp.textContent = text
  })
  return line
}

module.exports = {
  id: 'warEvents',
  fullWidth: true,
  build({ body, ui }) {
    document.getElementById(ADVISOR_ID)?.remove()
    const ch = () => game.player()

    // Interruptor del consejo en el juego.
    const toggle = el('label', 'display:flex;align-items:center;gap:6px;cursor:pointer;margin:2px 0', body)
    const cb = el('input', 'margin:0;cursor:pointer', toggle)
    cb.type = 'checkbox'
    cb.checked = ls.get(ADVISOR_KEY, true)
    toggle.append(t('warAdvisorToggle'))
    cb.onchange = () => { ls.set(ADVISOR_KEY, cb.checked); ui.refresh(true) }
    ui.note(body, t('warLegend'))

    // Árboles de referencia, uno por evento, en columnas.
    const grid = el('div', 'display:grid;grid-template-columns:repeat(auto-fit,minmax(380px,1fr));column-gap:22px;align-items:start', body)
    const trees = Object.entries(EVENTS).map(([evId, ev]) => {
      const crown = ev.crown ? ' · 👑 ' + traitTitle(ev.crown) : ''
      const box = ui.group(el('div', 'min-width:0', grid), ev.title + crown, 'warEvents.' + evId, true)
      return { evId, ev, box }
    })

    function renderOptions(parent, evId, opts, seen) {
      const sums = opts.map(o => optionSummary(evId, o, ch()))
      const rec = opts.length > 1 ? bestIndex(sums) : -1
      opts.forEach((o, i) => {
        const row = el('div', 'margin:4px 0', parent)
        const name = el('div', i === rec ? 'color:' + GOLD + ';font-weight:600' : '', row)
        name.textContent = (i === rec ? '★ ' : '• ') + '“' + o.text + '”'
        if (i === rec) name.title = t('warRecommended')
        partsLine(row, sums[i])
        const crown = crownPath(evId, o, ch(), sums[i])
        if (crown) partsLine(row, crown, t('warCrownPath'))
        // Un final directo (una sola rama, sin más ventanas) ya está en la línea de arriba.
        if (!o.to || isFinal(evId, o.to)) return
        if (seen.has(o.to)) { const n = el('div', 'font-size:11px;opacity:.6;margin-left:10px', row); n.textContent = t('warSeeAbove'); return }
        seen.add(o.to)
        renderStep(row, evId, o.to, seen)
      })
    }

    const isFinal = (evId, key) => { const bs = branches(evId, key, ch()); return bs.length === 1 && bs[0].p >= 1 && !bs[0].b.options }

    function renderStep(parent, evId, key, seen) {
      const bs = branches(evId, key, ch())
      const box = el('div', 'margin:2px 0 2px 6px;padding-left:8px;border-left:1px solid #5a4630', parent)
      for (const { b, p } of bs) {
        const own = branchEffects(b, ch())
        const hasEffects = own.death || own.crown || own.pr || own.inf || own.cash || Object.keys(own.traits).length || own.endWar || own.endTerm || own.exile
        if (bs.length > 1 || p < 1) { const h = el('div', 'font-size:11px;color:#d9bf8c;margin-top:3px', box); h.textContent = '🎲 ' + pct(p) }
        if (hasEffects || !b.options) partsLine(box, own)
        if (b.options) renderOptions(box, evId, b.options, seen)
      }
    }

    function renderTree({ evId, ev, box }) {
      box.innerHTML = ''
      const who = el('div', 'font-size:11px;opacity:.75;margin:2px 0', box)
      who.textContent = ev.starts ? Object.keys(ev.starts).map(w => t('warWho_' + w)).join(' / ') : t('warWho_' + ev.who)
      if (ev.note) ui.note(box, t(ev.note))
      if (ev.starts) {
        for (const [w, opts] of Object.entries(ev.starts)) { ui.subheading(box, t('warWho_' + w)); renderOptions(box, evId, opts, new Set()) }
      } else renderOptions(box, evId, ev.start, new Set())
    }

    // Las cifras dependen de los ingresos, la clase y (en la Corona de Hierba) de
    // las habilidades y heridas del personaje: se rehacen solo si eso cambia.
    let treeSig = ''
    const sigOf = () => { const c = ch(); return (game.STATS?.signature() || '') + '|' + (c ? c.id + JSON.stringify(c.skills) + c.traits.join(',') : '') }
    ui.onRefresh(() => {
      const sig = sigOf()
      if (sig === treeSig) return
      treeSig = sig
      trees.forEach(tr => { try { renderTree(tr) } catch (e) { console.warn('[trainer] árbol ' + tr.evId, e) } })
    })

    // Consejo junto a la ventana del evento.
    const advisor = el('div', 'position:fixed;z-index:2147483646;width:340px;max-height:80vh;overflow:auto;box-sizing:border-box;' +
      'background:rgba(20,16,12,.96);color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;border:1px solid #b08d57;' +
      'border-radius:8px;padding:8px 10px;box-shadow:0 4px 16px rgba(0,0,0,.5);display:none', document.body)
    advisor.id = ADVISOR_ID
    let advSig = '', marked = []
    const unmark = () => { marked.forEach(b => { b.style.outline = ''; b.style.outlineOffset = '' }); marked = [] }

    ui.onRefresh(() => {
      const a = cb.checked ? analyzeModal(game.modal(), ch()) : null
      const content = document.querySelector('#interactionModal .modal-content')
      if (!a || !content) { advisor.style.display = 'none'; advSig = ''; unmark(); return }

      const sig = JSON.stringify([a.evId, a.rec, a.options])
      if (sig !== advSig) {
        advSig = sig
        advisor.innerHTML = ''
        const head = el('div', 'color:' + GOLD + ';font-weight:600;margin-bottom:4px', advisor)
        head.textContent = '⚔ ' + t('warAdvisor') + ' · ' + a.ev.title
        a.options.forEach((o, i) => {
          const row = el('div', 'margin:6px 0', advisor)
          const name = el('div', i === a.rec ? 'color:' + GOLD + ';font-weight:600' : '', row)
          name.textContent = (i === a.rec ? '★ ' : '• ') + o.text
          partsLine(row, o.summary)
          if (o.crown) partsLine(row, o.crown, t('warCrownPath'))
        })
        ui.note(advisor, t('warAdvisorFoot'))
      }

      // Marca el botón recomendado en la ventana del juego.
      unmark()
      const btn = a.rec >= 0 && document.getElementById('interactionModalOption_' + a.rec)
      if (btn) { btn.style.outline = '2px solid ' + GOLD; btn.style.outlineOffset = '2px'; marked.push(btn) }

      // Al lado de la ventana: a la derecha, si no cabe a la izquierda, si no debajo.
      advisor.style.display = ''
      const r = content.getBoundingClientRect(), w = advisor.offsetWidth, gap = 12
      if (innerWidth - r.right >= w + gap) { advisor.style.left = (r.right + gap) + 'px'; advisor.style.top = r.top + 'px' }
      else if (r.left >= w + gap) { advisor.style.left = (r.left - gap - w) + 'px'; advisor.style.top = r.top + 'px' }
      else { advisor.style.left = Math.max(8, r.left) + 'px'; advisor.style.top = Math.min(innerHeight - 120, r.bottom + 8) + 'px' }
    })
  },
}
