// Eventos del trainer dentro del juego. Los botones (acciones) y las ventanas del
// juego llaman a sus métodos por nombre de evento: invokeMethod [bc91] los busca en
// el contexto de eventos [baa2] y llama a methods[método](ctx, contexto).
//
// Los botones se guardan en la partida, así que tienen que funcionar también sin el
// trainer. Si un evento no existe, bc91 lo anota con console.warn, y el juego guarda
// cada aviso en current.sessionErrorLog [9b31]: como el preCheck se evalúa al dibujar
// el botón [c29c], el aviso vuelve a dibujarlo y el juego se cuelga en un bucle.
// Por eso todo pasa por una "puerta": lifeAndDeath/birth.preCheckIfAlive, una
// comprobación del juego sin efectos (characters[characterId] vivo). Sin characterId
// en el contexto devuelve undefined, sin avisos: sin el trainer, los botones y las
// opciones de sus ventanas no hacen nada. (El botón tampoco se oculta: el juego usa
// el resultado de dispatch, que es una Promise y siempre cuenta como verdadero.)
// Con el trainer, la puerta lleva { trainer: { event, method, context } } a
// window.__corEvents (se actualiza en cada inyección).
// Los errores de los eventos del trainer no van a console.warn (el mismo bucle).
//
// Las partidas guardadas antes usaban eventos 'trainer/<nombre>' y sin el trainer
// cuelgan el juego al cargarlas. Este archivo no usa require: trainer.mjs también lo
// ejecuta al empezar cada carga de la página (antes que el juego), así esos eventos
// ya existen cuando el juego carga la partida, y sync() los cambia por la puerta.
const GATE = { event: 'lifeAndDeath/birth', method: 'preCheckIfAlive' }
const PREFIX = './trainer/'

function run(name, method, ctx, context) {
  const fn = window.__corEvents[name]?.methods[method]
  if (!fn) return false // trainer todavía sin inyectar, o evento de otra versión
  try { return fn(ctx, context) } catch (e) {
    window.__corErrors.push({ event: name, method, error: String(e && e.stack || e) })
    if (window.__corErrors.length > 50) window.__corErrors.shift()
    return false
  }
}

function patchGate(methods) {
  if (methods[GATE.method].__cor) return
  const orig = methods[GATE.method]
  const gate = function (ctx, c) {
    const tr = c && c.trainer
    if (!tr) return orig.apply(this, arguments)
    const { trainer, ...params } = c // p. ej. { option } de un desplegable
    return run(tr.event, tr.method, ctx, { ...tr.context, ...params })
  }
  gate.__cor = true
  methods[GATE.method] = gate
}

// req: la función require de webpack del juego.
function install(req) {
  window.__corEvents = window.__corEvents || {}
  window.__corErrors = window.__corErrors || []
  req('baa2')
  const mod = req.c.baa2
  if (!mod.exports.__cor) {
    const orig = mod.exports
    const legacy = name => ({ default: { methods: new Proxy({}, { get: (_, m) => (ctx, c) => run(name, m, ctx, c) }) } })
    // La puerta se pone al pedir su evento (no antes: al empezar la página, el juego
    // todavía no cargó sus módulos).
    const wrap = key => {
      if (typeof key === 'string' && key.startsWith(PREFIX)) return legacy(key.slice(PREFIX.length))
      const m = orig(key)
      if (key === './' + GATE.event) patchGate(m.default.methods)
      return m
    }
    Object.assign(wrap, { keys: orig.keys, resolve: orig.resolve, id: orig.id, __cor: true })
    mod.exports = wrap
  }
}

module.exports = {
  install,
  // Referencia a un método del trainer para acciones y ventanas del juego.
  call: (event, method, context) => ({ ...GATE, context: { trainer: { event, method, context } } }),
  // ¿Es un método del trainer? (también los de partidas anteriores)
  ours: ref => !!ref?.context?.trainer || (typeof ref?.event === 'string' && ref.event.startsWith('trainer/')),
}
