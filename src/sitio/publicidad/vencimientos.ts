import { diaEnMontevideo, sumarDias } from './fechas'

export const DIAS_DE_AVISO = 7

type AnuncioVigente = {
  id: number | string
  nombre: string
  anunciante: string
  hasta: string
  activo?: boolean | null
}

/** Anuncios activos que vencen exactamente dentro de 7 días (docs/03-flujos.md, P6). */
export function anunciosPorVencer<T extends AnuncioVigente>(
  anuncios: T[],
  hoy: Date,
  dias = DIAS_DE_AVISO,
): T[] {
  const objetivo = sumarDias(diaEnMontevideo(hoy), dias)
  return anuncios.filter((a) => a.activo !== false && diaEnMontevideo(a.hasta) === objetivo)
}

export function textoAvisoVencimiento(anuncios: AnuncioVigente[]) {
  const lineas = anuncios.map(
    (a) => `- ${a.nombre} (${a.anunciante}): vence el ${diaEnMontevideo(a.hasta)}`,
  )
  return [
    `${anuncios.length === 1 ? 'Este anuncio vence' : 'Estos anuncios vencen'} en ${DIAS_DE_AVISO} días:`,
    '',
    ...lineas,
    '',
    'Si el cliente renueva, actualizá la fecha de fin en el panel (Publicidad → Anuncios).',
  ].join('\n')
}
