'use client'

import { Rueda } from '../ui/Rueda'
import { useRadio } from './Radio'

/**
 * "Programa · Conducción" del programa que suena ahora. Sin programa cargado a esta hora, la radio. Con
 * `rodar`, cuando empieza otro programa el nombre nuevo sube en el lugar del viejo (barra de arriba).
 */
export function AlAireTexto({
  conConduccion = true,
  rodar = false,
}: {
  conConduccion?: boolean
  rodar?: boolean
}) {
  const { alAire } = useRadio()
  const texto = !alAire
    ? 'Visión FM 96.5'
    : conConduccion && alAire.programa.conduccion
      ? `${alAire.programa.nombre} · ${alAire.programa.conduccion}`
      : alAire.programa.nombre
  return rodar ? <Rueda texto={texto} /> : <>{texto}</>
}
