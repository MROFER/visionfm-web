'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useRef, useState } from 'react'

import { grupoActual, telefonoParaLink, type GrupoMenu } from '../../navegacion'
import type { Clima } from '../../datos/clima'
import { BotonEnVivo } from '../reproductor/BotonEnVivo'
import { CabeceraCelular } from '../reproductor/CabeceraCelular'
import { IconoFlechaAbajo } from '../ui/iconos'
import { LogoApilado } from '../ui/Logo'
import { Cinta, type NotaCinta } from './Cinta'

// Cada línea de la hamburguesa del celular
const LINEA =
  'absolute right-0 h-[3px] w-7 bg-current transition-[translate,rotate,scale,opacity] duration-200 ease-out motion-reduce:transition-none'

/**
 * Header del sitio (design/LEEME.md, sección 6). Desde 1024 px: menú con desplegables y botón
 * "Escuchar en vivo". Más angosto: logo y radio animados (CabeceraCelular), hamburguesa con grupos en
 * acordeón y, debajo, la cinta con la fecha, las destacadas y el clima.
 */
export function Encabezado({
  menu,
  telefono,
  cinta,
}: {
  menu: GrupoMenu[]
  telefono: string
  cinta: { notas: NotaCinta[]; clima: Clima | null }
}) {
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

  // Con el menú del celular abierto, la página de atrás queda quieta
  useEffect(() => {
    if (!menuAbierto) return
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.documentElement.style.overflow = ''
    }
  }, [menuAbierto])

  return (
    <>
      {/* Celular: el menú abierto queda encima de la página, que se oscurece; tocarla lo cierra */}
      {menuAbierto && (
        <div
          aria-hidden
          onClick={() => setMenuAbierto(false)}
          className="fixed inset-0 z-[19] bg-tinta/60 lg:hidden"
        />
      )}
      <header className="relative z-20 border-b-[3px] border-tinta bg-blanco">
        {/* Web */}
        <div className="contenedor hidden items-center justify-between gap-4 py-2 lg:flex">
          <Link href="/" className="text-tinta" aria-label="Visión 96.5 FM, ir al inicio">
            <LogoApilado tamano={40} className="block" />
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
          <div className="relative">
            <CabeceraCelular />
            <button
              type="button"
              aria-label="Menú"
              aria-expanded={menuAbierto}
              aria-controls="menu-movil"
              onClick={() => setMenuAbierto(!menuAbierto)}
              className="absolute top-0 right-0 flex size-11 cursor-pointer items-center justify-end text-tinta"
            >
              {/* Tres líneas sin recuadro, alineadas al margen; al abrir, la de arriba y la de abajo giran y
                  forman la cruz, y la del medio se desvanece */}
              <span aria-hidden className="relative block h-5 w-7">
                <span className={`${LINEA} top-0 ${menuAbierto ? 'translate-y-[8.5px] rotate-45' : ''}`} />
                <span className={`${LINEA} top-[8.5px] ${menuAbierto ? 'scale-x-40 opacity-0' : ''}`} />
                <span className={`${LINEA} top-[17px] ${menuAbierto ? '-translate-y-[8.5px] -rotate-45' : ''}`} />
              </span>
            </button>
          </div>
          <Cinta notas={cinta.notas} clima={cinta.clima} />
          {menuAbierto && (
            // Encima de la página, sin empujarla: tapa la línea del encabezado y la repite abajo
            <div className="absolute inset-x-0 top-full z-10 border-b-[3px] border-tinta bg-blanco px-4 pb-3 shadow-[0_16px_24px_rgb(19_22_29/0.18)] md:px-6">
              <nav
                id="menu-movil"
                aria-label="Principal"
                // El encabezado es fijo: el menú abierto se desplaza adentro si no entra en la pantalla
                className="flex max-h-[calc(100dvh-7rem)] flex-col overflow-y-auto overscroll-contain border-t-[3px] border-tinta"
              >
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
            </div>
          )}
        </div>
      </header>
    </>
  )
}
