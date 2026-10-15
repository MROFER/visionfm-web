'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { Imagen } from '../../datos/formas'
import { pestanaDeDia } from '../../lib/cine'
import { Foto } from '../ui/Foto'
import { PestanasDias } from './PestanasDias'

export type AficheCartelera = { id: number; slug: string; titulo: string; afiche: Imagen | null; dias: string[] }

const TODOS = 'todos'

/** La cartelera con el filtro por día: en web solo afiches; en el celular, 2 columnas con el nombre. */
export function CarteleraDias({ peliculas, dias }: { peliculas: AficheCartelera[]; dias: string[] }) {
  const [dia, setDia] = useState(TODOS)
  const visibles = dia === TODOS ? peliculas : peliculas.filter((p) => p.dias.includes(dia))

  return (
    <>
      {dias.length > 1 && (
        <PestanasDias
          opciones={[{ valor: TODOS, etiqueta: 'Todos' }, ...dias.map((d) => ({ valor: d, etiqueta: pestanaDeDia(d) }))]}
          elegida={dia}
          onElegir={setDia}
          controla="cartelera-del-dia"
        />
      )}
      <ul
        role="tabpanel"
        id="cartelera-del-dia"
        aria-labelledby={dias.length > 1 ? `cartelera-del-dia-${dia}` : undefined}
        className="m-0 mt-4 grid list-none grid-cols-2 gap-x-3 gap-y-5 p-0 md:grid-cols-3 md:gap-6 lg:mt-8 lg:grid-cols-4 lg:gap-8"
      >
        {visibles.map((p) => (
          <li key={p.id}>
            <Link href={`/cinevision/${p.slug}`} className="group flex flex-col gap-2 no-underline">
              <Foto
                imagen={p.afiche}
                sizes="(min-width: 1024px) 280px, (min-width: 768px) 30vw, 45vw"
                className="aspect-[2/3] w-full transition-opacity group-hover:opacity-90"
                textoSinFoto="Afiche"
              />
              <span className="font-titulos text-base leading-[1.2] font-bold group-hover:text-acento lg:sr-only">
                {p.titulo}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </>
  )
}
