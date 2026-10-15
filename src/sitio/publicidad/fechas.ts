export const ZONA = 'America/Montevideo'

/** Día calendario en Montevideo, como `AAAA-MM-DD`. */
export const diaEnMontevideo = (fecha: Date | string) =>
  new Date(fecha).toLocaleDateString('en-CA', { timeZone: ZONA })

/** Suma días a un `AAAA-MM-DD` sin depender de la zona horaria del servidor. */
export function sumarDias(dia: string, dias: number) {
  const [a, m, d] = dia.split('-').map(Number)
  return new Date(Date.UTC(a, m - 1, d + dias)).toISOString().slice(0, 10)
}

/** El mes anterior a `fecha` (en Montevideo): primer y último día, y el nombre para el reporte. */
export function mesAnterior(fecha: Date) {
  const [a, m] = diaEnMontevideo(fecha).split('-').map(Number)
  const anio = m === 1 ? a - 1 : a
  const mes = m === 1 ? 12 : m - 1
  return mesDe(`${anio}-${String(mes).padStart(2, '0')}`)
}

/** `AAAA-MM` → primer y último día, y nombre ("septiembre de 2026"). */
export function mesDe(clave: string) {
  const [anio, mes] = clave.split('-').map(Number)
  const ultimo = new Date(Date.UTC(anio, mes, 0)).getUTCDate()
  const nombre = new Date(Date.UTC(anio, mes - 1, 15)).toLocaleDateString('es-UY', {
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC',
  })
  return {
    clave,
    desde: `${clave}-01`,
    hasta: `${clave}-${String(ultimo).padStart(2, '0')}`,
    nombre,
  }
}

/**
 * Las fechas de solo día se guardan a las 12:00 UTC, igual que el selector del panel
 * (así caen en el mismo día en Montevideo y en UTC).
 */
export const mediodiaUTC = (dia: string) => `${dia}T12:00:00.000Z`
