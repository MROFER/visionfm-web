'use client'

import Link from 'next/link'
import { useCallback, useEffect, useRef, useState } from 'react'

import type { DiapositivaCine } from '../../datos/cinevision'

/** Cada cuánto avanza solo, mientras nadie lo toque. */
const AUTOAVANCE = 7000

/**
 * Carrusel de Cinevisión (design/LEEME.md, secciones 7 y 8): a todo el ancho en el celular y, en web,
 * dentro de los márgenes del contenedor y más bajo que en el diseño (1240×384 como máximo), para que
 * entre entero en una notebook. Flechas en web, negativos de película como indicadores y deslizar con
 * el dedo (scroll-snap). Avanza solo hasta que alguien lo toca, y nunca si el sistema pide menos movimiento.
 */
export function CarruselCine({ diapositivas }: { diapositivas: DiapositivaCine[] }) {
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  // Tocado o con foco: no avanza más. Con el mouse encima: espera a que salga.
  const [quieto, setQuieto] = useState(false)
  const [encima, setEncima] = useState(false)
  const total = diapositivas.length

  const ir = useCallback(
    (indice: number) => {
      const el = pista.current
      if (!el) return
      const destino = (indice + total) % total
      el.scrollTo({ left: destino * el.clientWidth, behavior: 'smooth' })
    },
    [total],
  )

  const tocar = (indice: number) => {
    setQuieto(true)
    ir(indice)
  }

  useEffect(() => {
    if (quieto || encima || total < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t = setInterval(() => ir(actual + 1), AUTOAVANCE)
    return () => clearInterval(t)
  }, [actual, quieto, encima, total, ir])

  if (!total) return null

  return (
    <section
      aria-roledescription="carrusel"
      aria-label="Cinevisión"
      className="md:mx-auto md:max-w-sitio md:px-6 md:pt-3"
      onPointerDown={() => setQuieto(true)}
      onFocusCapture={() => setQuieto(true)}
      onMouseEnter={() => setEncima(true)}
      onMouseLeave={() => setEncima(false)}
    >
      <div className="relative bg-carrusel">
        <div
          ref={pista}
          onScroll={(e) => {
            const el = e.currentTarget
            setActual(Math.round(el.scrollLeft / el.clientWidth))
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {diapositivas.map((d, i) => {
            const imagen = (
              <picture>
                <source
                  media="(min-width: 768px)"
                  // El original (2480 px) también va: los tamaños llegan hasta 1920 y en retina no alcanzan
                  srcSet={[...d.web.tamanos, { url: d.web.url, ancho: d.web.ancho }]
                    .map((t) => `${t.url} ${t.ancho}w`)
                    .join(', ')}
                  sizes="(min-width: 1288px) 1240px, calc(100vw - 48px)"
                />
                <img
                  src={d.movil.url}
                  srcSet={d.movil.tamanos.map((t) => `${t.url} ${t.ancho}w`).join(', ') || undefined}
                  sizes="100vw"
                  alt={d.alt}
                  width={390}
                  height={240}
                  loading={i === 0 ? 'eager' : 'lazy'}
                  fetchPriority={i === 0 ? 'high' : undefined}
                  className="aspect-[390/240] w-full object-cover md:aspect-[1240/384] md:max-h-[384px]"
                />
              </picture>
            )
            return (
              <div
                key={i}
                role="group"
                aria-roledescription="imagen"
                aria-label={`${i + 1} de ${total}`}
                aria-hidden={i !== actual}
                className="w-full shrink-0 snap-start"
              >
                {d.link ? (
                  <Link href={d.link} tabIndex={i === actual ? 0 : -1} className="block">
                    {imagen}
                  </Link>
                ) : (
                  imagen
                )}
              </div>
            )
          })}
        </div>

        {total > 1 && (
          <>
            <Flecha lado="izquierda" onClick={() => tocar(actual - 1)} />
            <Flecha lado="derecha" onClick={() => tocar(actual + 1)} />
            <nav
              aria-label="Imágenes del carrusel"
              className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-2 md:bottom-6 md:gap-3"
            >
              {diapositivas.map((d, i) => (
                <Negativo key={i} activo={i === actual} etiqueta={`Imagen ${i + 1}: ${d.alt}`} onClick={() => tocar(i)} />
              ))}
            </nav>
          </>
        )}
      </div>
    </section>
  )
}

function Flecha({ lado, onClick }: { lado: 'izquierda' | 'derecha'; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === 'izquierda' ? 'Imagen anterior' : 'Imagen siguiente'}
      className={`absolute top-1/2 hidden size-[52px] -translate-y-1/2 cursor-pointer items-center justify-center rounded-full bg-tinta/55 text-2xl text-blanco hover:bg-tinta/80 md:flex ${
        lado === 'izquierda' ? 'left-8' : 'right-8'
      }`}
    >
      <span aria-hidden>{lado === 'izquierda' ? '‹' : '›'}</span>
    </button>
  )
}

/** Indicador con forma de negativo: 3 perforaciones arriba y abajo y la ventana en el medio. */
function Negativo({ activo, etiqueta, onClick }: { activo: boolean; etiqueta: string; onClick: () => void }) {
  const perforaciones = (
    <span aria-hidden className="flex justify-around px-0.5">
      {[0, 1, 2].map((k) => (
        <span key={k} className="h-0.5 w-[3px] rounded-[1px] bg-linea md:h-[3px] md:w-1" />
      ))}
    </span>
  )
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-current={activo ? 'true' : undefined}
      className={`flex h-[22px] w-[30px] cursor-pointer flex-col justify-between rounded-[1px] bg-negativo p-0.5 transition-[transform,opacity] duration-200 md:h-[30px] md:w-[42px] ${
        activo
          ? 'scale-115 opacity-100 shadow-[0_0_0_1px_#fff,0_2px_6px_rgba(0,0,0,0.35)]'
          : 'opacity-75 shadow-[0_1px_3px_rgba(0,0,0,0.3)]'
      }`}
    >
      {perforaciones}
      <span aria-hidden className={`my-0.5 flex-1 ${activo ? 'bg-[#e8e6e1]' : 'bg-[#6e6a62]'}`} />
      {perforaciones}
    </button>
  )
}
