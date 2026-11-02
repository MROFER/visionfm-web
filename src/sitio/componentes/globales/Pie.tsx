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

function Columna({ grupo }: { grupo: GrupoMenu }) {
  return (
    <nav aria-label={grupo.etiqueta} className="flex flex-col lg:flex-1">
      <h2 className="mb-1 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase lg:mb-2.5 lg:text-xs">
        {grupo.etiqueta}
      </h2>
      {grupo.enlaces.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className="flex min-h-10 items-center text-[15px] text-oscuro-1 no-underline hover:text-blanco lg:min-h-0 lg:py-1.5"
        >
          {e.etiqueta}
        </Link>
      ))}
    </nav>
  )
}

const desarrollado = (
  <>
    Desarrollado por{' '}
    <a href={LABS_FRAY_BENTOS} className="font-semibold text-blanco">
      Labs Fray Bentos
    </a>
  </>
)

/**
 * Pie oscuro (design/LEEME.md, sección 6). Arriba, la marca con el mismo logo del encabezado, la ciudad y
 * las redes. Después, los grupos del menú con los mismos links y en el mismo orden que el encabezado: en
 * web en fila; en el celular en dos columnas (Radio y Noticias, Cinevisión e Institucional) para que no
 * quede un hueco al lado de Noticias, que es la más larga. Al final, los legales y los créditos.
 */
export function Pie({ ajustes, secciones }: { ajustes: AjustesSitio; secciones: SeccionMenu[] }) {
  const anio = new Date().getFullYear()
  const menu = menuPrincipal(secciones)
  return (
    <footer className="bg-tinta pb-[108px] text-oscuro-1 lg:pb-0">
      <div className="contenedor flex flex-col gap-9 pt-10 lg:gap-12 lg:pt-14 lg:pb-7">
        <div className="flex flex-col gap-9 lg:flex-row lg:gap-12">
          <div className="flex flex-col items-start gap-3 lg:flex-[2_1_0%] lg:gap-4">
            <span className="text-blanco">
              <LogoApilado tamano={34} className="block lg:hidden" />
              <LogoApilado tamano={40} className="hidden lg:block" />
            </span>
            <p className="m-0 max-w-[340px] text-sm leading-relaxed lg:text-[15px]">
              <span className="lg:hidden">Radio, noticias y cine en Fray Bentos desde 2005.</span>
              <span className="hidden lg:inline">
                La radio de Fray Bentos desde 2005. Noticias locales, cultura y compañía, en el 96.5
                FM y online.
              </span>
            </p>
            <p className="m-0 text-sm text-oscuro-2 lg:text-[15px]">
              Fray Bentos, Río Negro, Uruguay
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
        <div className="flex flex-col gap-1.5 border-t border-oscuro-linea pt-5 text-[13px] text-oscuro-2 lg:flex-row lg:items-center lg:justify-between lg:gap-6">
          <span className="max-lg:order-2">
            © {anio} Visión 96.5 FM. Todos los derechos reservados.
          </span>
          <div className="contents lg:flex lg:items-center lg:gap-5">
            {/* En el celular, los legales en dos columnas alineadas con las del menú */}
            <nav
              aria-label="Legal"
              className="grid grid-cols-2 gap-x-5 max-lg:order-1 max-lg:mb-3 lg:flex lg:gap-5"
            >
              {LEGALES.map((e) => (
                <Link
                  key={e.href}
                  href={e.href}
                  className="flex min-h-10 items-center text-oscuro-1 no-underline hover:text-blanco lg:min-h-0 lg:text-oscuro-2"
                >
                  {e.etiqueta}
                </Link>
              ))}
            </nav>
            <span className="max-lg:order-3">{desarrollado}</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
