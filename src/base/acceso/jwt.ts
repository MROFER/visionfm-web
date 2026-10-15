import { createRemoteJWKSet, jwtVerify, type JWTVerifyGetKey } from 'jose'

// El servidor valida el JWT que agrega Cloudflare Access en /admin y /cms-api, por si alguien
// llega al servidor sin pasar por Cloudflare (docs/02-trd.md, sección de seguridad).

export type ConfigJwt = { equipo: string; aud: string }

/** `null` si Access no está configurado (local, tests): entonces no se exige el JWT. */
export function configJwt(env: Record<string, string | undefined> = process.env): ConfigJwt | null {
  const equipo = env.CF_ACCESS_TEAM_DOMAIN?.replace(/^https?:\/\//, '').replace(/\/$/, '')
  if (!equipo || !env.CF_ACCESS_AUD) return null
  return { equipo, aud: env.CF_ACCESS_AUD }
}

const llaves = new Map<string, JWTVerifyGetKey>()
const llavesDe = (equipo: string) => {
  if (!llaves.has(equipo)) {
    llaves.set(equipo, createRemoteJWKSet(new URL(`https://${equipo}/cdn-cgi/access/certs`)))
  }
  return llaves.get(equipo)!
}

/** Devuelve el email del JWT si es válido para esta aplicación; `null` si no. */
export async function verificarJwt(
  token: string | null | undefined,
  cfg: ConfigJwt,
  llaves: JWTVerifyGetKey = llavesDe(cfg.equipo),
): Promise<string | null> {
  if (!token) return null
  try {
    const { payload } = await jwtVerify(token, llaves, {
      issuer: `https://${cfg.equipo}`,
      audience: cfg.aud,
    })
    return typeof payload.email === 'string' ? payload.email : null
  } catch {
    return null
  }
}
