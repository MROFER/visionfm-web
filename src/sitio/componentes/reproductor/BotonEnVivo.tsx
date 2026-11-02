'use client'

import { IconoCargando, IconoPausa, IconoPlay } from '../ui/iconos'
import { useRadio } from './Radio'

/**
 * "Escuchar en vivo" ↔ "Conectando…" ↔ "Pausar". Todos los botones del sitio controlan el mismo audio.
 * Mientras conecta se ve una ruedita: sin ella, el toque parece no haber hecho nada. Tocar de nuevo
 * corta la conexión. `compacto` es el del header en web, más bajo para que la barra mida 64 px.
 */
export function BotonEnVivo({
  variante,
  compacto = false,
}: {
  variante: 'header' | 'redondo' | 'hero'
  compacto?: boolean
}) {
  const { sonando, cargando, reconectando, alternar } = useRadio()
  const activo = sonando || cargando
  const texto = reconectando
    ? 'Reconectando…'
    : cargando
      ? 'Conectando…'
      : sonando
        ? 'Pausar'
        : 'Escuchar en vivo'

  if (variante === 'redondo') {
    return (
      <button
        type="button"
        onClick={alternar}
        aria-label={activo ? 'Pausar la radio en vivo' : 'Escuchar la radio en vivo'}
        aria-pressed={activo}
        aria-busy={cargando}
        className="relative flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover"
      >
        {cargando ? <IconoCargando /> : sonando ? <IconoPausa /> : <IconoPlay />}
        {sonando && !cargando && (
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
        aria-pressed={activo}
        aria-busy={cargando}
        className="flex min-h-[60px] cursor-pointer items-center justify-center gap-3 bg-acento px-7 text-sm font-extrabold tracking-[0.1em] text-blanco uppercase hover:bg-acento-hover md:min-h-16 md:justify-start md:gap-3.5 md:pl-[22px] md:text-[15px]"
      >
        {cargando ? (
          <IconoCargando tamano={22} />
        ) : sonando ? (
          <IconoPausa tamano={22} />
        ) : (
          <IconoPlay tamano={22} />
        )}
        {texto}
      </button>
    )
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={activo}
      aria-busy={cargando}
      className={`etiqueta flex cursor-pointer items-center gap-2.5 bg-acento text-blanco hover:bg-acento-hover ${
        compacto ? 'min-h-10 px-[15px] text-[10px]' : 'min-h-12 px-[18px]'
      }`}
    >
      {cargando ? <IconoCargando tamano={12} /> : <span aria-hidden className="size-2 bg-blanco" />}
      {texto}
    </button>
  )
}
