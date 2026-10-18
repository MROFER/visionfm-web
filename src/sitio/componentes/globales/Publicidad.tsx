'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import type { AjustesSitio } from '../../datos'
import type { Imagen } from '../../datos/formas'
import { type AnuncioRotable, elegirAnuncio, type Ubicacion } from '../../publicidad/rotacion'
import { Foto } from '../ui/Foto'

type Pieza = {
  web: Imagen | null
  movil: Imagen | null
  rectangulo: Imagen | null
  href: string
  /** Un anuncio pago sale por /a/{id}, que cuenta el clic, y abre en otra pestaña. */
  pago: boolean
}

/**
 * Espacio de publicidad (970×90 en web, 320×100 en celular), uno por página. En Cinevisión va debajo de
 * la cartelera, en 300×250 en el celular, y en web hay otro entre el carrusel y la cartelera. En la
 * página de cada película no hay.
 *
 * Al cargar pide los anuncios que rotan hoy en su ubicación (`/api/anuncios`) y elige uno según el peso
 * (docs/07-permisos-y-publicidad.md, sección 3). Cuenta una impresión cuando el aviso se ve al menos a
 * la mitad. Sin anuncios vigentes muestra el aviso propio de la radio de los Ajustes, y sin aviso propio
 * invita a anunciar: el espacio nunca queda vacío.
 */
export function Publicidad({
  ubicacion,
  seccion,
  aviso,
  oscuro = false,
  anchoWeb = 970,
  rectangulo = false,
}: {
  ubicacion: Ubicacion
  /** En Noticias · Sección y Nota: la sección, para los anuncios que se limitan a algunas. */
  seccion?: string
  aviso: AjustesSitio['avisoPropio']
  oscuro?: boolean
  /** 970×90 en las portadas; 728×90 dentro de una nota. */
  anchoWeb?: 970 | 728
  /** En el celular, 300×250 en vez de la tira de 320×100: para los avisos en el medio de la página. */
  rectangulo?: boolean
}) {
  // undefined mientras carga; null si no hay anuncios para esta ubicación
  const [anuncio, setAnuncio] = useState<AnuncioRotable | null | undefined>(undefined)
  const caja = useRef<HTMLElement>(null)

  useEffect(() => {
    const control = new AbortController()
    const params = new URLSearchParams({ ubicacion })
    if (seccion) params.set('seccion', seccion)
    fetch(`/api/anuncios?${params}`, { signal: control.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ anuncios: AnuncioRotable[] }>) : { anuncios: [] }))
      .then(({ anuncios }) => setAnuncio(elegirAnuncio(anuncios)))
      .catch(() => {
        if (!control.signal.aborted) setAnuncio(null)
      })
    return () => control.abort()
  }, [ubicacion, seccion])

  // Una impresión por visita, cuando se ve al menos la mitad del aviso (el que está oculto por el
  // tamaño de pantalla nunca se cruza con la vista)
  useEffect(() => {
    const elemento = caja.current
    if (!anuncio || !elemento || typeof IntersectionObserver === 'undefined') return
    const observador = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return
        observador.disconnect()
        avisarImpresion(ubicacion, anuncio.id)
      },
      { threshold: 0.5 },
    )
    for (const hijo of elemento.querySelectorAll('[data-aviso]')) observador.observe(hijo)
    return () => observador.disconnect()
  }, [anuncio, ubicacion])

  const pieza: Pieza | null =
    anuncio === undefined
      ? null
      : anuncio
        ? {
            web: anuncio.web,
            movil: anuncio.movil,
            rectangulo: anuncio.rectangulo,
            href: `/a/${anuncio.id}?u=${ubicacion}`,
            pago: true,
          }
        : { web: aviso.web, movil: aviso.movil, rectangulo: aviso.rectangulo, href: aviso.link, pago: false }

  const ancho = anchoWeb === 728 ? 'w-[728px]' : 'w-[970px]'
  const colores = oscuro
    ? 'border-oscuro-borde bg-oscuro-caja text-oscuro-2'
    : 'border-aviso-borde bg-aviso text-meta'
  const tamanoMovil = rectangulo ? 'h-[250px] w-[300px] max-w-full' : 'h-[100px] w-[320px] max-w-full'
  const tamanoWeb = `h-[90px] max-w-full ${ancho}`
  const fotoMovil = pieza && (rectangulo ? (pieza.rectangulo ?? pieza.movil) : pieza.movil)

  return (
    <aside ref={caja} aria-label="Publicidad" className="flex flex-col items-center gap-2">
      <span
        className={`text-[10px] font-extrabold tracking-[0.14em] uppercase ${oscuro ? 'text-oscuro-2' : 'text-meta'}`}
      >
        Publicidad
      </span>
      <div className="md:hidden" data-aviso>
        {!pieza ? (
          <Reservado clase={`${colores} ${tamanoMovil}`} />
        ) : fotoMovil ? (
          <Enlace pieza={pieza}>
            <Foto
              imagen={fotoMovil}
              sizes={rectangulo && pieza.rectangulo ? '300px' : '320px'}
              className={tamanoMovil}
            />
          </Enlace>
        ) : (
          <Vacio href={pieza.href} clase={`${colores} ${tamanoMovil}`} />
        )}
      </div>
      <div className="hidden w-full justify-center md:flex" data-aviso>
        {!pieza ? (
          <Reservado clase={`${colores} ${tamanoWeb}`} />
        ) : pieza.web ? (
          <Enlace pieza={pieza} clase={`block max-w-full ${ancho}`}>
            <Foto imagen={pieza.web} sizes={`${anchoWeb}px`} className="h-auto w-full" />
          </Enlace>
        ) : (
          <Vacio href={pieza.href} clase={`${colores} ${tamanoWeb}`} />
        )}
      </div>
    </aside>
  )
}

function Enlace({ pieza, clase = 'block', children }: { pieza: Pieza; clase?: string; children: React.ReactNode }) {
  if (!pieza.pago) {
    return (
      <Link href={pieza.href} className={clase}>
        {children}
      </Link>
    )
  }
  return (
    // /a/{id} es una ruta de servidor que cuenta el clic y redirige: va con <a>, no con <Link>
    <a href={pieza.href} target="_blank" rel="sponsored noopener" className={clase}>
      {children}
    </a>
  )
}

/** Mientras llegan los anuncios: la caja del tamaño final, para que la página no salte. */
function Reservado({ clase }: { clase: string }) {
  return <div aria-hidden className={`border ${clase}`} />
}

function Vacio({ href, clase }: { href: string; clase: string }) {
  return (
    <Link
      href={href}
      className={`flex items-center justify-center border border-dashed text-[13px] font-bold no-underline ${clase}`}
    >
      Anunciá en Visión
    </Link>
  )
}

function avisarImpresion(ubicacion: Ubicacion, id: number) {
  const cuerpo = JSON.stringify({ ubicacion, ids: [id] })
  // sendBeacon sigue aunque la persona cambie de página enseguida
  if (navigator.sendBeacon?.('/api/anuncios/impresiones', new Blob([cuerpo], { type: 'application/json' }))) return
  fetch('/api/anuncios/impresiones', {
    method: 'POST',
    body: cuerpo,
    headers: { 'Content-Type': 'application/json' },
    keepalive: true,
  }).catch(() => null)
}
