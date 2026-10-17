'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { grupoActual, telefonoParaLink, type GrupoMenu } from '../../navegacion'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { IconoCerrar, IconoFlechaAbajo, IconoMenu } from '../ui/iconos'
import { Logo } from '../ui/Logo'
import { FechaHoy } from './FechaHoy'

/**
 * Header del sitio (design/LEEME.md, sección 6). Desde 1024 px: menú con desplegables y botón
 * "Escuchar en vivo". Más angosto: play redondo, hamburguesa con grupos en acordeón y la fecha debajo.
 */
export function Encabezado({ menu, telefono }: { menu: GrupoMenu[]; telefono: string }) {
  const ruta = usePathname()
  const actual = grupoActual(ruta)
  const [desplegado, setDesplegado] = useState<GrupoMenu['clave'] | null>(null)
  const [menuAbierto, setMenuAbierto] = useState(false)
  const [grupoAbierto, setGrupoAbierto] = useState<GrupoMenu['clave'] | null>(null)
  const [rutaAnterior, setRutaAnterior] = useState(ruta)
  const nav = useRef<HTMLElement>(null)

  // Al navegar se cierra todo
  if (ruta !== rutaAnterior) {
    setRutaAnterior(ruta)
    setDesplegado(null)
    setMenuAbierto(false)
  }

  useEffect(() => {
    if (!desplegado) return
    const fuera = (e: PointerEvent) => {
      if (!nav.current?.contains(e.target as Node)) setDesplegado(null)
    }
    const escape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setDesplegado(null)
    }
    document.addEventListener('pointerdown', fuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', fuera)
      document.removeEventListener('keydown', escape)
    }
  }, [desplegado])

  return (
    <header className="relative z-20 border-b-[3px] border-tinta bg-blanco">
      {/* Web */}
      <div className="contenedor hidden items-center justify-between gap-4 py-2 lg:flex">
        <Link href="/" className="text-tinta" aria-label="Visión 96.5 FM, ir al inicio">
          <Logo tamano={40} />
        </Link>
        <nav ref={nav} aria-label="Principal" className="flex gap-7">
          {menu.map((g) => (
            <div key={g.clave} className="relative">
              <button
                type="button"
                aria-expanded={desplegado === g.clave}
                onClick={() => setDesplegado(desplegado === g.clave ? null : g.clave)}
                className={`flex min-h-12 cursor-pointer items-center gap-1.5 text-[13px] font-extrabold tracking-[0.08em] uppercase ${
                  actual === g.clave ? 'shadow-[inset_0_-3px_0_var(--color-acento)]' : ''
                }`}
              >
                {g.etiqueta} <IconoFlechaAbajo />
              </button>
              {desplegado === g.clave && (
                <div className="absolute top-full -left-[18px] z-30 flex min-w-[260px] flex-col border-2 border-tinta bg-blanco">
                  {g.enlaces.map((e) => (
                    <Link
                      key={e.href}
                      href={e.href}
                      onClick={() => setDesplegado(null)}
                      aria-current={ruta === e.href ? 'page' : undefined}
                      className="border-b border-linea px-[18px] py-[13px] text-[15px] font-bold no-underline last:border-b-0 hover:text-acento-hover"
                    >
                      {e.etiqueta}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>
        <BotonEnVivo variante="header" compacto />
      </div>

      {/* Celular y tablet */}
      <div className="flex flex-col gap-3 px-4 py-3 md:px-6 lg:hidden">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="text-tinta" aria-label="Visión 96.5 FM, ir al inicio">
              <Logo tamano={34} />
            </Link>
            <BotonEnVivo variante="redondo" />
          </div>
          <button
            type="button"
            aria-label="Menú"
            aria-expanded={menuAbierto}
            aria-controls="menu-movil"
            onClick={() => setMenuAbierto(!menuAbierto)}
            className="flex size-11 cursor-pointer items-center justify-center bg-tinta text-blanco"
          >
            {menuAbierto ? <IconoCerrar /> : <IconoMenu />}
          </button>
        </div>
        <span className="text-xs text-meta">
          <FechaHoy anio={false} /> · Fray Bentos
        </span>
        {menuAbierto && (
          <nav id="menu-movil" aria-label="Principal" className="flex flex-col border-t-[3px] border-tinta">
            {menu.map((g) => {
              const abierto = grupoAbierto === g.clave
              return (
                <div key={g.clave} className="border-b border-linea">
                  <button
                    type="button"
                    aria-expanded={abierto}
                    onClick={() => setGrupoAbierto(abierto ? null : g.clave)}
                    className={`flex min-h-[52px] w-full cursor-pointer items-center justify-between text-[15px] font-extrabold tracking-[0.08em] uppercase ${
                      actual === g.clave ? 'text-acento' : ''
                    }`}
                  >
                    {g.etiqueta}
                    <span aria-hidden className="text-xl font-semibold">
                      {abierto ? '−' : '+'}
                    </span>
                  </button>
                  {abierto && (
                    <div className="flex flex-col pb-2">
                      {g.enlaces.map((e) => (
                        <Link
                          key={e.href}
                          href={e.href}
                          onClick={() => setMenuAbierto(false)}
                          aria-current={ruta === e.href ? 'page' : undefined}
                          className="flex min-h-11 items-center pl-3 text-base font-semibold no-underline"
                        >
                          {e.etiqueta}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
            <a
              href={`tel:${telefonoParaLink(telefono)}`}
              className="flex min-h-[52px] items-center font-extrabold no-underline"
            >
              Llamá a la radio: {telefono}
            </a>
          </nav>
        )}
      </div>
    </header>
  )
}
