'use client'

import { useEffect, useLayoutEffect, useRef } from 'react'

import type { ProgramaGrilla } from '../../datos/tipos'
import type { Dia, Emision } from '../../lib/grilla'
import { Rueda } from '../ui/Rueda'

const NOMBRE_DIA: Record<Dia, string> = {
  lun: 'Lun',
  mar: 'Mar',
  mie: 'Mié',
  jue: 'Jue',
  vie: 'Vie',
  sab: 'Sáb',
  dom: 'Dom',
}

const SALIDA = 'cubic-bezier(0.23, 1, 0.32, 1)'

const claveDe = (e: Emision<ProgramaGrilla>) => `${e.programa.id}-${e.fecha}-${e.inicio}`

type Lugar = { top: number; nodo: HTMLLIElement }

/** Dónde quedó cada programa de la lista. Los que no se ven (en el celular, del tercero en adelante) no cuentan. */
function medir(ol: HTMLOListElement) {
  const lugares = new Map<string, Lugar>()
  for (const li of ol.querySelectorAll<HTMLLIElement>(':scope > li[data-clave]')) {
    if (li.offsetParent && li.dataset.clave) lugares.set(li.dataset.clave, { top: li.offsetTop, nodo: li })
  }
  return lugares
}

/**
 * La lista corre un lugar: el que se fue sube y se apaga, los que quedan van de su lugar viejo al nuevo y
 * el que se suma entra desde abajo, cuando los demás ya se acomodaron.
 */
function correr(ol: HTMLOListElement, antes: Map<string, Lugar>, ahora: Map<string, Lugar>) {
  for (const [clave, { top, nodo }] of ahora) {
    const lugar = antes.get(clave)
    if (lugar) {
      const dy = lugar.top - top
      if (dy) {
        nodo.animate([{ transform: `translateY(${dy}px)` }, { transform: 'none' }], {
          duration: 560,
          delay: 80,
          easing: SALIDA,
          fill: 'backwards',
        })
      }
    } else {
      nodo.animate(
        [
          { opacity: 0, transform: 'translateY(18px)' },
          { opacity: getComputedStyle(nodo).opacity, transform: 'none' },
        ],
        { duration: 480, delay: 320, easing: SALIDA, fill: 'backwards' },
      )
    }
  }
  for (const [clave, { top, nodo }] of antes) {
    if (ahora.has(clave) || nodo.isConnected) continue
    // El que salió de la lista ya no está en la página: va una copia en su lugar de antes
    const copia = nodo.cloneNode(true) as HTMLLIElement
    copia.removeAttribute('data-clave')
    copia.setAttribute('aria-hidden', 'true')
    Object.assign(copia.style, {
      position: 'absolute',
      top: `${top}px`,
      left: '0',
      right: '0',
      pointerEvents: 'none',
    })
    // Al principio, para no cambiar cuál es el último de la lista (el que no lleva línea abajo)
    ol.prepend(copia)
    const sacar = () => copia.remove()
    copia
      .animate(
        [
          { opacity: getComputedStyle(copia).opacity, transform: 'none' },
          { opacity: 0, transform: 'translateY(-18px)' },
        ],
        { duration: 260, easing: 'ease-in', fill: 'forwards' },
      )
      .finished.then(sacar, sacar)
  }
}

/**
 * Los próximos programas del hero ("A continuación"). Cuando empieza otro programa, la lista corre un
 * lugar y "Más tarde" pasa a "Después". En el celular se ven los dos primeros. Con "reducir movimiento"
 * cambia sin animación.
 */
export function ListaSiguientes({ siguientes, hoy }: { siguientes: Emision<ProgramaGrilla>[]; hoy: Dia }) {
  const lista = useRef<HTMLOListElement>(null)
  /** Dónde estaba cada programa la última vez que se midió. */
  const lugares = useRef(new Map<string, Lugar>())
  const claves = siguientes.map(claveDe).join(' ')
  const hayLista = siguientes.length > 0

  // Cuando cambia la lista, cada programa se anima desde donde estaba
  useLayoutEffect(() => {
    const ol = lista.current
    if (!ol) {
      lugares.current = new Map()
      return
    }
    const antes = lugares.current
    const ahora = medir(ol)
    lugares.current = ahora
    if (!antes.size || matchMedia('(prefers-reduced-motion: reduce)').matches) return
    correr(ol, antes, ahora)
  }, [claves])

  // Si la lista cambia de tamaño (otro ancho de pantalla, la letra que termina de cargar), se vuelve a
  // medir: así el próximo cambio arranca desde donde están ahora
  useEffect(() => {
    const ol = lista.current
    if (!ol) return
    const observador = new ResizeObserver(() => {
      lugares.current = medir(ol)
    })
    observador.observe(ol)
    return () => observador.disconnect()
  }, [hayLista])

  if (!siguientes.length) {
    return <p className="py-4 text-sm text-oscuro-2">No hay más programas cargados por ahora.</p>
  }
  return (
    <ol ref={lista} className="relative m-0 list-none p-0">
      {siguientes.map((e, i) => (
        <li
          key={claveDe(e)}
          data-clave={claveDe(e)}
          className={`flex gap-3.5 border-b border-oscuro-linea py-3.5 transition-opacity duration-500 md:gap-4 md:py-4 lg:border-blanco/12 lg:last:border-b-0 ${
            i > 0 ? 'md:opacity-80' : ''
          } ${i > 1 ? 'max-md:hidden' : ''}`}
        >
          <span className="flex w-20 shrink-0 flex-col gap-[3px] md:w-[92px] md:gap-1">
            <span className="text-[13px] font-extrabold tabular-nums md:text-sm">
              {e.dia !== hoy && `${NOMBRE_DIA[e.dia]} `}
              {e.inicio}
            </span>
            <span className="text-[10px] font-extrabold tracking-[0.1em] text-vivo-claro uppercase md:text-[11px]">
              <Rueda texto={i === 0 ? 'Después' : 'Más tarde'} />
            </span>
          </span>
          <span className="flex flex-col gap-0.5">
            <span className="font-titulos text-xl leading-[1.15] font-semibold md:text-[22px]">
              {e.programa.nombre}
            </span>
            {e.programa.conduccion && (
              <span className="text-[13px] text-oscuro-2 md:text-sm">{e.programa.conduccion}</span>
            )}
          </span>
        </li>
      ))}
    </ol>
  )
}
