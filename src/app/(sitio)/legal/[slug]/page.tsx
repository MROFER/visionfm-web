import { RichText } from '@payloadcms/richtext-lexical/react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'

import { obtenerPagina } from '@/sitio/datos/paginas'
import { fechaCompleta } from '@/sitio/lib/fecha'
import { LEGALES } from '@/sitio/navegacion'

type Parametros = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Parametros): Promise<Metadata> {
  const pagina = await obtenerPagina((await params).slug)
  if (!pagina) return {}
  return { title: pagina.seo.titulo, description: pagina.seo.descripcion || undefined }
}

// Textos legales (docs/03-flujos.md, /legal/[slug]): los carga la radio en Institucional › Páginas.
// El diseño no tiene una página propia; sigue el estilo del cuerpo de las notas, con los otros textos
// legales al costado en web y al final en el celular.
export default async function Legal({ params }: Parametros) {
  const { slug } = await params
  const pagina = await obtenerPagina(slug)
  if (!pagina) notFound()

  return (
    <main className="pb-10 md:pb-20">
      <div className="contenedor flex flex-col gap-8 pt-6 md:grid md:grid-cols-[minmax(0,1fr)_260px] md:gap-x-14 md:pt-12 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0">
          <span className="text-[11px] font-extrabold tracking-[0.12em] text-acento uppercase md:text-xs">Legal</span>
          <h1 className="m-0 mt-2 font-titulos text-[34px] leading-[1.05] font-extrabold tracking-[-0.01em] md:mt-2.5 md:text-[56px] md:leading-none md:tracking-[-0.02em]">
            {pagina.titulo}
          </h1>
          <p className="m-0 mt-3 border-b border-linea pb-5 text-[13px] text-meta md:mt-4 md:pb-7 md:text-sm">
            Actualizado el {fechaCompleta(pagina.actualizada)}
          </p>
          <div className="cuerpo-nota pt-5 md:pt-7">
            <RichText data={pagina.cuerpo} />
          </div>
        </article>
        <nav aria-label="Textos legales" className="border-t-[3px] border-tinta pt-4 md:self-start md:pt-5">
          <h2 className="m-0 mb-2 text-xs font-extrabold tracking-[0.1em] uppercase md:text-[13px]">Textos legales</h2>
          <ul className="m-0 list-none p-0">
            {LEGALES.map((e) => {
              const actual = e.href === `/legal/${slug}`
              return (
                <li key={e.href} className="border-b border-linea">
                  <Link
                    href={e.href}
                    aria-current={actual ? 'page' : undefined}
                    className={`flex min-h-11 items-center text-[15px] no-underline ${actual ? 'font-bold text-acento' : 'text-tinta hover:text-acento'}`}
                  >
                    {e.etiqueta}
                  </Link>
                </li>
              )
            })}
            <li className="border-b border-linea">
              <Link href="/institucional/contacto" className="flex min-h-11 items-center text-[15px] text-tinta no-underline hover:text-acento">
                Consultas: escribinos
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  )
}
