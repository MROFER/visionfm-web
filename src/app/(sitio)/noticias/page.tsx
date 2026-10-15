import type { Metadata } from 'next'

import { PaginaNoticias, type BusquedaNoticias } from '@/sitio/componentes/noticias/PaginaNoticias'

export const metadata: Metadata = {
  title: 'Noticias',
  description: 'Noticias de Fray Bentos y Río Negro: locales, nacionales, policiales, deportes y cultura.',
}

export default function Noticias({ searchParams }: { searchParams: BusquedaNoticias }) {
  return <PaginaNoticias busqueda={searchParams} />
}
