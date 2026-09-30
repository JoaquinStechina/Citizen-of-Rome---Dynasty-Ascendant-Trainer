// Punto de entrada dentro del juego: construye el panel y registra los atajos
// globales (solo una vez por página, aunque el panel se reinyecte).
const game = require('game')
const panel = require('core/panel')

panel.build()

// Si la ventana del juego se achica, que el panel no quede fuera de pantalla.
if (!window.__corTrainerResize) {
  window.__corTrainerResize = true
  addEventListener('resize', () => {
    const p = document.getElementById('cor-trainer')
    if (!p) return
    p.style.left = Math.max(0, Math.min(p.offsetLeft, innerWidth - 80)) + 'px'
    p.style.top = Math.max(0, Math.min(p.offsetTop, innerHeight - 40)) + 'px'
  })
}

// F8 muestra u oculta el panel.
if (!window.__corTrainerKeys) {
  window.__corTrainerKeys = true
  window.addEventListener('keydown', e => {
    if (e.key === 'F8') {
      const p = document.getElementById('cor-trainer')
      if (p) p.style.display = p.style.display === 'none' ? '' : 'none'
    }
  })
}

// El host reintenta la inyección hasta recibir 'ok' (partida cargada).
module.exports = game.store() ? 'ok' : 'store-not-ready'
