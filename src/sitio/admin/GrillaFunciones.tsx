'use client'

import { Button, toast, useConfig } from '@payloadcms/ui'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'

import { sumarDias } from '../publicidad/fechas'
import { lunesActual, rangoSemana } from '../cinevision/semana'

type Funcion = {
  id: number
  fechaHora: string
  idioma: string
  formato: string
  pelicula: { id: number; titulo?: string } | number
}

const ZONA = 'America/Montevideo'
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

const diaDe = (iso: string) => new Date(iso).toLocaleDateString('en-CA', { timeZone: ZONA })
const horaDe = (iso: string) =>
  new Date(iso).toLocaleTimeString('es-UY', {
    timeZone: ZONA,
    hour: '2-digit',
    minute: '2-digit',
    hourCycle: 'h23',
  })
const fechaCorta = (dia: string) =>
  new Date(`${dia}T12:00:00Z`).toLocaleDateString('es-UY', {
    day: 'numeric',
    month: 'short',
    timeZone: 'UTC',
  })

/** Grilla semanal de funciones arriba de la lista, con "Copiar semana anterior" (docs/03-flujos.md, P4). */
export function GrillaFunciones() {
  const {
    config: { routes, serverURL },
  } = useConfig()
  const router = useRouter()
  const [lunes, setLunes] = useState(() => lunesActual())
  const [funciones, setFunciones] = useState<Funcion[]>([])
  const [cargando, setCargando] = useState(true)
  const [copiando, setCopiando] = useState(false)
  const [recargas, setRecargas] = useState(0)
  const api = `${serverURL ?? ''}${routes.api}/funciones`

  // Se vuelve a pedir la semana al cambiar de semana o después de copiar
  useEffect(() => {
    let vigente = true
    const { desde, hasta } = rangoSemana(lunes)
    const consulta = new URLSearchParams({
      'where[and][0][fechaHora][greater_than_equal]': desde,
      'where[and][1][fechaHora][less_than]': hasta,
      sort: 'fechaHora',
      limit: '0',
      depth: '1',
    })
    fetch(`${api}?${consulta}`, { credentials: 'include' })
      .then((respuesta) => respuesta.json() as Promise<{ docs?: Funcion[] }>)
      .then((cuerpo) => {
        if (vigente) setFunciones(cuerpo.docs ?? [])
      })
      .catch(() => {
        if (vigente) toast.error('No se pudieron cargar las funciones.')
      })
      .finally(() => {
        if (vigente) setCargando(false)
      })
    return () => {
      vigente = false
    }
  }, [api, lunes, recargas])

  const irA = (nuevoLunes: string) => {
    setCargando(true)
    setLunes(nuevoLunes)
  }

  const copiar = async () => {
    if (!window.confirm('¿Copiar a esta semana las funciones de la semana anterior?')) return
    setCopiando(true)
    try {
      const respuesta = await fetch(`${api}/copiar-semana`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ semana: lunes }),
      })
      const cuerpo = (await respuesta.json()) as {
        creadas?: number
        omitidas?: number
        error?: string
      }
      if (!respuesta.ok) {
        toast.error(cuerpo.error ?? 'No se pudo copiar la semana.')
        return
      }
      const omitidas = cuerpo.omitidas
        ? ` (${cuerpo.omitidas} ya estaban o no se pudieron copiar)`
        : ''
      toast.success(`Se copiaron ${cuerpo.creadas} funciones${omitidas}.`)
      setCargando(true)
      setRecargas((n) => n + 1)
      router.refresh()
    } finally {
      setCopiando(false)
    }
  }

  const dias = DIAS.map((nombre, i) => {
    const dia = sumarDias(lunes, i)
    return { nombre, dia, funciones: funciones.filter((f) => diaDe(f.fechaHora) === dia) }
  })

  return (
    <section className="grilla-funciones" style={{ marginBottom: 'var(--base)' }}>
      <div
        style={{
          display: 'flex',
          flexWrap: 'wrap',
          gap: 8,
          alignItems: 'center',
          marginBottom: 12,
        }}
      >
        <Button buttonStyle="secondary" size="small" onClick={() => irA(sumarDias(lunes, -7))}>
          ← Semana anterior
        </Button>
        <strong>
          Semana del {fechaCorta(lunes)} al {fechaCorta(sumarDias(lunes, 6))}
        </strong>
        <Button buttonStyle="secondary" size="small" onClick={() => irA(sumarDias(lunes, 7))}>
          Semana siguiente →
        </Button>
        <Button size="small" onClick={copiar} disabled={copiando}>
          {copiando ? 'Copiando…' : 'Copiar semana anterior'}
        </Button>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8,
          opacity: cargando ? 0.5 : 1,
        }}
      >
        {dias.map(({ nombre, dia, funciones: delDia }) => (
          <div
            key={dia}
            style={{ border: '1px solid var(--theme-elevation-150)', borderRadius: 4, padding: 8 }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>
              {nombre} {fechaCorta(dia)}
            </div>
            {delDia.length === 0 && <div style={{ opacity: 0.6 }}>Sin funciones</div>}
            {delDia.map((f) => (
              <Link
                key={f.id}
                href={`${routes.admin}/collections/funciones/${f.id}`}
                style={{ display: 'block', marginBottom: 4, textDecoration: 'none' }}
              >
                <strong>{horaDe(f.fechaHora)}</strong>{' '}
                {typeof f.pelicula === 'object' ? (f.pelicula.titulo ?? 'Película') : 'Película'}{' '}
                <span style={{ opacity: 0.7 }}>
                  · {f.idioma === 'doblada' ? 'Dob.' : 'Sub.'} {f.formato.toUpperCase()}
                </span>
              </Link>
            ))}
          </div>
        ))}
      </div>
    </section>
  )
}
