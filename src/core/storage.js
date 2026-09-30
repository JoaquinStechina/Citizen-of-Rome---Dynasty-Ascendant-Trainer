// Preferencias del panel en localStorage (idioma, posición, tamaño, orden…).
// Nunca lanza: si el almacenamiento no está disponible, devuelve el valor por defecto.
module.exports = {
  get: (k, d) => { try { const v = localStorage.getItem(k); return v === null ? d : JSON.parse(v) } catch { return d } },
  set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)) } catch {} },
}
