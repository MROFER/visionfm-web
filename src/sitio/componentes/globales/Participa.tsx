import Link from 'next/link'

import { linkWhatsapp } from '../../navegacion'
import { IconoWhatsapp } from '../ui/iconos'

/** Bloque "Participá" (design/LEEME.md, sección 6): al final del Inicio y de Noticias. */
export function Participa({ whatsapp }: { whatsapp: string }) {
  return (
    <section
      aria-label="Participá"
      className="flex flex-col gap-3 border-2 border-tinta p-5 md:flex-row md:flex-wrap md:items-center md:justify-between md:gap-6 md:p-8"
    >
      <div className="flex flex-col gap-2 md:flex-[1_1_420px]">
        <span className="etiqueta text-[11px] tracking-[0.12em] text-acento md:text-xs">Participá</span>
        <h2 className="m-0 font-titulos text-2xl leading-[1.15] font-extrabold md:text-[34px] md:leading-[1.1]">
          ¿Tenés una noticia? Mandala a la redacción.
        </h2>
        <p className="m-0 text-sm text-texto-2 md:text-base">
          Fotos, audios, avisos o lo que esté pasando en tu barrio.
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap md:gap-2.5">
        {whatsapp && (
          <a
            href={linkWhatsapp(whatsapp)}
            className="etiqueta flex min-h-12 items-center justify-center gap-2 bg-acento text-[11px] text-blanco no-underline hover:bg-acento-hover md:min-h-[52px] md:gap-2.5 md:px-[22px] md:text-xs"
          >
            <IconoWhatsapp tamano={18} />
            WhatsApp
          </a>
        )}
        <Link
          href="/institucional/contacto"
          className="etiqueta flex min-h-12 items-center justify-center border-2 border-tinta text-[11px] no-underline hover:bg-tinta hover:text-blanco md:min-h-[52px] md:px-[22px] md:text-xs"
        >
          Escribinos →
        </Link>
      </div>
    </section>
  )
}
