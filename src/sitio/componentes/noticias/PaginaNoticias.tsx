import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  destacadaDeSeccion,
  diasDeNoticias,
  listarNoticias,
  obtenerAjustes,
  obtenerPortada,
  obtenerSecciones,
  ultimasNoticias,
} from '../../datos'
import { esDia, hoyEnMontevideo, nombreDelRango } from '../../lib/fecha'
import { Participa } from '../globales/Participa'
import { Publicidad } from '../globales/Publicidad'
import { FiltroFechas } from '../radio/FiltroFechas'
import { Buscador } from '../ui/Buscador'
import { Migas } from '../ui/Migas'
import { Paginacion } from '../ui/Paginacion'
import { NotaTarjeta } from '../ui/TarjetaNota'
import { TiraSecciones } from '../ui/TiraSecciones'
import { NoticiasPortada } from './NoticiasPortada'

export type BusquedaNoticias = Promise<{
  pagina?: string | string[]
  q?: string | string[]
  desde?: string | string[]
  hasta?: string | string[]
}>

const uno = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)

/** `?pagina=`, `?q=` y el rango `?desde=`/`?hasta=` de la URL, saneados. */
export async function leerBusqueda(busqueda: BusquedaNoticias) {
  const b = await busqueda
  const numero = Number(uno(b.pagina))
  const texto = uno(b.q)?.trim().slice(0, 100) ?? ''
  // Rango de días, los dos incluidos; si vienen al revés se dan vuelta
  let [desde, hasta] = [uno(b.desde), uno(b.hasta)]
  if (!desde || !hasta || !esDia(desde) || !esDia(hasta)) desde = hasta = undefined
  else if (desde > hasta) [desde, hasta] = [hasta, desde]
  return { pagina: Number.isInteger(numero) && numero > 1 ? numero : 1, q: texto, desde, hasta }
}

/**
 * Noticias y cada sección (design/LEEME.md, sección 7): buscador, tira de secciones, destacada con las
 * últimas al lado, archivo paginado, filtro por fechas y, en el celular, Participá.
 */
export async function PaginaNoticias({
  seccion,
  busqueda,
}: {
  seccion?: string
  busqueda: BusquedaNoticias
}) {
  const [{ pagina, q, desde, hasta }, ajustes, secciones, portada, dias] = await Promise.all([
    leerBusqueda(busqueda),
    obtenerAjustes(),
    obtenerSecciones(),
    obtenerPortada(),
    diasDeNoticias(seccion),
  ])
  const actual = seccion ? secciones.find((s) => s.slug === seccion) : null
  if (seccion && !actual) notFound()

  // La destacada sale del archivo en todas las páginas, así la paginación no se corre al pasar de la 1 a la 2
  const [destacada, ultimas] = seccion
    ? await destacadaDeSeccion(seccion).then(async (d) => [
        d,
        d ? (await listarNoticias({ seccion, pagina: 1, excluir: d.id })).notas.slice(0, 5) : [],
      ] as const)
    : await ultimasNoticias(6, portada.notaDestacada).then((u) => [u.destacada, u.resto.slice(0, 5)] as const)

  // Con búsqueda o fechas elegidas no hay destacada: se listan todas las que coinciden
  const filtrando = Boolean(q || desde)
  const archivo = await listarNoticias({
    seccion,
    pagina,
    q: q || undefined,
    desde,
    hasta,
    excluir: filtrando ? null : destacada?.id,
  })
  if (pagina > archivo.paginas) notFound()

  const hoy = hoyEnMontevideo()
  const rango = desde && hasta ? nombreDelRango(desde, hasta, hoy) : ''
  const base = seccion ? `/noticias/${seccion}` : '/noticias'
  const conPortada = destacada && pagina === 1 && !filtrando
  const href = (n: number, { fechas = true } = {}) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (fechas && desde && hasta) {
      params.set('desde', desde)
      params.set('hasta', hasta)
    }
    if (n > 1) params.set('pagina', String(n))
    const cadena = params.toString()
    return cadena ? `${base}?${cadena}` : base
  }
  // El mismo filtro de Entrevistas, en la fila del archivo a la derecha. En el celular esa fila no se ve,
  // así que con la destacada va debajo de ella, junto a su fecha
  const filtro =
    dias.length > 0 || desde ? (
      <FiltroFechas dias={dias} desde={desde} hasta={hasta} hoy={hoy} cosa={{ una: 'nota', varias: 'notas' }} />
    ) : null

  return (
    <main className="pb-8 md:pb-20">
      <Migas
        pasos={
          actual
            ? [{ nombre: 'Noticias', ruta: '/noticias' }, { nombre: actual.nombre }]
            : [{ nombre: 'Noticias' }]
        }
      />
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad
          ubicacion={seccion ? 'noticias-seccion' : 'noticias-listado'}
          seccion={seccion}
          aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor pt-5 md:pt-9">
        <div className="mb-2 flex flex-col gap-3 md:mb-5 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-5">
          <h1 className="m-0 font-titulos text-[44px] leading-none font-bold tracking-[-0.02em] md:text-[72px]">
            {actual?.nombre ?? 'Noticias'}
          </h1>
          <Buscador
            accion={base}
            etiqueta={actual ? `Buscar en ${actual.nombre}` : 'Buscar noticias'}
            placeholder={actual ? `Buscar en ${actual.nombre}…` : 'Buscar noticias…'}
            valor={q}
            className="md:flex-[0_1_460px] md:[&_label]:min-h-[52px]"
          />
        </div>
        <TiraSecciones secciones={secciones} actual={seccion} todas />

        {conPortada && (
          <NoticiasPortada
            destacada={destacada}
            ultimas={ultimas}
            filtro={filtro && archivo.notas.length > 0 ? <div className="md:hidden">{filtro}</div> : filtro}
          />
        )}

        {q || !conPortada ? (
          <div className="flex items-center justify-between gap-4 pt-6 pb-1">
            <h2 className="etiqueta m-0 text-[13px]">
              {q ? `Resultados para “${q}”` : rango ? `${actual?.nombre ?? 'Noticias'} ${rango}` : 'Archivo'}
            </h2>
            <div className="flex items-center gap-4">
              {archivo.total > 0 && (
                <span className="text-[13px] whitespace-nowrap text-meta">
                  {q ? `${archivo.total} ${archivo.total === 1 ? 'nota' : 'notas'}` : `Página ${pagina} de ${archivo.paginas}`}
                </span>
              )}
              {filtro}
            </div>
          </div>
        ) : (
          archivo.notas.length > 0 && (
            <div className="hidden items-center justify-between gap-4 pt-6 pb-1 md:flex">
              <h2 className="etiqueta m-0 text-[13px]">Archivo</h2>
              <div className="flex items-center gap-4">
                <span className="text-[13px] whitespace-nowrap text-meta">
                  Página {pagina} de {archivo.paginas}
                </span>
                {filtro}
              </div>
            </div>
          )
        )}

        {archivo.notas.length > 0 ? (
          <div className="md:grid md:grid-cols-2 md:gap-x-6 md:gap-y-10 md:pt-4 lg:grid-cols-3 lg:gap-x-8">
            {archivo.notas.map((n) => (
              <NotaTarjeta key={n.id} nota={n} />
            ))}
          </div>
        ) : q ? (
          <p className="py-8 text-texto-2">
            No encontramos noticias con “{q}”.{' '}
            <Link href={base} className="font-semibold">
              Ver todas
            </Link>
          </p>
        ) : rango ? (
          <p className="py-8 text-texto-2">
            No hay noticias {rango}.{' '}
            <Link href={href(1, { fechas: false })} className="font-semibold">
              Ver todas
            </Link>
          </p>
        ) : (
          !destacada && (
            <p className="py-8 text-texto-2">
              {actual ? `Todavía no hay noticias publicadas en ${actual.nombre}.` : 'Todavía no hay noticias publicadas.'}
            </p>
          )
        )}

        <Paginacion actual={pagina} total={archivo.paginas} href={href} />

        <div className="mt-8 lg:hidden">
          <Participa whatsapp={ajustes.whatsapp} />
        </div>
      </div>
    </main>
  )
}
