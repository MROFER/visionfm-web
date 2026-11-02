'use client'

import Link from 'next/link'
import { useState } from 'react'

import type { Enlace } from '../../navegacion'

/**
 * Los links de más de un grupo del pie (las secciones de Noticias): en web se ven siempre; en el celular
 * quedan plegados detrás de "+ Ver más", para que la columna no sea mucho más larga que las otras.
 */
export function MasEnlaces({ enlaces, className }: { enlaces: Enlace[]; className: string }) {
  const [abiertos, setAbiertos] = useState(false)
  return (
    <>
      {enlaces.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className={`${className} ${abiertos ? '' : 'max-lg:hidden'}`}
        >
          {e.etiqueta}
        </Link>
      ))}
      <button
        type="button"
        aria-expanded={abiertos}
        onClick={() => setAbiertos(!abiertos)}
        className="flex min-h-10 cursor-pointer items-center self-start text-[15px] font-semibold text-vivo-claro hover:text-blanco lg:hidden"
      >
        {abiertos ? '− Ver menos' : '+ Ver más'}
      </button>
    </>
  )
}
