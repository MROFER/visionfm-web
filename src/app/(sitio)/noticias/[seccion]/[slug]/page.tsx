import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { Compartir } from '@/sitio/componentes/noticias/Compartir'
import { convertidoresNota, pieDeFoto } from '@/sitio/componentes/noticias/convertidores'
import { EntrevistaEnNota } from '@/sitio/componentes/noticias/EntrevistaEnNota'
import { DatosEstructurados } from '@/sitio/componentes/ui/DatosEstructurados'
import { Foto } from '@/sitio/componentes/ui/Foto'
import { IconoReloj } from '@/sitio/componentes/ui/iconos'
import { NotaTarjeta } from '@/sitio/componentes/ui/TarjetaNota'
import { notasRelacionadas, obtenerAjustes, obtenerEntrevista, obtenerNota } from '@/sitio/datos'
import { imagenParaCompartir, OPEN_GRAPH, urlDelSitio } from '@/sitio/lib/compartir'
import { fechaCompleta, horaDelDia } from '@/sitio/lib/fecha'
import { minutosDeLectura, palabrasDeLexical, partirEnLaMitad } from '@/sitio/lib/texto'
import { articulo, migas } from '@/sitio/seo/estructurados'

type Parametros = { params: Promise<{ seccion: string; slug: string }> }

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const { seccion, slug } = await params
  const nota = await obtenerNota(seccion, slug)
  if (!nota) return {}
  return {
    title: nota.seo.titulo,
    description: nota.seo.descripcion,
    alternates: { canonical: `/noticias/${seccion}/${slug}` },
    openGraph: {
      ...OPEN_GRAPH,
      type: 'article',
      url: `/noticias/${seccion}/${slug}`,
      title: nota.seo.titulo,
      description: nota.seo.descripcion,
      publishedTime: nota.fecha ?? undefined,
      modifiedTime: nota.actualizada ?? undefined,
      images: imagenParaCompartir(nota.seo.imagen),
    },
  }
}

// La nota (design/LEEME.md, sección 7): encabezado a 780 px, foto a 1040 (16:10 en el celular), cuerpo
// a 680, una publicidad arriba, otra en el medio si la nota es larga y otra al final, y "Seguí leyendo"
// con las tarjetas del archivo. Desde 1280 px el bloque y los cuadrados del costado van juntos y
// centrados, con la foto al ancho del encabezado en 16:10, el título en 48 px y la publicidad de arriba
// y la del final al ancho de los dos
export default async function Nota({ params }: Parametros) {
  const { seccion, slug } = await params
  const [nota, ajustes] = await Promise.all([obtenerNota(seccion, slug), obtenerAjustes()])
  if (!nota) notFound()
  const [relacionadas, entrevista] = await Promise.all([
    notasRelacionadas(nota.id, seccion, 3),
    nota.entrevista ? obtenerEntrevista(nota.entrevista) : null,
  ])
  const minutos = minutosDeLectura(palabrasDeLexical(nota.cuerpo))
  // La del medio va solo en notas de 6 párrafos o más (docs/07-permisos-y-publicidad.md, sección 3)
  const mitades = partirEnLaMitad(nota.cuerpo)
  const pie = pieDeFoto(nota.epigrafe, nota.credito)
  const origen = urlDelSitio().origin
  const datos = [
    articulo(origen, nota),
    migas(origen, [
      { nombre: 'Noticias', ruta: '/noticias' },
      ...(nota.seccion ? [{ nombre: nota.seccion.nombre, ruta: `/noticias/${nota.seccion.slug}` }] : []),
      { nombre: nota.titulo },
    ]),
  ]

  return (
    <main className="pb-10 md:pb-20">
      <DatosEstructurados nodos={datos} />
      <div className="contenedor pt-4 md:pt-8">
        <nav aria-label="Ruta" className="mb-7 hidden flex-wrap gap-2 text-[13px] text-meta md:flex">
          <Link href="/" className="text-meta">
            Inicio
          </Link>
          <span aria-hidden>/</span>
          <Link href="/noticias" className="text-meta">
            Noticias
          </Link>
          <span aria-hidden>/</span>
          {nota.seccion && (
            <Link href={`/noticias/${nota.seccion.slug}`} aria-current="page" className="text-meta no-underline">
              {nota.seccion.nombre}
            </Link>
          )}
        </nav>
      </div>

      {/* Desde 1280 px el bloque (780) y el costado (300) van juntos, centrados: 1140 px con la separación */}
      <div className="contenedor xl:max-w-[1188px]">
        <Publicidad
          ubicacion="noticias-nota"
          seccion={seccion}
          aviso={ajustes.avisoPropio}
          anchoWeb={728}
          anchoXl={1140}
        />
      </div>

      <div className="xl:mx-auto xl:flex xl:max-w-[1188px] xl:justify-between xl:px-6">
        <div className="xl:w-[780px] xl:shrink-0">
          <article>
            <header className="contenedor flex max-w-[828px] flex-col xl:max-w-none xl:px-0 gap-3.5 pt-5 md:gap-5 md:pt-8">
              {nota.seccion && (
                <Link
                  href={`/noticias/${nota.seccion.slug}`}
                  className="text-[11px] font-extrabold tracking-[0.1em] text-acento uppercase no-underline md:text-xs"
                >
                  {nota.seccion.nombre}
                </Link>
              )}
              <h1 className="m-0 font-titulos text-4xl leading-[1.06] font-bold tracking-[-0.01em] md:text-6xl md:leading-[1.04] md:tracking-[-0.02em] xl:text-5xl xl:leading-[1.08]">
                {nota.titulo}
              </h1>
              <p className="m-0 text-[19px] leading-[1.45] text-texto-2 md:text-2xl">{nota.bajada}</p>
              <div className="flex flex-wrap items-center justify-between gap-4 border-y border-linea py-3 md:py-4">
                <span className="text-[13px] md:text-sm">
                  <strong>{nota.firma}</strong>{' '}
                  <span className="text-meta">
                    {/* El punto queda al final de cada dato, así al cortar la línea ninguna empieza con "·" */}
                    {nota.fecha ? (
                      <>
                        <time dateTime={nota.fecha}>· {fechaCompleta(nota.fecha)} ·</time>{' '}
                        <span className="whitespace-nowrap">
                          <IconoReloj tamano={13} className="mr-1 inline align-[-2px]" />
                          {`${horaDelDia(nota.fecha)} ·`}
                        </span>{' '}
                      </>
                    ) : (
                      '· '
                    )}
                    <span className="whitespace-nowrap">{minutos} min de lectura</span>
                  </span>
                </span>
                <div className="hidden md:block">
                  <Compartir titulo={nota.titulo} variante="web" />
                </div>
              </div>
            </header>

            <figure className="mx-auto mt-4 mb-0 flex max-w-[1088px] flex-col gap-2 md:my-8 md:gap-2.5 md:px-6 xl:max-w-none xl:px-0">
              <Foto
                imagen={nota.foto}
                sizes="(min-width: 1280px) 780px, (min-width: 1088px) 1040px, 100vw"
                prioridad
                className="aspect-[16/10] h-auto w-full md:max-h-[520px] md:aspect-[2/1] xl:max-h-none xl:aspect-[16/10]"
              />
              {pie && <figcaption className="px-4 text-xs text-meta md:px-0 md:text-[13px]">{pie}</figcaption>}
            </figure>

            <div className="cuerpo-nota contenedor max-w-[728px] pt-5 md:pt-0">
              {entrevista && <EntrevistaEnNota entrevista={entrevista} />}
              {mitades ? (
                <>
                  <RichText data={mitades[0]} converters={convertidoresNota} />
                  {/* `block`: el cuerpo deja sin caja a los div del editor, y este necesita la suya */}
                  <div className="block py-2 md:py-3">
                    <Publicidad
                      ubicacion="noticias-nota-medio"
                      seccion={seccion}
                      aviso={ajustes.avisoPropio}
                      anchoWeb={728}
                      segunAnuncio
                    />
                  </div>
                  <RichText data={mitades[1]} converters={convertidoresNota} />
                </>
              ) : (
                <RichText data={nota.cuerpo} converters={convertidoresNota} />
              )}
            </div>

            <div className="contenedor pt-6 md:hidden">
              <Compartir titulo={nota.titulo} variante="movil" />
            </div>
          </article>
        </div>

        <div className="hidden w-[300px] shrink-0 pt-8 xl:block">
          <div className="sticky top-24">
            <Publicidad ubicacion="noticias-nota-costado" seccion={seccion} aviso={ajustes.avisoPropio} costado={2} />
          </div>
        </div>
      </div>

      {/* Debajo de las dos columnas y a su ancho: el formato ancho y los tres cuadrados no entran en el bloque */}
      <div className="contenedor pt-8 md:pt-14 xl:max-w-[1188px]">
        <Publicidad
          ubicacion="noticias-nota-abajo"
          seccion={seccion}
          aviso={ajustes.avisoPropio}
          anchoWeb={728}
          anchoXl={1140}
          cuadrados={ajustes.cuadradosFinalNota}
        />
      </div>

      {relacionadas.length > 0 && (
        <section aria-labelledby="segui-leyendo" className="contenedor mt-8 md:mt-[72px]">
          <h2
            id="segui-leyendo"
            className="etiqueta m-0 border-b-[3px] border-tinta pb-2 text-xs md:pb-2.5 md:text-[13px] lg:mb-6"
          >
            Seguí leyendo
          </h2>
          {/* Las mismas tarjetas del archivo de Noticias */}
          <div className="md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-10 md:pt-4 lg:grid-cols-3 lg:gap-x-8">
            {relacionadas.map((n) => (
              <NotaTarjeta key={n.id} nota={n} />
            ))}
          </div>
        </section>
      )}
    </main>
  )
}
