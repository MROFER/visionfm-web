import { s3Storage } from '@payloadcms/storage-s3'
import type { Plugin } from 'payload'

/**
 * Imágenes y archivos en Cloudflare R2 (docs/02-trd.md). Sin las variables R2_* (desarrollo y tests)
 * quedan en disco. `alwaysInsertFields` mantiene el mismo esquema de base con o sin R2.
 *
 * - `medios`: bucket público, servido directo desde el dominio de R2 (con caché de Cloudflare).
 * - `archivos`: bucket privado. Cada descarga pasa por el control de acceso de Payload (los adjuntos
 *   de formularios solo los ve Institucional) y redirige a una URL firmada que vence en 1 h.
 */
export function almacenamientoR2(): Plugin[] {
  const {
    R2_ACCOUNT_ID,
    R2_ACCESS_KEY_ID,
    R2_SECRET_ACCESS_KEY,
    R2_BUCKET,
    R2_BUCKET_PRIVADO,
    R2_PUBLIC_URL,
  } = process.env
  const config = {
    endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
    region: 'auto',
    credentials: {
      accessKeyId: R2_ACCESS_KEY_ID ?? '',
      secretAccessKey: R2_SECRET_ACCESS_KEY ?? '',
    },
  }
  const conCredenciales = Boolean(R2_ACCOUNT_ID && R2_ACCESS_KEY_ID && R2_SECRET_ACCESS_KEY)

  return [
    s3Storage({
      enabled: conCredenciales && Boolean(R2_BUCKET && R2_PUBLIC_URL),
      alwaysInsertFields: true,
      clientCacheKey: 'r2-publico',
      bucket: R2_BUCKET ?? '',
      config,
      collections: {
        medios: {
          prefix: 'medios',
          disablePayloadAccessControl: true,
          generateFileURL: ({ filename, prefix }) =>
            `${R2_PUBLIC_URL?.replace(/\/$/, '')}/${[prefix, filename].filter(Boolean).join('/')}`,
        },
      },
    }),
    s3Storage({
      enabled: conCredenciales && Boolean(R2_BUCKET_PRIVADO),
      alwaysInsertFields: true,
      clientCacheKey: 'r2-privado',
      bucket: R2_BUCKET_PRIVADO ?? '',
      config,
      collections: {
        archivos: {
          prefix: 'archivos',
          signedDownloads: { shouldUseSignedURL: () => true, expiresIn: 3600 },
        },
      },
    }),
  ]
}
