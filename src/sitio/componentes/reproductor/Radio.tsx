'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { alAire, type Emision } from '../../lib/grilla'
import type { ProgramaGrilla } from '../../datos/tipos'

// Un solo audio para todo el sitio (design/LEEME.md, sección 8). Vive en el layout, que no se vuelve a
// montar al navegar, así la radio no se corta al cambiar de página. Media Session, reconexión y
// entrevistas llegan en la fase 3.

type EstadoRadio = {
  sonando: boolean
  cargando: boolean
  error: boolean
  alternar: () => void
  alAire: Emision<ProgramaGrilla> | null
  grilla: ProgramaGrilla[]
  ahora: Date
}

const ContextoRadio = createContext<EstadoRadio | null>(null)

export function useRadio() {
  const radio = useContext(ContextoRadio)
  if (!radio) throw new Error('useRadio va dentro de <Radio>')
  return radio
}

/** Cada cuánto se recalcula qué programa está al aire. */
const CADA_MINUTO = 30_000

export function Radio({
  streamUrl,
  grilla,
  ahoraInicial,
  children,
}: {
  streamUrl: string
  grilla: ProgramaGrilla[]
  /** Hora del servidor al armar la página: el primer render coincide en el servidor y el navegador. */
  ahoraInicial: number
  children: React.ReactNode
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const [sonando, setSonando] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(false)
  // El HTML puede venir de la caché: apenas carga, el navegador recalcula con su reloj
  const [ahora, setAhora] = useState(() => new Date(ahoraInicial))

  useEffect(() => {
    const tic = () => setAhora(new Date())
    const primero = setTimeout(tic, 0)
    const intervalo = setInterval(tic, CADA_MINUTO)
    return () => {
      clearTimeout(primero)
      clearInterval(intervalo)
    }
  }, [])

  const alternar = useCallback(() => {
    const a = audio.current
    if (!a || !streamUrl) return
    if (!a.paused) {
      a.pause()
      // Soltar la conexión: al volver a escuchar arranca desde el vivo y no desde lo que quedó en memoria
      a.removeAttribute('src')
      a.load()
      return
    }
    setError(false)
    setCargando(true)
    a.src = streamUrl
    a.play().catch(() => {
      setCargando(false)
      setError(true)
    })
  }, [streamUrl])

  return (
    <ContextoRadio.Provider
      value={{ sonando, cargando, error, alternar, alAire: alAire(grilla, ahora), grilla, ahora }}
    >
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlaying={() => {
          setSonando(true)
          setCargando(false)
        }}
        onPause={() => setSonando(false)}
        onEmptied={() => setSonando(false)}
        onError={() => {
          if (audio.current?.getAttribute('src')) setError(true)
          setCargando(false)
          setSonando(false)
        }}
      />
    </ContextoRadio.Provider>
  )
}
