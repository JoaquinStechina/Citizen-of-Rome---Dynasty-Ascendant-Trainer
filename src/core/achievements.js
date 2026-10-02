// Logros que consigue el trainer: se marcan en el juego y, si la opción "también
// en Steam" está activada (por defecto sí), se desbloquean en Steam. Lo usan la
// sección Logros y las de rasgos: algunos rasgos tienen un logro con el mismo id
// (las coronas, oneHand, fat, veteran…), y añadirlos los desbloquea.
// Los resultados forzados de los eventos militares pasan por el propio juego, que
// desbloquea sus logros por su cuenta.
const ls = require('core/storage')
const game = require('game')

const STEAM_KEY = 'corTrainerSteam'
const steamOn = () => ls.get(STEAM_KEY, true)
const setSteamOn = v => ls.set(STEAM_KEY, !!v)

// Marca los logros (los ids que no son logros se ignoran). Devuelve '' o el motivo
// por el que no se enviaron a Steam (ver game.unlockSteam).
function grant(ids) {
  ids = ids.filter(id => game.ACH?.list[id])
  if (!ids.length) return ''
  game.setAchievements(ids, true)
  return steamOn() ? game.unlockSteam(ids) : ''
}

module.exports = { steamOn, setSteamOn, grant }
