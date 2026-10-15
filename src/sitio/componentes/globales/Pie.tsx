import Link from 'next/link'

import type { AjustesSitio } from '../../datos'
import { LABS_FRAY_BENTOS, LEGALES, linkWhatsapp, type Enlace, type SeccionMenu } from '../../navegacion'
import { IconoEnlace, IconoFacebook, IconoInstagram, IconoWhatsapp } from '../ui/iconos'
import { Logo } from '../ui/Logo'

const NOMBRE_RED: Record<string, string> = {
  instagram: 'Instagram',
  facebook: 'Facebook',
  x: 'X',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  whatsapp: 'WhatsApp',
}

function Redes({ ajustes, className }: { ajustes: AjustesSitio; className: string }) {
  const redes = ajustes.redes.filter((r) => r.red !== 'whatsapp')
  if (ajustes.whatsapp) redes.push({ red: 'whatsapp', url: linkWhatsapp(ajustes.whatsapp) })
  return (
    <div className={`gap-2.5 py-1.5 ${className}`}>
      {redes.map((r) => {
        const Icono =
          r.red === 'instagram'
            ? IconoInstagram
            : r.red === 'facebook'
              ? IconoFacebook
              : r.red === 'whatsapp'
                ? IconoWhatsapp
                : IconoEnlace
        return (
          <a
            key={r.red}
            href={r.url}
            aria-label={`${NOMBRE_RED[r.red] ?? r.red} de Visión`}
            className="flex size-11 items-center justify-center rounded-full border-2 border-oscuro-borde text-blanco no-underline hover:border-blanco"
          >
            <Icono />
          </a>
        )
      })}
    </div>
  )
}

function Columna({ titulo, enlaces, className = '', children }: { titulo: string; enlaces: Enlace[]; className?: string; children?: React.ReactNode }) {
  return (
    <nav aria-label={titulo} className={`flex flex-col lg:flex-[1_1_160px] ${className}`}>
      <h2 className="mb-1 text-[11px] font-extrabold tracking-[0.1em] text-blanco uppercase lg:mb-2.5 lg:text-xs">
        {titulo}
      </h2>
      {enlaces.map((e) => (
        <Link
          key={e.href}
          href={e.href}
          className="flex min-h-10 items-center text-[15px] text-oscuro-1 no-underline hover:text-blanco lg:min-h-0 lg:py-1.5"
        >
          {e.etiqueta}
        </Link>
      ))}
      {children}
    </nav>
  )
}

/** Pie oscuro (design/LEEME.md, sección 6), con los links a las páginas reales y no a anclas del Inicio. */
export function Pie({ ajustes, secciones }: { ajustes: AjustesSitio; secciones: SeccionMenu[] }) {
  const anio = new Date().getFullYear()
  return (
    <footer className="bg-tinta pb-[108px] text-oscuro-1 lg:pb-0">
      <div className="contenedor flex flex-col gap-7 pt-9 lg:gap-10 lg:pt-14 lg:pb-7">
        <div className="grid grid-cols-2 gap-x-5 gap-y-6 md:grid-cols-4 lg:flex lg:flex-wrap lg:gap-12">
          <div className="col-span-2 flex flex-col gap-3 md:col-span-4 lg:flex-[2_1_300px] lg:gap-4">
            <span className="text-blanco">
              <span className="lg:hidden">
                <Logo tamano={32} colorFM="var(--color-vivo-claro)" />
              </span>
              <span className="hidden lg:block">
                <Logo tamano={40} colorFM="var(--color-vivo-claro)" />
              </span>
            </span>
            <p className="m-0 max-w-[340px] text-sm leading-relaxed lg:text-[15px]">
              <span className="lg:hidden">Radio, noticias y cine en Fray Bentos desde 2005.</span>
              <span className="hidden lg:inline">
                La radio de Fray Bentos desde 2005. Noticias locales, cultura y compañía, en el 96.5 FM y online.
              </span>
            </p>
            <Redes ajustes={ajustes} className="flex lg:hidden" />
          </div>
          <Columna
            titulo="Radio"
            enlaces={[
              { etiqueta: 'En vivo', href: '/radio/en-vivo' },
              { etiqueta: 'Programación', href: '/radio/programacion' },
              { etiqueta: 'Entrevistas', href: '/radio/entrevistas' },
            ]}
          />
          <Columna
            titulo="Noticias"
            className="lg:order-1"
            enlaces={[
              { etiqueta: 'Últimas', href: '/noticias' },
              ...secciones.map((s) => ({ etiqueta: s.nombre, href: `/noticias/${s.slug}` })),
            ]}
          />
          <Columna
            titulo="Cinevisión"
            enlaces={[
              { etiqueta: 'Cartelera', href: '/cinevision#cartelera' },
              { etiqueta: 'Estrenos', href: '/cinevision#estrenos' },
              { etiqueta: 'Entradas', href: '/cinevision#entradas' },
            ]}
          />
          <Columna
            titulo="Institucional"
            className="lg:order-2 lg:flex-[1_1_200px]"
            enlaces={[
              { etiqueta: 'Quiénes somos', href: '/institucional#nosotros' },
              { etiqueta: 'Equipo', href: '/institucional#equipo' },
              { etiqueta: 'Ser parte', href: '/institucional/sumarse' },
              { etiqueta: 'Contacto', href: '/institucional/contacto' },
            ]}
          >
            <span className="hidden py-1.5 text-[15px] lg:block">Fray Bentos, Río Negro, Uruguay</span>
            <Redes ajustes={ajustes} className="hidden lg:flex" />
          </Columna>
        </div>
        <div className="flex flex-col gap-2.5 border-t border-oscuro-linea pt-[18px] text-xs text-oscuro-2 lg:flex-row lg:flex-wrap lg:justify-between lg:gap-4 lg:pt-5 lg:text-[13px]">
          <span className="text-[13px] text-oscuro-1 lg:hidden">Fray Bentos, Río Negro</span>
          <span className="max-lg:order-2">© {anio} Visión 96.5 FM. Todos los derechos reservados.</span>
          <nav aria-label="Legal" className="flex flex-wrap items-center gap-x-[18px] lg:gap-x-5 lg:gap-y-2">
            {[...LEGALES, { etiqueta: 'Publicidad', href: '/institucional/publicidad' }].map((e) => (
              <Link key={e.href} href={e.href} className="py-1.5 text-oscuro-2 hover:text-blanco lg:py-0">
                {e.etiqueta}
              </Link>
            ))}
            <span className="hidden lg:inline">
              Desarrollado por{' '}
              <a href={LABS_FRAY_BENTOS} className="font-semibold text-blanco">
                Labs Fray Bentos
              </a>
            </span>
          </nav>
          <span className="order-3 lg:hidden">
            Desarrollado por{' '}
            <a href={LABS_FRAY_BENTOS} className="font-semibold text-blanco">
              Labs Fray Bentos
            </a>
          </span>
        </div>
      </div>
    </footer>
  )
}
