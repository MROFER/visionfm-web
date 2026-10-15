import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { purgarCloudflare, unir, URLS_POR_PURGA } from '@/base/cache'
import { mapaDeCache } from '@/sitio/cache/mapa'

const log = { info: vi.fn(), error: vi.fn() }

describe('purga de Cloudflare', () => {
  beforeEach(() => {
    vi.stubEnv('CF_ZONE_ID', 'zona')
    vi.stubEnv('CF_API_TOKEN', 'token')
    vi.stubEnv('NEXT_PUBLIC_SITE_URL', 'https://visionfm-labs.fraybentos.uy/')
  })
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('manda las URL completas, de a 30 por pedido', async () => {
    const buscar = vi.fn(async () => new Response('{}'))
    const rutas = Array.from({ length: 31 }, (_, i) => `/noticias/n${i}`)
    expect(await purgarCloudflare({ etiquetas: [], rutas }, log, buscar as never)).toBe(2)
    const primero = JSON.parse((buscar.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(primero.files).toHaveLength(URLS_POR_PURGA)
    expect(primero.files[0]).toBe('https://visionfm-labs.fraybentos.uy/noticias/n0')
  })

  it('purga todo cuando el cambio se ve en todas las páginas', async () => {
    const buscar = vi.fn(async () => new Response('{}'))
    await purgarCloudflare({ etiquetas: [], rutas: [], todo: true }, log, buscar as never)
    const cuerpo = JSON.parse((buscar.mock.calls[0] as unknown as [string, RequestInit])[1].body as string)
    expect(cuerpo).toEqual({ purge_everything: true })
  })

  it('sin credenciales no hace nada', async () => {
    vi.stubEnv('CF_API_TOKEN', '')
    const buscar = vi.fn()
    expect(await purgarCloudflare({ etiquetas: [], rutas: ['/'] }, log, buscar as never)).toBe(0)
    expect(buscar).not.toHaveBeenCalled()
  })

  it('si Cloudflare falla, lo registra y sigue', async () => {
    const buscar = vi.fn(async () => new Response('', { status: 500 }))
    expect(await purgarCloudflare({ etiquetas: [], rutas: ['/'] }, log, buscar as never)).toBe(0)
    expect(log.error).toHaveBeenCalled()
  })
})

describe('mapa de caché', () => {
  it('una nota refresca su URL, su sección, Noticias, Inicio y el RSS', async () => {
    const afectado = await mapaDeCache.colecciones.noticias(
      { id: 7, slug: 'obras-en-cerro-norte', seccion: 3 },
      async () => 'locales',
    )
    expect(afectado.etiquetas).toEqual(['noticias', 'nota:7', 'seccion:locales'])
    expect(afectado.rutas).toEqual(
      expect.arrayContaining(['/', '/noticias', '/rss.xml', '/noticias/locales', '/noticias/locales/obras-en-cerro-norte']),
    )
  })

  it('unir no repite rutas', () => {
    const a = { etiquetas: ['noticias'], rutas: ['/', '/noticias/a'] }
    const b = { etiquetas: ['noticias'], rutas: ['/', '/noticias/b'] }
    expect(unir(a, b).rutas).toEqual(['/', '/noticias/a', '/noticias/b'])
  })
})
