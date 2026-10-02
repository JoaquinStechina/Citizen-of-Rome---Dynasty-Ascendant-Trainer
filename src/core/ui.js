// Piezas de interfaz reutilizables por las secciones. createUI() se llama en
// cada construcción del panel y guarda las filas y refrescos de esa construcción;
// ui.refresh() (llamado cada 500 ms y tras cada acción) actualiza lo que se ve.
const { CTRL_CSS, el, fmt } = require('core/dom')
const { t } = require('core/i18n')
const ls = require('core/storage')
const game = require('game')

// Bloques plegados dentro de las secciones: { 'family.traits': true, … }.
const GROUPS_KEY = 'corTrainerGroups'

// Orden y nombres de los grupos de rasgos en los desplegables.
const GROUP_ORDER = ['education', 'personality', 'good', 'bad', 'goodGenetic', 'badGenetic', 'neutralGenetic', 'skill', 'militaryHonor', 'neutral']
const groupName = g => GROUP_ORDER.includes(g) ? t('g_' + g) : g

function createUI() {
  const rows = [], refreshers = []
  const ui = {}

  // Registra una función que se ejecuta en cada refresco; recibe `force`
  // (true tras una acción del usuario, para redibujar aunque nada cambie).
  ui.onRefresh = fn => refreshers.push(fn)

  ui.refresh = force => {
    for (const fn of refreshers) { try { fn(force) } catch (e) { console.warn('[trainer]', e) } }
    for (const { c, input, btns, sub, inline } of rows) {
      let on = true; try { on = c.enabled ? c.enabled() : true } catch { on = false }
      input.disabled = !on
      btns.forEach(b => { b.disabled = !on; b.style.opacity = on ? '' : '.4' })
      if (sub) { try { sub.textContent = c.suffix() } catch {} }
      if (inline) {
        try { inline.textContent = c.inline(); inline.style.color = c.inlineColor ? c.inlineColor() : ''; inline.style.opacity = inline.style.color ? '1' : '.7' } catch {}
      }
      if (document.activeElement === input) continue // no pisar lo que estás escribiendo
      let v; try { v = c.get() } catch {}
      input.value = fmt(v)
    }
  }

  // Botón que ejecuta `fn` y refresca el panel.
  ui.button = (parent, text, fn, tip) => {
    const b = el('button', CTRL_CSS + ';padding:1px 6px;cursor:pointer', parent)
    b.textContent = text
    if (tip) b.title = tip
    b.onclick = () => { try { fn(); ui.refresh(true) } catch (e) { console.warn('[trainer]', e) } }
    return b
  }

  // Desplegable a todo el ancho; `onchange(valor)` y luego refresca.
  ui.select = (parent, onchange) => {
    const s = el('select', CTRL_CSS + ';width:100%;padding:2px;margin:2px 0', parent)
    s.onchange = () => { onchange(s.value); ui.refresh(true) }
    return s
  }

  ui.note = (parent, text) => { const n = el('div', 'font-size:11px;opacity:.7;margin-top:3px', parent); n.textContent = text; return n }
  ui.subheading = (parent, text) => { const h = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600', parent); h.textContent = text }

  // Todo lo plegable del panel (secciones y bloques): { set(plegado), get() }.
  // Lo usan los botones de la cabecera "plegar todo" / "desplegar todo".
  ui.collapsibles = []

  // Bloque plegable dentro de una sección: clic en el título para abrir/cerrar.
  // `key` identifica el bloque para recordar si está plegado (p. ej. 'family.traits');
  // `folded` = plegado hasta que el jugador lo abra por primera vez.
  // Devuelve el contenedor donde poner el contenido; su título es body.previousSibling.
  const groupState = ls.get(GROUPS_KEY, {})
  ui.group = (parent, text, key, folded = false) => {
    const head = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600;cursor:pointer', parent)
    const body = el('div', '', parent)
    const get = () => groupState[key] ?? folded
    const paint = () => { head.textContent = (get() ? '▸ ' : '▾ ') + text; body.style.display = get() ? 'none' : '' }
    const set = v => { groupState[key] = v; ls.set(GROUPS_KEY, groupState); paint() }
    head.onclick = () => set(!get())
    paint()
    ui.collapsibles.push({ set, get })
    return body
  }

  // Fila: etiqueta, campo editable (Enter o salir del campo = aplicar) y botones +N.
  //   c = { label, get(), set(v), steps: [n, …] }
  // Opcionales: c.enabled() desactiva la fila, c.extra = [[texto, fn, ayuda], …] añade
  // botones, c.suffix() una nota debajo, c.inline() un texto corto junto al campo
  // (con c.inlineColor()), c.wide = etiqueta flexible y campo estrecho (para nombres
  // largos), c.tip = ayuda al pasar el ratón por la etiqueta.
  ui.addRow = (c, parent) => {
    const row = el('div', 'display:flex;align-items:center;gap:4px;margin:4px 0', parent)
    const label = el('span', c.wide ? 'flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap' : 'width:92px;flex-shrink:0', row)
    label.textContent = c.label
    label.title = c.tip || (c.wide ? c.label : '')
    const input = el('input', CTRL_CSS + ';' + (c.wide ? 'width:72px;flex:none' : 'flex:1;min-width:0') + ';padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums', row)
    const inline = c.inline ? el('span', 'font-size:11px;min-width:44px;font-variant-numeric:tabular-nums', row) : null
    input.type = 'number'
    input.step = 'any'
    input.addEventListener('change', () => {
      const v = parseFloat(input.value)
      if (!Number.isNaN(v)) { try { c.set(v) } catch (e) { console.warn('[trainer]', e) } }
      ui.refresh(true)
    })
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur()
      else if (e.key === 'Escape') { input.value = fmt(c.get()); input.blur() }
    })
    const short = n => n >= 1000 ? (n / 1000) + 'k' : String(n)
    const btns = (c.steps || []).map(n => ui.button(row, '+' + short(n), () => c.set((c.get() || 0) + n)))
    for (const [text, fn, tip] of c.extra || []) btns.push(ui.button(row, text, fn, tip))
    let sub = null
    if (c.suffix) sub = el('div', 'font-size:11px;opacity:.7;text-align:right;margin:-3px 0 4px', parent)
    rows.push({ c, input, btns, sub, inline })
  }

  // Fila de edad para un personaje o mascota. El juego calcula la edad a partir de
  // birthMonth/birthYear, así que cambiarla es mover el año de nacimiento (se
  // conserva el mes). `extraNote(x)` añade texto a la nota de debajo.
  ui.ageRow = (entity, parent, extraNote) => {
    const years = () => Math.floor(game.ageOf(entity()))
    const setAge = v => {
      const x = entity()
      if (!x) return
      x.birthYear += Math.floor(game.ageOf(x)) - Math.max(0, Math.floor(v))
    }
    ui.addRow({
      label: t('age'),
      get: () => entity() ? years() : undefined,
      set: setAge,
      enabled: () => !!entity(),
      steps: [1, 5],
      extra: [['−1', () => setAge(years() - 1)], ['−5', () => setAge(years() - 5)]],
      suffix: () => {
        const x = entity()
        if (!x) return ''
        const more = extraNote ? extraNote(x) : ''
        return t('bornIn', { year: x.birthYear }) + (more ? ' · ' + more : '')
      },
    }, parent)
  }

  // Editor de rasgos (personajes y mascotas): etiquetas con × para quitar y un
  // desplegable agrupado para añadir.
  ui.traitEditor = (parent, { entity, list, title, describe, add, remove, available }) => {
    const chips = el('div', 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0', parent)
    const line = el('div', 'display:flex;gap:4px;margin-top:4px', parent)
    const pick = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', line)
    ui.button(line, t('add'), () => { const e = entity(); if (e && pick.value) add(e, pick.value) }, t('addTip'))
    ui.note(parent, t('traitNote'))
    if (!available) { chips.textContent = t('notAvailable'); line.style.display = 'none'; return }
    let sig = ''
    ui.onRefresh(force => {
      const e = entity(), owned = e?.traits || []
      const now = (e?.id || '') + ':' + owned.join(',')
      if (now === sig && !force) return
      sig = now
      chips.innerHTML = ''
      if (!e) { chips.innerHTML = '<span style="opacity:.6">—</span>'; pick.innerHTML = ''; return }
      if (!owned.length) { const n = el('span', 'opacity:.6', chips); n.textContent = t('noTraits') }
      for (const id of owned) {
        const chip = el('span', 'display:inline-flex;align-items:center;gap:3px;background:#2a2118;border:1px solid #5a4630;border-radius:10px;padding:0 4px 0 8px', chips)
        chip.title = describe(id)
        chip.append(title(id))
        const x = ui.button(chip, '×', () => remove(e, id), t('removeTrait'))
        x.style.cssText += ';border:none;background:none;padding:0 2px;font-weight:700'
      }
      ui.fillTraitSelect(pick, Object.keys(list()).filter(id => !owned.includes(id)), list(), title, describe)
    })
  }

  // Rellena el desplegable `pick` con los rasgos `ids`, agrupados y ordenados por
  // nombre. Conserva lo elegido si sigue en la lista.
  ui.fillTraitSelect = (pick, ids, defs, title, describe) => {
    const prev = pick.value
    pick.innerHTML = ''
    const byGroup = {}
    for (const id of ids) { const g = defs[id]?.group; (byGroup[g] = byGroup[g] || []).push(id) }
    for (const g of GROUP_ORDER.concat(Object.keys(byGroup).filter(g => !GROUP_ORDER.includes(g)))) {
      if (!byGroup[g]) continue
      const og = el('optgroup', '', pick)
      og.label = groupName(g)
      byGroup[g].sort((a, b) => title(a).localeCompare(title(b))).forEach(id => {
        const o = el('option', '', og)
        o.value = id
        o.textContent = title(id)
        o.title = describe(id)
      })
    }
    if (prev && ids.includes(prev)) pick.value = prev
  }

  // Rellena `sel` con list() y lo reconstruye solo cuando cambia la lista.
  // Si el elegido desaparece, elige el primero. Si otra sección cambia la
  // selección compartida, el desplegable la sigue.
  ui.rosterSelect = (sel, list, getId, setId, label, emptyText) => {
    let sig = ''
    ui.onRefresh(() => {
      const items = list()
      const now = items.map(x => x.id + label(x)).join('|')
      if (now !== sig) {
        sig = now
        if (!items.some(x => x.id === getId())) setId(items[0]?.id ?? null)
        sel.innerHTML = ''
        if (!items.length) { const o = el('option', '', sel); o.value = ''; o.textContent = emptyText }
        for (const x of items) { const o = el('option', '', sel); o.value = x.id; o.textContent = label(x) }
      }
      if (document.activeElement !== sel && sel.value !== String(getId() ?? '')) sel.value = getId() ?? ''
    })
  }

  return ui
}

module.exports = { createUI }
