// Personaje y mascota elegidos en los desplegables. Viven fuera del panel para
// conservarse al reconstruirlo (p. ej. al cambiar de idioma) y para que otras
// secciones (Multiplicadores) usen la misma selección.
const game = require('game')

const sel = { charId: null, petId: null }
sel.character = () => game.S()?.characters?.[sel.charId]
sel.pet = () => game.pets()[sel.petId]

module.exports = sel
