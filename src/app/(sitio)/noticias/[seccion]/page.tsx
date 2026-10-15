import type { Metadata } from 'next'

import { PaginaNoticias, type BusquedaNoticias } from '@/sitio/componentes/noticias/PaginaNoticias'
import { obtenerSecciones } from '@/sitio/datos'

type Parametros = { params: Promise<{ seccion: string }>; searchParams: BusquedaNoticias }

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { seccion } = await params
  const actual = (await obtenerSecciones()).find((s) => s.slug === seccion)
  return actual ? { title: `${actual.nombre} · Noticias` } : {}
}

export default async function SeccionNoticias({ params, searchParams }: Parametros) {
  const { seccion } = await params
  return <PaginaNoticias seccion={seccion} busqueda={searchParams} />
}
