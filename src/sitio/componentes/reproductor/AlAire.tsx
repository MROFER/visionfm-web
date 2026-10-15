'use client'

import { useRadio } from './Radio'

/** "Programa · Conducción" del programa que suena ahora. Sin programa cargado a esta hora, la radio. */
export function AlAireTexto({ conConduccion = true }: { conConduccion?: boolean }) {
  const { alAire } = useRadio()
  if (!alAire) return <>Visión 96.5 FM</>
  const { nombre, conduccion } = alAire.programa
  return (
    <>
      {nombre}
      {conConduccion && conduccion ? ` · ${conduccion}` : ''}
    </>
  )
}
