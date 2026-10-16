'use client'

import { useEffect } from 'react'

import { PaginaError } from '@/sitio/componentes/errores/PaginaError'

// Error del servidor dentro de una página del sitio: el encabezado, el reproductor y el pie siguen
// funcionando, así la radio no se corta. Si falla el layout entero, responde global-error.tsx.
export default function ErrorDelSitio({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])
  return (
    <PaginaError
      codigo="Error 500"
      titulo="Algo salió mal"
      texto="No pudimos cargar esta página. Probá de nuevo en unos segundos; si sigue igual, avisanos."
      accion={
        <button
          type="button"
          onClick={reset}
          className="etiqueta flex min-h-12 cursor-pointer items-center justify-center bg-acento px-6 text-blanco hover:bg-acento-hover md:min-h-[52px]"
        >
          Probar de nuevo
        </button>
      }
    />
  )
}
