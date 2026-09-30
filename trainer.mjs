// Citizen of Rome - Dynasty Ascendant :: trainer via Chrome DevTools Protocol
//
// Requisitos: Node 22+ (usa fetch y WebSocket nativos, sin dependencias).
// Uso:
//   1. Steam -> juego -> Propiedades -> Opciones de lanzamiento:
//        --remote-debugging-port=9222
//   2. Abre el juego y carga tu partida.
//   3. node trainer.mjs
//   4. En el juego, pulsa F8 para mostrar/ocultar el panel del trainer.
//
// El script queda conectado y vuelve a inyectar el panel si el juego recarga
// la página. Ctrl+C para salir (el panel desaparece al recargar el juego).

const PORT = Number(process.env.CDP_PORT || 9222)

// Código que se ejecuta DENTRO del juego. Crea un panel flotante que modifica
// el estado Vuex del juego (document.querySelector('#app').__vue__.$store).
const PANEL = String.raw`(() => {
  const store = () => document.querySelector('#app')?.__vue__?.$store
  const S = () => store()?.state
  const player = () => { const s = S(); return s?.characters?.[s.current.id] }
  const dynasty = () => { const s = S(), p = player(); return p && s.dynasties?.[p.dynastyId] }

  // Módulos internos del juego (webpack). Se usan las mismas funciones que el
  // juego para añadir/quitar rasgos: aplican los bonus de habilidad del rasgo y
  // quitan los rasgos opuestos. No activa el modo mods (los logros siguen).
  function gameRequire() {
    if (window.__corReq) return window.__corReq
    const key = Object.keys(window).find(k => /^webpackJsonp/.test(k))
    if (!key) return null
    const mid = '__cor' + Date.now()
    window[key].push([[mid], { [mid]: (m, e, r) => { window.__corReq = r } }, [[mid]]])
    return window.__corReq || null
  }
  let TR = null
  try {
    const req = gameRequire()
    const defs = req('50ab').default()
    TR = { defs, titles: req('7073').default(), add: req('a822').a, remove: req('cc6f').a, discoverable: defs.discoverable || [] }
  } catch (e) { console.warn('[trainer] rasgos no disponibles', e) }
  // Trabajos: definiciones (maxLevel por trabajo), nombres y la función del juego
  // que fija el nivel (lo limita a [0, maxLevel] y recalcula al personaje).
  let JOBS = null
  try {
    const req = gameRequire()
    JOBS = { types: req('0262').default.types, titles: req('c9c8').default.titles || {}, set: req('6cf7').a }
  } catch (e) { console.warn('[trainer] trabajos no disponibles', e) }
  let PET_TYPES = {}
  try { PET_TYPES = gameRequire()('ed26').a.types || {} } catch (e) { console.warn('[trainer] tipos de mascota no disponibles', e) }
  const GROUPS = {
    education: 'Educación', personality: 'Personalidad', good: 'Buenos', bad: 'Malos',
    goodGenetic: 'Genética buena', badGenetic: 'Genética mala', neutralGenetic: 'Genética neutral',
    skill: 'Habilidad', militaryHonor: 'Honores militares', neutral: 'Neutrales / cargos',
  }
  const traitTitle = id => TR?.titles?.[id]?.title || id

  // Personaje elegido en el desplegable de la sección "Familia".
  let selectedId = null
  const selected = () => S()?.characters?.[selectedId]
  const household = () => {
    const s = S()
    if (!s) return []
    const ids = [s.current.id, ...(s.current.householdCharacterIds || [])]
    return [...new Set(ids)].map(id => s.characters[id]).filter(c => c && !c.isDead)
  }

  const cheats = [
    { label: 'Dinero',     get: () => S()?.current.cash,      set: v => { S().current.cash = v },      steps: [1000, 10000] },
    { label: 'Influencia', get: () => S()?.current.influence, set: v => { S().current.influence = v }, steps: [1000, 10000] },
    { label: 'Prestigio',  get: () => dynasty()?.prestige,    set: v => { dynasty().prestige = v },    steps: [1000, 10000] },
  ]
  const SKILLS = { intelligence: 'Inteligencia', stewardship: 'Administración', eloquence: 'Elocuencia', combat: 'Combate' }
  const skillCheats = Object.entries(SKILLS).map(([key, label]) => ({
    label, get: () => selected()?.skills?.[key], set: v => { selected().skills[key] = v }, steps: [1, 5],
  }))
  const SKILL_MAX = 30 // a partir de ~27 las fórmulas del juego ya dan el máximo (99%)

  const jobMax = () => { const ch = selected(); return (ch?.job && JOBS?.types[ch.job]?.maxLevel) || 0 }
  const setJobLevel = v => {
    const ch = selected()
    if (!ch?.job) return
    if (JOBS) JOBS.set(S(), { characterId: ch.id, jobLevel: v })
    else ch.jobLevel = Math.max(0, v)
  }
  const jobCheat = {
    label: 'Nivel trabajo',
    get: () => selected()?.job ? selected().jobLevel : undefined,
    set: setJobLevel,
    enabled: () => !!selected()?.job,
    steps: [1, 5],
    extra: [['Máx', () => setJobLevel(jobMax()), 'Sube al nivel máximo de este trabajo']],
    suffix: () => {
      const ch = selected()
      if (!ch?.job) return 'sin trabajo'
      return (JOBS?.titles[ch.job] || ch.job) + ' · máx ' + jobMax()
    },
  }

  // Mascotas: las del jugador, las de la casa y las de cada miembro de la familia.
  let selectedPetId = null
  const pets = () => S()?.current?.pets || {}
  const selectedPet = () => pets()[selectedPetId]
  const householdPets = () => {
    const s = S()
    if (!s) return []
    const ids = [...(s.current.petIds || []), ...(s.current.householdPetIds || [])]
    household().forEach(ch => ids.push(...(ch.petIds || [])))
    return [...new Set(ids)].map(id => pets()[id]).filter(p => p && !p.isDead)
  }
  const PET_SKILLS = { aptitude: 'Aptitud', vigor: 'Vigor', tameness: 'Docilidad' }
  const petCheats = Object.entries(PET_SKILLS).map(([key, label]) => ({
    label, get: () => selectedPet()?.skills?.[key], set: v => { selectedPet().skills[key] = v },
    enabled: () => !!selectedPet(), steps: [1, 5],
  }))

  document.getElementById('cor-trainer')?.remove()
  const box = document.createElement('div')
  box.id = 'cor-trainer'
  box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:rgba(20,16,12,.94);' +
    'color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;padding:10px 12px;border:1px solid #b08d57;' +
    'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);width:300px;max-height:90vh;overflow:auto;user-select:none'
  box.innerHTML = '<div style="font-weight:600;margin-bottom:6px;color:#e0c07a">Trainer &middot; F8 oculta</div>'
  // Que las teclas escritas en el panel no disparen atajos del juego (salvo F8).
  box.addEventListener('keydown', e => { if (e.key !== 'F8') e.stopPropagation() })

  const fmt = v => typeof v === 'number' ? String(Math.round(v * 100) / 100) : ''
  const CTRL_CSS = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px'
  const button = (parent, text, fn, title) => {
    const b = document.createElement('button')
    b.textContent = text
    if (title) b.title = title
    b.style.cssText = CTRL_CSS + ';padding:1px 6px;cursor:pointer'
    b.onclick = () => { try { fn(); refresh() } catch (e) { console.warn('[trainer]', e) } }
    parent.appendChild(b)
    return b
  }
  const heading = (text, parent = box) => {
    const h = document.createElement('div')
    h.textContent = text
    h.style.cssText = 'margin:8px 0 2px;padding-top:6px;border-top:1px solid #5a4630;color:#e0c07a;font-weight:600'
    parent.appendChild(h)
  }

  // Fila: etiqueta, campo editable (Enter o salir del campo = aplicar) y botones +N.
  // Opcionales: c.enabled() desactiva la fila, c.extra añade botones, c.suffix() una nota debajo.
  const rows = []
  function addRow(c, parent = box) {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin:4px 0'
    const label = document.createElement('span')
    label.textContent = c.label
    label.style.cssText = 'width:96px'
    const input = document.createElement('input')
    input.type = 'number'
    input.step = 'any'
    input.style.cssText = CTRL_CSS + ';flex:1;min-width:0;padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums'
    const apply = () => {
      const v = parseFloat(input.value)
      if (!Number.isNaN(v)) { try { c.set(v) } catch (e) { console.warn('[trainer]', e) } }
      refresh()
    }
    input.addEventListener('change', apply)
    input.addEventListener('keydown', e => { if (e.key === 'Enter') { input.blur() } else if (e.key === 'Escape') { input.value = fmt(c.get()); input.blur() } })
    row.append(label, input)
    const short = n => n >= 1000 ? (n / 1000) + 'k' : String(n)
    const btns = c.steps.map(n => button(row, '+' + short(n), () => c.set((c.get() || 0) + n)))
    for (const [text, fn, title] of c.extra || []) btns.push(button(row, text, fn, title))
    parent.appendChild(row)
    let note = null
    if (c.suffix) {
      note = document.createElement('div')
      note.style.cssText = 'font-size:11px;opacity:.7;text-align:right;margin:-3px 0 4px'
      parent.appendChild(note)
    }
    rows.push({ c, input, btns, note })
  }

  cheats.forEach(c => addRow(c))

  heading('Familia')
  const pick = document.createElement('select')
  pick.style.cssText = CTRL_CSS + ';width:100%;padding:2px;margin:2px 0'
  pick.onchange = () => { selectedId = pick.value; lastTraitSig = ''; refresh() }
  box.appendChild(pick)
  skillCheats.forEach(c => addRow(c))
  const bulk = document.createElement('div')
  bulk.style.cssText = 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px'
  button(bulk, 'Todo a ' + SKILL_MAX, () => { for (const k in SKILLS) selected().skills[k] = SKILL_MAX })
  button(bulk, 'Toda la familia a ' + SKILL_MAX, () => household().forEach(ch => { for (const k in SKILLS) ch.skills[k] = SKILL_MAX }))
  box.appendChild(bulk)
  addRow(jobCheat)

  // Rasgos del personaje elegido.
  const traitBox = document.createElement('div')
  box.appendChild(traitBox)
  heading('Rasgos', traitBox)
  const chips = document.createElement('div')
  chips.style.cssText = 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0'
  traitBox.appendChild(chips)
  const addLine = document.createElement('div')
  addLine.style.cssText = 'display:flex;gap:4px;margin-top:4px'
  const traitPick = document.createElement('select')
  traitPick.style.cssText = CTRL_CSS + ';flex:1;min-width:0;padding:2px'
  addLine.appendChild(traitPick)
  button(addLine, 'Añadir', () => {
    const id = traitPick.value, ch = selected()
    if (!id || !ch) return
    TR.add(S(), ch.id, id)
    if (TR.discoverable.includes(id)) {
      ch.discoveredTraits = ch.discoveredTraits || []
      if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
    }
  }, 'Usa la función del juego: suma los bonus del rasgo y quita sus opuestos')
  traitBox.appendChild(addLine)
  const note = document.createElement('div')
  note.style.cssText = 'font-size:11px;opacity:.7;margin-top:3px'
  note.textContent = 'Añadir/quitar un rasgo también suma/resta sus bonus de habilidad. Los rasgos opuestos se quitan solos.'
  traitBox.appendChild(note)
  if (!TR) {
    chips.textContent = 'No se pudieron cargar los rasgos (¿versión distinta del juego?).'
    addLine.style.display = note.style.display = 'none'
  }

  let lastTraitSig = ''
  function refreshTraits() {
    if (!TR) return
    const ch = selected()
    const owned = ch?.traits || []
    const sig = (ch?.id || '') + ':' + owned.join(',')
    if (sig === lastTraitSig) return
    lastTraitSig = sig
    chips.innerHTML = ''
    if (!owned.length) chips.innerHTML = '<span style="opacity:.6">Sin rasgos</span>'
    for (const id of owned) {
      const chip = document.createElement('span')
      chip.style.cssText = 'display:inline-flex;align-items:center;gap:3px;background:#2a2118;border:1px solid #5a4630;border-radius:10px;padding:0 4px 0 8px'
      chip.title = TR.titles[id]?.description || ''
      chip.append(traitTitle(id))
      const x = button(chip, '×', () => TR.remove(S(), ch.id, id, true), 'Quitar rasgo')
      x.style.cssText += ';border:none;background:none;padding:0 2px;font-weight:700'
      chips.appendChild(chip)
    }
    const prev = traitPick.value
    traitPick.innerHTML = ''
    const byGroup = {}
    for (const [id, def] of Object.entries(TR.defs.list)) {
      if (owned.includes(id)) continue
      ;(byGroup[def.group] = byGroup[def.group] || []).push(id)
    }
    for (const g of Object.keys(GROUPS).concat(Object.keys(byGroup).filter(g => !GROUPS[g]))) {
      if (!byGroup[g]) continue
      const og = document.createElement('optgroup')
      og.label = GROUPS[g] || g
      byGroup[g].sort((a, b) => traitTitle(a).localeCompare(traitTitle(b))).forEach(id => {
        const o = document.createElement('option')
        o.value = id
        o.textContent = traitTitle(id)
        o.title = TR.titles[id]?.description || ''
        og.appendChild(o)
      })
      traitPick.appendChild(og)
    }
    if (prev && !owned.includes(prev)) traitPick.value = prev
  }

  // Mascotas.
  heading('Mascotas')
  const petPick = document.createElement('select')
  petPick.style.cssText = CTRL_CSS + ';width:100%;padding:2px;margin:2px 0'
  petPick.onchange = () => { selectedPetId = petPick.value; refresh() }
  box.appendChild(petPick)
  petCheats.forEach(c => addRow(c))
  const petBulk = document.createElement('div')
  petBulk.style.cssText = 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px'
  button(petBulk, 'Todo a ' + SKILL_MAX, () => { const p = selectedPet(); if (p) for (const k in PET_SKILLS) p.skills[k] = SKILL_MAX })
  button(petBulk, 'Todas las mascotas a ' + SKILL_MAX, () => householdPets().forEach(p => { for (const k in PET_SKILLS) p.skills[k] = SKILL_MAX }))
  box.appendChild(petBulk)

  document.body.appendChild(box)

  let lastPetRoster = ''
  function refreshPets() {
    const list = householdPets()
    const roster = list.map(p => p.id + p.name).join('|')
    if (roster === lastPetRoster) return
    lastPetRoster = roster
    if (!list.some(p => p.id === selectedPetId)) selectedPetId = list[0]?.id ?? null
    petPick.innerHTML = ''
    if (!list.length) petPick.innerHTML = '<option value="">Sin mascotas</option>'
    for (const p of list) {
      const o = document.createElement('option')
      o.value = p.id
      const owner = S().characters[p.ownerId]?.praenomen
      const breed = PET_TYPES[p.type]?.breed || p.type
      o.textContent = p.name + ' (' + breed + (owner ? ', de ' + owner : '') + ')'
      petPick.appendChild(o)
    }
    petPick.value = selectedPetId ?? ''
  }

  let lastRoster = ''
  function refreshRoster() {
    const list = household()
    const roster = list.map(ch => ch.id + ch.praenomen).join('|')
    if (roster === lastRoster) return
    lastRoster = roster
    if (!list.some(ch => ch.id === selectedId)) selectedId = list[0]?.id ?? null
    pick.innerHTML = ''
    for (const ch of list) {
      const o = document.createElement('option')
      o.value = ch.id
      o.textContent = ch.praenomen + (ch.id === S().current.id ? ' (tú)' : '')
      pick.appendChild(o)
    }
    pick.value = selectedId ?? ''
  }

  function refresh() {
    try { refreshRoster() } catch {}
    try { refreshPets() } catch {}
    for (const { c, input, btns, note } of rows) {
      let on = true; try { on = c.enabled ? c.enabled() : true } catch { on = false }
      input.disabled = !on
      btns.forEach(b => { b.disabled = !on; b.style.opacity = on ? '' : '.4' })
      if (note) { try { note.textContent = c.suffix() } catch {} }
      if (document.activeElement === input) continue // no pisar lo que estás escribiendo
      let v; try { v = c.get() } catch {}
      input.value = fmt(v)
    }
    try { refreshTraits() } catch (e) { console.warn('[trainer]', e) }
  }
  clearInterval(window.__corTrainerTimer)
  window.__corTrainerTimer = setInterval(refresh, 500)
  refresh()

  if (!window.__corTrainerKeys) {
    window.__corTrainerKeys = true
    window.addEventListener('keydown', e => {
      if (e.key === 'F8') {
        const el = document.getElementById('cor-trainer')
        if (el) el.style.display = el.style.display === 'none' ? '' : 'none'
      }
    })
  }
  return store() ? 'ok' : 'store-not-ready'
})()`

async function findGamePage() {
  const res = await fetch(`http://127.0.0.1:${PORT}/json/list`)
  const targets = await res.json()
  const page = targets.find(t => t.type === 'page' && /index\.html/.test(t.url))
    || targets.find(t => t.type === 'page')
  if (!page) throw new Error('No se encontró la ventana del juego en el puerto de depuración.')
  return page
}

function connect(wsUrl) {
  const ws = new WebSocket(wsUrl)
  let nextId = 1
  const pending = new Map()
  const listeners = new Set()
  ws.onmessage = ev => {
    const msg = JSON.parse(ev.data)
    if (msg.id && pending.has(msg.id)) {
      const { resolve, reject } = pending.get(msg.id)
      pending.delete(msg.id)
      msg.error ? reject(new Error(msg.error.message)) : resolve(msg.result)
    } else if (msg.method) {
      listeners.forEach(fn => fn(msg))
    }
  }
  const send = (method, params = {}) => new Promise((resolve, reject) => {
    const id = nextId++
    pending.set(id, { resolve, reject })
    ws.send(JSON.stringify({ id, method, params }))
  })
  const opened = new Promise((resolve, reject) => {
    ws.onopen = resolve
    ws.onerror = () => reject(new Error('No se pudo abrir el WebSocket de depuración.'))
  })
  return { ws, send, opened, on: fn => listeners.add(fn) }
}

async function inject(send) {
  // Reintenta hasta que Vue y la partida estén listos.
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression: PANEL, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'error al inyectar')
    if (r.result.value === 'ok') return true
    await new Promise(res => setTimeout(res, 1000))
  }
  return false
}

async function main() {
  let page
  try {
    page = await findGamePage()
  } catch (e) {
    console.error(`No pude conectar con el juego en el puerto ${PORT}.`)
    console.error('¿Está abierto con la opción de lanzamiento --remote-debugging-port=9222?')
    process.exit(1)
  }
  console.log(`Conectado a: ${page.title || page.url}`)

  const { ws, send, opened, on } = connect(page.webSocketDebuggerUrl)
  await opened
  await send('Page.enable')

  on(async msg => {
    if (msg.method === 'Page.loadEventFired') {
      console.log('El juego recargó la página, reinyectando panel...')
      if (await inject(send)) console.log('Panel listo (F8).')
    }
  })

  if (await inject(send)) console.log('Panel listo. Pulsa F8 dentro del juego para mostrarlo u ocultarlo.')
  else console.log('El juego aún no tiene una partida cargada; el panel aparecerá al recargar.')

  ws.onclose = () => { console.log('El juego se cerró. Saliendo.'); process.exit(0) }
  console.log('Deja esta ventana abierta. Ctrl+C para salir.')
}

main()
