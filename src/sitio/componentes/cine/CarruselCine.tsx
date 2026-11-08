'use client'

import Link from 'next/link'
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

import type { DiapositivaCine } from '../../datos/cinevision'

const sinCambios = () => () => {}

/** Cada cuánto avanza solo, mientras nadie lo toque. */
const AUTOAVANCE = 7000

/** Imágenes de copia que hay como mínimo de cada lado, para que el dedo nunca llegue al final. */
const MARGEN = 8

/**
 * Carrusel de Cinevisión (design/LEEME.md, secciones 7 y 8): a todo el ancho en el celular y, en web,
 * dentro de los márgenes del contenedor y más bajo que en el diseño (1240×384 como máximo), para que
 * entre entero en una notebook. Flechas en web, negativos de película como indicadores y deslizar con
 * el dedo (scroll-snap). Avanza solo hasta que alguien lo toca, y nunca si el sistema pide menos movimiento.
 *
 * Es infinito (7/11/2026): antes y después de las imágenes van copias de todas. Después de la última se
 * desliza hacia la copia de la primera y, cuando se detiene, salta sin animación a la primera de verdad,
 * que se ve igual; para atrás, lo mismo. Así nunca rebobina todas las imágenes. Las copias aparecen recién
 * con JavaScript, para que la página cargue en la primera imagen.
 *
 * Deslizar rápido con el dedo (8/11/2026): cada deslizada pasa una sola imagen (snap-always) y, si el dedo
 * se apoya antes de que termine el paso anterior, el salto a las de verdad se hace en ese momento. Antes el
 * salto esperaba a que el carrusel se quedara quieto, así que con deslizadas seguidas el dedo llegaba al
 * final de las copias y el carrusel se trababa. Las copias suman al menos MARGEN imágenes de cada lado.
 */
export function CarruselCine({ diapositivas }: { diapositivas: DiapositivaCine[] }) {
  const pista = useRef<HTMLDivElement>(null)
  const [actual, setActual] = useState(0)
  // Tocado o con foco: no avanza más. Con el mouse encima: espera a que salga.
  const [quieto, setQuieto] = useState(false)
  const [encima, setEncima] = useState(false)
  const total = diapositivas.length
  const infinito = total > 1
  // Juegos enteros de copias de cada lado; con ellos antes, la imagen i está en el lugar i + antes
  const copias = Math.max(1, Math.ceil(MARGEN / Math.max(total, 1)))
  // Falso en el servidor y al hidratar; verdadero después, ya con JavaScript
  const hidratado = useSyncExternalStore(
    sinCambios,
    () => true,
    () => false,
  )
  const montado = infinito && hidratado
  const antes = montado ? copias * total : 0
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined)
  const tocando = useRef(false)

  // Recién montado, antes de pintar: se ubica en la primera de verdad, después de las copias
  useLayoutEffect(() => {
    const el = pista.current
    if (montado && el) el.scrollTo({ left: antes * el.clientWidth, behavior: 'instant' })
  }, [montado, antes])

  // Parado sobre una copia, salta sin animación a la imagen que copia
  const enderezar = useCallback(() => {
    const el = pista.current
    if (!el || !montado || tocando.current) return null
    const lugar = Math.round(el.scrollLeft / el.clientWidth)
    const real = (lugar % total) + antes
    if (real !== lugar) el.scrollTo({ left: real * el.clientWidth, behavior: 'instant' })
    return real
  }, [montado, total, antes])

  const deslizarA = (lugar: number) => {
    const el = pista.current
    el?.scrollTo({ left: lugar * el.clientWidth, behavior: 'smooth' })
  }

  // Un paso para un lado o para el otro, sin rebobinar nunca
  const pasar = useCallback(
    (paso: 1 | -1) => {
      const el = pista.current
      if (!el) return
      const lugar = enderezar() ?? Math.round(el.scrollLeft / el.clientWidth)
      const ultimo = (montado ? 2 * copias + 1 : 1) * total - 1
      el.scrollTo({
        left: Math.min(Math.max(lugar + paso, 0), ultimo) * el.clientWidth,
        behavior: 'smooth',
      })
    },
    [enderezar, montado, copias, total],
  )

  const tocar = (paso: 1 | -1) => {
    setQuieto(true)
    pasar(paso)
  }

  const elegir = (indice: number) => {
    setQuieto(true)
    enderezar()
    deslizarA(indice + antes)
  }

  useEffect(() => {
    if (quieto || encima || total < 2 || matchMedia('(prefers-reduced-motion: reduce)').matches)
      return
    const t = setInterval(() => pasar(1), AUTOAVANCE)
    return () => clearInterval(t)
  }, [actual, quieto, encima, total, pasar])

  useEffect(() => () => clearTimeout(espera.current), [])

  // Donde el navegador avisa que el desplazamiento terminó (scrollend), salta en ese momento, sin esperar
  useEffect(() => {
    const el = pista.current
    if (!el || !montado) return
    const alTerminar = () => {
      clearTimeout(espera.current)
      enderezar()
    }
    el.addEventListener('scrollend', alTerminar)
    return () => el.removeEventListener('scrollend', alTerminar)
  }, [montado, enderezar])

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
            const lugar = Math.round(el.scrollLeft / el.clientWidth)
            setActual(montado ? lugar % total : lugar)
            // Cuando deja de moverse, si quedó en una copia, pasa a la de verdad
            clearTimeout(espera.current)
            espera.current = setTimeout(enderezar, 120)
          }}
          onTouchStart={(e) => {
            tocando.current = true
            // Si se vuelve a apoyar el dedo antes de que termine el paso anterior, el salto a las de verdad se
            // hace ahí mismo, corriendo la pista justo una vuelta entera: se ve igual y el dedo no se acerca nunca
            // al final, por más rápido que se deslice
            const el = e.currentTarget
            if (!montado) return
            const vuelta = total * el.clientWidth
            const lugar = Math.round(el.scrollLeft / el.clientWidth)
            const vueltas = Math.floor((lugar - antes) / total)
            if (!vueltas) return
            // Sin el imán un instante, para que quede en el mismo punto y no salte a la imagen más cercana
            el.style.scrollSnapType = 'none'
            el.scrollTo({ left: el.scrollLeft - vueltas * vuelta, behavior: 'instant' })
            requestAnimationFrame(() => el.style.removeProperty('scroll-snap-type'))
          }}
          onTouchEnd={() => {
            tocando.current = false
            clearTimeout(espera.current)
            espera.current = setTimeout(enderezar, 120)
          }}
          onTouchCancel={() => {
            tocando.current = false
          }}
          className="flex snap-x snap-mandatory overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {Array.from({ length: montado ? 2 * copias + 1 : 1 }, () => diapositivas.map((_, i) => i))
            .flat()
            .map((i, lugar) => {
              const d = diapositivas[i]
              // Las copias de antes y de después son solo para la vista
              const copia = montado && (lugar < antes || lugar >= antes + total)
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
                    srcSet={
                      d.movil.tamanos.map((t) => `${t.url} ${t.ancho}w`).join(', ') || undefined
                    }
                    sizes="100vw"
                    alt={d.alt}
                    width={390}
                    height={240}
                    loading={i === 0 && !copia ? 'eager' : 'lazy'}
                    fetchPriority={i === 0 && !copia ? 'high' : undefined}
                    className="aspect-[390/240] w-full object-cover md:aspect-[1240/384] md:max-h-[384px]"
                  />
                </picture>
              )
              return (
                <div
                  key={copia ? `copia-${lugar}` : i}
                  role={copia ? undefined : 'group'}
                  aria-roledescription={copia ? undefined : 'imagen'}
                  aria-label={copia ? undefined : `${i + 1} de ${total}`}
                  aria-hidden={copia || i !== actual}
                  className="w-full shrink-0 snap-start snap-always"
                >
                  {d.link ? (
                    <Link
                      href={d.link}
                      tabIndex={!copia && i === actual ? 0 : -1}
                      className="block"
                    >
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
            <Flecha lado="izquierda" onClick={() => tocar(-1)} />
            <Flecha lado="derecha" onClick={() => tocar(1)} />
            <nav
              aria-label="Imágenes del carrusel"
              className="absolute inset-x-0 bottom-3 flex items-center justify-center gap-1.5 md:bottom-6 md:gap-[7px]"
            >
              {diapositivas.map((d, i) => (
                <Negativo
                  key={i}
                  activo={i === actual}
                  etiqueta={`Imagen ${i + 1}: ${d.alt}`}
                  onClick={() => elegir(i)}
                />
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

/**
 * Indicador con forma de negativo: 3 perforaciones arriba y abajo y la ventana en el medio. Mide 18×13 en
 * el celular y 25×18 en web, con todas las medidas en píxeles enteros para que el dibujo no se borronee.
 * El que se está viendo va sin borde, con la ventana blanca, más grande (22×17 y 31×22) y con más sombra,
 * como si saliera hacia adelante. Se dibuja a ese tamaño en vez de escalarlo, porque escalado queda
 * borroso; los márgenes negativos hacen que no empuje a los otros.
 * Se puede tocar más allá del dibujo: cada uno tiene 24 px de ancho y de alto como mínimo.
 */
function Negativo({
  activo,
  etiqueta,
  onClick,
}: {
  activo: boolean
  etiqueta: string
  onClick: () => void
}) {
  const perforaciones = (
    <span
      aria-hidden
      className={`flex justify-between ${activo ? 'px-[3px] md:px-[5px]' : 'px-[2px] md:px-[3px]'}`}
    >
      {[0, 1, 2].map((k) => (
        <span key={k} className="h-px w-[2px] bg-linea md:h-[2px] md:w-[3px]" />
      ))}
    </span>
  )
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={etiqueta}
      aria-current={activo ? 'true' : undefined}
      className={`relative flex cursor-pointer flex-col justify-between rounded-[1px] bg-negativo p-px transition-opacity duration-200 before:absolute before:-inset-x-[3px] before:-inset-y-[6px] md:before:-inset-y-[3px] ${
        activo
          ? '-m-0.5 h-[17px] w-[22px] opacity-100 shadow-[0_4px_10px_rgba(0,0,0,0.5)] md:-mx-[3px] md:h-[22px] md:w-[31px]'
          : 'h-[13px] w-[18px] opacity-75 shadow-[0_1px_3px_rgba(0,0,0,0.3)] md:h-[18px] md:w-[25px]'
      }`}
    >
      {perforaciones}
      <span aria-hidden className={`my-px flex-1 ${activo ? 'bg-[#e8e6e1]' : 'bg-[#6e6a62]'}`} />
      {perforaciones}
    </button>
  )
}
