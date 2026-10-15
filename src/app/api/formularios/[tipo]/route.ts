import config from '@payload-config'
import { getPayload, ValidationError } from 'payload'

import {
  CAMPOS,
  CON_ADJUNTO,
  errorAdjunto,
  esTipoFormulario,
  nombreDeOpcion,
  validarFormulario,
  type TipoFormulario,
  type Valores,
} from '@/sitio/formularios/campos'
import { ipDe, superaLimite, verificarTurnstile } from '@/sitio/formularios/servidor'

export const dynamic = 'force-dynamic'

const sinCache = { 'Cache-Control': 'private, no-store' }

const error = (status: number, codigo: string, mensaje: string, errores?: Record<string, string>) =>
  Response.json({ error: { codigo, mensaje, ...(errores ? { errores } : {}) } }, { status, headers: sinCache })

const ASUNTOS: Record<TipoFormulario, string> = {
  contacto: 'Nuevo mensaje de contacto',
  sumarse: 'Nueva propuesta para sumarse',
  tarifas: 'Nuevo pedido de tarifas',
}

const ETIQUETAS: Record<string, string> = {
  motivo: 'Motivo',
  ciudad: 'Ciudad',
  areas: 'Cómo le gustaría sumarse',
  link: 'Redes o portfolio',
  donde: 'Dónde quiere anunciar',
  empresa: 'Empresa o marca',
  rubro: 'Rubro',
  presupuesto: 'Presupuesto mensual',
  plazo: 'Cuándo quiere empezar',
}

/**
 * Envío de los formularios del sitio (docs/02-trd.md, sección 4; docs/03-flujos.md, F6). Recibe el
 * formulario como multipart, valida Turnstile, el límite por IP y los campos, guarda el adjunto como
 * archivo privado, crea el mensaje y avisa por email al destinatario de los Ajustes.
 */
export async function POST(request: Request, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params
  if (!esTipoFormulario(tipo)) return error(404, 'NO_ENCONTRADO', 'Ese formulario no existe.')

  let formulario: FormData
  try {
    formulario = await request.formData()
  } catch {
    return error(400, 'FORMATO', 'No pudimos leer el formulario.')
  }

  const ip = ipDe(request)
  const token = formulario.get('cf-turnstile-response')
  if (!(await verificarTurnstile(typeof token === 'string' ? token : null, ip))) {
    return error(403, 'ANTISPAM', 'No pudimos comprobar que no seas un robot. Recargá la página y probá de nuevo.')
  }

  const valores: Valores = { consentimiento: String(formulario.get('consentimiento') ?? '') }
  for (const campo of CAMPOS[tipo]) {
    const todos = formulario.getAll(campo.nombre).filter((v): v is string => typeof v === 'string')
    valores[campo.nombre] = campo.varios ? todos : (todos[0] ?? '')
  }
  const resultado = validarFormulario(tipo, valores)
  const adjunto = CON_ADJUNTO[tipo] ? formulario.get('adjunto') : null
  const archivo = adjunto instanceof File && adjunto.size > 0 ? adjunto : null
  const problemaAdjunto = errorAdjunto(archivo)
  if (!resultado.ok || problemaAdjunto) {
    const errores = { ...(resultado.ok ? {} : resultado.errores), ...(problemaAdjunto ? { adjunto: problemaAdjunto } : {}) }
    return error(400, 'VALIDACION', 'Revisá los campos marcados.', errores)
  }

  // El límite cuenta solo los envíos válidos: un error de tipeo no le gasta un intento a nadie
  if (superaLimite(ip)) {
    return error(429, 'LIMITE', 'Recibimos varios envíos seguidos desde tu conexión. Probá de nuevo en una hora.')
  }

  const payload = await getPayload({ config })
  const { datos } = resultado
  let adjuntoId: number | null = null
  if (archivo) {
    try {
      const subido = await payload.create({
        collection: 'archivos',
        data: { privado: true, descripcion: `Adjunto de ${tipo}: ${datos.nombre}` },
        file: {
          data: Buffer.from(await archivo.arrayBuffer()),
          mimetype: archivo.type,
          name: nombreSeguro(archivo.name),
          size: archivo.size,
        },
      })
      adjuntoId = subido.id
    } catch (err) {
      // Payload revisa el contenido real del archivo: un PDF roto o un .exe renombrado no pasa
      if (err instanceof ValidationError) {
        return error(400, 'VALIDACION', 'Revisá los campos marcados.', {
          adjunto: 'No pudimos leer ese archivo. Revisá que no esté dañado o probá con otro.',
        })
      }
      payload.logger.error({ err, msg: `No se pudo guardar el adjunto de ${tipo}` })
      return error(500, 'INTERNO', 'No pudimos enviar el mensaje. Probá de nuevo en un rato.')
    }
  }
  try {
    const mensaje = await payload.create({
      collection: 'mensajes',
      data: {
        tipo,
        nombre: datos.nombre,
        email: datos.email,
        telefono: datos.telefono,
        mensaje: datos.mensaje,
        datos: datos.extra,
        adjunto: adjuntoId,
        estado: 'nuevo',
        consentimiento: { aceptado: true, fecha: new Date().toISOString() },
      },
    })
    await avisar(payload, tipo, mensaje.id, datos)
  } catch (err) {
    payload.logger.error({ err, msg: `No se pudo guardar un mensaje de ${tipo}` })
    if (adjuntoId) await payload.delete({ collection: 'archivos', id: adjuntoId }).catch(() => null)
    return error(500, 'INTERNO', 'No pudimos enviar el mensaje. Probá de nuevo en un rato.')
  }

  return Response.json({ ok: true }, { status: 201, headers: sinCache })
}

/** Sin rutas ni caracteres raros en el nombre del archivo que se guarda. */
function nombreSeguro(nombre: string) {
  const limpio = nombre
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\w.-]+/g, '-')
    .replace(/^[.-]+/, '')
    .slice(-100)
  return limpio || 'adjunto'
}

type Payload = Awaited<ReturnType<typeof getPayload>>
type Datos = Extract<ReturnType<typeof validarFormulario>, { ok: true }>['datos']

/** Email al destinatario configurado en Ajustes; si falla, el mensaje igual queda en el panel. */
async function avisar(payload: Payload, tipo: TipoFormulario, id: number, datos: Datos) {
  const ajustes = await payload.findGlobal({ slug: 'ajustes', depth: 0 })
  const para = ajustes.emailsFormularios?.[tipo] || ajustes.email
  if (!para) return
  const lineas = [
    `${ASUNTOS[tipo]} desde el sitio.`,
    '',
    `Nombre: ${datos.nombre}`,
    `Email: ${datos.email}`,
    ...(datos.telefono ? [`Teléfono: ${datos.telefono}`] : []),
    ...Object.entries(datos.extra).map(
      ([campo, valor]) =>
        `${ETIQUETAS[campo] ?? campo}: ${(Array.isArray(valor) ? valor : [valor]).map((v) => nombreDeOpcion(campo, v)).join(', ')}`,
    ),
    ...(datos.mensaje ? ['', datos.mensaje] : []),
    '',
    `Verlo en el panel: ${process.env.NEXT_PUBLIC_SITE_URL ?? ''}/admin/collections/mensajes/${id}`,
  ]
  await payload
    .sendEmail({ to: para, replyTo: datos.email, subject: `${ASUNTOS[tipo]}: ${datos.nombre}`, text: lineas.join('\n') })
    .catch((err: unknown) => payload.logger.error({ err, msg: `No se pudo avisar del mensaje ${id}` }))
}
