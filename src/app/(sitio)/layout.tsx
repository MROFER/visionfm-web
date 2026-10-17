import type { Metadata, Viewport } from 'next'
import localFont from 'next/font/local'
import React from 'react'

import { BarraSuperior } from '@/sitio/componentes/globales/BarraSuperior'
import { DatosDeLaRadio } from '@/sitio/componentes/globales/DatosDeLaRadio'
import { Encabezado } from '@/sitio/componentes/globales/Encabezado'
import { Pie } from '@/sitio/componentes/globales/Pie'
import { MiniReproductor } from '@/sitio/componentes/reproductor/MiniReproductor'
import { Radio } from '@/sitio/componentes/reproductor/Radio'
import { obtenerAjustes, obtenerExcepciones, obtenerGrilla, obtenerSecciones } from '@/sitio/datos'
import { OPEN_GRAPH, urlDelSitio } from '@/sitio/lib/compartir'
import { marcaDeTiempo } from '@/sitio/lib/fecha'
import { menuPrincipal } from '@/sitio/navegacion'
import { sePuedeIndexar } from '@/sitio/seo/indexacion'

import './estilos.css'

// Tipografías servidas desde el sitio: un archivo variable por familia, solo el alfabeto latino.
// Newsreader no se carga: el logo va en trazos (src/sitio/marca.ts).
const titulos = localFont({
  src: './fuentes/libre-franklin.woff2',
  weight: '500 800',
  variable: '--fuente-titulos',
  display: 'swap',
})
const cuerpo = localFont({
  src: './fuentes/public-sans.woff2',
  weight: '400 800',
  variable: '--fuente-cuerpo',
  display: 'swap',
})

// Se arma en cada pedido con los datos de la caché de Next (src/sitio/datos): así el build de Docker no
// necesita la base. Cloudflare guarda el HTML delante del servidor (docs/02-trd.md, sección 5).
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  // Las imágenes y links de la vista previa al compartir salen con este dominio
  metadataBase: urlDelSitio(),
  title: { default: 'Visión 96.5 FM', template: '%s · Visión 96.5 FM' },
  description: 'Radio, noticias y Cinevisión desde Fray Bentos.',
  openGraph: OPEN_GRAPH,
  twitter: { card: 'summary_large_image' },
  icons: { icon: '/marca/icono.svg' },
  alternates: { types: { 'application/rss+xml': '/rss.xml' } },
  // Hasta el lanzamiento, ningún entorno se indexa (docs/02-trd.md, sección 2)
  robots: sePuedeIndexar() ? { index: true, follow: true } : { index: false, follow: false },
}

export const viewport: Viewport = { themeColor: '#13161d' }

export default async function SitioLayout({ children }: { children: React.ReactNode }) {
  const [ajustes, secciones, grilla, excepciones] = await Promise.all([
    obtenerAjustes(),
    obtenerSecciones(),
    obtenerGrilla(),
    obtenerExcepciones(),
  ])
  return (
    <html lang="es-UY" className={`${titulos.variable} ${cuerpo.variable}`}>
      <body>
        <Radio
          streamUrl={ajustes.streamUrl}
          grilla={grilla}
          excepciones={excepciones}
          ahoraInicial={marcaDeTiempo()}
        >
          <a
            href="#contenido"
            className="etiqueta sr-only bg-tinta p-3 text-blanco focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50"
          >
            Saltar al contenido
          </a>
          <BarraSuperior telefono={ajustes.telefono} />
          <Encabezado menu={menuPrincipal(secciones)} telefono={ajustes.telefono} />
          <div id="contenido">{children}</div>
          <Pie ajustes={ajustes} secciones={secciones} />
          <DatosDeLaRadio ajustes={ajustes} />
          <MiniReproductor />
        </Radio>
      </body>
    </html>
  )
}
