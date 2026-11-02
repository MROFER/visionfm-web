'use client'

import Link from 'next/link'

import { IconoPausa } from '../ui/iconos'
import { useRadio } from './Radio'

/**
 * Barra fija abajo en el celular mientras suena una entrevista (design/LEEME.md, sección 6). La radio en
 * vivo ya se controla desde el encabezado (CabeceraCelular).
 */
export function MiniReproductor() {
  const { entrevista, reproducirEntrevista } = useRadio()
  if (!entrevista?.sonando) return null
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 flex items-center gap-3 border-t-[3px] border-acento bg-tinta py-2.5 pr-3 pl-4 text-blanco lg:hidden">
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="flex items-center gap-1.5 text-[10px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase">
          <span aria-hidden className="size-1.5 bg-vivo" />
          Entrevista
        </span>
        <Link href="/radio/entrevistas" className="truncate text-[15px] font-bold text-blanco no-underline">
          {entrevista.titulo}
        </Link>
      </span>
      <button
        type="button"
        onClick={() => reproducirEntrevista(entrevista)}
        aria-label="Pausar la entrevista"
        className="flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-acento text-blanco"
      >
        <IconoPausa />
      </button>
    </div>
  )
}
