import config from '@payload-config'
import { REST_GET } from '@payloadcms/next/routes'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const restGet = REST_GET(config)

const noEncontrado = () =>
  Response.json(
    { error: { codigo: 'NO_ENCONTRADO', mensaje: 'No encontramos esa entrevista.' } },
    { status: 404, headers: { 'Cache-Control': 'no-store' } },
  )

/**
 * Audio de una entrevista publicada (docs/02-trd.md, sección 4). Los audios viven en el bucket privado
 * y su URL de Payload está en /cms-api, detrás de Cloudflare Access; esta ruta pública deja escuchar
 * solo los de entrevistas publicadas. Le pasa el pedido al manejador de archivos de Payload como un
 * visitante (sin cookies): con R2 responde con una redirección a una URL firmada que vence en 1 h; en
 * desarrollo, con el archivo desde el disco. El encabezado Range viaja para poder adelantar.
 */
export async function GET(request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  const payload = await getPayload({ config })
  const { docs } = await payload.find({
    collection: 'entrevistas',
    where: { slug: { equals: slug } },
    limit: 1,
    depth: 1,
    select: { audio: true },
    overrideAccess: false,
  })
  const audio = docs[0]?.audio
  if (!audio || typeof audio !== 'object' || !audio.filename || audio.privado) return noEncontrado()

  const pedido = new Request(new URL(`/cms-api/archivos/file/${encodeURIComponent(audio.filename)}`, request.url), {
    headers: request.headers.get('range') ? { range: request.headers.get('range')! } : {},
  })
  const respuesta = await restGet(pedido, {
    params: Promise.resolve({ slug: ['archivos', 'file', audio.filename] }),
  })
  // Nunca en la caché de Cloudflare: la URL firmada vence y la entrevista puede despublicarse
  const encabezados = new Headers(respuesta.headers)
  encabezados.set('Cache-Control', 'private, no-store')
  encabezados.delete('set-cookie')
  return new Response(respuesta.body, { status: respuesta.status, headers: encabezados })
}
