// Banco de Roma: el mod "bank_of_rome" de peritiSumus (github.com/peritiSumus/CoR-Mods,
// dominio público). Si no tienes deuda y te queda menos de 500, el banco te presta
// 500, 1000, 2000 o 5000 × (tu clase + préstamos ya pedidos, hasta 3) al 8,3% anual.
// Cada año, al llegar el mes del cobro, hay que pagar al menos el interés.
// El préstamo se guarda con la partida (current.modFlags.trainerBank).
const game = require('game')

const FLAG = 'trainerBank'
const RATE = 0.083
const AMOUNTS = [500, 1000, 2000, 5000]
const EXTRA = [100, 500, 1000, 2500, 5000] // abonos al capital además del interés
const BILL_MONTH = 3 // el juego pasa sus eventos anuales en el mes 3

const api = () => game.DA.api()
const S = () => game.S()

const data = () => ({ principal: 0, rate: RATE, loansTaken: 0, billedYear: null, ...(api().getGlobalFlag({ flag: FLAG }) || {}) })
const save = d => api().setGlobalFlag({ flag: FLAG, data: d })

const debt = () => Math.max(0, data().principal)
const interest = () => Math.ceil(debt() * data().rate)
const canBorrow = () => debt() <= 0 && S().current.cash < 500
const amounts = () => { const d = data(); return AMOUNTS.map(a => a * ((S().current.class || 1) + Math.min(d.loansTaken, 3))) }

// Para statChanges de una ventana: el juego multiplica el dinero por el factor de clase.
const cashChange = real => ({ cash: real / api().calculateScaleByClassFactor() })

// Recibir el préstamo (el dinero lo da quien llama: el panel o la ventana del juego).
function borrow(amount) {
  const d = data(), s = S()
  d.principal += amount
  d.loansTaken += 1
  d.rate = RATE
  // El primer cobro es en el próximo mes del cobro.
  d.billedYear = s.month >= BILL_MONTH ? s.year : s.year - 1
  save(d)
}

// Abonar al capital (el interés se cobra aparte).
function repay(amount) {
  const d = data()
  d.principal = Math.max(0, d.principal - amount)
  save(d)
}

// ¿Toca el cobro anual? Lo marca como cobrado y devuelve las opciones de pago.
function dueBill() {
  const d = data(), s = S()
  if (d.principal <= 0 || s.month < BILL_MONTH || (d.billedYear ?? -Infinity) >= s.year) return null
  d.billedYear = s.year
  save(d)
  const i = interest()
  return {
    interest: i, principal: d.principal,
    extras: EXTRA.filter(x => d.principal > x).map(x => ({ extra: x, total: x + i })),
    all: d.principal + i,
  }
}

module.exports = { RATE, debt, interest, canBorrow, amounts, cashChange, borrow, repay, dueBill, data }
