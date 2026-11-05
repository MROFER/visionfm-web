'use client'

import { useRef, useState } from 'react'

import type { Imagen } from '../../datos/formas'
import { Foto } from '../ui/Foto'
import { IconoFlechaAbajo } from '../ui/iconos'

export type FotoGaleria = { imagen: Imagen; pie: string }

/**
 * Galería dentro del texto de una nota (opción B de bocetos/nota-galeria): la foto limpia en 16:9,
 * rayitas debajo que marcan cuál se ve, y al lado del epígrafe el número y las flechas cuadradas con el
 * borde de los botones de compartir. Se pasa con las flechas o deslizando con el dedo (scroll-snap). Una
 * foto vertical entra entera, sobre fondo oscuro, en vez de recortarse.
 */
export function GaleriaNota({ fotos }: { fotos: FotoGaleria[] }) {
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  const total = fotos.length

  const ir = (indice: number) => {
    const el = pista.current
    if (!el) return
    const destino = Math.max(0, Math.min(total - 1, indice))
    const suave = !matchMedia('(prefers-reduced-motion: reduce)').matches
    el.scrollTo({ left: destino * el.clientWidth, behavior: suave ? 'smooth' : 'auto' })
  }

  return (
    <figure
      role="group"
      aria-roledescription="galería"
      aria-label={`Galería de ${total} fotos`}
      className="flex flex-col gap-2.5 md:gap-3"
    >
      <div
        ref={pista}
        onScroll={(e) => {
          const el = e.currentTarget
          // Sin ancho (oculta o en medio de un cambio de tamaño) no hay foto que marcar
          if (!el.clientWidth) return
          setActual(Math.min(total - 1, Math.max(0, Math.round(el.scrollLeft / el.clientWidth))))
        }}
        className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {fotos.map((f, i) => (
          <div
            key={i}
            role="group"
            aria-roledescription="foto"
            aria-label={`${i + 1} de ${total}`}
            aria-hidden={i !== actual}
            className="w-full shrink-0 snap-start"
          >
            <Foto
              imagen={f.imagen}
              sizes="(min-width: 768px) 680px, calc(100vw - 32px)"
              className={`aspect-[16/9] h-auto w-full ${f.imagen.alto > f.imagen.ancho ? 'bg-tinta object-contain!' : ''}`}
            />
          </div>
        ))}
      </div>
      <span aria-hidden className="flex gap-1">
        {fotos.map((_, i) => (
          <span key={i} className={`h-[3px] flex-1 ${i === actual ? 'bg-tinta' : 'bg-linea'}`} />
        ))}
      </span>
      <div className="flex items-start justify-between gap-4">
        <figcaption aria-live="polite" className="min-w-0 flex-1 text-xs text-meta md:text-[13px]">
          {fotos[actual]?.pie}
        </figcaption>
        <div className="flex shrink-0 items-center gap-2">
          <span className="mr-1 text-[13px] font-bold tabular-nums">
            {actual + 1} / {total}
          </span>
          <Flecha lado="anterior" desactivada={actual === 0} onClick={() => ir(actual - 1)} />
          <Flecha lado="siguiente" desactivada={actual === total - 1} onClick={() => ir(actual + 1)} />
        </div>
      </div>
    </figure>
  )
}

function Flecha({
  lado,
  desactivada,
  onClick,
}: {
  lado: 'anterior' | 'siguiente'
  desactivada: boolean
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desactivada}
      aria-label={lado === 'anterior' ? 'Foto anterior' : 'Foto siguiente'}
      className="flex size-11 cursor-pointer items-center justify-center border-2 border-tinta bg-blanco text-tinta hover:bg-suave disabled:cursor-default disabled:opacity-30 disabled:hover:bg-blanco md:size-10"
    >
      <IconoFlechaAbajo tamano={18} className={lado === 'anterior' ? 'rotate-90' : '-rotate-90'} />
    </button>
  )
}
