// Temas de color del mod "theme" de Prahlad (github.com/prahlad-swarnkar/CORmods):
// la misma hoja de estilos con 4 colores por tema. Se aplica con una etiqueta
// <style> propia (el trainer no usa los mods del juego) y se recuerda en
// localStorage para volver a aplicarlo al recargar.
const ls = require('core/storage')

const KEY = 'corTrainerTheme'
const STYLE_ID = 'cor-trainer-theme'

// light = fondo, main = botones y barras, accent = ventanas y etiquetas, ink = texto y bordes.
const LIST = {
  baseGreen: { name: 'Green', light: 'lightgreen', main: 'darkgreen', accent: 'limegreen', ink: 'black' },
  monoMix: { name: 'Mono Mix', light: '#cad2c5', main: '#05668d', accent: '#bc8da0', ink: '#51344d' },
  vesta: { name: 'Vestalia', light: '#e6cdb8', main: '#01806e', accent: '#99dbd3', ink: '#b33921' },
}

const css = ({ light, main, accent, ink }, bg) => `
${bg ? `#app{background:linear-gradient(hsla(0,0%,20%,.9),hsla(0,0%,20%,.9)),url("${bg}") !important}` : ''}
.container-main{background:${light} !important}
.btn{background:${main} !important;color:${light} !important;border-color:${ink} !important}
.modal-title{background:${light} !important;color:${ink} !important;border-color:${accent} !important}
.modal-content{background:${light} !important}
.interaction-modal-content{background:${accent} !important}
.interaction-modal-content-message{background:${light} !important}
.progress{background:${accent} !important}
.progress-bar{background:${main} !important;color:${light} !important}
.stats-number{background:${main} !important;color:${light} !important}
.img-thumbnail{background:${accent} !important;border-color:${ink} !important}
.character-tree-family-wrapper{border-color:${main} !important}
.badge-skills{background:${main} !important}
.badge-light{background:${accent} !important}
.popover{background:${accent}}
.alert{background:${accent} !important;color:${ink} !important;border-color:${ink} !important}
.list-group-item{background:${accent} !important}
.active{background:${accent} !important;color:${ink} !important;border-color:${ink} !important}
.nav-link:hover{border-color:${ink} !important}
.nav{border-color:${ink} !important}
`

const current = () => { const id = ls.get(KEY, ''); return LIST[id] ? id : '' }

// Aplica el tema `id` ('' = el del juego) y lo recuerda.
function apply(id) {
  document.getElementById(STYLE_ID)?.remove()
  if (!LIST[id]) { ls.set(KEY, ''); return }
  ls.set(KEY, id)
  // Imagen de fondo del juego (leída sin el tema puesto), para oscurecerla como el mod.
  const app = document.getElementById('app')
  const bg = app ? (getComputedStyle(app).backgroundImage.match(/url\("?([^")]+)"?\)/) || [])[1] : ''
  const style = document.createElement('style')
  style.id = STYLE_ID
  style.textContent = css(LIST[id], bg)
  document.head.appendChild(style)
}

module.exports = { LIST, current, apply }
