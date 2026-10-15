import Link from 'next/link'
import { notFound } from 'next/navigation'

import {
  destacadaDeSeccion,
  listarNoticias,
  obtenerAjustes,
  obtenerPortada,
  obtenerSecciones,
  ultimasNoticias,
} from '../../datos'
import { Participa } from '../globales/Participa'
import { Publicidad } from '../globales/Publicidad'
import { Buscador } from '../ui/Buscador'
import { Paginacion } from '../ui/Paginacion'
import { NotaFila } from '../ui/TarjetaNota'
import { TiraSecciones } from '../ui/TiraSecciones'
import { NoticiasPortada } from './NoticiasPortada'

export type BusquedaNoticias = Promise<{ pagina?: string | string[]; q?: string | string[] }>

/** `?pagina=` y `?q=` de la URL, saneados. */
export async function leerBusqueda(busqueda: BusquedaNoticias) {
  const { pagina, q } = await busqueda
  const numero = Number(Array.isArray(pagina) ? pagina[0] : pagina)
  const texto = (Array.isArray(q) ? q[0] : q)?.trim().slice(0, 100) ?? ''
  return { pagina: Number.isInteger(numero) && numero > 1 ? numero : 1, q: texto }
}

/**
 * Noticias y cada sección (design/LEEME.md, sección 7): buscador, tira de secciones, destacada con las
 * últimas al lado, archivo paginado y, en el celular, Participá.
 */
export async function PaginaNoticias({
  seccion,
  busqueda,
}: {
  seccion?: string
  busqueda: BusquedaNoticias
}) {
  const [{ pagina, q }, ajustes, secciones, portada] = await Promise.all([
    leerBusqueda(busqueda),
    obtenerAjustes(),
    obtenerSecciones(),
    obtenerPortada(),
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

  const archivo = await listarNoticias({ seccion, pagina, q: q || undefined, excluir: q ? null : destacada?.id })
  if (pagina > archivo.paginas) notFound()

  const base = seccion ? `/noticias/${seccion}` : '/noticias'
  const conPortada = destacada && pagina === 1 && !q
  const href = (n: number) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (n > 1) params.set('pagina', String(n))
    const cadena = params.toString()
    return cadena ? `${base}?${cadena}` : base
  }

  return (
    <main className="pb-8 md:pb-20">
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad aviso={ajustes.avisoPropio} />
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

        {conPortada && <NoticiasPortada destacada={destacada} ultimas={ultimas} />}

        {q || !conPortada ? (
          <div className="flex items-baseline justify-between gap-4 pt-6 pb-1">
            <h2 className="etiqueta m-0 text-[13px]">{q ? `Resultados para “${q}”` : 'Archivo'}</h2>
            {archivo.total > 0 && (
              <span className="text-[13px] text-meta">
                {q ? `${archivo.total} ${archivo.total === 1 ? 'nota' : 'notas'}` : `Página ${pagina} de ${archivo.paginas}`}
              </span>
            )}
          </div>
        ) : (
          archivo.notas.length > 0 && (
            <div className="hidden items-baseline justify-between pt-6 pb-1 md:flex">
              <h2 className="etiqueta m-0 text-[13px]">Archivo</h2>
              <span className="text-[13px] text-meta">
                Página {pagina} de {archivo.paginas}
              </span>
            </div>
          )
        )}

        {archivo.notas.length > 0 ? (
          <div className="lg:grid lg:grid-cols-2 lg:gap-x-12">
            {archivo.notas.map((n) => (
              <NotaFila key={n.id} nota={n} />
            ))}
          </div>
        ) : q ? (
          <p className="py-8 text-texto-2">
            No encontramos noticias con “{q}”.{' '}
            <Link href={base} className="font-semibold">
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
