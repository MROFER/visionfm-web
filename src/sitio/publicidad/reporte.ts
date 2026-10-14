import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

import { UBICACIONES } from './ubicaciones'

export type Metrica = {
  anuncio: number | string
  ubicacion: string
  fecha: string
  impresiones: number
  clics: number
}
export type AnuncioDelReporte = { id: number | string; nombre: string }

export type FilaReporte = { anuncio: string; ubicacion: string; impresiones: number; clics: number }

const nombreUbicacion = (valor: string) =>
  UBICACIONES.find((u) => u.value === valor)?.label ?? valor

/** Suma impresiones y clics por anuncio y ubicación; ordena por anuncio y por impresiones. */
export function resumirMetricas(anuncios: AnuncioDelReporte[], metricas: Metrica[]): FilaReporte[] {
  const nombres = new Map(anuncios.map((a) => [String(a.id), a.nombre]))
  const filas = new Map<string, FilaReporte>()
  for (const m of metricas) {
    const nombre = nombres.get(String(m.anuncio))
    if (!nombre) continue
    const clave = `${m.anuncio}|${m.ubicacion}`
    const fila = filas.get(clave) ?? {
      anuncio: nombre,
      ubicacion: nombreUbicacion(m.ubicacion),
      impresiones: 0,
      clics: 0,
    }
    fila.impresiones += m.impresiones
    fila.clics += m.clics
    filas.set(clave, fila)
  }
  return [...filas.values()].sort(
    (a, b) => a.anuncio.localeCompare(b.anuncio, 'es') || b.impresiones - a.impresiones,
  )
}

export const ctr = (impresiones: number, clics: number) =>
  impresiones === 0
    ? '—'
    : `${((clics / impresiones) * 100).toLocaleString('es-UY', { maximumFractionDigits: 2 })} %`

const numero = (n: number) => n.toLocaleString('es-UY')

/** PDF de una página por anunciante con impresiones y clics del mes (docs/03-flujos.md, P11). */
export async function pdfReporte({
  anunciante,
  mes,
  filas,
}: {
  anunciante: string
  mes: string
  filas: FilaReporte[]
}) {
  const pdf = await PDFDocument.create()
  pdf.setTitle(`Reporte de publicidad · ${anunciante} · ${mes}`)
  pdf.setAuthor('Visión 96.5 FM')
  const normal = await pdf.embedFont(StandardFonts.Helvetica)
  const negrita = await pdf.embedFont(StandardFonts.HelveticaBold)
  let pagina = pdf.addPage([595, 842])
  const gris = rgb(0.35, 0.35, 0.35)
  let y = 780

  pagina.drawText('Visión 96.5 FM', { x: 50, y, size: 11, font: negrita, color: gris })
  y -= 34
  pagina.drawText('Reporte de publicidad', { x: 50, y, size: 22, font: negrita })
  y -= 24
  pagina.drawText(`${anunciante} · ${mes}`, { x: 50, y, size: 13, font: normal })
  y -= 36

  const columnas = [50, 230, 390, 470]
  const encabezado = (p: typeof pagina, alto: number) => {
    ;['Anuncio', 'Ubicación', 'Impresiones', 'Clics'].forEach((t, i) =>
      p.drawText(t, { x: columnas[i], y: alto, size: 10, font: negrita }),
    )
    p.drawLine({
      start: { x: 50, y: alto - 6 },
      end: { x: 545, y: alto - 6 },
      thickness: 0.5,
      color: gris,
    })
  }
  encabezado(pagina, y)
  y -= 22

  const recortar = (texto: string, ancho: number) => {
    let t = texto
    while (normal.widthOfTextAtSize(t, 10) > ancho && t.length > 1) t = t.slice(0, -1)
    return t === texto ? t : `${t.slice(0, -1)}…`
  }

  for (const fila of filas) {
    if (y < 80) {
      pagina = pdf.addPage([595, 842])
      y = 780
      encabezado(pagina, y)
      y -= 22
    }
    pagina.drawText(recortar(fila.anuncio, 170), { x: columnas[0], y, size: 10, font: normal })
    pagina.drawText(recortar(fila.ubicacion, 150), { x: columnas[1], y, size: 10, font: normal })
    pagina.drawText(numero(fila.impresiones), { x: columnas[2], y, size: 10, font: normal })
    pagina.drawText(numero(fila.clics), { x: columnas[3], y, size: 10, font: normal })
    y -= 18
  }

  const impresiones = filas.reduce((s, f) => s + f.impresiones, 0)
  const clics = filas.reduce((s, f) => s + f.clics, 0)
  y -= 10
  pagina.drawText(
    filas.length === 0
      ? 'No hubo impresiones en este período.'
      : `Total: ${numero(impresiones)} impresiones, ${numero(clics)} clics (tasa de clics ${ctr(impresiones, clics)}).`,
    { x: 50, y, size: 11, font: negrita },
  )
  return pdf.save()
}
