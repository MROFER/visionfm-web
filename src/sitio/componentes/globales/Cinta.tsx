'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import type { Clima } from '../../datos/clima'
import { FechaHoy } from './FechaHoy'

export type NotaCinta = { titulo: string; href: string }

/** Cada cuánto pasa a la siguiente, en milisegundos. */
const INTERVALO = 4000

/**
 * La línea de abajo del encabezado en el celular: la fecha, las notas destacadas y el clima, una por vez
 * y subiendo como una cinta. Se frena mientras el dedo o el foco están encima, y con la pestaña oculta.
 */
export function Cinta({ notas, clima }: { notas: NotaCinta[]; clima: Clima | null }) {
  const items: React.ReactNode[] = [
    <span key="fecha">
      <FechaHoy anio={false} /> · Fray Bentos
    </span>,
    ...notas.map((n) => (
      <Link key={n.href} href={n.href} className="font-semibold text-tinta no-underline">
        <Etiqueta>Destacada</Etiqueta>
        {n.titulo}
      </Link>
    )),
  ]
  if (clima) {
    items.push(
      <span key="clima">
        <Etiqueta>Clima</Etiqueta>
        {clima.temperatura}° · {clima.estado} · Fray Bentos
      </span>,
    )
  }

  const [actual, setActual] = useState(0)
  // Al llegar a la copia de la fecha (el último renglón) se vuelve al primero sin animación
  const [sinTransicion, setSinTransicion] = useState(false)
  const [quieta, setQuieta] = useState(false)
  const total = items.length

  useEffect(() => {
    if (total < 2 || quieta) return
    const t = setInterval(() => {
      if (document.visibilityState === 'hidden') return
      setSinTransicion(false)
      setActual((a) => a + 1)
    }, INTERVALO)
    return () => clearInterval(t)
  }, [total, quieta])

  const alTerminar = () => {
    if (actual < total) return
    setSinTransicion(true)
    setActual(0)
  }

  return (
    <div
      className="h-[18px] overflow-hidden text-xs leading-[18px] text-meta"
      onPointerEnter={() => setQuieta(true)}
      onPointerLeave={() => setQuieta(false)}
      onFocus={() => setQuieta(true)}
      onBlur={() => setQuieta(false)}
    >
      <ul
        className={`m-0 flex list-none flex-col p-0 ${sinTransicion ? '' : 'transition-transform duration-500 ease-out motion-reduce:transition-none'}`}
        style={{ transform: `translateY(-${actual * 18}px)` }}
        onTransitionEnd={alTerminar}
      >
        {items.map((item, i) => (
          // Al recibir el foco con el teclado, ese renglón pasa a ser el visible
          <li key={i} className="h-[18px] truncate" onFocus={() => setActual(i)}>
            {item}
          </li>
        ))}
        {total > 1 && (
          <li aria-hidden className="h-[18px] truncate">
            <FechaHoy anio={false} /> · Fray Bentos
          </li>
        )}
      </ul>
    </div>
  )
}

function Etiqueta({ children }: { children: React.ReactNode }) {
  return (
    <b className="mr-2 text-[10px] font-extrabold tracking-[0.1em] text-acento uppercase">
      {children}
    </b>
  )
}
