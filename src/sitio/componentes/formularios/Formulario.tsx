'use client'

import Link from 'next/link'
import Script from 'next/script'
import { createContext, useContext, useId, useRef, useState } from 'react'

import {
  ACEPTA_ADJUNTO,
  CAMPOS,
  errorAdjunto,
  validarCampo,
  validarFormulario,
  type Opcion,
  type TipoFormulario,
  type Valores,
} from '../../formularios/campos'

// Formularios del sitio (docs/03-flujos.md, F6): avisan campo por campo al salir de cada uno, validan el
// adjunto antes de subirlo, pasan por Turnstile y, al enviarse, se reemplazan por la confirmación. Si
// falla la red, lo escrito queda.

type Contexto = { tipo: TipoFormulario; errores: Record<string, string> }
const ContextoFormulario = createContext<Contexto>({ tipo: 'contacto', errores: {} })

declare global {
  interface Window {
    turnstile?: { reset: (widget?: string) => void }
  }
}

type Estado = 'listo' | 'enviando' | 'enviado'

const SIN_RED = 'No pudimos enviar el mensaje. Revisá tu conexión y probá de nuevo.'

function leerValores(tipo: TipoFormulario, datos: FormData): Valores {
  const valores: Valores = { consentimiento: String(datos.get('consentimiento') ?? '') }
  for (const c of CAMPOS[tipo]) {
    const todos = datos.getAll(c.nombre).filter((v): v is string => typeof v === 'string')
    valores[c.nombre] = c.varios ? todos : (todos[0] ?? '')
  }
  return valores
}

export function Formulario({
  tipo,
  turnstile,
  boton,
  oscuro = false,
  children,
}: {
  tipo: TipoFormulario
  /** Clave pública de Turnstile; sin ella (desarrollo) no se carga */
  turnstile?: string
  boton: string
  /** Botón negro (Contacto) en vez de naranja */
  oscuro?: boolean
  children: React.ReactNode
}) {
  const [errores, setErrores] = useState<Record<string, string>>({})
  const [estado, setEstado] = useState<Estado>('listo')
  const [aviso, setAviso] = useState<string | null>(null)
  const formulario = useRef<HTMLFormElement>(null)
  const confirmacion = useRef<HTMLDivElement>(null)

  const marcar = (nombre: string, error: string | null) =>
    setErrores((previos) => {
      if ((previos[nombre] ?? null) === error) return previos
      const nuevos = { ...previos }
      if (error) nuevos[nombre] = error
      else delete nuevos[nombre]
      return nuevos
    })

  // Al salir de un campo de texto o lista, se valida ese campo
  const alSalir = (e: React.FocusEvent<HTMLFormElement>) => {
    const campo = e.target as unknown as HTMLInputElement
    if (!campo.name || campo.type === 'checkbox' || campo.type === 'file') return
    marcar(campo.name, validarCampo(tipo, campo.name, campo.value))
  }

  // Las casillas validan al marcarlas; los demás campos solo borran su error cuando ya se corrigió
  const alCambiar = (e: React.ChangeEvent<HTMLFormElement>) => {
    const campo = e.target as unknown as HTMLInputElement
    if (!campo.name || !formulario.current) return
    if (campo.type === 'checkbox') {
      const datos = new FormData(formulario.current)
      if (campo.name === 'consentimiento') marcar('consentimiento', campo.checked ? null : errores.consentimiento ?? null)
      else marcar(campo.name, validarCampo(tipo, campo.name, datos.getAll(campo.name) as string[]))
    } else if (campo.type !== 'file' && errores[campo.name] && !validarCampo(tipo, campo.name, campo.value)) {
      marcar(campo.name, null)
    }
  }

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (estado === 'enviando') return
    const form = e.currentTarget
    const datos = new FormData(form)
    const resultado = validarFormulario(tipo, leerValores(tipo, datos))
    const adjunto = datos.get('adjunto')
    const problemaAdjunto = adjunto instanceof File ? errorAdjunto(adjunto) : null
    const nuevos = { ...(resultado.ok ? {} : resultado.errores), ...(problemaAdjunto ? { adjunto: problemaAdjunto } : {}) }
    setErrores(nuevos)
    if (Object.keys(nuevos).length) {
      setAviso('Revisá los campos marcados.')
      enfocarPrimerError(form, nuevos)
      return
    }
    // Sin archivo elegido, el navegador igual manda un campo vacío
    if (adjunto instanceof File && adjunto.size === 0) datos.delete('adjunto')

    setEstado('enviando')
    setAviso(null)
    try {
      const respuesta = await fetch(`/api/formularios/${tipo}`, { method: 'POST', body: datos })
      if (respuesta.ok) {
        setEstado('enviado')
        requestAnimationFrame(() => confirmacion.current?.focus())
        return
      }
      const cuerpo = (await respuesta.json().catch(() => null)) as {
        error?: { mensaje?: string; errores?: Record<string, string> }
      } | null
      setEstado('listo')
      setAviso(cuerpo?.error?.mensaje ?? SIN_RED)
      if (cuerpo?.error?.errores) {
        setErrores(cuerpo.error.errores)
        enfocarPrimerError(form, cuerpo.error.errores)
      }
      window.turnstile?.reset()
    } catch {
      setEstado('listo')
      setAviso(SIN_RED)
      window.turnstile?.reset()
    }
  }

  if (estado === 'enviado') {
    return (
      <div
        ref={confirmacion}
        tabIndex={-1}
        role="status"
        className="flex flex-col gap-2 border-2 border-tinta p-5 outline-none md:p-8"
      >
        <span className="etiqueta text-acento">Enviado</span>
        <p className="m-0 font-titulos text-2xl leading-tight font-extrabold md:text-[32px]">
          Recibimos tu mensaje. Te respondemos a la brevedad.
        </p>
      </div>
    )
  }

  return (
    <ContextoFormulario.Provider value={{ tipo, errores }}>
      <form
        ref={formulario}
        noValidate
        onSubmit={enviar}
        onBlur={alSalir}
        onChange={alCambiar}
        aria-busy={estado === 'enviando'}
        className="flex flex-col gap-5 md:gap-6"
      >
        {children}

        <div className="flex flex-col gap-1">
          <label className="flex cursor-pointer items-start gap-3 text-sm leading-[1.5] text-texto-2 md:text-[15px]">
            <input
              type="checkbox"
              name="consentimiento"
              value="si"
              aria-invalid={Boolean(errores.consentimiento)}
              aria-describedby={errores.consentimiento ? 'error-consentimiento' : undefined}
              className="mt-0.5 size-5 shrink-0 accent-tinta"
            />
            <span>
              Acepto la{' '}
              <Link href="/legal/privacidad" className="font-bold text-tinta">
                política de privacidad
              </Link>{' '}
              y que Visión guarde estos datos para responderme.
            </span>
          </label>
          <MensajeError id="error-consentimiento" texto={errores.consentimiento} />
        </div>

        {turnstile && (
          <>
            <Script src="https://challenges.cloudflare.com/turnstile/v0/api.js" strategy="afterInteractive" />
            <div className="cf-turnstile" data-sitekey={turnstile} data-appearance="interaction-only" data-language="es" />
          </>
        )}

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-5">
          <button
            type="submit"
            disabled={estado === 'enviando'}
            className={`etiqueta min-h-12 cursor-pointer px-7 text-blanco disabled:cursor-wait disabled:opacity-70 md:min-h-[52px] md:self-start ${
              oscuro ? 'bg-tinta hover:bg-acento' : 'bg-acento hover:bg-acento-hover'
            }`}
          >
            {estado === 'enviando' ? 'Enviando…' : `${boton} →`}
          </button>
          <p aria-live="polite" className="m-0 text-sm font-bold text-acento empty:hidden md:text-[15px]">
            {aviso}
          </p>
        </div>
      </form>
    </ContextoFormulario.Provider>
  )
}

function enfocarPrimerError(form: HTMLFormElement, errores: Record<string, string>) {
  const primero = Array.from(form.elements).find(
    (el): el is HTMLInputElement => 'name' in el && Boolean(errores[(el as HTMLInputElement).name]),
  )
  primero?.focus()
}

const etiqueta = 'text-[11px] font-extrabold tracking-[0.1em] uppercase md:text-xs'
const caja =
  'w-full min-h-12 border-0 border-b-2 border-tinta bg-suave px-3.5 text-base text-tinta placeholder:text-meta focus:outline-2 focus:outline-offset-2 focus:outline-acento aria-[invalid=true]:border-acento md:px-4'

function MensajeError({ id, texto }: { id: string; texto?: string }) {
  if (!texto) return null
  return (
    <span id={id} className="text-[13px] font-bold text-acento md:text-sm">
      {texto}
    </span>
  )
}

function Rotulo({ htmlFor, texto, opcional }: { htmlFor?: string; texto: string; opcional?: boolean }) {
  const Elemento = htmlFor ? 'label' : 'span'
  return (
    // "(opcional)" al lado del rótulo, para que los campos de una misma fila queden alineados
    <Elemento htmlFor={htmlFor} className="flex items-baseline gap-1.5">
      <span className={etiqueta}>{texto}</span>
      {opcional && <span className="text-xs text-meta">(opcional)</span>}
    </Elemento>
  )
}

/** Dos campos lado a lado desde tablet; uno debajo del otro en el celular. */
export function Fila({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-col gap-5 md:grid md:grid-cols-2 md:gap-x-4 md:gap-y-6">{children}</div>
}

export function Texto({
  nombre,
  etiqueta: texto,
  tipo = 'text',
  opcional,
  autoComplete,
  placeholder,
  lineas,
}: {
  nombre: string
  etiqueta: string
  tipo?: 'text' | 'email' | 'tel' | 'url'
  opcional?: boolean
  autoComplete?: string
  placeholder?: string
  /** Área de texto con este alto en líneas */
  lineas?: number
}) {
  const { errores } = useContext(ContextoFormulario)
  const id = useId()
  const error = errores[nombre]
  const comunes = {
    id,
    name: nombre,
    placeholder,
    autoComplete,
    required: !opcional,
    'aria-invalid': Boolean(error),
    'aria-describedby': error ? `${id}-error` : undefined,
  }
  return (
    <div className="flex flex-col gap-1.5">
      <Rotulo htmlFor={id} texto={texto} opcional={opcional} />
      {lineas ? (
        <textarea {...comunes} rows={lineas} className={`${caja} resize-y py-3`} />
      ) : (
        <input {...comunes} type={tipo} inputMode={tipo === 'tel' ? 'tel' : undefined} className={caja} />
      )}
      <MensajeError id={`${id}-error`} texto={error} />
    </div>
  )
}

export function Seleccion({ nombre, etiqueta: texto, opciones }: { nombre: string; etiqueta: string; opciones: Opcion[] }) {
  const { errores } = useContext(ContextoFormulario)
  const id = useId()
  const error = errores[nombre]
  return (
    <div className="flex flex-col gap-1.5">
      <Rotulo htmlFor={id} texto={texto} />
      <select
        id={id}
        name={nombre}
        defaultValue={opciones[0]?.valor}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? `${id}-error` : undefined}
        className={`${caja} cursor-pointer`}
      >
        {opciones.map((o) => (
          <option key={o.valor} value={o.valor}>
            {o.nombre}
          </option>
        ))}
      </select>
      <MensajeError id={`${id}-error`} texto={error} />
    </div>
  )
}

/** Casillas de opción múltiple: chips (Sumarse) o tarjetas con detalle (dónde anunciar). */
export function Casillas({
  nombre,
  etiqueta: texto,
  opciones,
}: {
  nombre: string
  etiqueta: string
  opciones: (Opcion & { detalle?: string })[]
}) {
  const { errores } = useContext(ContextoFormulario)
  const id = useId()
  const error = errores[nombre]
  const tarjetas = opciones.some((o) => o.detalle)
  return (
    <fieldset
      aria-describedby={error ? `${id}-error` : undefined}
      className="m-0 flex min-w-0 flex-col gap-2.5 border-0 p-0"
    >
      <legend className={`${etiqueta} mb-2.5 p-0`}>{texto}</legend>
      <div className={tarjetas ? 'flex flex-col gap-3 md:grid md:grid-cols-3 md:gap-3' : 'flex flex-wrap gap-2 md:gap-2.5'}>
        {opciones.map((o) => (
          <label
            key={o.valor}
            className={`flex cursor-pointer border-2 border-tinta has-[:checked]:bg-tinta has-[:checked]:text-blanco has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-acento ${
              tarjetas ? 'items-start gap-3 p-4 md:p-5' : 'min-h-12 items-center gap-3 px-4 text-[15px] font-bold'
            }`}
          >
            <input
              type="checkbox"
              name={nombre}
              value={o.valor}
              aria-invalid={Boolean(error)}
              className={`size-5 shrink-0 accent-vivo ${tarjetas ? 'mt-1' : ''}`}
            />
            {tarjetas ? (
              <span className="flex flex-col gap-1">
                <span className="font-titulos text-2xl leading-none font-extrabold">{o.nombre}</span>
                <span className="text-sm leading-[1.5] opacity-80">{o.detalle}</span>
              </span>
            ) : (
              o.nombre
            )}
          </label>
        ))}
      </div>
      <MensajeError id={`${id}-error`} texto={error} />
    </fieldset>
  )
}

/** Adjunto opcional: valida tipo y tamaño apenas se elige y muestra el nombre del archivo. */
export function Adjunto({ texto }: { texto: string }) {
  const { errores } = useContext(ContextoFormulario)
  const [elegido, setElegido] = useState<{ nombre: string; peso: string } | null>(null)
  const [problema, setProblema] = useState<string | null>(null)
  const entrada = useRef<HTMLInputElement>(null)
  const id = useId()
  const error = problema ?? errores.adjunto

  const alElegir = (e: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = e.target.files?.[0]
    if (!archivo) return setElegido(null)
    const mal = errorAdjunto(archivo)
    setProblema(mal)
    if (mal) {
      e.target.value = ''
      setElegido(null)
      return
    }
    const mb = archivo.size / 1024 / 1024
    setElegido({ nombre: archivo.name, peso: mb >= 1 ? `${mb.toFixed(1).replace('.', ',')} MB` : `${Math.ceil(archivo.size / 1024)} KB` })
  }

  const quitar = () => {
    if (entrada.current) entrada.current.value = ''
    setElegido(null)
    setProblema(null)
  }

  return (
    <div className="flex flex-col gap-1.5">
      <Rotulo texto="Adjuntar archivo" opcional />
      <div className="flex items-stretch gap-2">
        <label
          htmlFor={id}
          className="flex min-h-14 flex-1 cursor-pointer items-center gap-3 border-2 border-dashed border-aviso-borde bg-suave px-3.5 text-[15px] text-texto-2 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-acento md:px-4"
        >
          <IconoClip />
          <span className="min-w-0 py-2">
            {elegido ? (
              <>
                <span className="font-bold break-all text-tinta">{elegido.nombre}</span> · {elegido.peso}
              </>
            ) : (
              texto
            )}
          </span>
          <input
            ref={entrada}
            id={id}
            type="file"
            name="adjunto"
            accept={ACEPTA_ADJUNTO}
            onChange={alElegir}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? `${id}-error` : undefined}
            className="sr-only"
          />
        </label>
        {elegido && (
          <button
            type="button"
            onClick={quitar}
            className="etiqueta cursor-pointer border-2 border-tinta px-3 hover:bg-tinta hover:text-blanco"
          >
            Quitar
          </button>
        )}
      </div>
      <MensajeError id={`${id}-error`} texto={error} />
    </div>
  )
}

const IconoClip = () => (
  <svg width={18} height={18} viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="shrink-0">
    <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
  </svg>
)
