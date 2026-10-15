import Link from 'next/link'

import type { SeccionMenu } from '../../navegacion'

/** Tira de secciones de Noticias. En el celular se desliza de costado. */
export function TiraSecciones({ secciones, actual }: { secciones: SeccionMenu[]; actual?: string }) {
  return (
    <nav
      aria-label="Secciones de noticias"
      className="flex gap-[18px] overflow-x-auto border-b border-linea md:flex-wrap md:gap-x-7 md:overflow-visible"
    >
      {secciones.map((s) => (
        <Link
          key={s.slug}
          href={`/noticias/${s.slug}`}
          aria-current={actual === s.slug ? 'page' : undefined}
          className={`flex min-h-11 shrink-0 items-center text-xs font-extrabold tracking-[0.08em] uppercase no-underline hover:text-acento md:text-[13px] ${
            actual === s.slug ? 'shadow-[inset_0_-3px_0_var(--color-acento)]' : ''
          }`}
        >
          {s.nombre}
        </Link>
      ))}
    </nav>
  )
}
