'use client'

import { IconoPausa, IconoPlay } from '../ui/iconos'
import { useRadio } from './Radio'

/**
 * "Escuchar en vivo" ↔ "Pausar". Todos los botones del sitio controlan el mismo audio.
 * `compacto` es el del header en web, más bajo para que la barra de navegación mida 64 px.
 */
export function BotonEnVivo({
  variante,
  compacto = false,
}: {
  variante: 'header' | 'redondo' | 'hero'
  compacto?: boolean
}) {
  const { sonando, cargando, alternar } = useRadio()

  if (variante === 'redondo') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-label={sonando ? 'Pausar la radio en vivo' : 'Escuchar la radio en vivo'}
        aria-pressed={sonando}
        className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover"
      >
        {sonando ? <IconoPausa /> : <IconoPlay />}
        {sonando && (
          <span className="absolute top-0 right-0 size-3 rounded-full border-2 border-blanco bg-vivo" />
        )}
      </button>
    )
  }

  if (variante === 'hero') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-pressed={sonando}
        className="flex min-h-[60px] cursor-pointer items-center justify-center gap-3 bg-acento px-7 text-sm font-extrabold tracking-[0.1em] text-blanco uppercase hover:bg-acento-hover md:min-h-16 md:justify-start md:gap-3.5 md:pl-[22px] md:text-[15px]"
      >
        {sonando ? <IconoPausa tamano={22} /> : <IconoPlay tamano={22} />}
        {sonando ? 'Pausar' : 'Escuchar en vivo'}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={sonando}
      className={`etiqueta flex cursor-pointer items-center gap-2.5 bg-acento text-blanco hover:bg-acento-hover ${
        compacto ? 'min-h-10 px-[15px] text-[10px]' : 'min-h-12 px-[18px]'
      }`}
    >
      <span aria-hidden className={`size-2 bg-blanco ${cargando ? 'animate-pulse' : ''}`} />
      {sonando ? 'Pausar' : 'Escuchar en vivo'}
    </button>
  )
}
