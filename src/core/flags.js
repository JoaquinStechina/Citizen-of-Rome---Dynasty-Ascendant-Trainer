// Banderas de la cabecera, en el orden en que se muestran: [código de idioma, SVG].
// Se dibujan en SVG porque Windows no muestra los emojis de banderas. Cada código
// necesita sus textos en el módulo de idiomas.
const stripesH = colors => colors.map((c, i) => '<rect y="' + (20 / colors.length) * i + '" width="30" height="' + (20 / colors.length + 0.05) + '" fill="' + c + '"/>').join('')
const stripesV = colors => colors.map((c, i) => '<rect x="' + 10 * i + '" width="10.05" height="20" fill="' + c + '"/>').join('')
const usa = () => {
  let s = '<rect width="30" height="20" fill="#b22234"/>'
  for (let i = 1; i < 13; i += 2) s += '<rect y="' + (20 / 13) * i + '" width="30" height="' + 20 / 13 + '" fill="#fff"/>'
  s += '<rect width="12" height="' + (20 / 13) * 7 + '" fill="#3c3b6e"/>'
  for (let r = 0; r < 4; r++) for (let c = 0; c < 5; c++) s += '<circle cx="' + (1.4 + c * 2.3) + '" cy="' + (1.4 + r * 2.5) + '" r=".45" fill="#fff"/>'
  return s
}

module.exports = [
  ['es', stripesH(['#74acdf', '#fff', '#74acdf']) + '<circle cx="15" cy="10" r="2.3" fill="#f6b40e"/>'],
  ['pt', '<rect width="30" height="20" fill="#009c3b"/><polygon points="15,2.2 27.5,10 15,17.8 2.5,10" fill="#ffdf00"/><circle cx="15" cy="10" r="4.3" fill="#002776"/>'],
  ['en', usa()],
  ['ru', stripesH(['#fff', '#0039a6', '#d52b1e'])],
  ['fr', stripesV(['#0055a4', '#fff', '#ef4135'])],
  ['de', stripesH(['#000', '#dd0000', '#ffce00'])],
]
