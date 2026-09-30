// Traducciones del panel. Los textos vienen del módulo "locales", uno por idioma.
// Los nombres de rasgos, trabajos y propiedades vienen del juego (solo trae inglés).
const ls = require('core/storage')
const LOCALES = require('locales')

const DEFAULT = 'es'
let lang = ls.get('corTrainerLang', DEFAULT)
if (!LOCALES[lang]) lang = DEFAULT

// t('clave', { variable: valor }) -> texto en el idioma actual. Si falta en ese
// idioma usa el español, y si tampoco existe devuelve la clave.
const t = (key, vars) => {
  let s = LOCALES[lang][key] ?? LOCALES[DEFAULT][key] ?? key
  for (const k in vars || {}) s = s.replace('{' + k + '}', vars[k])
  return s
}

module.exports = {
  t,
  lang: () => lang,
  setLang: code => { if (LOCALES[code]) { lang = code; ls.set('corTrainerLang', lang) } },
  langName: code => LOCALES[code]?.langName || code,
}
