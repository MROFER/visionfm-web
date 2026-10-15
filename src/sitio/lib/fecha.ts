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
