'use client'

import { useRouter } from 'next/navigation'

import { aContinuacion } from '../../lib/grilla'
import { useRadio } from '../reproductor/Radio'
import { IconoPausa, IconoPlay, IconoVolumenMas, IconoVolumenMenos, IconoVolver } from '../ui/iconos'

const BARRAS = [14, 26, 34, 20, 30, 12, 24, 36, 18, 28, 16, 22]

/**
 * Reproductor a pantalla completa del celular (design/capturas/mobile-en-vivo.png). Tapa el header y el
 * pie; el audio sigue siendo el del layout, así al volver la radio no se corta.
 */
export function ReproductorPantalla({ children }: { children?: React.ReactNode }) {
  const router = useRouter()
  const { sonando, cargando, error, alternar, alAire, grilla, ahora, volumen, cambiarVolumen } = useRadio()
  const despues = aContinuacion(grilla, ahora, 1)[0]
  const volver = () => (window.history.length > 1 ? router.back() : router.push('/'))
  const circulo = 'flex items-center justify-center rounded-full'

  return (
    <div className="pantalla-completa fixed inset-0 z-50 flex flex-col gap-6 overflow-y-auto bg-tinta px-5 pt-4 pb-7 text-blanco">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={volver}
          aria-label="Volver"
          className="flex size-11 cursor-pointer items-center justify-center rounded-[12px] border border-oscuro-linea"
        >
          <IconoVolver />
        </button>
        <span className="flex items-center gap-2 text-xs font-bold tracking-[0.08em] uppercase">
          <span aria-hidden className="size-2 rounded-full bg-vivo" />
          En vivo
        </span>
        <span aria-hidden className="w-11" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center gap-7">
        <div className="flex aspect-square w-full max-w-[280px] flex-col items-center justify-center gap-1 rounded-[32px] border border-oscuro-linea bg-oscuro-caja">
          <span className="font-titulos text-7xl leading-none font-extrabold tracking-[-0.04em]">96.5</span>
          <span className="font-titulos text-[22px] font-bold text-vivo-claro">Visión FM</span>
        </div>
        <div aria-hidden className="flex h-9 items-end gap-[5px]">
          {BARRAS.map((alto, i) => (
            <span
              key={i}
              style={{ height: alto, animationDelay: `${(i % 5) * -0.18}s` }}
              className={`w-1.5 origin-bottom rounded-[3px] bg-vivo ${sonando ? 'motion-safe:animate-[ecualizador_0.9s_ease-in-out_infinite_alternate]' : 'opacity-40'}`}
            />
          ))}
        </div>
        <div className="flex flex-col gap-1.5 text-center">
          <h1 className="m-0 font-titulos text-[32px] leading-tight font-extrabold">
            {alAire?.programa.nombre ?? 'Visión 96.5 FM'}
          </h1>
          {alAire && (
            <p className="m-0 text-base text-oscuro-2">
              {alAire.programa.conduccion && `Con ${alAire.programa.conduccion} · `}
              {alAire.inicio}–{alAire.fin}
            </p>
          )}
          {error && (
            <p role="alert" className="m-0 text-sm text-vivo-claro">
              No pudimos conectar con la radio. Probá de nuevo en un rato.
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center justify-center gap-7">
        <button
          type="button"
          onClick={() => cambiarVolumen(-0.1)}
          disabled={volumen <= 0}
          aria-label="Bajar volumen"
          className={`${circulo} size-[52px] cursor-pointer border border-oscuro-linea disabled:opacity-40`}
        >
          <IconoVolumenMenos />
        </button>
        <button
          type="button"
          onClick={alternar}
          aria-label={sonando ? 'Pausar' : 'Escuchar en vivo'}
          aria-pressed={sonando}
          className={`${circulo} size-[88px] cursor-pointer bg-acento hover:bg-acento-hover ${cargando ? 'animate-pulse' : ''}`}
        >
          {sonando ? <IconoPausa tamano={32} /> : <IconoPlay tamano={32} />}
        </button>
        <button
          type="button"
          onClick={() => cambiarVolumen(0.1)}
          disabled={volumen >= 1}
          aria-label="Subir volumen"
          className={`${circulo} size-[52px] cursor-pointer border border-oscuro-linea disabled:opacity-40`}
        >
          <IconoVolumenMas />
        </button>
      </div>

      {children}

      {despues && (
        <div className="flex items-center justify-between gap-3 rounded-[16px] border border-oscuro-linea bg-oscuro-caja px-4 py-3.5">
          <span className="flex flex-col gap-0.5">
            <span className="text-xs font-bold tracking-[0.08em] text-oscuro-2 uppercase">A continuación</span>
            <span className="font-bold">{despues.programa.nombre}</span>
          </span>
          <span className="shrink-0 text-oscuro-2">{despues.inicio}</span>
        </div>
      )}
    </div>
  )
}
