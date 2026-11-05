const ZONA = 'America/Montevideo'

const partes = (fecha: Date, opciones: Intl.DateTimeFormatOptions) =>
  Object.fromEntries(
    new Intl.DateTimeFormat('es-UY', { timeZone: ZONA, ...opciones })
      .formatToParts(fecha)
      .map((p) => [p.type, p.value]),
  )

const mayuscula = (texto: string) => texto.charAt(0).toUpperCase() + texto.slice(1)

/** "Lunes 12 de octubre de 2026" (con año) o "Lunes 12 de octubre", en hora de Montevideo. */
export function fechaLarga(fecha: Date, { anio = true } = {}) {
  const p = partes(fecha, { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  return `${mayuscula(p.weekday)} ${p.day} de ${p.month}${anio ? ` de ${p.year}` : ''}`
}

/** "11 oct" */
export function fechaCorta(iso: string) {
  const p = partes(new Date(iso), { day: 'numeric', month: 'short' })
  return `${p.day} ${p.month.replace('.', '')}`
}

/** "11 de octubre" */
export function fechaDia(iso: string) {
  const p = partes(new Date(iso), { day: 'numeric', month: 'long' })
  return `${p.day} de ${p.month}`
}

/** "11 de octubre de 2026" */
export function fechaCompleta(iso: string) {
  const p = partes(new Date(iso), { day: 'numeric', month: 'long', year: 'numeric' })
  return `${p.day} de ${p.month} de ${p.year}`
}

/** "08:30": la hora en Montevideo, de 0 a 23. */
export function horaDelDia(iso: string) {
  const p = partes(new Date(iso), { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
  return `${p.hour}:${p.minute}`
}

/** "09/10" */
export function fechaNumerica(iso: string) {
  const p = partes(new Date(iso), { day: '2-digit', month: '2-digit' })
  return `${p.day}/${p.month}`
}

/** "2026-10-15": el día de hoy en Montevideo. */
export function hoyEnMontevideo(fecha = new Date()) {
  const p = partes(fecha, { year: 'numeric', month: '2-digit', day: '2-digit' })
  return `${p.year}-${p.month}-${p.day}`
}

const DIAS_CORTOS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

/**
 * Los días en que se da una película, sin horarios (design/LEEME.md, sección 11): "Vie a Dom",
 * "Sáb y Dom", "Dom", "Lun, Mié y Vie". Las fechas van en orden.
 */
export function diasDeFunciones(fechas: string[]) {
  const vistos: string[] = []
  const indices: number[] = []
  for (const f of fechas) {
    const dia = hoyEnMontevideo(new Date(f))
    if (vistos.includes(dia)) continue
    vistos.push(dia)
    indices.push((new Date(`${dia}T12:00:00Z`).getUTCDay() + 6) % 7)
  }
  if (!indices.length) return ''
  const DIA = 24 * 3600_000
  // Seguidos por fecha, no por nombre: de jueves a miércoles también es un rango
  const seguidos = vistos.every((d, i) => i === 0 || Date.parse(d) - Date.parse(vistos[i - 1]) === DIA)
  const nombres = indices.map((d) => DIAS_CORTOS[d])
  if (seguidos && nombres.length >= 3) return `${nombres[0]} a ${nombres.at(-1)}`
  if (nombres.length === 1) return nombres[0]
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

/** La hora de este pedido, para que el primer render del servidor y del navegador coincidan. */
export const marcaDeTiempo = () => Date.now()

// Las direcciones viejas del filtro por mes de las entrevistas traen el mes como "2026-10"
export const esMes = (valor: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor)

// Filtro por fechas de las entrevistas: cada punta va como "2026-10-15" en la dirección y cuenta entera
export const esDia = (valor: string) =>
  /^\d{4}-(0[1-9]|1[0-2])-(0[1-9]|[12]\d|3[01])$/.test(valor) &&
  new Date(`${valor}T12:00:00Z`).toISOString().startsWith(valor)

/** Del primer instante del día `desde` al primero del día siguiente a `hasta`, en hora de Montevideo. */
export function rangoDeDias(desde: string, hasta: string) {
  const siguiente = new Date(`${hasta}T12:00:00Z`)
  siguiente.setUTCDate(siguiente.getUTCDate() + 1)
  const inicio = (dia: string) => new Date(`${dia}T00:00:00-03:00`).toISOString()
  return { desde: inicio(desde), hasta: inicio(siguiente.toISOString().slice(0, 10)) }
}

/** El primer y el último día de un mes ("2026-10"), para las direcciones viejas con `mes`. */
export function diasDelMes(mes: string) {
  const [anio, numero] = mes.split('-').map(Number)
  const ultimo = new Date(Date.UTC(anio, numero, 0)).getUTCDate()
  return { desde: `${mes}-01`, hasta: `${mes}-${String(ultimo).padStart(2, '0')}` }
}

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre']

const partesDelDia = (dia: string) => dia.split('-').map(Number) as [number, number, number]

/**
 * "del 1 de agosto al 15 de octubre", "del 3 al 9 de agosto" o "el 3 de agosto"; con el año cuando no
 * es el de `hoy` o las puntas son de años distintos.
 */
export function nombreDelRango(desde: string, hasta: string, hoy: string) {
  const [a1, m1, d1] = partesDelDia(desde)
  const [a2, m2, d2] = partesDelDia(hasta)
  const conAnio = a1 !== a2 || a2 !== partesDelDia(hoy)[0]
  const anio = (a: number) => (conAnio ? ` de ${a}` : '')
  if (desde === hasta) return `el ${d1} de ${MESES[m1 - 1]}${anio(a1)}`
  if (a1 === a2 && m1 === m2) return `del ${d1} al ${d2} de ${MESES[m2 - 1]}${anio(a2)}`
  return `del ${d1} de ${MESES[m1 - 1]}${a1 !== a2 ? ` de ${a1}` : ''} al ${d2} de ${MESES[m2 - 1]}${anio(a2)}`
}

/** "1 ago – 15 oct", o "3 ago" si es un solo día. */
export function rangoCorto(desde: string, hasta: string) {
  const corto = (dia: string) => {
    const [, m, d] = partesDelDia(dia)
    return `${d} ${MESES_CORTOS[m - 1]}`
  }
  return desde === hasta ? corto(desde) : `${corto(desde)} – ${corto(hasta)}`
}
