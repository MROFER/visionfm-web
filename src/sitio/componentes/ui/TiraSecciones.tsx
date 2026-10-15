import Link from 'next/link'

import type { SeccionMenu } from '../../navegacion'

/**
 * Tira de secciones de Noticias. En el celular se desliza de costado. Con `todas` es la de la página
 * Noticias: suma "Todas" al principio, una línea negra arriba y las no elegidas van más finas.
 */
export function TiraSecciones({
  secciones,
  actual,
  todas = false,
}: {
  secciones: SeccionMenu[]
  actual?: string
  todas?: boolean
}) {
  const enlaces = todas ? [{ nombre: 'Todas', slug: '', href: '/noticias' }] : []
  enlaces.push(...secciones.map((s) => ({ ...s, href: `/noticias/${s.slug}` })))
  const elegida = todas ? (actual ?? '') : actual
  return (
    <nav
      aria-label="Secciones de noticias"
      className={`flex gap-5 overflow-x-auto border-b border-linea md:flex-wrap md:overflow-visible ${
        todas ? 'md:gap-x-6 md:border-t md:border-t-tinta' : 'gap-[18px] md:gap-x-7'
      }`}
    >
      {enlaces.map((s) => (
        <Link
          key={s.href}
          href={s.href}
          aria-current={elegida === s.slug ? 'page' : undefined}
          className={`flex min-h-11 shrink-0 items-center text-xs tracking-[0.08em] uppercase no-underline hover:text-acento md:text-[13px] ${
            elegida === s.slug ? 'font-extrabold shadow-[inset_0_-3px_0_var(--color-acento)]' : todas ? 'font-semibold' : 'font-extrabold'
          }`}
        >
          {s.nombre}
        </Link>
      ))}
    </nav>
  )
}
