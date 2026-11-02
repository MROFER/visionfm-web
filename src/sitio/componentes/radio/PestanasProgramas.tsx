'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

export type Pestana = { nombre: string; href: string; elegida: boolean }

/** Cuántos programas se ven en web antes del "+ Ver más" (además de "Todos"). */
const VISIBLES = 6

/**
 * Pestañas de programas de Entrevistas. En el celular es una cinta que se desliza con el dedo, con un
 * "+" que late a la derecha mientras quedan pestañas por ver; en web, si son muchas, se ven las
 * primeras y el resto se despliega con "+ Ver más".
 */
export function PestanasProgramas({ pestanas }: { pestanas: Pestana[] }) {
  const elegida = pestanas.findIndex((p) => p.elegida)
  // Si la elegida está entre las de más, arranca desplegado para que se vea cuál es
  const [abiertas, setAbiertas] = useState(elegida > VISIBLES)
  const sobran = pestanas.length - 1 - VISIBLES
  const cinta = useRef<HTMLElement>(null)
  const [hayMas, setHayMas] = useState(false)
  useEffect(() => {
    const nav = cinta.current
    if (!nav) return
    const medir = () => setHayMas(nav.scrollLeft + nav.clientWidth < nav.scrollWidth - 4)
    medir()
    nav.addEventListener('scroll', medir, { passive: true })
    const observador = new ResizeObserver(medir)
    observador.observe(nav)
    return () => {
      nav.removeEventListener('scroll', medir)
      observador.disconnect()
    }
  }, [])

  return (
    <div className="relative mb-4 md:mb-7">
      <nav
        ref={cinta}
        aria-label="Programas"
        className="flex gap-5 overflow-x-auto border-b border-linea [scrollbar-width:none] md:flex-wrap md:gap-x-7 md:overflow-visible"
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
        {/* Lugar al final para que la última pestaña no quede tapada por el "+" */}
        <span aria-hidden className="w-6 shrink-0 md:hidden" />
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
      </nav>
      {/* Hay más a la derecha: un toque adelanta la cinta. Se va al llegar al final */}
      <button
        type="button"
        aria-label="Ver más programas"
        tabIndex={-1}
        onClick={() =>
          cinta.current?.scrollBy({ left: cinta.current.clientWidth * 0.7, behavior: 'smooth' })
        }
        className={`absolute top-0 right-0 bottom-px flex w-14 cursor-pointer items-center justify-end bg-gradient-to-l from-blanco from-45% to-transparent transition-opacity duration-300 md:hidden ${
          hayMas ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <span aria-hidden className="latido text-xl leading-none font-bold text-acento">
          +
        </span>
      </button>
    </div>
  )
}
