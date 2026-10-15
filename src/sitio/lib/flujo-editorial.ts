/**
 * Flujo editorial de noticias (docs/03-flujos.md, P2). Lógica pura: el hook la aplica en el servidor.
 *
 * borrador ─Enviar a revisión─▶ en-revision ─Aprobar y publicar─▶ publicada
 *    ▲                             │   └─Aprobar y programar─▶ aprobada ─(hora)─▶ publicada
 *    └──────────Devolver───────────┘
 *    └─Publicar ahora / Programar (solo con Noticias → Publicar)─▶ publicada
 */
export const ESTADOS = ['borrador', 'en-revision', 'devuelta', 'aprobada', 'publicada'] as const
export type Estado = (typeof ESTADOS)[number]

export type Capacidades = { puedePublicar: boolean; puedeAprobar: boolean }

/** `null` si el cambio de estado está permitido; si no, el motivo para mostrar en el panel. */
export function validarTransicion(
  anterior: Estado | null | undefined,
  nuevo: Estado,
  { puedePublicar, puedeAprobar }: Capacidades,
  comentario?: string | null,
): string | null {
  const desde = anterior ?? 'borrador'
  if (desde === nuevo) return null

  switch (nuevo) {
    case 'borrador':
    case 'en-revision':
      // Desde una publicada, es una corrección en borrador: la versión publicada sigue en el sitio (P2d)
      if (desde === 'aprobada' && !puedeAprobar)
        return 'La nota ya está aprobada; pedile a un editor que la cambie.'
      return null
    case 'devuelta':
      if (!puedeAprobar) return 'Solo un editor puede devolver una nota.'
      if (desde !== 'en-revision') return 'Solo se devuelven notas que están en revisión.'
      if (!comentario?.trim()) return 'Escribí el motivo para el autor en "Comentario del editor".'
      return null
    case 'aprobada':
      return puedeAprobar ? null : 'Solo un editor puede aprobar.'
    case 'publicada':
      return puedePublicar ? null : 'No tenés permiso para publicar: enviala a revisión.'
  }
}

export type DestinatarioPosible = {
  id: number | string
  email: string
  activo?: boolean | null
  recibeAvisosRevision?: boolean | null
  avisosEmail?: 'al-instante' | 'resumen-por-hora' | 'nunca' | null
}

export type Aviso = { para: 'editores' | 'autor'; asunto: string }

/** Qué aviso por email corresponde a un cambio de estado. */
export function avisoPorCambio(
  anterior: Estado | null | undefined,
  nuevo: Estado,
  titulo: string,
): Aviso | null {
  if (anterior === nuevo) return null
  if (nuevo === 'en-revision') return { para: 'editores', asunto: `Nota para revisar: ${titulo}` }
  if (nuevo === 'devuelta') return { para: 'autor', asunto: `Te devolvieron la nota: ${titulo}` }
  if (nuevo === 'publicada') return { para: 'autor', asunto: `Se publicó tu nota: ${titulo}` }
  return null
}

/** Solo reciben al instante los activos que lo eligieron (por defecto, al instante). El resumen por hora va aparte. */
export const recibeAlInstante = (u: DestinatarioPosible) =>
  u.activo !== false && (u.avisosEmail ?? 'al-instante') === 'al-instante'
