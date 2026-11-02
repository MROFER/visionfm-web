import Link from 'next/link'

import type { AjustesSitio } from '../../datos'
import {
  LABS_FRAY_BENTOS,
  LEGALES,
  menuPrincipal,
  type GrupoMenu,
  type SeccionMenu,
} from '../../navegacion'
import { LogoApilado } from '../ui/Logo'
import { Redes } from '../ui/Redes'
import { MasEnlaces } from './MasEnlaces'

const claseEnlace =
  'flex min-h-10 items-center text-[15px] text-oscuro-1 no-underline hover:text-blanco lg:min-h-0 lg:py-1.5'

/** Cuántas secciones de Noticias se ven en el celular antes del "+ Ver más". */
const NOTICIAS_VISIBLES = 3

function Columna({ grupo }: { grupo: GrupoMenu }) {
  const visibles = grupo.clave === 'noticias' ? NOTICIAS_VISIBLES : grupo.enlaces.length
  return (
    <nav aria-label={grupo.etiqueta} className="flex flex-col lg:flex-1">
      <h2 className="mb-1 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase lg:mb-2.5 lg:text-xs">
        {grupo.etiqueta}
      </h2>
      {grupo.enlaces.slice(0, visibles).map((e) => (
        <Link key={e.href} href={e.href} className={claseEnlace}>
          {e.etiqueta}
        </Link>
      ))}
      {grupo.enlaces.length > visibles && (
        <MasEnlaces enlaces={grupo.enlaces.slice(visibles)} className={claseEnlace} />
      )}
    </nav>
  )
}

/**
 * Pie oscuro (design/LEEME.md, sección 6). Arriba, la marca con el mismo logo del encabezado y las redes
 * (la ubicación de la radio ya la dicen los datos estructurados, src/sitio/seo/estructurados.ts).
 * Después, los grupos del menú con los mismos links y en el mismo orden que el encabezado (sin "Cómo
 * llegar"): en web en fila; en el celular en dos columnas (Radio y Noticias, Cinevisión e Institucional),
 * con Noticias plegada para que las dos queden parejas. Al final, los legales y los créditos, centrados en
 * el celular.
 */
export function Pie({ ajustes, secciones }: { ajustes: AjustesSitio; secciones: SeccionMenu[] }) {
  const anio = new Date().getFullYear()
  const menu = menuPrincipal(secciones).map((g) => ({
    ...g,
    enlaces: g.enlaces.filter((e) => e.href !== '/cinevision#como-llegar'),
  }))
  const logo = (tamano: number) => (
    <span className="shrink-0 text-blanco">
      <LogoApilado tamano={tamano} className="block" />
    </span>
  )
  return (
    <footer className="bg-tinta pb-[108px] text-oscuro-1 lg:pb-0">
      <div className="contenedor flex flex-col gap-9 pt-10 lg:gap-12 lg:pt-14 lg:pb-7">
        <div className="flex flex-col gap-9 lg:flex-row lg:gap-12">
          {/* Celular: el logo con la frase al lado, y las redes debajo */}
          <div className="flex flex-col gap-5 lg:hidden">
            <div className="flex items-center gap-4">
              {logo(34)}
              <p className="m-0 border-l border-oscuro-linea pl-4 text-sm leading-snug">
                Radio, noticias y cine
                <br />
                en Fray Bentos desde 2005.
              </p>
            </div>
            <Redes ajustes={ajustes} className="flex" />
          </div>
          {/* Web */}
          <div className="hidden flex-col items-start gap-4 lg:flex lg:flex-[2_1_0%]">
            {logo(40)}
            <p className="m-0 max-w-[340px] text-[15px] leading-relaxed">
              La radio de Fray Bentos desde 2005. Noticias locales, cultura y compañía, en el 96.5
              FM y online.
            </p>
            <Redes ajustes={ajustes} className="flex" />
          </div>
          <div className="grid grid-cols-2 gap-x-5 lg:flex lg:flex-[4_1_0%] lg:gap-8 xl:gap-12">
            {[menu.slice(0, 2), menu.slice(2)].map((grupos, i) => (
              <div key={i} className="flex flex-col gap-7 lg:contents">
                {grupos.map((g) => (
                  <Columna key={g.clave} grupo={g} />
                ))}
              </div>
            ))}
          </div>
        </div>
        <div className="flex flex-col items-center gap-1 border-t border-oscuro-linea pt-4 text-center text-[13px] text-oscuro-2 lg:flex-row lg:justify-between lg:gap-6 lg:pt-5 lg:text-left">
          <span className="max-lg:order-2">
            © {anio} Visión 96.5 FM. Todos los derechos reservados.
          </span>
          <div className="contents lg:flex lg:items-center lg:gap-5">
            <nav
              aria-label="Legal"
              className="flex flex-wrap justify-center gap-x-3 max-lg:order-1 max-lg:mb-2 max-[389px]:gap-x-2.5 max-[389px]:text-xs lg:gap-x-5"
            >
              {LEGALES.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="flex min-h-10 items-center whitespace-nowrap text-oscuro-1 no-underline hover:text-blanco lg:min-h-0 lg:text-oscuro-2"
                >
                  {e.etiqueta}
                </Link>
              ))}
            </nav>
            <span className="max-lg:order-3">
              Desarrollado por{' '}
              <a href={LABS_FRAY_BENTOS} className="font-semibold text-blanco">
                Labs Fray Bentos
              </a>
            </span>
          </div>
        </div>
      </div>
    </footer>
  )
}
