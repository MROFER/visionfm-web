import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { EntrevistaDestacada, FilaEntrevista } from '@/sitio/componentes/radio/ListaEntrevistas'
import { Buscador } from '@/sitio/componentes/ui/Buscador'
import { Paginacion } from '@/sitio/componentes/ui/Paginacion'
import { entrevistaDestacada, listarEntrevistas, obtenerAjustes, obtenerGrilla } from '@/sitio/datos'

export const metadata: Metadata = {
  title: 'Entrevistas',
  description: 'Las voces de Fray Bentos que pasaron por Visión 96.5 FM, para escuchar de nuevo.',
}

type Busqueda = Promise<{ pagina?: string | string[]; q?: string | string[]; programa?: string | string[] }>

const uno = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)

// Entrevistas (design/LEEME.md, sección 7): buscador, pestañas por programa, destacada con reproductor,
// archivo paginado. Todo suena con el mismo audio de la radio.
export default async function Entrevistas({ searchParams }: { searchParams: Busqueda }) {
  const busqueda = await searchParams
  const numero = Number(uno(busqueda.pagina))
  const pagina = Number.isInteger(numero) && numero > 1 ? numero : 1
  const q = uno(busqueda.q)?.trim().slice(0, 100) ?? ''
  const programa = uno(busqueda.programa) || undefined

  const [ajustes, grilla] = await Promise.all([obtenerAjustes(), obtenerGrilla()])
  if (programa && !grilla.some((p) => p.slug === programa)) notFound()
  const destacada = await entrevistaDestacada(programa)
  const archivo = await listarEntrevistas({
    pagina,
    programa,
    q: q || undefined,
    excluir: q ? null : destacada?.id,
  })
  if (pagina > archivo.paginas) notFound()

  const href = (cambios: { pagina?: number; programa?: string | null }) => {
    const params = new URLSearchParams()
    const prog = cambios.programa === undefined ? programa : cambios.programa
    if (prog) params.set('programa', prog)
    if (q && cambios.programa === undefined) params.set('q', q)
    if (cambios.pagina && cambios.pagina > 1) params.set('pagina', String(cambios.pagina))
    const cadena = params.toString()
    return cadena ? `/radio/entrevistas?${cadena}` : '/radio/entrevistas'
  }
  const pestanas = [{ nombre: 'Todos', slug: '' }, ...grilla.map((p) => ({ nombre: p.nombre, slug: p.slug }))]

  return (
    <main className="pb-10 md:pb-20">
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad aviso={ajustes.avisoPropio} />
      </div>
      <div className="contenedor pt-4 md:pt-9">
        <div className="mb-2 flex flex-col gap-3 md:mb-0 md:flex-row md:flex-wrap md:items-end md:justify-between md:gap-6 md:border-b-[3px] md:border-tinta md:pb-5">
          <div className="flex flex-col gap-2 md:gap-2.5">
            <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">
              Radio · Escuchá de nuevo
            </span>
            <h1 className="m-0 font-titulos text-[40px] leading-none font-extrabold tracking-[-0.02em] md:text-[64px]">
              Entrevistas
            </h1>
            <p className="m-0 hidden text-[17px] text-texto-2 md:block">
              Las voces de Fray Bentos que pasaron por el 96.5.
            </p>
          </div>
          <Buscador
            accion="/radio/entrevistas"
            etiqueta="Buscar entrevistas"
            placeholder="Buscar por nombre o tema…"
            valor={q}
            className="md:flex-[0_1_460px] md:[&_label]:min-h-[52px]"
          />
        </div>

        <nav
          aria-label="Programas"
          className="mb-4 flex gap-5 overflow-x-auto border-b border-linea md:mb-7 md:flex-wrap md:gap-x-7 md:overflow-visible"
        >
          {pestanas.map((p) => {
            const elegida = (programa ?? '') === p.slug
            return (
              <Link
                key={p.slug || 'todos'}
                href={href({ programa: p.slug || null })}
                aria-current={elegida ? 'page' : undefined}
                className={`flex min-h-11 shrink-0 items-center text-xs tracking-[0.08em] uppercase no-underline hover:text-acento md:min-h-12 md:text-sm ${
                  elegida ? 'font-extrabold shadow-[inset_0_-3px_0_var(--color-acento)]' : 'font-semibold'
                }`}
              >
                {p.nombre}
              </Link>
            )
          })}
        </nav>

        {destacada && pagina === 1 && !q && <EntrevistaDestacada entrevista={destacada} />}

        <h2 className="etiqueta m-0 flex items-baseline justify-between gap-4 border-b-[3px] border-tinta pb-2.5 text-xs md:text-[13px]">
          {q ? `Resultados para “${q}”` : 'Todas las entrevistas'}
          {archivo.paginas > 1 && (
            <span className="hidden font-normal tracking-normal text-meta normal-case md:inline">
              Página {pagina} de {archivo.paginas}
            </span>
          )}
        </h2>
        {archivo.entrevistas.length > 0 ? (
          <ol className="m-0 list-none p-0">
            {archivo.entrevistas.map((e) => (
              <FilaEntrevista key={e.id} entrevista={e} />
            ))}
          </ol>
        ) : (
          <p className="py-8 text-texto-2">
            {q ? (
              <>
                No encontramos entrevistas con “{q}”.{' '}
                <Link href={href({ programa: programa ?? null })} className="font-semibold">
                  Ver todas
                </Link>
              </>
            ) : destacada ? (
              'No hay más entrevistas por ahora.'
            ) : (
              'Todavía no hay entrevistas publicadas.'
            )}
          </p>
        )}

        <Paginacion actual={pagina} total={archivo.paginas} href={(n) => href({ pagina: n })} />
      </div>
    </main>
  )
}
