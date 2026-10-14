import type { PayloadRequest } from 'payload'

/** Validación de una imagen de `medios` con medidas exactas (anuncios, carrusel). */
export const medidasExactas =
  (ancho: number, alto: number) =>
  async (valor: unknown, { req, required }: { req: PayloadRequest; required?: boolean }) => {
    if (!valor) return required ? 'Obligatorio.' : true
    const id = typeof valor === 'object' ? (valor as { id: number }).id : valor
    const imagen = await req.payload
      .findByID({ collection: 'medios', id: id as number, depth: 0, req })
      .catch(() => null)
    if (!imagen) return true
    return imagen.width === ancho && imagen.height === alto
      ? true
      : `La imagen tiene que medir ${ancho}×${alto} px; esta mide ${imagen.width}×${imagen.height}.`
  }
