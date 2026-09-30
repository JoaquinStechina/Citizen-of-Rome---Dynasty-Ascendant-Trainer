// Citizen of Rome - Dynasty Ascendant :: trainer via Chrome DevTools Protocol
//
// Requisitos: Node 22+ (usa fetch y WebSocket nativos, sin dependencias).
// Uso:
//   1. Steam -> juego -> Propiedades -> Opciones de lanzamiento:
//        --remote-debugging-port=9222
//   2. Abre el juego y carga tu partida.
//   3. node trainer.mjs            (o: node trainer.mjs --check para validar sin el juego)
//   4. En el juego, pulsa F8 para mostrar/ocultar el panel del trainer.
//
// El script queda conectado y vuelve a inyectar el panel si el juego recarga
// la página. Ctrl+C para salir (el panel desaparece al recargar el juego).
//
// El panel vive en src/ (se ejecuta DENTRO del juego). Este archivo lo empaqueta
// en un único script con un cargador mínimo tipo CommonJS: cada archivo de src/
// es un módulo cuyo id es su ruta sin ".js" (p. ej. "core/ui"), y se usa con
// require('core/ui') y module.exports. El punto de entrada es src/main.js.

import { readFileSync, readdirSync } from 'fs'
import { dirname, join, relative } from 'path'
import { fileURLToPath } from 'url'

const PORT = Number(process.env.CDP_PORT || 9222)
const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'src')

// --- Empaquetado ----------------------------------------------------------------

function listModules(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return listModules(p)
    return d.name.endsWith('.js') ? [p] : []
  })
}

// Devuelve el script a inyectar: define cada módulo y ejecuta require('main').
function bundle() {
  const files = listModules(SRC).sort()
  let out = '(() => {\n' +
    'const __mods = {}, __cache = {}\n' +
    'const __def = (id, fn) => { __mods[id] = fn }\n' +
    'const require = id => {\n' +
    '  if (__cache[id]) return __cache[id].exports\n' +
    "  if (!__mods[id]) throw new Error('[trainer] módulo no encontrado: ' + id)\n" +
    '  const module = { exports: {} }\n' +
    '  __cache[id] = module\n' +
    '  __mods[id](require, module, module.exports)\n' +
    '  return module.exports\n' +
    '}\n'
  for (const file of files) {
    const id = relative(SRC, file).replace(/\\/g, '/').replace(/\.js$/, '')
    out += '__def(' + JSON.stringify(id) + ', function (require, module, exports) {\n' + readFileSync(file, 'utf8') + '\n})\n'
  }
  return out + "return require('main')\n})()"
}

// --check: empaqueta y compila (sin ejecutar) para detectar errores sin abrir el juego.
function check() {
  const code = bundle()
  new Function(code)
  console.log(`OK: ${listModules(SRC).length} módulos, ${(code.length / 1024).toFixed(1)} KB.`)
}

// --- Conexión con el juego --------------------------------------------------------

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
  // Se empaqueta en cada inyección, así los cambios en src/ se aplican al recargar.
  const expression = bundle()
  // Reintenta hasta que Vue y la partida estén listos.
  for (let i = 0; i < 60; i++) {
    const r = await send('Runtime.evaluate', { expression, returnByValue: true })
    if (r.exceptionDetails) throw new Error(r.exceptionDetails.exception?.description || 'error al inyectar')
    if (r.result.value === 'ok') return true
    await new Promise(res => setTimeout(res, 1000))
  }
  return false
}

async function main() {
  if (process.argv.includes('--check')) return check()

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
