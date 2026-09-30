// Utilidades de DOM y estilo compartidas por el panel y las secciones.

// Estilo común de botones, campos y desplegables.
const CTRL_CSS = 'background:#3a2e20;color:#f3e6c8;border:1px solid #b08d57;border-radius:4px'

// Crea un elemento con estilo en línea y, si se indica, lo añade a `parent`.
const el = (tag, css, parent) => { const e = document.createElement(tag); if (css) e.style.cssText = css; if (parent) parent.appendChild(e); return e }

// Número con hasta dos decimales; vacío si no es un número.
const fmt = v => typeof v === 'number' ? String(Math.round(v * 100) / 100) : ''

module.exports = { CTRL_CSS, el, fmt }
