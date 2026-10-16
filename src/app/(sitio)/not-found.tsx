import type { Metadata } from 'next'

import { PaginaError } from '@/sitio/componentes/errores/PaginaError'

export const metadata: Metadata = { title: 'Página no encontrada' }

// 404 del sitio, con el encabezado y el pie (docs/03-flujos.md, estados)
export default function NoEncontrada() {
  return (
    <PaginaError
      codigo="Error 404"
      titulo="No encontramos esta página"
      texto="Puede que el link esté mal escrito o que la página ya no exista. Seguí por alguna de estas secciones."
    />
  )
}
