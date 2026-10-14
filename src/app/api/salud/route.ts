import config from '@payload-config'
import { getPayload } from 'payload'

export const dynamic = 'force-dynamic'

// Chequeo de salud para Coolify y el monitoreo externo: responde 200 si la app llega a la base
export async function GET() {
  try {
    const payload = await getPayload({ config })
    await payload.count({ collection: 'usuarios' })
    return Response.json({ estado: 'ok' }, { headers: { 'Cache-Control': 'no-store' } })
  } catch {
    return Response.json({ estado: 'sin-base' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
  }
}
