// Campos y validación de los tres formularios del sitio (design/LEEME.md, sección 7; docs/03-flujos.md, F6).
// Lo usan el navegador, para avisar campo por campo, y POST /api/formularios/{tipo}, que vuelve a validar.

export const TIPOS_FORMULARIO = ['contacto', 'sumarse', 'tarifas'] as const
export type TipoFormulario = (typeof TIPOS_FORMULARIO)[number]

export const esTipoFormulario = (valor: string): valor is TipoFormulario =>
  (TIPOS_FORMULARIO as readonly string[]).includes(valor)

export type Opcion = { valor: string; nombre: string }

export const MOTIVOS: Opcion[] = [
  { valor: 'noticia', nombre: 'Noticia o aviso' },
  { valor: 'publicidad', nombre: 'Publicidad' },
  { valor: 'ser-parte', nombre: 'Ser parte' },
  { valor: 'cinevision', nombre: 'Cinevisión' },
  { valor: 'otro', nombre: 'Otro' },
]

export const AREAS_SUMARSE: Opcion[] = [
  { valor: 'columna', nombre: 'Columna u opinión' },
  { valor: 'conduccion', nombre: 'Conducción' },
  { valor: 'produccion', nombre: 'Producción' },
  { valor: 'redaccion', nombre: 'Redacción de noticias' },
  { valor: 'tecnico', nombre: 'Equipo técnico' },
  { valor: 'pasantia', nombre: 'Pasantía' },
  { valor: 'programa', nombre: 'Propuesta de programa' },
  { valor: 'cinevision', nombre: 'Cinevisión' },
]

export const DONDE_ANUNCIAR: (Opcion & { detalle: string })[] = [
  { valor: 'radio', nombre: 'Radio', detalle: 'Spots, menciones y auspicio de programas en el 96.5 FM.' },
  { valor: 'web', nombre: 'Web', detalle: 'Banner rotativo en todas las páginas del sitio.' },
  { valor: 'cine', nombre: 'Cine', detalle: 'Tu aviso en la página de la cartelera de Cinevisión.' },
]

// Los rangos de presupuesto los define el área comercial de la radio (el diseño los deja a confirmar)
export const PRESUPUESTOS: Opcion[] = [
  { valor: 'a-definir', nombre: 'A definir' },
  { valor: 'hasta-5000', nombre: 'Hasta $ 5.000' },
  { valor: '5000-15000', nombre: 'De $ 5.000 a $ 15.000' },
  { valor: 'mas-15000', nombre: 'Más de $ 15.000' },
]

export const PLAZOS: Opcion[] = [
  { valor: 'ya', nombre: 'Lo antes posible' },
  { valor: 'proximo-mes', nombre: 'En el próximo mes' },
  { valor: 'fecha-especial', nombre: 'Para una fecha especial' },
  { valor: 'averiguando', nombre: 'Solo estoy averiguando' },
]

/** Adjuntos: hasta 10 MB (docs/02-trd.md), foto, audio, video o documento. */
export const ADJUNTO_MAXIMO = 10 * 1024 * 1024
export const TIPOS_ADJUNTO: Record<string, string> = {
  'image/jpeg': 'foto',
  'image/png': 'foto',
  'image/webp': 'foto',
  'audio/mpeg': 'audio',
  'audio/mp4': 'audio',
  'audio/x-m4a': 'audio',
  'video/mp4': 'video',
  'application/pdf': 'documento',
  'application/msword': 'documento',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'documento',
}
/** Para el `accept` del campo: los navegadores no siempre conocen el tipo de un .m4a o un .docx. */
export const ACEPTA_ADJUNTO = [...Object.keys(TIPOS_ADJUNTO), '.m4a', '.doc', '.docx'].join(',')

export function errorAdjunto(archivo: { size: number; type: string } | null | undefined): string | null {
  if (!archivo || archivo.size === 0) return null
  if (!TIPOS_ADJUNTO[archivo.type]) return 'Ese tipo de archivo no se puede adjuntar. Probá con una foto, un audio, un video, un PDF o un Word.'
  if (archivo.size > ADJUNTO_MAXIMO) return `El archivo pesa ${Math.ceil(archivo.size / 1024 / 1024)} MB y el máximo es 10 MB.`
  return null
}

type Campo = {
  nombre: string
  requerido?: boolean
  /** Varias casillas con el mismo nombre */
  varios?: boolean
  opciones?: Opcion[]
  tipo?: 'email' | 'url' | 'telefono'
  maximo?: number
  /** Mensaje cuando falta */
  falta?: string
}

const NOMBRE: Campo = { nombre: 'nombre', requerido: true, maximo: 120, falta: 'Escribí tu nombre.' }
const EMAIL: Campo = { nombre: 'email', requerido: true, tipo: 'email', maximo: 200, falta: 'Escribí tu email.' }
const TELEFONO: Campo = { nombre: 'telefono', tipo: 'telefono', maximo: 40 }

export const CAMPOS: Record<TipoFormulario, Campo[]> = {
  contacto: [
    NOMBRE,
    EMAIL,
    { nombre: 'motivo', requerido: true, opciones: MOTIVOS },
    { nombre: 'mensaje', requerido: true, maximo: 5000, falta: 'Escribí tu mensaje.' },
  ],
  sumarse: [
    NOMBRE,
    EMAIL,
    { ...TELEFONO, requerido: true, falta: 'Escribí un teléfono para contactarte.' },
    { nombre: 'ciudad', maximo: 80 },
    { nombre: 'areas', requerido: true, varios: true, opciones: AREAS_SUMARSE, falta: 'Elegí al menos una opción.' },
    { nombre: 'mensaje', requerido: true, maximo: 5000, falta: 'Contanos un poco sobre vos.' },
    { nombre: 'link', tipo: 'url', maximo: 300 },
  ],
  tarifas: [
    { nombre: 'donde', requerido: true, varios: true, opciones: DONDE_ANUNCIAR, falta: 'Elegí dónde querés anunciar.' },
    { nombre: 'empresa', requerido: true, maximo: 120, falta: 'Escribí el nombre de la empresa o marca.' },
    { nombre: 'rubro', maximo: 80 },
    { ...NOMBRE, falta: 'Escribí el nombre de contacto.' },
    EMAIL,
    { ...TELEFONO, requerido: true, falta: 'Escribí un teléfono para contactarte.' },
    { nombre: 'presupuesto', requerido: true, opciones: PRESUPUESTOS },
    { nombre: 'plazo', requerido: true, opciones: PLAZOS },
    { nombre: 'mensaje', maximo: 5000 },
  ],
}

/** Qué formularios llevan adjunto (Pedir tarifas no tiene). */
export const CON_ADJUNTO: Record<TipoFormulario, boolean> = { contacto: true, sumarse: true, tarifas: false }

const EMAIL_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

function errorDeCampo(campo: Campo, valor: string | string[]): string | null {
  const valores = (Array.isArray(valor) ? valor : [valor]).map((v) => v.trim()).filter(Boolean)
  if (!valores.length) return campo.requerido ? (campo.falta ?? 'Completá este campo.') : null
  if (!campo.varios && valores.length > 1) return 'Elegí una sola opción.'
  if (campo.opciones && valores.some((v) => !campo.opciones!.some((o) => o.valor === v))) return 'Elegí una de las opciones.'
  const texto = valores[0]
  if (campo.maximo && texto.length > campo.maximo) return `Usá ${campo.maximo} caracteres como máximo.`
  if (campo.tipo === 'email' && !EMAIL_VALIDO.test(texto)) return 'Revisá el email: parece que le falta algo.'
  if (campo.tipo === 'telefono' && !/^[\d\s()+-]{6,}$/.test(texto)) return 'Revisá el teléfono: solo números, espacios y +.'
  if (campo.tipo === 'url' && !/^(https?:\/\/)?[^\s/]+\.[^\s]{2,}/i.test(texto)) return 'Revisá el link.'
  return null
}

export type Valores = Record<string, string | string[]>

/** Error de un solo campo, para avisar al salir de él. */
export function validarCampo(tipo: TipoFormulario, nombre: string, valor: string | string[]): string | null {
  const campo = CAMPOS[tipo].find((c) => c.nombre === nombre)
  return campo ? errorDeCampo(campo, valor) : null
}

export type Resultado =
  | { ok: true; datos: { nombre: string; email: string; telefono?: string; mensaje?: string; extra: Record<string, string | string[]> } }
  | { ok: false; errores: Record<string, string> }

/** Valida todo el formulario y separa los campos fijos de Mensajes de los propios de cada formulario. */
export function validarFormulario(tipo: TipoFormulario, valores: Valores): Resultado {
  const errores: Record<string, string> = {}
  const limpio: Record<string, string | string[]> = {}
  for (const campo of CAMPOS[tipo]) {
    const crudo = valores[campo.nombre] ?? (campo.varios ? [] : '')
    const error = errorDeCampo(campo, crudo)
    if (error) errores[campo.nombre] = error
    else if (campo.varios) limpio[campo.nombre] = (Array.isArray(crudo) ? crudo : [crudo]).map((v) => v.trim()).filter(Boolean)
    else {
      const texto = (Array.isArray(crudo) ? crudo[0] ?? '' : crudo).trim()
      if (texto) limpio[campo.nombre] = texto
    }
  }
  if (valores.consentimiento !== 'si') errores.consentimiento = 'Para enviar, aceptá la política de privacidad.'
  if (Object.keys(errores).length) return { ok: false, errores }

  const { nombre, email, telefono, mensaje, ...extra } = limpio as Record<string, string> & Record<string, string | string[]>
  return {
    ok: true,
    datos: {
      nombre: nombre as string,
      email: (email as string).toLowerCase(),
      ...(telefono ? { telefono: telefono as string } : {}),
      ...(mensaje ? { mensaje: mensaje as string } : {}),
      extra,
    },
  }
}

/** Nombre legible de un valor guardado (para el email y el panel). */
export function nombreDeOpcion(campo: string, valor: string): string {
  const lista =
    campo === 'motivo' ? MOTIVOS : campo === 'areas' ? AREAS_SUMARSE : campo === 'donde' ? DONDE_ANUNCIAR : campo === 'presupuesto' ? PRESUPUESTOS : campo === 'plazo' ? PLAZOS : []
  return lista.find((o) => o.valor === valor)?.nombre ?? valor
}
