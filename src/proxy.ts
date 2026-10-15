import { NextResponse, type NextRequest } from 'next/server'

import { configJwt, verificarJwt } from './base/acceso/jwt'

// /admin y /cms-api solo responden a pedidos que pasaron por Cloudflare Access (docs/02-trd.md).
// Sin CF_ACCESS_TEAM_DOMAIN y CF_ACCESS_AUD (local, tests) no se exige nada.
export async function proxy(request: NextRequest) {
  const cfg = configJwt()
  if (!cfg) return NextResponse.next()

  const token =
    request.headers.get('cf-access-jwt-assertion') ?? request.cookies.get('CF_Authorization')?.value
  if (await verificarJwt(token, cfg)) return NextResponse.next()

  return new NextResponse('Acceso denegado.', {
    status: 403,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/plain; charset=utf-8' },
  })
}

export const config = {
  matcher: ['/admin/:path*', '/cms-api/:path*'],
}
