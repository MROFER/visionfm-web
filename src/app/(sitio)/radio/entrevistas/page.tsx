import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { Publicidad } from '@/sitio/componentes/globales/Publicidad'
import { FiltroMes } from '@/sitio/componentes/radio/FiltroMes'
import { EntrevistaDestacada, FilaEntrevista } from '@/sitio/componentes/radio/ListaEntrevistas'
import { PestanasProgramas } from '@/sitio/componentes/radio/PestanasProgramas'
import { Buscador } from '@/sitio/componentes/ui/Buscador'
import { Migas } from '@/sitio/componentes/ui/Migas'
import { Paginacion } from '@/sitio/componentes/ui/Paginacion'
import {
  entrevistaDestacada,
  indiceEntrevistas,
  listarEntrevistas,
  obtenerAjustes,
  obtenerGrilla,
} from '@/sitio/datos'
import { esMes, nombreDelMes } from '@/sitio/lib/fecha'

export const metadata: Metadata = {
  title: 'Entrevistas',
  description: 'Las voces de Fray Bentos que pasaron por Visión 96.5 FM, para escuchar de nuevo.',
}

type Busqueda = Promise<{
  pagina?: string | string[]
  q?: string | string[]
  programa?: string | string[]
  mes?: string | string[]
}>

const uno = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v)

// Entrevistas (design/LEEME.md, sección 7): buscador, pestañas por programa, destacada con reproductor,
// archivo paginado y filtro por mes. Todo suena con el mismo audio de la radio.
export default async function Entrevistas({ searchParams }: { searchParams: Busqueda }) {
  const busqueda = await searchParams
  const numero = Number(uno(busqueda.pagina))
  const pagina = Number.isInteger(numero) && numero > 1 ? numero : 1
  const q = uno(busqueda.q)?.trim().slice(0, 100) ?? ''
  const programa = uno(busqueda.programa) || undefined
  const mesPedido = uno(busqueda.mes)
  const mes = mesPedido && esMes(mesPedido) ? mesPedido : undefined

  const [ajustes, grilla, indice] = await Promise.all([
    obtenerAjustes(),
    obtenerGrilla(),
    indiceEntrevistas(),
  ])
  // Pestañas: solo los programas con entrevistas, el de la más reciente primero
  const conEntrevistas = new Map<string, string>()
  for (const e of indice) if (e.programa) conEntrevistas.set(e.programa.slug, e.programa.nombre)
  const elegido = grilla.find((p) => p.slug === programa)
  if (programa && !elegido && !conEntrevistas.has(programa)) notFound()
  // Un programa de la grilla todavía sin entrevistas también se puede elegir por la dirección
  if (programa && elegido && !conEntrevistas.has(programa)) conEntrevistas.set(programa, elegido.nombre)
  const meses = [...new Set(indice.filter((e) => !programa || e.programa?.slug === programa).map((e) => e.mes))]

  // Con búsqueda o mes elegido no hay destacada: se listan todas las que coinciden
  const filtrando = Boolean(q || mes)
  const destacada = filtrando ? null : await entrevistaDestacada(programa)
  const archivo = await listarEntrevistas({
    pagina,
    programa,
    q: q || undefined,
    mes,
    excluir: destacada?.id,
  })
  if (pagina > archivo.paginas) notFound()

  const href = (cambios: { pagina?: number; programa?: string | null; mes?: string | null }) => {
    const params = new URLSearchParams()
    const mismoPrograma = cambios.programa === undefined
    const prog = mismoPrograma ? programa : cambios.programa
    if (prog) params.set('programa', prog)
    if (q && mismoPrograma) params.set('q', q)
    // Al cambiar de programa el mes se suelta: puede no tener entrevistas de ese programa
    const m = cambios.mes === undefined ? (mismoPrograma ? mes : undefined) : cambios.mes
    if (m) params.set('mes', m)
    if (cambios.pagina && cambios.pagina > 1) params.set('pagina', String(cambios.pagina))
    const cadena = params.toString()
    return cadena ? `/radio/entrevistas?${cadena}` : '/radio/entrevistas'
  }
  const pestanas = [
    { nombre: 'Todos', href: href({ programa: null }), elegida: !programa },
    ...[...conEntrevistas].map(([slug, nombre]) => ({
      nombre,
      href: href({ programa: slug }),
      elegida: slug === programa,
    })),
  ]
  const opcionesMes = [
    { valor: '', etiqueta: 'Todas las fechas', href: href({ mes: null }) },
    ...meses.map((m) => ({ valor: m, etiqueta: nombreDelMes(m), href: href({ mes: m }) })),
  ]

  return (
    <main className="pb-10 md:pb-20">
      <Migas pasos={[{ nombre: 'Entrevistas' }]} />
      <div className="contenedor pt-4 md:pt-8">
        <Publicidad ubicacion="radio-entrevistas" aviso={ajustes.avisoPropio} />
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

        <PestanasProgramas pestanas={pestanas} />

        {destacada && pagina === 1 && <EntrevistaDestacada entrevista={destacada} />}

        <div className="flex items-end justify-between gap-4 border-b-[3px] border-tinta pb-2.5">
          <h2 className="etiqueta m-0 text-xs md:text-[13px]">
            {q ? `Resultados para “${q}”` : mes ? `Entrevistas de ${nombreDelMes(mes).toLowerCase()}` : 'Todas las entrevistas'}
          </h2>
          <div className="flex items-center gap-4">
            {archivo.paginas > 1 && (
              <span className="hidden text-[13px] text-meta md:inline">
                Página {pagina} de {archivo.paginas}
              </span>
            )}
            {meses.length > 0 && <FiltroMes opciones={opcionesMes} actual={mes ?? ''} />}
          </div>
        </div>
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
            ) : mes ? (
              <>
                No hay entrevistas en {nombreDelMes(mes).toLowerCase()}.{' '}
                <Link href={href({ mes: null })} className="font-semibold">
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
