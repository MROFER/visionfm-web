import type { Metadata } from 'next'
import React from 'react'

import './estilos.css'

export const metadata: Metadata = {
  title: 'Visión 96.5 FM',
  description: 'Radio, noticias y Cinevisión desde Fray Bentos.',
  // Hasta el lanzamiento, ningún entorno se indexa (docs/02-trd.md, sección 2)
  robots: { index: false, follow: false },
}

export default function SitioLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-UY">
      <body>{children}</body>
    </html>
  )
}
