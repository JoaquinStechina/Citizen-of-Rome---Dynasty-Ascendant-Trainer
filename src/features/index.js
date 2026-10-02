// Secciones del panel, en su orden por defecto (el jugador puede reordenarlas).
// Para añadir una sección: crea features/<nombre>.js (ver README) y añádela aquí.
module.exports = [
  require('features/resources'),
  require('features/family'),
  require('features/traitStacks'),
  require('features/pets'),
  require('features/estate'),
  require('features/multipliers'),
  require('features/achievements'),
  require('features/warEvents'),
]
