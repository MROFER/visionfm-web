import config from '@payload-config'
import { REST_GET } from '@payloadcms/next/routes'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

const restGet = REST_GET(config)

/**
 * Kit comercial en PDF de la página Pedir tarifas (docs/03-flujos.md, F6). Como los audios de las
 * entrevistas, vive en el bucket privado detrás de /cms-api; esta ruta pública lo entrega como un
 * visitante: con R2, redirige a una URL firmada que vence en 1 h; en desarrollo, lo lee del disco.
 */
export async function GET(request: Request) {
  const payload = await getPayload({ config })
  const { kitComercial: kit } = await payload.findGlobal({ slug: 'institucional', depth: 1, overrideAccess: false })
  if (!kit || typeof kit !== 'object' || !kit.filename || kit.privado) {
    return Response.json(
      { error: { codigo: 'NO_ENCONTRADO', mensaje: 'El kit comercial todavía no está disponible.' } },
      { status: 404, headers: { 'Cache-Control': 'no-store' } },
    )
  }
  const respuesta = await restGet(
    new Request(new URL(`/cms-api/archivos/file/${encodeURIComponent(kit.filename)}`, request.url)),
    { params: Promise.resolve({ slug: ['archivos', 'file', kit.filename] }) },
  )
  const encabezados = new Headers(respuesta.headers)
  encabezados.set('Cache-Control', 'private, no-store')
  encabezados.delete('set-cookie')
  if (respuesta.ok) encabezados.set('Content-Disposition', 'attachment; filename="kit-comercial-vision.pdf"')
  return new Response(respuesta.body, { status: respuesta.status, headers: encabezados })
}
