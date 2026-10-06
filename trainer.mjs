// Citizen of Rome - Dynasty Ascendant :: trainer via Chrome DevTools Protocol
//
// Requisitos: Node 22+ (usa fetch y WebSocket nativos, sin dependencias).
// Uso:
//   1. Steam -> juego -> Propiedades -> Opciones de lanzamiento:
//        --remote-debugging-port=9222
//   2. node trainer.mjs (si el juego no está abierto, lo espera)
//        --dev    reinyecta el panel al guardar cambios en src/ o locales/
//        --check  valida src/ y locales/ sin abrir el juego
//   3. Abre el juego y carga tu partida.
//   4. En el juego, pulsa F8 para mostrar/ocultar el panel del trainer.
//
// El script queda conectado y vuelve a inyectar el panel si el juego recarga
// la página; si el juego se cierra, espera a que se vuelva a abrir. Ctrl+C para
// salir (el panel desaparece al recargar el juego).
//
// El panel vive en src/ (se ejecuta DENTRO del juego). Este archivo lo empaqueta
// en un único script con un cargador mínimo tipo CommonJS: cada archivo de src/
// es un módulo cuyo id es su ruta sin ".js" (p. ej. "core/ui"), y se usa con
// require('core/ui') y module.exports. El punto de entrada es src/main.js.
// Los textos están en locales/<idioma>.json y llegan al panel como el módulo "locales".

import { readFileSync, readdirSync, watch } from 'fs'
import { dirname, join, relative, basename } from 'path'
import { fileURLToPath } from 'url'

const PORT = Number(process.env.CDP_PORT || 9222)
const ROOT = dirname(fileURLToPath(import.meta.url))
const SRC = join(ROOT, 'src')
const LOCALES = join(ROOT, 'locales')
const BASE_LANG = 'es' // idioma de referencia: los demás deben tener sus mismas claves

// --- Empaquetado ----------------------------------------------------------------

function listModules(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap(d => {
    const p = join(dir, d.name)
    if (d.isDirectory()) return listModules(p)
    return d.name.endsWith('.js') ? [p] : []
  })
}

// Lee locales/*.json -> { es: {...}, en: {...}, ... }. Un JSON mal escrito es un
// error con el nombre del archivo.
function loadLocales() {
  const out = {}
  for (const name of readdirSync(LOCALES).filter(n => n.endsWith('.json')).sort()) {
    try { out[basename(name, '.json')] = JSON.parse(readFileSync(join(LOCALES, name), 'utf8')) } catch (e) {
      throw new Error(`locales/${name}: ${e.message}`)
    }
  }
  if (!out[BASE_LANG]) throw new Error(`falta locales/${BASE_LANG}.json`)
  return out
}

// Avisos (no errores) si un idioma no tiene las mismas claves que el de referencia.
// Una clave que falta se muestra en español en el panel.
function localeWarnings(locales) {
  const base = Object.keys(locales[BASE_LANG])
  const warnings = []
  for (const [lang, texts] of Object.entries(locales)) {
    const keys = Object.keys(texts)
    const missing = base.filter(k => !keys.includes(k)), extra = keys.filter(k => !base.includes(k))
    if (missing.length) warnings.push(`locales/${lang}.json: faltan ${missing.join(', ')}`)
    if (extra.length) warnings.push(`locales/${lang}.json: sobran ${extra.join(', ')}`)
  }
  return warnings
}

// Devuelve el script a inyectar: define cada módulo y ejecuta require('main').
function bundle() {
  const files = listModules(SRC).sort()
  const locales = loadLocales()
  for (const w of localeWarnings(locales)) console.warn('Aviso:', w)
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
    '}\n' +
    '__def("locales", function (require, module) { module.exports = ' + JSON.stringify(locales) + ' })\n'
  for (const file of files) {
    const id = relative(SRC, file).replace(/\\/g, '/').replace(/\.js$/, '')
    out += '__def(' + JSON.stringify(id) + ', function (require, module, exports) {\n' + readFileSync(file, 'utf8') + '\n})\n'
  }
  return out + "return require('main')\n})()"
}

// Script que el juego ejecuta al empezar cada carga de la página, antes que su propio
// código: src/hook.js (no usa require) y un chunk falso de webpack que corre en cuanto
// carga chunk-vendors, antes que el juego, y le pasa a hook.js la función require.
function early() {
  return [
    '(() => {',
    'if (window.__corEarly) return',
    'window.__corEarly = true',
    'const module = { exports: {} }',
    ';(function (require, module, exports) {',
    readFileSync(join(SRC, 'hook.js'), 'utf8'),
    '})(null, module, module.exports)',
    "const id = '__corEarly', q = window.webpackJsonp = window.webpackJsonp || []",
    "q.push([[id], { [id]: (m, e, r) => { window.__corReq = r; try { module.exports.install(r) } catch (err) { window.__corEarlyError = String(err) } } }, [[id, 'chunk-vendors']]])",
    '})()',
  ].join('\n')
}

// --check: empaqueta y compila (sin ejecutar) para detectar errores sin abrir el juego.
function check() {
  const code = bundle()
  new Function(code)
  new Function(early())
  const locales = loadLocales()
  console.log(`OK: ${listModules(SRC).length} módulos, ${Object.keys(locales).length} idiomas (${Object.keys(locales).join(', ')}), ${(code.length / 1024).toFixed(1)} KB.`)
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

const sleep = ms => new Promise(res => setTimeout(res, ms))
// Una respuesta del juego, o null si no contesta (p. ej. colgado).
const within = (p, ms) => Promise.race([p, sleep(ms).then(() => null)])

// Estado de la página: ¿ya tiene la puerta de hook.js? ¿hay una partida cargada?
const PROBE = `({ early: !!window.__corEarly, hooked: !!window.__corReq?.c?.baa2?.exports?.__cor,
  loaded: !!document.querySelector('#app')?.__vue__?.$store?.state?.current?.id })`

// Una conexión con el juego, hasta que se cierre.
async function session(page, dev) {
  console.log(`Conectado a: ${page.title || page.url}`)
  const { ws, send, opened, on } = connect(page.webSocketDebuggerUrl)
  await opened
  const closed = new Promise(res => { ws.onclose = res })

  // hook.js en cada carga de la página, antes que el juego: así una partida con
  // botones de una versión anterior del trainer no cuelga el juego al cargarse.
  // Si el juego está colgado no contesta: se sigue igual (within) y se avisa abajo.
  await within(send('Page.addScriptToEvaluateOnNewDocument', { source: early() }), 5000)
  await within(send('Page.enable'), 5000)

  // Un error en src/ o locales/ se informa sin cerrar el trainer.
  const tryInject = async () => {
    try { return await inject(send) } catch (e) { console.error('Error al inyectar el panel:', e.message); return false }
  }
  on(async msg => {
    if (msg.method === 'Page.loadEventFired') {
      console.log('El juego recargó la página, reinyectando panel...')
      if (await tryInject()) console.log('Panel listo (F8).')
    }
  })

  const probe = await within(send('Runtime.evaluate', { expression: PROBE, returnByValue: true }), 5000)
  const state = probe?.result?.value
  if (!state) {
    console.log('El juego no responde. Si se colgó al cargar una partida, ciérralo y vuelve a abrirlo:')
    console.log('el trainer lo espera y lo prepara antes de que cargue la partida.')
  } else if (!state.early && !state.hooked && !state.loaded) {
    // El juego está empezando sin hook.js: se recarga una vez para que lo tenga.
    console.log('Preparando el juego antes de que cargue la partida...')
    await send('Page.reload')
  } else if (await tryInject()) console.log('Panel listo. Pulsa F8 dentro del juego para mostrarlo u ocultarlo.')
  else console.log('El juego aún no tiene una partida cargada; el panel aparecerá al recargar.')

  if (dev) dev.inject = tryInject
  console.log('Deja esta ventana abierta. Ctrl+C para salir.')
  await closed
}

async function main() {
  if (process.argv.includes('--check')) {
    try { return check() } catch (e) { console.error('Error:', e.message); process.exit(1) }
  }

  // --dev: al guardar un archivo de src/ o locales/, reinyecta el panel (agrupando
  // los cambios que llegan casi a la vez, p. ej. varios archivos guardados juntos).
  const dev = process.argv.includes('--dev') ? { inject: null } : null
  if (dev) {
    let timer, changed = new Set()
    for (const dir of [SRC, LOCALES]) {
      watch(dir, { recursive: true }, (event, file) => {
        if (!file || !/\.(js|json)$/.test(file)) return // ignora temporales de editores
        changed.add(relative(ROOT, join(dir, file)).replace(/\\/g, '/'))
        clearTimeout(timer)
        timer = setTimeout(async () => {
          if (!dev.inject) return
          console.log(`Cambios en ${[...changed].join(', ') || 'archivos'}: reinyectando panel...`)
          changed = new Set()
          if (await dev.inject()) console.log('Panel actualizado.')
        }, 200)
      })
    }
    console.log('Modo desarrollo: los cambios en src/ y locales/ se aplican al guardar.')
  }

  // Espera al juego (si todavía no está abierto) y vuelve a esperarlo si se cierra.
  for (let waiting = false; ; ) {
    let page = null
    try { page = await findGamePage() } catch {}
    if (!page) {
      if (!waiting) {
        console.log(`Esperando al juego en el puerto ${PORT}...`)
        console.log('(Steam -> juego -> Propiedades -> Opciones de lanzamiento: --remote-debugging-port=9222)')
        waiting = true
      }
      await sleep(250)
      continue
    }
    waiting = false
    try { await session(page, dev) } catch (e) { console.error('Error de conexión:', e.message) }
    if (dev) dev.inject = null
    console.log('El juego se cerró.')
    await sleep(1000)
  }
}

main()
