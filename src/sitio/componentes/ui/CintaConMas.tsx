'use client'

import { useEffect, useRef, useState, type ReactNode } from 'react'

/**
 * Cinta que se desliza de costado en el celular (pestañas de programas, tira de secciones). Mientras
 * quedan opciones por ver, a la derecha late un "+" sobre un borde que se esfuma; un toque adelanta la
 * cinta y el "+" se va al llegar al final. En web la cinta no se desliza y el "+" no aparece.
 */
export function CintaConMas({
  etiqueta,
  etiquetaMas,
  className = '',
  claseNav,
  children,
}: {
  /** Nombre del `<nav>` para los lectores de pantalla. */
  etiqueta: string
  /** Lo que dice el "+" para los lectores de pantalla: "Ver más programas". */
  etiquetaMas: string
  /** Clases del contenedor (márgenes). */
  className?: string
  /** Clases del `<nav>`. */
  claseNav: string
  children: ReactNode
}) {
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
    <div className={`relative ${className}`}>
      <nav ref={cinta} aria-label={etiqueta} className={`[scrollbar-width:none] ${claseNav}`}>
        {children}
        {/* Lugar al final para que la última opción no quede tapada por el "+" */}
        <span aria-hidden className="w-6 shrink-0 md:hidden" />
      </nav>
      <button
        type="button"
        aria-label={etiquetaMas}
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
