'use client'

import Link from 'next/link'

import { IconoPausa, IconoPlay } from '../ui/iconos'
import { LogoApilado, LogoCompacto } from '../ui/Logo'
import { AlAireTexto } from './AlAire'
import { useRadio } from './Radio'

/**
 * Logo y radio del encabezado en celular y tablet. Sin sonar, el play queda en el medio de la pantalla.
 * Al tocarlo se corre a la izquierda y se abre una cápsula con lo que está al aire; el logo se achica al
 * tamaño de la hamburguesa. Tocar la cápsula abre el reproductor a pantalla completa (/radio/en-vivo).
 * Las animaciones están en estilos.css (.cabecera-celular).
 */
export function CabeceraCelular() {
  const { sonando, cargando, reconectando, alternar } = useRadio()
  const activo = sonando || cargando

  return (
    <div className="cabecera-celular" data-activo={activo || undefined}>
      <Link href="/" className="cabecera-logo text-tinta" aria-label="Visión 96.5 FM, ir al inicio">
        <LogoApilado className="cabecera-logo-entero block" />
        <LogoCompacto className="cabecera-logo-compacto" />
      </Link>
      <div className="cabecera-reproductor">
        <button
          type="button"
          onClick={alternar}
          aria-label={activo ? 'Pausar la radio en vivo' : 'Escuchar la radio en vivo'}
          aria-pressed={activo}
          className={`flex size-11 shrink-0 cursor-pointer items-center justify-center rounded-full bg-acento text-blanco hover:bg-acento-hover ${
            cargando ? 'motion-safe:animate-pulse' : ''
          }`}
        >
          {activo ? <IconoPausa /> : <IconoPlay />}
        </button>
        {activo && (
          <Link
            href="/radio/en-vivo"
            className="cabecera-capsula flex min-w-0 flex-1 items-center gap-1.5 pr-2.5 pl-2.5 text-blanco no-underline"
          >
            <span className="sr-only">Abrir el reproductor: </span>
            <span className="h-[18px] min-w-0 flex-1 overflow-hidden">
              <span
                className="cabecera-pista flex flex-col"
                data-sube={(sonando && !reconectando) || undefined}
              >
                <span className="flex h-[18px] items-center gap-1.5 text-[11px] font-extrabold tracking-[0.1em] whitespace-nowrap text-vivo-claro uppercase">
                  <span
                    aria-hidden
                    className="size-1.5 shrink-0 bg-vivo motion-safe:animate-pulse"
                  />
                  {reconectando ? 'Reconectando…' : cargando ? 'Conectando…' : 'Al aire · 96.5 FM'}
                </span>
                <span className="block h-[18px] truncate text-sm leading-[18px] font-bold">
                  <AlAireTexto conConduccion={false} />
                </span>
              </span>
            </span>
            <svg
              aria-hidden
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2.5}
              className="shrink-0"
            >
              <path d="M6 9l6 6 6-6" />
            </svg>
          </Link>
        )}
      </div>
    </div>
  )
}
