'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { alAire, type Emision, type ExcepcionEnGrilla } from '../../lib/grilla'
import type { ProgramaGrilla } from '../../datos/tipos'

// Un solo audio para todo el sitio (design/LEEME.md, sección 8). Vive en el layout, que no se vuelve a
// montar al navegar, así la radio no se corta al cambiar de página. Pasa la radio en vivo o una
// entrevista grabada, nunca las dos a la vez. Media Session y reconexión llegan en la fase 3.

/** Una entrevista lista para sonar. `src` es la ruta pública del audio (/api/entrevistas/…/audio). */
export type PistaEntrevista = { id: number; titulo: string; src: string }

type Pista = { tipo: 'vivo' } | ({ tipo: 'entrevista' } & PistaEntrevista)

type EstadoEntrevista = PistaEntrevista & {
  sonando: boolean
  cargando: boolean
  error: boolean
  /** Segundos escuchados y duración total (0 hasta que el navegador la conoce). */
  actual: number
  duracion: number
}

type EstadoRadio = {
  /** Estado de la radio en vivo: con una entrevista cargada, el vivo figura en pausa. */
  sonando: boolean
  cargando: boolean
  error: boolean
  /** Escuchar o pausar el vivo. Si sonaba una entrevista, la corta y pasa al vivo. */
  alternar: () => void
  /** La entrevista cargada en el reproductor, si hay una. */
  entrevista: EstadoEntrevista | null
  /** Pone una entrevista, o la pausa y la retoma si ya era esa. */
  reproducirEntrevista: (pista: PistaEntrevista) => void
  /** Salta a ese segundo de la entrevista cargada. */
  buscar: (segundos: number) => void
  /** De 0 a 1. Los celulares con iOS no dejan cambiarlo desde la página: ahí manda el botón del equipo. */
  volumen: number
  cambiarVolumen: (diferencia: number) => void
  alAire: Emision<ProgramaGrilla> | null
  grilla: ProgramaGrilla[]
  /** Cambios de grilla de hoy y la semana que viene. */
  excepciones: ExcepcionEnGrilla[]
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
/** Cada cuánto se vuelve a pedir la grilla, por si cargaron un cambio con la página abierta. */
const CADA_DIEZ_MINUTOS = 10 * 60_000

export function Radio({
  streamUrl,
  grilla: grillaInicial,
  excepciones: excepcionesIniciales,
  ahoraInicial,
  children,
}: {
  streamUrl: string
  grilla: ProgramaGrilla[]
  excepciones: ExcepcionEnGrilla[]
  /** Hora del servidor al armar la página: el primer render coincide en el servidor y el navegador. */
  ahoraInicial: number
  children: React.ReactNode
}) {
  const audio = useRef<HTMLAudioElement>(null)
  const [pista, setPista] = useState<Pista | null>(null)
  const [reproduciendo, setReproduciendo] = useState(false)
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState(false)
  const [actual, setActual] = useState(0)
  const [duracion, setDuracion] = useState(0)
  const [volumen, setVolumen] = useState(1)
  // El HTML puede venir de la caché: apenas carga, el navegador recalcula con su reloj
  const [ahora, setAhora] = useState(() => new Date(ahoraInicial))
  const [{ grilla, excepciones }, setGrilla] = useState({
    grilla: grillaInicial,
    excepciones: excepcionesIniciales,
  })

  // La grilla del HTML también puede venir de la caché: /api/grilla trae las excepciones al día
  useEffect(() => {
    const control = new AbortController()
    const pedir = () =>
      fetch('/api/grilla', { signal: control.signal })
        .then((r) =>
          r.ok
            ? (r.json() as Promise<{
                programas: ProgramaGrilla[]
                excepciones: ExcepcionEnGrilla[]
              }>)
            : null,
        )
        .then(
          (datos) =>
            datos && setGrilla({ grilla: datos.programas, excepciones: datos.excepciones }),
        )
        .catch(() => null)
    pedir()
    const intervalo = setInterval(pedir, CADA_DIEZ_MINUTOS)
    return () => {
      control.abort()
      clearInterval(intervalo)
    }
  }, [])

  useEffect(() => {
    const tic = () => setAhora(new Date())
    const primero = setTimeout(tic, 0)
    const intervalo = setInterval(tic, CADA_MINUTO)
    return () => {
      clearTimeout(primero)
      clearInterval(intervalo)
    }
  }, [])

  const arrancar = useCallback((a: HTMLAudioElement, src: string, nueva: Pista) => {
    setPista(nueva)
    setError(false)
    setCargando(true)
    setActual(0)
    setDuracion(0)
    a.src = src
    a.play().catch(() => {
      setCargando(false)
      setError(true)
    })
  }, [])

  const alternar = useCallback(() => {
    const a = audio.current
    if (!a || !streamUrl) return
    if (pista?.tipo === 'vivo' && !a.paused) {
      a.pause()
      // Soltar la conexión: al volver a escuchar arranca desde el vivo y no desde lo que quedó en memoria
      a.removeAttribute('src')
      a.load()
      return
    }
    arrancar(a, streamUrl, { tipo: 'vivo' })
  }, [streamUrl, pista, arrancar])

  const reproducirEntrevista = useCallback(
    (nueva: PistaEntrevista) => {
      const a = audio.current
      if (!a) return
      if (pista?.tipo === 'entrevista' && pista.id === nueva.id && a.getAttribute('src')) {
        if (a.paused) {
          setError(false)
          a.play().catch(() => setError(true))
        } else {
          a.pause()
        }
        return
      }
      arrancar(a, nueva.src, { tipo: 'entrevista', ...nueva })
    },
    [pista, arrancar],
  )

  const buscar = useCallback((segundos: number) => {
    const a = audio.current
    if (!a || !Number.isFinite(a.duration)) return
    a.currentTime = Math.min(Math.max(0, segundos), a.duration)
    setActual(a.currentTime)
  }, [])

  const cambiarVolumen = useCallback((diferencia: number) => {
    const a = audio.current
    if (!a) return
    const nuevo = Math.min(1, Math.max(0, Math.round((a.volume + diferencia) * 10) / 10))
    a.volume = nuevo
    setVolumen(nuevo)
  }, [])

  const enVivo = pista?.tipo === 'vivo'
  const entrevista: EstadoEntrevista | null =
    pista?.tipo === 'entrevista'
      ? {
          id: pista.id,
          titulo: pista.titulo,
          src: pista.src,
          sonando: reproduciendo,
          cargando,
          error,
          actual,
          duracion,
        }
      : null

  return (
    <ContextoRadio.Provider
      value={{
        sonando: enVivo && reproduciendo,
        cargando: enVivo && cargando,
        error: enVivo && error,
        alternar,
        entrevista,
        reproducirEntrevista,
        buscar,
        volumen,
        cambiarVolumen,
        alAire: alAire(grilla, ahora, excepciones),
        grilla,
        excepciones,
        ahora,
      }}
    >
      {children}
      <audio
        ref={audio}
        preload="none"
        onPlaying={() => {
          setReproduciendo(true)
          setCargando(false)
        }}
        onPause={() => setReproduciendo(false)}
        onEmptied={() => setReproduciendo(false)}
        onEnded={() => setReproduciendo(false)}
        onTimeUpdate={(e) => setActual(e.currentTarget.currentTime)}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration
          setDuracion(Number.isFinite(d) ? d : 0)
        }}
        onError={() => {
          if (audio.current?.getAttribute('src')) setError(true)
          setCargando(false)
          setReproduciendo(false)
        }}
      />
    </ContextoRadio.Provider>
  )
}
