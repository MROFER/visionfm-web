import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

const dirname = path.dirname(fileURLToPath(import.meta.url))

const nextConfig: NextConfig = {
  // Imagen de Docker liviana: solo lo que el servidor necesita (docs/02-trd.md)
  output: 'standalone',
  poweredByHeader: false,
  turbopack: {
    root: path.resolve(dirname),
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }
    return webpackConfig
  },
}

const conPayload = withPayload(nextConfig, { devBundleServerPackages: false })
const encabezadosPayload = conPayload.headers

// Payload pide a todas las rutas el esquema de color del navegador (Accept-CH + Critical-CH) para el modo
// oscuro del panel. En el sitio eso obliga al navegador a repetir el primer pedido y suma un Vary que
// rompe la caché de Cloudflare, así que queda solo en /admin.
conPayload.headers = async () =>
  (encabezadosPayload ? await encabezadosPayload() : []).map((regla) =>
    regla.source === '/:path*' ? { ...regla, source: '/admin/:path*' } : regla,
  )

export default conPayload
