// Ventana del trainer: marco movible y redimensionable, cabecera con banderas y
// la rejilla de secciones (plegables y reordenables). El contenido de cada
// sección lo aporta su módulo en features/. build() se vuelve a llamar al
// cambiar de idioma o al restablecer la posición.
const ls = require('core/storage')
const { el } = require('core/dom')
const i18n = require('core/i18n')
const FLAGS = require('core/flags')
const { createUI } = require('core/ui')
const FEATURES = require('features/index')

const { t } = i18n
const DEFAULT_W = 360, MIN_W = 280, MIN_H = 120
const COL_MIN = 290, COL_GAP = 18
const SECTION_IDS = FEATURES.map(f => f.id)

function build() {
  // Si estaba oculto con F8 (p. ej. al reinyectar en modo --dev), sigue oculto.
  const wasHidden = document.getElementById('cor-trainer')?.style.display === 'none'
  document.getElementById('cor-trainer')?.remove()
  window.__corTrainerRO?.disconnect()
  const ui = createUI()

  // Posición y tamaño: el panel se puede arrastrar (desde el título) y
  // redimensionar desde cualquier borde o esquina. Ambos se recuerdan.
  // "frame" es la ventana (borde, sombra, asas de redimensionado);
  // "box" es el contenido con scroll.
  const layout = ls.get('corTrainerLayout', {})
  const frame = el('div', 'position:fixed;z-index:2147483647;background:rgba(20,16,12,.94);box-sizing:border-box;' +
    'color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;border:1px solid #b08d57;' +
    'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);user-select:none')
  frame.id = 'cor-trainer'
  frame.lang = i18n.lang()
  // Ojo: el alto del contenido se limita con height/max-height propios y no con
  // flexbox, porque F8 alterna frame.style.display ('' <-> 'none') y perdería el flex.
  const box = el('div', 'padding:10px 12px;overflow:auto;box-sizing:border-box', frame)
  const sizeInner = () => {
    if (frame.style.height) { box.style.height = '100%'; box.style.maxHeight = 'none' }
    else { box.style.height = ''; box.style.maxHeight = 'calc(90vh - 2px)' }
  }
  frame.style.width = Math.min(layout.w || DEFAULT_W, innerWidth - 8) + 'px'
  if (layout.h) frame.style.height = Math.min(layout.h, innerHeight - 8) + 'px'
  else frame.style.maxHeight = '90vh'
  sizeInner()
  const place = (x, y) => {
    frame.style.left = Math.round(Math.max(0, Math.min(x, innerWidth - 80))) + 'px'
    frame.style.top = Math.round(Math.max(0, Math.min(y, innerHeight - 40))) + 'px'
  }
  place(layout.x ?? innerWidth - parseInt(frame.style.width) - 12, layout.y ?? 12)
  let saveTimer
  const saveLayout = () => {
    clearTimeout(saveTimer)
    saveTimer = setTimeout(() => frame.offsetWidth > 0 && ls.set('corTrainerLayout', { // oculto (F8) = no guardar
      x: frame.offsetLeft, y: frame.offsetTop, w: frame.offsetWidth, h: frame.style.height ? frame.offsetHeight : undefined,
    }), 250)
  }
  window.__corTrainerRO = new ResizeObserver(saveLayout)
  window.__corTrainerRO.observe(frame)
  // Que las teclas escritas en el panel no disparen atajos del juego (salvo F8).
  frame.addEventListener('keydown', e => { if (e.key !== 'F8') e.stopPropagation() })

  // Asas de redimensionado: 4 bordes + 4 esquinas. Sobresalen 4px hacia fuera
  // para que sean fáciles de agarrar sin tapar el contenido.
  const HANDLES = {
    n: 'top:-4px;left:10px;right:10px;height:8px;cursor:ns-resize',
    s: 'bottom:-4px;left:10px;right:10px;height:8px;cursor:ns-resize',
    e: 'right:-4px;top:10px;bottom:10px;width:8px;cursor:ew-resize',
    w: 'left:-4px;top:10px;bottom:10px;width:8px;cursor:ew-resize',
    ne: 'top:-5px;right:-5px;width:14px;height:14px;cursor:nesw-resize',
    nw: 'top:-5px;left:-5px;width:14px;height:14px;cursor:nwse-resize',
    se: 'bottom:-5px;right:-5px;width:14px;height:14px;cursor:nwse-resize',
    sw: 'bottom:-5px;left:-5px;width:14px;height:14px;cursor:nesw-resize',
  }
  for (const [dir, css] of Object.entries(HANDLES)) {
    const h = el('div', 'position:absolute;z-index:2;' + css, frame)
    h.title = t('resizeHint')
    h.addEventListener('mousedown', e => {
      if (e.button !== 0) return
      e.preventDefault()
      const sx = e.clientX, sy = e.clientY
      const r = { x: frame.offsetLeft, y: frame.offsetTop, w: frame.offsetWidth, h: frame.offsetHeight }
      const move = ev => {
        const dx = ev.clientX - sx, dy = ev.clientY - sy
        let { x, y, w, h: hh } = r
        if (dir.includes('e')) w = Math.min(Math.max(MIN_W, r.w + dx), innerWidth - r.x)
        if (dir.includes('s')) hh = Math.min(Math.max(MIN_H, r.h + dy), innerHeight - r.y)
        if (dir.includes('w')) { w = Math.min(Math.max(MIN_W, r.w - dx), r.x + r.w); x = r.x + r.w - w }
        if (dir.includes('n')) { hh = Math.min(Math.max(MIN_H, r.h - dy), r.y + r.h); y = r.y + r.h - hh }
        frame.style.left = x + 'px'
        frame.style.top = y + 'px'
        frame.style.width = w + 'px'
        if (dir.includes('n') || dir.includes('s')) { frame.style.height = hh + 'px'; frame.style.maxHeight = 'none'; sizeInner() }
      }
      const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); document.body.style.cursor = ''; saveLayout() }
      document.body.style.cursor = getComputedStyle(h).cursor
      addEventListener('mousemove', move)
      addEventListener('mouseup', up)
    })
  }

  // Cabecera: título (arrastrable) + botón de reinicio + banderas de idioma.
  const header = el('div', 'margin-bottom:6px', box)
  const titleLine = el('div', 'display:flex;align-items:baseline;gap:8px;cursor:move', header)
  titleLine.title = t('dragHint')
  const title = el('span', 'font-weight:600;color:#e0c07a;flex:1', titleLine)
  title.textContent = '⠿ Trainer'
  const hint = el('span', 'font-size:11px;opacity:.7', titleLine)
  hint.textContent = t('hideHint')
  const ICON_BTN = 'background:none;border:none;color:#e0c07a;cursor:pointer;padding:0 2px;font-size:14px'
  // Plegar / desplegar todas las secciones y bloques a la vez.
  for (const [icon, tip, folded] of [['⊟', 'collapseAll', true], ['⊞', 'expandAll', false]]) {
    const b = el('button', ICON_BTN, titleLine)
    b.textContent = icon
    b.title = t(tip)
    b.onclick = () => ui.collapsibles.forEach(c => c.set(folded))
  }
  const reset = el('button', ICON_BTN, titleLine)
  reset.textContent = '↺'
  reset.title = t('resetLayout')
  reset.onclick = () => { ls.set('corTrainerLayout', {}); ls.set('corTrainerOrder', null); build() }
  titleLine.addEventListener('mousedown', e => {
    if (e.button !== 0 || e.target.closest('button')) return
    const dx = e.clientX - frame.offsetLeft, dy = e.clientY - frame.offsetTop
    const move = ev => place(ev.clientX - dx, ev.clientY - dy)
    const up = () => { removeEventListener('mousemove', move); removeEventListener('mouseup', up); saveLayout() }
    addEventListener('mousemove', move)
    addEventListener('mouseup', up)
    e.preventDefault()
  })
  const flags = el('div', 'display:flex;gap:6px;margin-top:6px', header)
  for (const [code, svg] of FLAGS) {
    const active = code === i18n.lang()
    const b = el('button', 'padding:0;line-height:0;cursor:pointer;background:none;border-radius:3px;' +
      'border:2px solid ' + (active ? '#e0c07a' : 'transparent') + ';opacity:' + (active ? '1' : '.55') + ';transition:opacity .15s', flags)
    b.title = i18n.langName(code)
    b.setAttribute('aria-label', i18n.langName(code))
    b.setAttribute('aria-pressed', String(active))
    b.innerHTML = '<svg width="30" height="20" viewBox="0 0 30 20" style="display:block;border-radius:1px">' + svg + '</svg>'
    b.onmouseenter = () => { b.style.opacity = '1' }
    b.onmouseleave = () => { b.style.opacity = active ? '1' : '.55' }
    b.onclick = () => { if (!active) { i18n.setLang(code); build() } }
  }

  // Secciones: tarjetas en una rejilla. Si el panel es ancho se reparten en
  // varias columnas. Se pueden plegar (clic en el título) y reordenar
  // (arrastrando la cabecera o con ▲▼). Plegado y orden se recuerdan.
  const grid = el('div', 'display:grid;grid-template-columns:minmax(0,1fr);column-gap:18px;align-items:start', box)
  const cards = {}
  // Número de columnas = cuántas tarjetas normales caben (mín. 290px c/u), sin
  // pasar del número de tarjetas: así no quedan columnas vacías a la derecha.
  // (Las tarjetas a todo el ancho, como Propiedades, no cuentan.)
  const fitColumns = () => {
    const normal = Object.values(cards).filter(c => c.style.gridColumn !== '1 / -1').length || 1
    const fit = Math.floor((grid.clientWidth + COL_GAP) / (COL_MIN + COL_GAP)) || 1
    grid.style.gridTemplateColumns = 'repeat(' + Math.max(1, Math.min(normal, fit)) + ',minmax(0,1fr))'
  }
  window.__corTrainerGridRO?.disconnect()
  window.__corTrainerGridRO = new ResizeObserver(fitColumns)
  window.__corTrainerGridRO.observe(grid)
  const collapsed = ls.get('corTrainerCollapsedV2', {})
  let order = (ls.get('corTrainerOrder', null) || []).filter(id => SECTION_IDS.includes(id))
  order = order.concat(SECTION_IDS.filter(id => !order.includes(id)))
  const applyOrder = () => order.forEach(id => cards[id] && grid.appendChild(cards[id]))
  const moveSection = (id, to) => {
    const from = order.indexOf(id)
    if (from < 0 || to < 0 || to >= order.length || to === from) return
    order.splice(from, 1)
    order.splice(to, 0, id)
    ls.set('corTrainerOrder', order)
    applyOrder()
  }
  let dragging = null
  function section(id) {
    const card = el('div', 'border-radius:6px;transition:background .1s', grid)
    cards[id] = card
    const head = el('div', 'display:flex;align-items:center;gap:4px;margin:8px 0 2px;padding-top:6px;border-top:1px solid #5a4630;color:#e0c07a;font-weight:600', card)
    head.draggable = true
    head.title = t('dragSection')
    const grip = el('span', 'cursor:grab;opacity:.55;font-weight:400', head)
    grip.textContent = '⠿'
    const name = el('span', 'flex:1;cursor:pointer', head)
    const arrow = (text, tip, delta) => {
      const b = el('button', 'background:none;border:none;color:#e0c07a;cursor:pointer;padding:0 3px;font-size:10px;opacity:.7', head)
      b.textContent = text
      b.title = tip
      b.onclick = e => { e.stopPropagation(); moveSection(id, order.indexOf(id) + delta) }
    }
    arrow('▲', t('moveUp'), -1)
    arrow('▼', t('moveDown'), 1)
    const body = el('div', '', card)
    const paint = () => { name.textContent = (collapsed[id] ? '▸ ' : '▾ ') + t(id); body.style.display = collapsed[id] ? 'none' : '' }
    const setCollapsed = v => { collapsed[id] = v; ls.set('corTrainerCollapsedV2', collapsed); paint() }
    name.onclick = () => setCollapsed(!collapsed[id])
    paint()
    ui.collapsibles.push({ set: setCollapsed, get: () => !!collapsed[id] })
    head.addEventListener('dragstart', e => { dragging = id; e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain', id); card.style.opacity = '.5' })
    head.addEventListener('dragend', () => { dragging = null; card.style.opacity = ''; Object.values(cards).forEach(c => { c.style.background = '' }) })
    card.addEventListener('dragover', e => { if (dragging && dragging !== id) { e.preventDefault(); card.style.background = 'rgba(224,192,122,.12)' } })
    card.addEventListener('dragleave', () => { card.style.background = '' })
    card.addEventListener('drop', e => { e.preventDefault(); card.style.background = ''; if (dragging) moveSection(dragging, order.indexOf(id)) })
    return body
  }

  // Cada sección construye su contenido. Si una falla (p. ej. tras una
  // actualización del juego), las demás siguen funcionando.
  for (const f of FEATURES) {
    const body = section(f.id)
    if (f.fullWidth) cards[f.id].style.gridColumn = '1 / -1'
    try { f.build({ body, ui }) } catch (e) {
      console.warn('[trainer] error en la sección ' + f.id, e)
      ui.note(body, t('notAvailable'))
    }
  }

  applyOrder()
  if (wasHidden) frame.style.display = 'none'
  document.body.appendChild(frame)

  clearInterval(window.__corTrainerTimer)
  window.__corTrainerTimer = setInterval(() => ui.refresh(), 500)
  ui.refresh(true)
}

module.exports = { build }
