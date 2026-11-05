'use client'

import Link from 'next/link'
import { useEffect, useRef, useState } from 'react'

import type { AjustesSitio } from '../../datos'
import type { Imagen } from '../../datos/formas'
import {
  type AnuncioRotable,
  elegirAnuncio,
  elegirFinalDeNota,
  type Ubicacion,
} from '../../publicidad/rotacion'
import { Foto } from '../ui/Foto'

type Pieza = {
  /** El anuncio pago, para contar su impresión; el aviso propio no tiene. */
  id: number | null
  web: Imagen | null
  movil: Imagen | null
  rectangulo: Imagen | null
  ancha: Imagen | null
  formato: AnuncioRotable['formato']
  href: string
  /** Un anuncio pago sale por /a/{id}, que cuenta el clic, y abre en otra pestaña. */
  pago: boolean
}

/** Lo que salió en esta visita: uno, y al final de la nota los cuadrados que van juntos en web. */
type Eleccion = { principal: AnuncioRotable | null; cuadrados: AnuncioRotable[] }

const deAnuncio = (a: AnuncioRotable, ubicacion: Ubicacion): Pieza => ({
  id: a.id,
  web: a.web,
  movil: a.movil,
  rectangulo: a.rectangulo,
  ancha: a.ancha,
  formato: a.formato,
  href: `/a/${a.id}?u=${ubicacion}`,
  pago: true,
})

const propia = (aviso: AjustesSitio['avisoPropio']): Pieza => ({
  id: null,
  web: aviso.web,
  movil: aviso.movil,
  rectangulo: aviso.rectangulo,
  ancha: null,
  formato: 'tira',
  href: aviso.link,
  pago: false,
})

/**
 * Espacio de publicidad (970×90 en web, 320×100 en celular). Casi todas las páginas tienen uno arriba y
 * otro al final; el Inicio, uno entre cada bloque. En Cinevisión va debajo de la cartelera, en 300×250 en
 * el celular, y en web hay otro entre el carrusel y la cartelera. En la página de cada película no hay.
 *
 * Al cargar pide los anuncios que rotan hoy en su ubicación (`/api/anuncios`) y elige uno según el peso
 * (docs/07-permisos-y-publicidad.md, sección 3). Cuenta una impresión por anuncio cuando se ve al menos
 * a la mitad. Sin anuncios vigentes muestra el aviso propio de la radio de los Ajustes, y sin aviso propio
 * invita a anunciar: el espacio nunca queda vacío.
 *
 * Con `cuadrados` (al final de la nota) el anuncio sale en el formato que se eligió al subirlo: tira,
 * cuadrado o ancho. Si es cuadrado, en web van al lado otros anuncios cuadrados hasta esos lugares, y los
 * que faltan los llena el aviso propio. El tercero entra recién en pantallas de 1024 px.
 */
export function Publicidad({
  ubicacion,
  seccion,
  aviso,
  oscuro = false,
  anchoWeb = 970,
  rectangulo = false,
  cuadrados,
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
  /** Al final de la nota: en web, cuántos anuncios cuadrados van juntos (de Ajustes). */
  cuadrados?: number
}) {
  // undefined mientras carga; sin principal si no hay anuncios para esta ubicación
  const [eleccion, setEleccion] = useState<Eleccion | undefined>(undefined)
  const caja = useRef<HTMLElement>(null)

  useEffect(() => {
    const control = new AbortController()
    const params = new URLSearchParams({ ubicacion })
    if (seccion) params.set('seccion', seccion)
    fetch(`/api/anuncios?${params}`, { signal: control.signal })
      .then((r) => (r.ok ? (r.json() as Promise<{ anuncios: AnuncioRotable[] }>) : { anuncios: [] }))
      .then(({ anuncios }) =>
        setEleccion(
          cuadrados
            ? elegirFinalDeNota(anuncios, cuadrados)
            : { principal: elegirAnuncio(anuncios), cuadrados: [] },
        ),
      )
      .catch(() => {
        if (!control.signal.aborted) setEleccion({ principal: null, cuadrados: [] })
      })
    return () => control.abort()
  }, [ubicacion, seccion, cuadrados])

  // Una impresión por anuncio y por visita, cuando se ve al menos la mitad (el que está oculto por el
  // tamaño de pantalla nunca se cruza con la vista)
  useEffect(() => {
    const elemento = caja.current
    if (!eleccion?.principal || !elemento || typeof IntersectionObserver === 'undefined') return
    const contados = new Set<number>()
    const observador = new IntersectionObserver(
      (entradas) => {
        for (const e of entradas) {
          const id = Number((e.target as HTMLElement).dataset.anuncio)
          if (!e.isIntersecting || contados.has(id)) continue
          contados.add(id)
          avisarImpresion(ubicacion, id)
        }
      },
      { threshold: 0.5 },
    )
    for (const hijo of elemento.querySelectorAll('[data-anuncio]')) observador.observe(hijo)
    return () => observador.disconnect()
  }, [eleccion, ubicacion])

  const pieza: Pieza | null =
    eleccion === undefined
      ? null
      : eleccion.principal
        ? deAnuncio(eleccion.principal, ubicacion)
        : propia(aviso)

  const ancho = anchoWeb === 728 ? 'w-[728px]' : 'w-[970px]'
  const colores = oscuro
    ? 'border-oscuro-borde bg-oscuro-caja text-oscuro-2'
    : 'border-aviso-borde bg-aviso text-meta'
  // Al final de la nota, el anuncio cuadrado también sale cuadrado en el celular
  const cuadradoMovil = rectangulo || Boolean(cuadrados && pieza?.pago && pieza.formato === 'cuadrado')
  const tamanoMovil = cuadradoMovil ? 'h-[250px] w-[300px] max-w-full' : 'h-[100px] w-[320px] max-w-full'
  const tamanoWeb = `h-[90px] max-w-full ${ancho}`
  const fotoMovil = pieza && (cuadradoMovil ? (pieza.rectangulo ?? pieza.movil) : pieza.movil)
  const anchaWeb = Boolean(cuadrados && pieza?.pago && pieza.formato === 'ancho' && pieza.ancha)
  const juntos = cuadrados && eleccion ? eleccion.cuadrados : []

  return (
    <aside ref={caja} aria-label="Publicidad" className="flex flex-col items-center gap-2">
      <span
        className={`text-[10px] font-extrabold tracking-[0.14em] uppercase ${oscuro ? 'text-oscuro-2' : 'text-meta'}`}
      >
        Publicidad
      </span>
      <div className="md:hidden" data-aviso data-anuncio={pieza?.id ?? undefined}>
        {!pieza ? (
          <Reservado clase={`${colores} ${tamanoMovil}`} />
        ) : fotoMovil ? (
          <Enlace pieza={pieza}>
            <Foto
              imagen={fotoMovil}
              sizes={cuadradoMovil && pieza.rectangulo ? '300px' : '320px'}
              className={tamanoMovil}
            />
          </Enlace>
        ) : (
          <Vacio href={pieza.href} clase={`${colores} ${tamanoMovil}`} />
        )}
      </div>
      {juntos.length > 0 ? (
        <div className="hidden w-full justify-center gap-6 md:flex">
          {Array.from({ length: cuadrados ?? 0 }, (_, i) => {
            const p = juntos[i] ? deAnuncio(juntos[i], ubicacion) : propia(aviso)
            return (
              // De a dos en tablet: el tercero entra desde los 1024 px
              <div
                key={i}
                data-aviso
                data-anuncio={p.id ?? undefined}
                className={i >= 2 ? 'hidden lg:block' : ''}
              >
                {p.rectangulo ? (
                  <Enlace pieza={p}>
                    <Foto imagen={p.rectangulo} sizes="300px" className="h-[250px] w-[300px]" />
                  </Enlace>
                ) : (
                  <Vacio href={p.href} clase={`${colores} h-[250px] w-[300px]`} />
                )}
              </div>
            )
          })}
        </div>
      ) : (
        <div className="hidden w-full justify-center md:flex" data-aviso data-anuncio={pieza?.id ?? undefined}>
          {!pieza ? (
            <Reservado clase={`${colores} ${tamanoWeb}`} />
          ) : anchaWeb ? (
            <Enlace pieza={pieza} clase="block w-[970px] max-w-full">
              <Foto imagen={pieza.ancha} sizes="970px" className="h-auto w-full" />
            </Enlace>
          ) : pieza.web ? (
            <Enlace pieza={pieza} clase={`block max-w-full ${ancho}`}>
              <Foto imagen={pieza.web} sizes={`${anchoWeb}px`} className="h-auto w-full" />
            </Enlace>
          ) : (
            <Vacio href={pieza.href} clase={`${colores} ${tamanoWeb}`} />
          )}
        </div>
      )}
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
