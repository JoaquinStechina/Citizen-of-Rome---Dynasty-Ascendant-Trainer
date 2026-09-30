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

  // Módulos internos del juego (webpack). Se usan las mismas funciones que usa
  // el juego (rasgos, nivel de trabajo, multiplicadores), así se aplican sus
  // efectos secundarios. No activa el modo mods (los logros siguen activos).
  function gameRequire() {
    if (window.__corReq) return window.__corReq
    const key = Object.keys(window).find(k => /^webpackJsonp/.test(k))
    if (!key) return null
    const mid = '__cor' + Date.now()
    window[key].push([[mid], { [mid]: (m, e, r) => { window.__corReq = r } }, [[mid]]])
    return window.__corReq || null
  }
  const load = (what, fn) => { try { return fn(gameRequire()) } catch (e) { console.warn('[trainer] ' + what + ' no disponible', e); return null } }

  const TR = load('rasgos', req => {
    const defs = req('50ab').default()
    return { list: defs.list, titles: req('7073').default(), discoverable: defs.discoverable || [],
      add: (ch, id) => req('a822').a(S(), ch.id, id), remove: (ch, id) => req('cc6f').a(S(), ch.id, id, true) }
  })
  const JOBS = load('trabajos', req => ({ types: req('0262').default.types, titles: req('c9c8').default.titles || {}, set: req('6cf7').a }))
  const PETS = load('mascotas', req => {
    const P = req('ed26').a
    return { types: P.types || {}, traitList: P.traits.list, traitTitles: req('c7db').default.traits || {},
      add: (p, id) => req('d6d3').a({ state: S(), petId: p.id, trait: id }),
      remove: (p, id) => req('d217').a({ state: S(), petId: p.id, trait: id, forceClearStack: true }) }
  })
  const MODS = load('multiplicadores', req => ({
    add: (key, id, factor, description) => req('dbe5').default(S(), { key, id, factor, description }),
    remove: (key, id) => req('f761').a(S(), key, id),
    value: key => req('fc68').a(S(), { key }),
    propTypes: req('08e5').default.types, propTitles: req('5785').default.types || {},
  }))

  const GROUPS = {
    education: 'Educación', personality: 'Personalidad', good: 'Buenos', bad: 'Malos',
    goodGenetic: 'Genética buena', badGenetic: 'Genética mala', neutralGenetic: 'Genética neutral',
    skill: 'Habilidad', militaryHonor: 'Honores militares', neutral: 'Neutrales / cargos',
  }
  const SKILL_MAX = 30 // a partir de ~27 las fórmulas del juego ya dan el máximo (99%)

  // --- Selección de personaje y mascota -------------------------------------
  let selectedId = null
  const selected = () => S()?.characters?.[selectedId]
  const household = () => {
    const s = S()
    if (!s) return []
    const ids = [s.current.id, ...(s.current.householdCharacterIds || [])]
    return [...new Set(ids)].map(id => s.characters[id]).filter(c => c && !c.isDead)
  }
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
  const petLabel = p => {
    const owner = S().characters[p.ownerId]?.praenomen
    return p.name + ' (' + (PETS?.types[p.type]?.breed || p.type) + (owner ? ', de ' + owner : '') + ')'
  }

  // --- Estructura del panel --------------------------------------------------
  document.getElementById('cor-trainer')?.remove()
  const box = document.createElement('div')
  box.id = 'cor-trainer'
  box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:rgba(20,16,12,.94);' +
    'color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;padding:10px 12px;border:1px solid #b08d57;' +
    'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);width:310px;max-height:90vh;overflow:auto;user-select:none'
  box.innerHTML = '<div style="font-weight:600;margin-bottom:6px;color:#e0c07a">Trainer &middot; F8 oculta</div>'
  // Que las teclas escritas en el panel no disparen atajos del juego (salvo F8).
  box.addEventListener('keydown', e => { if (e.key !== 'F8') e.stopPropagation() })

  const fmt = v => typeof v === 'number' ? String(Math.round(v * 100) / 100) : ''
  const CTRL_CSS = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px'
  const el = (tag, css, parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e }
  const button = (parent, text, fn, title) => {
    const b = el('button', CTRL_CSS + ';padding:1px 6px;cursor:pointer', parent)
    b.textContent = text
    if (title) b.title = title
    b.onclick = () => { try { fn(); refresh(true) } catch (e) { console.warn('[trainer]', e) } }
    return b
  }
  const select = (parent, onchange) => {
    const s = el('select', CTRL_CSS + ';width:100%;padding:2px;margin:2px 0', parent)
    s.onchange = () => { onchange(s.value); refresh(true) }
    return s
  }
  const note = (parent, text) => { const n = el('div', 'font-size:11px;opacity:.7;margin-top:3px', parent); n.textContent = text; return n }
  const subheading = (parent, text) => { const h = el('div', 'margin-top:6px;color:#d9bf8c;font-weight:600', parent); h.textContent = text }

  // Sección plegable: clic en el título para abrir/cerrar (se recuerda).
  const collapsed = (() => { try { return JSON.parse(localStorage.corTrainerCollapsed || '{}') } catch { return {} } })()
  function section(title) {
    const head = el('div', 'margin:8px 0 2px;padding-top:6px;border-top:1px solid #5a4630;color:#e0c07a;font-weight:600;cursor:pointer', box)
    const body = el('div', '', box)
    const paint = () => { head.textContent = (collapsed[title] ? '▸ ' : '▾ ') + title; body.style.display = collapsed[title] ? 'none' : '' }
    head.onclick = () => { collapsed[title] = !collapsed[title]; try { localStorage.corTrainerCollapsed = JSON.stringify(collapsed) } catch {} ; paint() }
    paint()
    return body
  }

  // Fila: etiqueta, campo editable (Enter o salir del campo = aplicar) y botones +N.
  // Opcionales: c.enabled() desactiva la fila, c.extra añade botones, c.suffix() una nota debajo.
  const rows = []
  function addRow(c, parent) {
    const row = el('div', 'display:flex;align-items:center;gap:4px;margin:4px 0', parent)
    const label = el('span', 'width:96px', row)
    label.textContent = c.label
    const input = el('input', CTRL_CSS + ';flex:1;min-width:0;padding:1px 4px;text-align:right;font-variant-numeric:tabular-nums', row)
    input.type = 'number'
    input.step = 'any'
    input.addEventListener('change', () => {
      const v = parseFloat(input.value)
      if (!Number.isNaN(v)) { try { c.set(v) } catch (e) { console.warn('[trainer]', e) } }
      refresh(true)
    })
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') input.blur()
      else if (e.key === 'Escape') { input.value = fmt(c.get()); input.blur() }
    })
    const short = n => n >= 1000 ? (n / 1000) + 'k' : String(n)
    const btns = (c.steps || []).map(n => button(row, '+' + short(n), () => c.set((c.get() || 0) + n)))
    for (const [text, fn, title] of c.extra || []) btns.push(button(row, text, fn, title))
    let sub = null
    if (c.suffix) sub = el('div', 'font-size:11px;opacity:.7;text-align:right;margin:-3px 0 4px', parent)
    rows.push({ c, input, btns, sub })
  }

  // Editor de rasgos reutilizable (personajes y mascotas).
  const refreshers = []
  function traitEditor(parent, { entity, list, title, describe, add, remove, available }) {
    const chips = el('div', 'display:flex;flex-wrap:wrap;gap:4px;margin:4px 0', parent)
    const line = el('div', 'display:flex;gap:4px;margin-top:4px', parent)
    const pick = el('select', CTRL_CSS + ';flex:1;min-width:0;padding:2px', line)
    button(line, 'Añadir', () => { const e = entity(); if (e && pick.value) add(e, pick.value) },
      'Usa la función del juego: suma los bonus del rasgo y quita sus opuestos')
    note(parent, 'Añadir/quitar un rasgo también suma/resta sus bonus de habilidad. Los opuestos se quitan solos.')
    if (!available) { chips.textContent = 'No disponible en esta versión del juego.'; line.style.display = 'none'; return }
    let sig = ''
    refreshers.push(force => {
      const e = entity(), owned = e?.traits || []
      const now = (e?.id || '') + ':' + owned.join(',')
      if (now === sig && !force) return
      sig = now
      chips.innerHTML = ''
      if (!e) { chips.innerHTML = '<span style="opacity:.6">—</span>'; pick.innerHTML = ''; return }
      if (!owned.length) chips.innerHTML = '<span style="opacity:.6">Sin rasgos</span>'
      for (const id of owned) {
        const chip = el('span', 'display:inline-flex;align-items:center;gap:3px;background:#2a2118;border:1px solid #5a4630;border-radius:10px;padding:0 4px 0 8px', chips)
        chip.title = describe(id)
        chip.append(title(id))
        const x = button(chip, '×', () => remove(e, id), 'Quitar rasgo')
        x.style.cssText += ';border:none;background:none;padding:0 2px;font-weight:700'
      }
      const prev = pick.value
      pick.innerHTML = ''
      const byGroup = {}
      for (const [id, def] of Object.entries(list())) {
        if (!owned.includes(id)) (byGroup[def.group] = byGroup[def.group] || []).push(id)
      }
      for (const g of Object.keys(GROUPS).concat(Object.keys(byGroup).filter(g => !GROUPS[g]))) {
        if (!byGroup[g]) continue
        const og = el('optgroup', '', pick)
        og.label = GROUPS[g] || g
        byGroup[g].sort((a, b) => title(a).localeCompare(title(b))).forEach(id => {
          const o = el('option', '', og)
          o.value = id
          o.textContent = title(id)
          o.title = describe(id)
        })
      }
      if (prev && !owned.includes(prev)) pick.value = prev
    })
  }

  // Desplegable que se reconstruye solo cuando cambia la lista.
  function rosterSelect(sel, list, getId, setId, label, emptyText) {
    let sig = ''
    refreshers.push(() => {
      const items = list()
      const now = items.map(x => x.id + label(x)).join('|')
      if (now === sig) return
      sig = now
      if (!items.some(x => x.id === getId())) setId(items[0]?.id ?? null)
      sel.innerHTML = ''
      if (!items.length) sel.innerHTML = '<option value="">' + emptyText + '</option>'
      for (const x of items) { const o = el('option', '', sel); o.value = x.id; o.textContent = label(x) }
      sel.value = getId() ?? ''
    })
  }

  // --- Sección: Recursos -----------------------------------------------------
  const secRes = section('Recursos')
  ;[
    { label: 'Dinero',     get: () => S()?.current.cash,      set: v => { S().current.cash = v },      steps: [1000, 10000] },
    { label: 'Influencia', get: () => S()?.current.influence, set: v => { S().current.influence = v }, steps: [1000, 10000] },
    { label: 'Prestigio',  get: () => dynasty()?.prestige,    set: v => { dynasty().prestige = v },    steps: [1000, 10000] },
  ].forEach(c => addRow(c, secRes))

  // --- Sección: Familia ------------------------------------------------------
  const secFam = section('Familia')
  const pick = select(secFam, v => { selectedId = v })
  rosterSelect(pick, household, () => selectedId, v => { selectedId = v },
    ch => ch.praenomen + (ch.id === S().current.id ? ' (tú)' : ''), 'Sin familia')
  const SKILLS = { intelligence: 'Inteligencia', stewardship: 'Administración', eloquence: 'Elocuencia', combat: 'Combate' }
  Object.entries(SKILLS).forEach(([key, label]) => addRow({
    label, get: () => selected()?.skills?.[key], set: v => { selected().skills[key] = v }, steps: [1, 5],
  }, secFam))
  const bulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', secFam)
  button(bulk, 'Todo a ' + SKILL_MAX, () => { for (const k in SKILLS) selected().skills[k] = SKILL_MAX })
  button(bulk, 'Toda la familia a ' + SKILL_MAX, () => household().forEach(ch => { for (const k in SKILLS) ch.skills[k] = SKILL_MAX }))

  const jobMax = () => { const ch = selected(); return (ch?.job && JOBS?.types[ch.job]?.maxLevel) || 0 }
  const setJobLevel = v => {
    const ch = selected()
    if (!ch?.job) return
    if (JOBS) JOBS.set(S(), { characterId: ch.id, jobLevel: v })
    else ch.jobLevel = Math.max(0, v)
  }
  addRow({
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
  }, secFam)

  subheading(secFam, 'Rasgos')
  traitEditor(secFam, {
    available: !!TR, entity: selected, list: () => TR.list,
    title: id => TR.titles[id]?.title || id, describe: id => TR.titles[id]?.description || '',
    add: (ch, id) => {
      TR.add(ch, id)
      if (TR.discoverable.includes(id)) {
        ch.discoveredTraits = ch.discoveredTraits || []
        if (!ch.discoveredTraits.includes(id)) ch.discoveredTraits.push(id)
      }
    },
    remove: (ch, id) => TR.remove(ch, id),
  })

  // --- Sección: Mascotas -----------------------------------------------------
  const secPets = section('Mascotas')
  const petPick = select(secPets, v => { selectedPetId = v })
  rosterSelect(petPick, householdPets, () => selectedPetId, v => { selectedPetId = v }, petLabel, 'Sin mascotas')
  const PET_SKILLS = { aptitude: 'Aptitud', vigor: 'Vigor', tameness: 'Docilidad' }
  Object.entries(PET_SKILLS).forEach(([key, label]) => addRow({
    label, get: () => selectedPet()?.skills?.[key], set: v => { selectedPet().skills[key] = v },
    enabled: () => !!selectedPet(), steps: [1, 5],
  }, secPets))
  const petBulk = el('div', 'display:flex;gap:4px;justify-content:flex-end;margin-top:4px', secPets)
  button(petBulk, 'Todo a ' + SKILL_MAX, () => { const p = selectedPet(); if (p) for (const k in PET_SKILLS) p.skills[k] = SKILL_MAX })
  button(petBulk, 'Todas a ' + SKILL_MAX, () => householdPets().forEach(p => { for (const k in PET_SKILLS) p.skills[k] = SKILL_MAX }))
  subheading(secPets, 'Rasgos de la mascota')
  traitEditor(secPets, {
    available: !!PETS, entity: selectedPet, list: () => PETS.traitList,
    title: id => PETS.traitTitles[id]?.title || id, describe: id => PETS.traitTitles[id]?.description || '',
    add: (p, id) => PETS.add(p, id), remove: (p, id) => PETS.remove(p, id),
  })

  // --- Sección: Multiplicadores ----------------------------------------------
  // El juego multiplica todos los modificadores activos de una clave. El trainer
  // añade UNO propio por clave (id "cor_trainer", permanente) que puedes cambiar
  // o quitar sin tocar los del juego.
  const TRAINER_MOD_ID = 'cor_trainer'
  const secMods = section('Multiplicadores')
  const modCatalog = () => {
    const out = [
      ['Casa', [['household_health', 'Salud de la casa'], ['revenue', 'Ingresos'], ['household_fertility', 'Fertilidad de la casa'],
        ['household_expenses', 'Gastos de la casa'], ['household_stewardship', 'Administración de la casa']]],
    ]
    const ch = selected(), p = selectedPet()
    if (ch) out.push(['Personal: ' + ch.praenomen, [['character_health_' + ch.id, 'Salud personal'], ['character_fertility_' + ch.id, 'Fertilidad personal'],
      ['character_expenses_' + ch.id, 'Gastos personales'], ['character_stewardship_' + ch.id, 'Administración personal']]])
    if (p) out.push(['Mascota: ' + p.name, [['pet_health_' + p.id, 'Salud de la mascota'], ['pet_fertility_' + p.id, 'Fertilidad de la mascota'],
      ['pet_expenses_' + p.id, 'Gastos de la mascota']]])
    if (JOBS) out.push(['Trabajos', Object.keys(JOBS.types).map(j => ['job_' + j, 'Trabajo: ' + (JOBS.titles[j] || j)]).sort((a, b) => a[1].localeCompare(b[1]))])
    if (MODS) out.push(['Propiedades', Object.keys(MODS.propTypes).map(k => ['property_' + k, 'Propiedad: ' + (MODS.propTitles[k]?.title || k)]).sort((a, b) => a[1].localeCompare(b[1]))])
    return out
  }
  const PERSONAL = { health: 'Salud', fertility: 'Fertilidad', expenses: 'Gastos', stewardship: 'Administración' }
  const modName = key => {
    for (const [, items] of modCatalog()) for (const [k, n] of items) if (k === key) return n
    const m = key.match(/^(character|pet)_(health|fertility|expenses|stewardship)_(.+)$/)
    if (m) {
      const who = m[1] === 'pet' ? pets()[m[3]]?.name : S().characters[m[3]]?.praenomen
      return PERSONAL[m[2]] + ' de ' + (who || '?')
    }
    return key
  }
  const trainerFactor = key => (S()?.current?.modifiers?.[key] || []).find(m => m.id === TRAINER_MOD_ID)?.factor
  const setTrainerFactor = (key, f) => {
    MODS.remove(key, TRAINER_MOD_ID)
    if (f && Math.abs(f - 1) > 1e-9) MODS.add(key, TRAINER_MOD_ID, Math.max(0.01, f), 'Trainer')
  }

  let modKey = 'household_health'
  const modPick = select(secMods, v => { modKey = v })
  let modSig = ''
  refreshers.push(() => {
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
  addRow({
    label: 'Factor trainer', get: () => trainerFactor(modKey) ?? 1, set: f => setTrainerFactor(modKey, f), enabled: () => !!MODS,
    extra: [['×2', () => setTrainerFactor(modKey, (trainerFactor(modKey) ?? 1) * 2)], ['Quitar', () => setTrainerFactor(modKey, 1), 'Quita el factor del trainer']],
    suffix: () => 'Total en juego: ×' + fmt(MODS?.value(modKey) ?? 1),
  }, secMods)
  note(secMods, 'Se multiplica con los del juego. En "Gastos" conviene un factor menor que 1 (p. ej. 0.5 = mitad de gastos).')

  subheading(secMods, 'Activos ahora')
  const active = el('div', 'font-size:12px;margin-top:2px', secMods)
  const clearAll = el('div', 'display:flex;justify-content:flex-end;margin-top:4px', secMods)
  button(clearAll, 'Quitar todos los del trainer', () => {
    for (const key of Object.keys(S().current.modifiers || {})) MODS.remove(key, TRAINER_MOD_ID)
  })
  let activeSig = ''
  refreshers.push(force => {
    if (!MODS) { active.textContent = 'No disponible en esta versión del juego.'; return }
    const items = Object.keys(S()?.current?.modifiers || {})
      .map(k => [k, MODS.value(k), trainerFactor(k)])
      .filter(([, v]) => typeof v === 'number' && Math.abs(v - 1) > 0.005)
    const now = items.map(x => x.join(':')).join('|')
    if (now === activeSig && !force) return
    activeSig = now
    active.innerHTML = ''
    if (!items.length) active.innerHTML = '<span style="opacity:.6">Ninguno</span>'
    for (const [k, v, t] of items) {
      const row = el('div', 'display:flex;justify-content:space-between;gap:6px;cursor:pointer', active)
      row.title = 'Clic para editarlo arriba'
      row.onclick = () => { modKey = k; modSig = ''; refresh(true) }
      const name = el('span', '', row)
      name.textContent = modName(k) + (t ? ' ★' : '')
      const val = el('span', 'font-variant-numeric:tabular-nums;color:' + ((k.includes('expenses') ? v < 1 : v > 1) ? '#9fd38a' : '#e38a7a'), row)
      val.textContent = '×' + fmt(v)
    }
  })
  note(secMods, '★ = incluye un factor del trainer. Verde = te favorece.')

  document.body.appendChild(box)

  // --- Refresco ---------------------------------------------------------------
  function refresh(force) {
    for (const fn of refreshers) { try { fn(force) } catch (e) { console.warn('[trainer]', e) } }
    for (const { c, input, btns, sub } of rows) {
      let on = true; try { on = c.enabled ? c.enabled() : true } catch { on = false }
      input.disabled = !on
      btns.forEach(b => { b.disabled = !on; b.style.opacity = on ? '' : '.4' })
      if (sub) { try { sub.textContent = c.suffix() } catch {} }
      if (document.activeElement === input) continue // no pisar lo que estás escribiendo
      let v; try { v = c.get() } catch {}
      input.value = fmt(v)
    }
  }
  clearInterval(window.__corTrainerTimer)
  window.__corTrainerTimer = setInterval(refresh, 500)
  refresh(true)

  if (!window.__corTrainerKeys) {
    window.__corTrainerKeys = true
    window.addEventListener('keydown', e => {
      if (e.key === 'F8') {
        const p = document.getElementById('cor-trainer')
        if (p) p.style.display = p.style.display === 'none' ? '' : 'none'
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
