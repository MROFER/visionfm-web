'use client'

import type { TarjetaEntrevista } from '../../datos/formas'
import { useRadio } from '../reproductor/Radio'
import { reloj } from '../../lib/formato'
import { IconoPausa, IconoPlay } from '../ui/iconos'

const titulo = (e: TarjetaEntrevista) => `${e.entrevistado}: ${e.tema}`

/** Play/pausa de una entrevista con el reproductor del sitio. Sin audio cargado no se muestra. */
export function BotonEntrevista({
  entrevista,
  className,
  tamano = 16,
}: {
  entrevista: TarjetaEntrevista
  className: string
  tamano?: number
}) {
  const { entrevista: actual, reproducirEntrevista } = useRadio()
  if (!entrevista.audio) return <span aria-hidden className={`${className} invisible`} />
  const esta = actual?.id === entrevista.id
  const sonando = esta && actual.sonando
  return (
    <button
      type="button"
      onClick={() => reproducirEntrevista({ id: entrevista.id, titulo: titulo(entrevista), src: entrevista.audio! })}
      aria-label={`${sonando ? 'Pausar' : 'Escuchar'} la entrevista a ${entrevista.entrevistado}`}
      aria-pressed={sonando}
      className={`cursor-pointer ${esta && actual.cargando ? 'animate-pulse' : ''} ${className}`}
    >
      {sonando ? <IconoPausa tamano={tamano} /> : <IconoPlay tamano={tamano} />}
    </button>
  )
}

/** Barra de avance de la entrevista destacada: muestra lo escuchado y deja adelantar o volver. */
export function AvanceEntrevista({ entrevista }: { entrevista: TarjetaEntrevista }) {
  const { entrevista: actual, buscar } = useRadio()
  const esta = actual?.id === entrevista.id
  const duracion = (esta && actual.duracion) || entrevista.duracion || 0
  const escuchado = esta ? actual.actual : 0
  return (
    <div className="flex flex-1 flex-col gap-1.5">
      <input
        type="range"
        min={0}
        max={duracion || 1}
        step={1}
        value={escuchado}
        disabled={!esta || !actual.duracion}
        onChange={(e) => buscar(Number(e.target.value))}
        aria-label="Avance de la entrevista"
        aria-valuetext={`${reloj(escuchado)} de ${reloj(duracion)}`}
        className="avance h-1 w-full cursor-pointer appearance-none disabled:cursor-default"
        style={{
          background: `linear-gradient(to right, var(--color-vivo) ${duracion ? (escuchado / duracion) * 100 : 0}%, var(--color-oscuro-linea) 0)`,
        }}
      />
      <div className="flex justify-between text-xs text-oscuro-2 tabular-nums">
        <span>{reloj(escuchado)}</span>
        <span>{duracion ? reloj(duracion) : '--:--'}</span>
      </div>
      {esta && actual.error && (
        <p role="alert" className="m-0 text-[13px] text-vivo-claro">
          No pudimos cargar el audio. Probá de nuevo en un rato.
        </p>
      )}
    </div>
  )
}
