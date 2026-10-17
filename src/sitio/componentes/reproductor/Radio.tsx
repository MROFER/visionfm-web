'use client'

import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

import { alAire, type Emision, type ExcepcionEnGrilla } from '../../lib/grilla'
import type { ProgramaGrilla } from '../../datos/tipos'

// Un solo audio para todo el sitio (design/LEEME.md, sección 8). Vive en el layout, que no se vuelve a
// montar al navegar, así la radio no se corta al cambiar de página. Pasa la radio en vivo o una
// entrevista grabada, nunca las dos a la vez. Si el vivo se corta, se reconecta solo; Media Session
// muestra qué suena en la pantalla bloqueada y deja pausar desde ahí o desde los auriculares.

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
  /** Se cortó el vivo y está volviendo a conectar solo. */
  reconectando: boolean
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
/** Esperas entre reintentos cuando se corta el vivo; después del último, se avisa el error. */
const REINTENTOS = [1000, 2000, 4000, 8000, 15_000, 30_000]
/** Si el vivo queda cargando más que esto, se da por cortado. */
const ESPERA_MAXIMA = 15_000
const PORTADA = [{ src: '/marca/icono-512.png', sizes: '512x512', type: 'image/png' }]
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
  const [reconectando, setReconectando] = useState(false)
  // Si la persona quiere escuchar el vivo: un corte de red no es una pausa
  const quiereVivo = useRef(false)
  const reintentos = useRef(0)
  const temporizador = useRef<ReturnType<typeof setTimeout>>(undefined)
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
    a.play().catch((e: unknown) => {
      const bloqueado = e instanceof DOMException && e.name === 'NotAllowedError'
      // En el vivo, un corte lo resuelve la reconexión (evento error), salvo que el navegador no deje sonar
      if (quiereVivo.current && !bloqueado) return
      quiereVivo.current = false
      setCargando(false)
      setError(true)
    })
  }, [])

  const olvidarReintentos = useCallback(() => {
    clearTimeout(temporizador.current)
    reintentos.current = 0
    setReconectando(false)
  }, [])

  const cortarVivo = useCallback(
    (a: HTMLAudioElement) => {
      quiereVivo.current = false
      olvidarReintentos()
      setCargando(false)
      a.pause()
      // Soltar la conexión: al volver a escuchar arranca desde el vivo y no desde lo que quedó en memoria
      a.removeAttribute('src')
      a.load()
    },
    [olvidarReintentos],
  )

  const escucharVivo = useCallback(
    (a: HTMLAudioElement) => {
      quiereVivo.current = true
      olvidarReintentos()
      arrancar(a, streamUrl, { tipo: 'vivo' })
    },
    [streamUrl, arrancar, olvidarReintentos],
  )

  /** El vivo se cortó sin que nadie lo pausara: vuelve a conectar, cada vez esperando un poco más. */
  const reconectar = useCallback(() => {
    const a = audio.current
    if (!a || !quiereVivo.current) return
    clearTimeout(temporizador.current)
    if (reintentos.current >= REINTENTOS.length) {
      quiereVivo.current = false
      setReconectando(false)
      setCargando(false)
      setError(true)
      return
    }
    const espera = REINTENTOS[reintentos.current++]
    setReconectando(true)
    setCargando(true)
    setError(false)
    temporizador.current = setTimeout(() => {
      if (!quiereVivo.current) return
      a.src = streamUrl
      a.play().catch((e: unknown) => {
        // Si el navegador ya no deja sonar sin un toque, no tiene sentido seguir probando
        if (e instanceof DOMException && e.name === 'NotAllowedError') {
          quiereVivo.current = false
          setReconectando(false)
          setCargando(false)
          setError(true)
        }
      })
    }, espera)
  }, [streamUrl])

  // Cuando vuelve la conexión del equipo, no esperar al próximo reintento
  useEffect(() => {
    const alVolver = () => {
      if (!quiereVivo.current) return
      reintentos.current = 0
      reconectar()
    }
    window.addEventListener('online', alVolver)
    return () => {
      window.removeEventListener('online', alVolver)
      clearTimeout(temporizador.current)
    }
  }, [reconectar])

  const alternar = useCallback(() => {
    const a = audio.current
    if (!a || !streamUrl) return
    if (pista?.tipo === 'vivo' && (!a.paused || quiereVivo.current)) return cortarVivo(a)
    escucharVivo(a)
  }, [streamUrl, pista, cortarVivo, escucharVivo])

  const reproducirEntrevista = useCallback(
    (nueva: PistaEntrevista) => {
      const a = audio.current
      if (!a) return
      quiereVivo.current = false
      olvidarReintentos()
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
    [pista, arrancar, olvidarReintentos],
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
  const programa = alAire(grilla, ahora, excepciones)

  // Pantalla bloqueada, auriculares y centro de control (Media Session)
  const titulo =
    pista?.tipo === 'entrevista' ? pista.titulo : (programa?.programa.nombre ?? 'Visión 96.5 FM')
  const artista =
    pista?.tipo === 'entrevista'
      ? 'Entrevista · Visión 96.5 FM'
      : programa?.programa.conduccion || 'En vivo · 96.5 FM'
  useEffect(() => {
    if (!pista || !('mediaSession' in navigator) || typeof MediaMetadata === 'undefined') return
    navigator.mediaSession.metadata = new MediaMetadata({
      title: titulo,
      artist: artista,
      album: 'Visión 96.5 FM',
      artwork: PORTADA,
    })
  }, [pista, titulo, artista])

  useEffect(() => {
    const a = audio.current
    if (!pista || !a || !('mediaSession' in navigator)) return
    const sesion = navigator.mediaSession
    const vivo = pista.tipo === 'vivo'
    const acciones: [MediaSessionAction, MediaSessionActionHandler | null][] = [
      ['play', () => (vivo ? escucharVivo(a) : void a.play().catch(() => setError(true)))],
      ['pause', () => (vivo ? cortarVivo(a) : a.pause())],
      ['stop', () => (vivo ? cortarVivo(a) : a.pause())],
      // En el vivo no hay para dónde adelantar
      ['seekbackward', vivo ? null : (d) => buscar(a.currentTime - (d.seekOffset ?? 10))],
      ['seekforward', vivo ? null : (d) => buscar(a.currentTime + (d.seekOffset ?? 30))],
      ['seekto', vivo ? null : (d) => d.seekTime !== undefined && buscar(d.seekTime)],
    ]
    for (const [accion, manejo] of acciones) {
      try {
        sesion.setActionHandler(accion, manejo)
      } catch {
        // Algunos navegadores no conocen todas las acciones
      }
    }
  }, [pista, escucharVivo, cortarVivo, buscar])

  useEffect(() => {
    if (!('mediaSession' in navigator)) return
    navigator.mediaSession.playbackState = !pista ? 'none' : reproduciendo ? 'playing' : 'paused'
  }, [pista, reproduciendo])

  useEffect(() => {
    if (pista?.tipo !== 'entrevista' || !duracion || !('mediaSession' in navigator)) return
    try {
      navigator.mediaSession.setPositionState({
        duration: duracion,
        position: Math.min(actual, duracion),
      })
    } catch {
      // Safari viejo no tiene setPositionState
    }
  }, [pista, actual, duracion])
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
        // Mientras reconecta sigue contando como sonando: los botones ofrecen cortar, no volver a escuchar
        sonando: enVivo && (reproduciendo || reconectando),
        cargando: enVivo && cargando,
        reconectando: enVivo && reconectando,
        error: enVivo && error,
        alternar,
        entrevista,
        reproducirEntrevista,
        buscar,
        volumen,
        cambiarVolumen,
        alAire: programa,
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
          clearTimeout(temporizador.current)
          reintentos.current = 0
          setReconectando(false)
          setReproduciendo(true)
          setCargando(false)
        }}
        onWaiting={() => {
          if (!quiereVivo.current) return
          clearTimeout(temporizador.current)
          temporizador.current = setTimeout(reconectar, ESPERA_MAXIMA)
        }}
        onPause={() => setReproduciendo(false)}
        onEmptied={() => setReproduciendo(false)}
        onEnded={() => {
          setReproduciendo(false)
          // Un vivo no termina: si terminó, el servidor cortó la conexión
          if (quiereVivo.current) reconectar()
        }}
        onTimeUpdate={(e) => setActual(e.currentTarget.currentTime)}
        onDurationChange={(e) => {
          const d = e.currentTarget.duration
          setDuracion(Number.isFinite(d) ? d : 0)
        }}
        onError={() => {
          setReproduciendo(false)
          if (quiereVivo.current) return reconectar()
          if (audio.current?.getAttribute('src')) setError(true)
          setCargando(false)
        }}
      />
    </ContextoRadio.Provider>
  )
}
