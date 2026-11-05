import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { BotonEntrevista } from '@/sitio/componentes/radio/BotonEntrevista'
import { EntrevistaDestacada } from '@/sitio/componentes/radio/ListaEntrevistas'
import { Transcripcion } from '@/sitio/componentes/radio/Transcripcion'
import { DatosEstructurados } from '@/sitio/componentes/ui/DatosEstructurados'
import { Migas } from '@/sitio/componentes/ui/Migas'
import { listarEntrevistas, obtenerAjustes, obtenerEntrevista } from '@/sitio/datos'
import { imagenParaCompartir, OPEN_GRAPH, urlDelSitio } from '@/sitio/lib/compartir'
import { fechaCorta } from '@/sitio/lib/fecha'
import { reloj } from '@/sitio/lib/formato'
import { parrafosDeTranscripcion } from '@/sitio/lib/texto'
import { entrevista as nodoEntrevista } from '@/sitio/seo/estructurados'

type Parametros = { params: Promise<{ slug: string }> }

// Con más letras que esto la transcripción arranca plegada (unos cuatro párrafos a la vista)
const LARGA = 1500

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { slug } = await params
  const e = await obtenerEntrevista(slug)
  if (!e) return {}
  const titulo = `${e.entrevistado}: ${e.tema}`
  const ruta = `/radio/entrevistas/${slug}`
  return {
    title: titulo,
    description: e.resumen || `Entrevista en Visión 96.5 FM, para escuchar de nuevo.`,
    alternates: { canonical: ruta },
    openGraph: {
      ...OPEN_GRAPH,
      type: 'article',
      url: ruta,
      title: titulo,
      description: e.resumen || undefined,
      images: imagenParaCompartir(e.foto),
    },
  }
}

// La entrevista: el bloque oscuro con el reproductor, la transcripción (lo que leen buscadores y
// asistentes de IA, que no escuchan audio), más entrevistas del mismo programa y una publicidad arriba
// y otra al final.
export default async function Entrevista({ params }: Parametros) {
  const { slug } = await params
  const [e, ajustes] = await Promise.all([obtenerEntrevista(slug), obtenerAjustes()])
  if (!e) notFound()
  // Más del mismo programa; si es la única, las últimas de todos
  const delPrograma = e.programa
    ? (await listarEntrevistas({ pagina: 1, cantidad: 4, programa: e.programa.slug, excluir: e.id }))
        .entrevistas
    : []
  const otras = delPrograma.length
    ? delPrograma
    : (await listarEntrevistas({ pagina: 1, cantidad: 4, excluir: e.id })).entrevistas
  const deDonde =
    delPrograma.length && e.programa
      ? { nombre: `Más de ${e.programa.nombre}`, href: `/radio/entrevistas?programa=${e.programa.slug}` }
      : { nombre: 'Más entrevistas', href: '/radio/entrevistas' }
  const transcripcion = parrafosDeTranscripcion(e.transcripcion)

  return (
    <main className="pb-10 md:pb-20">
      <Migas pasos={[{ nombre: 'Entrevistas', ruta: '/radio/entrevistas' }, { nombre: e.entrevistado }]} />
      <DatosEstructurados nodos={[nodoEntrevista(urlDelSitio().origin, e)]} />
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad ubicacion="radio-entrevista" aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor pt-4 md:pt-9">
        <nav aria-label="Ruta" className="mb-4 flex flex-wrap gap-2 text-[13px] text-meta md:mb-6">
          <Link href="/radio/entrevistas" className="text-meta">
            ← Todas las entrevistas
          </Link>
        </nav>
        <EntrevistaDestacada entrevista={e} enPagina />

        <div className={`flex flex-col gap-10 ${transcripcion.length ? 'lg:grid lg:grid-cols-[minmax(0,1fr)_340px] lg:gap-16' : ''}`}>
          {transcripcion.length > 0 && (
            <section aria-labelledby="transcripcion">
              <h2
                id="transcripcion"
                className="etiqueta m-0 border-b-[3px] border-tinta pb-2.5 text-xs md:text-[13px]"
              >
                Transcripción
              </h2>
              <Transcripcion larga={transcripcion.reduce((n, p) => n + p.dice.length, 0) > LARGA}>
                {transcripcion.map((p, i) => (
                  <p key={i}>
                    {p.quien && <strong className="font-bold">{p.quien}: </strong>}
                    {p.dice}
                  </p>
                ))}
              </Transcripcion>
            </section>
          )}

          {otras.length > 0 && (
            <aside aria-labelledby="mas-entrevistas">
              <h2
                id="mas-entrevistas"
                className="etiqueta m-0 border-b-[3px] border-tinta pb-2.5 text-xs md:text-[13px]"
              >
                {deDonde.nombre}
              </h2>
              <ul className="m-0 list-none p-0">
                {otras.map((o) => (
                  <li key={o.id} className="flex items-center gap-3 border-b border-linea py-3.5">
                    <BotonEntrevista
                      entrevista={o}
                      className="flex size-10 shrink-0 items-center justify-center rounded-full border-2 border-tinta bg-blanco hover:bg-tinta hover:text-blanco"
                    />
                    <span className="flex min-w-0 flex-col gap-1">
                      <Link
                        href={`/radio/entrevistas/${o.slug}`}
                        className="font-titulos text-[17px] leading-[1.2] font-bold no-underline hover:text-acento-hover"
                      >
                        {o.entrevistado}: {o.tema}
                      </Link>
                      <span className="text-xs text-meta">
                        {[fechaCorta(o.fecha), o.duracion ? reloj(o.duracion) : null].filter(Boolean).join(' · ')}
                      </span>
                    </span>
                  </li>
                ))}
              </ul>
              <Link href={deDonde.href} className="etiqueta mt-4 inline-block text-[11px] no-underline">
                Ver todas <span aria-hidden>→</span>
              </Link>
            </aside>
          )}
        </div>
      </div>
      <div className="contenedor pt-8 md:pt-14">
        <Publicidad ubicacion="radio-entrevista-abajo" aviso={ajustes.avisoPropio} />
      </div>
    </main>
  )
}
