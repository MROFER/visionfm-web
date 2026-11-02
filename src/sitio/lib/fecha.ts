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

// Filtro por mes de las entrevistas: el mes va como "2026-10" en la dirección
export const esMes = (valor: string) => /^\d{4}-(0[1-9]|1[0-2])$/.test(valor)

/** "2026-10": el mes de una fecha, en hora de Montevideo. */
export function mesEnMontevideo(iso: string) {
  const p = partes(new Date(iso), { year: 'numeric', month: '2-digit' })
  return `${p.year}-${p.month}`
}

/** "Octubre 2026" */
export function nombreDelMes(mes: string) {
  const [anio, numero] = mes.split('-').map(Number)
  const p = partes(new Date(Date.UTC(anio, numero - 1, 15, 12)), { month: 'long' })
  return `${mayuscula(p.month)} ${anio}`
}

/** Desde el primer instante del mes hasta el del siguiente, en hora de Montevideo. */
export function rangoDelMes(mes: string) {
  const [anio, numero] = mes.split('-').map(Number)
  const siguiente = numero === 12 ? `${anio + 1}-01` : `${anio}-${String(numero + 1).padStart(2, '0')}`
  const inicio = (m: string) => new Date(`${m}-01T00:00:00-03:00`).toISOString()
  return { desde: inicio(mes), hasta: inicio(siguiente) }
}
