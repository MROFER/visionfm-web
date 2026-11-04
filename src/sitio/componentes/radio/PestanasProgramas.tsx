'use client'

import Link from 'next/link'
import { useState } from 'react'

import { CintaConMas } from '../ui/CintaConMas'

export type Pestana = { nombre: string; href: string; elegida: boolean }

/** Cuántos programas se ven en web antes del "+ Ver más" (además de "Todos"). */
const VISIBLES = 6

/**
 * Pestañas de programas de Entrevistas. En el celular es la cinta con el "+" (CintaConMas); en web, si
 * son muchas, se ven las primeras y el resto se despliega con "+ Ver más".
 */
export function PestanasProgramas({ pestanas }: { pestanas: Pestana[] }) {
  const elegida = pestanas.findIndex((p) => p.elegida)
  // Si la elegida está entre las de más, arranca desplegado para que se vea cuál es
  const [abiertas, setAbiertas] = useState(elegida > VISIBLES)
  const sobran = pestanas.length - 1 - VISIBLES
  return (
    <CintaConMas
      etiqueta="Programas"
      etiquetaMas="Ver más programas"
      className="mb-4 md:mb-7"
      claseNav="flex gap-5 overflow-x-auto border-b border-linea md:flex-wrap md:gap-x-7 md:overflow-visible"
    >
      {pestanas.map((p, i) => (
        <Link
          key={p.href}
          href={p.href}
          aria-current={p.elegida ? 'page' : undefined}
          className={`flex min-h-11 shrink-0 items-center text-xs tracking-[0.08em] uppercase no-underline hover:text-acento md:min-h-12 md:text-sm ${
            p.elegida
              ? 'font-extrabold shadow-[inset_0_-3px_0_var(--color-acento)]'
              : 'font-semibold'
          } ${!abiertas && i > VISIBLES ? 'md:hidden' : ''}`}
        >
          {p.nombre}
        </Link>
      ))}
      {sobran > 0 && (
        <button
          type="button"
          aria-expanded={abiertas}
          onClick={() => setAbiertas(!abiertas)}
          className="hidden min-h-12 shrink-0 cursor-pointer items-center text-sm font-extrabold tracking-[0.08em] text-acento uppercase hover:text-acento-hover md:flex"
        >
          {abiertas ? '− Ver menos' : `+ Ver más (${sobran})`}
        </button>
      )}
    </CintaConMas>
  )
}
