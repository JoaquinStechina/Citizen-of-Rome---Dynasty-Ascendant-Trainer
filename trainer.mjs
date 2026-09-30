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

  const cheats = {
    cash:      { label: 'Dinero',     get: () => S()?.current.cash,       set: v => { S().current.cash = v } },
    influence: { label: 'Influencia', get: () => S()?.current.influence,  set: v => { S().current.influence = v } },
    prestige:  { label: 'Prestigio',  get: () => dynasty()?.prestige,     set: v => { dynasty().prestige = v } },
  }

  document.getElementById('cor-trainer')?.remove()
  const box = document.createElement('div')
  box.id = 'cor-trainer'
  box.style.cssText = 'position:fixed;top:12px;right:12px;z-index:2147483647;background:rgba(20,16,12,.94);' +
    'color:#f3e6c8;font:13px/1.4 system-ui,sans-serif;padding:10px 12px;border:1px solid #b08d57;' +
    'border-radius:8px;box-shadow:0 4px 16px rgba(0,0,0,.5);min-width:250px;user-select:none'
  box.innerHTML = '<div style="font-weight:600;margin-bottom:6px;color:#e0c07a">Trainer &middot; F8 oculta</div>'

  const fmt = v => typeof v === 'number' ? v.toLocaleString(undefined, { maximumFractionDigits: 2 }) : '—'
  const rows = {}
  for (const [key, c] of Object.entries(cheats)) {
    const row = document.createElement('div')
    row.style.cssText = 'display:flex;align-items:center;gap:4px;margin:4px 0'
    row.innerHTML = '<span style="width:72px">' + c.label + '</span>' +
      '<span data-v style="flex:1;text-align:right;font-variant-numeric:tabular-nums"></span>'
    const btn = (text, fn) => {
      const b = document.createElement('button')
      b.textContent = text
      b.style.cssText = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px;padding:1px 6px;cursor:pointer'
      b.onclick = () => { try { fn(); refresh() } catch (e) { console.warn('[trainer]', e) } }
      row.appendChild(b)
    }
    btn('+1k', () => c.set((c.get() || 0) + 1000))
    btn('+10k', () => c.set((c.get() || 0) + 10000))
    btn('=', () => {
      const v = parseFloat(prompt(c.label + ' nuevo valor:', Math.round(c.get() || 0)))
      if (!Number.isNaN(v)) c.set(v)
    })
    rows[key] = row.querySelector('[data-v]')
    box.appendChild(row)
  }
  document.body.appendChild(box)

  function refresh() {
    for (const [key, c] of Object.entries(cheats)) {
      let v; try { v = c.get() } catch {}
      rows[key].textContent = fmt(v)
    }
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
