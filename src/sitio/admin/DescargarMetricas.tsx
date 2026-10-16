'use client'

import { useConfig, useDocumentInfo } from '@payloadcms/ui'

/** Link en la ficha del anuncio para bajar sus impresiones y clics por día y ubicación (CSV). */
export function DescargarMetricas() {
  const { id } = useDocumentInfo()
  const {
    config: { routes, serverURL },
  } = useConfig()
  if (!id) return null
  return (
    <p style={{ margin: '0 0 1.5rem' }}>
      <a href={`${serverURL ?? ''}${routes.api}/anuncios/${id}/metricas`} download>
        Descargar métricas por día y ubicación (CSV)
      </a>
    </p>
  )
}
