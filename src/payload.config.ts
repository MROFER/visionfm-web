import { postgresAdapter } from '@payloadcms/db-postgres'
import { nodemailerAdapter } from '@payloadcms/email-nodemailer'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { es } from '@payloadcms/translations/languages/es'
import path from 'path'
import { buildConfig } from 'payload'
import sharp from 'sharp'
import { fileURLToPath } from 'url'

import { tareaSincronizarAccess } from './base/acceso/sincronizar'
import { almacenamientoR2 } from './base/almacenamiento'
import { conRevalidacion } from './base/cache'
import { tienePermiso, type UsuarioConPermisos } from './base/permisos'
import { Archivos } from './base/collections/Archivos'
import { Medios } from './base/collections/Medios'
import { Paginas } from './base/collections/Paginas'
import { Redirecciones } from './base/collections/Redirecciones'
import { Usuarios } from './base/collections/Usuarios'
import { conRegistroDeActividad, RegistroActividad } from './base/registro'
import { Anuncios } from './sitio/collections/Anuncios'
import { AnunciosMetricas } from './sitio/collections/AnunciosMetricas'
import { Entrevistas } from './sitio/collections/Entrevistas'
import { Equipo } from './sitio/collections/Equipo'
import { ExcepcionesGrilla } from './sitio/collections/ExcepcionesGrilla'
import { Funciones } from './sitio/collections/Funciones'
import { Mensajes } from './sitio/collections/Mensajes'
import { Noticias } from './sitio/collections/Noticias'
import { Peliculas } from './sitio/collections/Peliculas'
import { Programas } from './sitio/collections/Programas'
import { Secciones } from './sitio/collections/Secciones'
import { mapaDeCache } from './sitio/cache/mapa'
import { tareasPublicidad } from './sitio/publicidad/tareas'
import { Ajustes } from './sitio/globals/Ajustes'
import { Cinevision } from './sitio/globals/Cinevision'
import { Institucional } from './sitio/globals/Institucional'
import { Portada } from './sitio/globals/Portada'
import { migrations } from './migrations'

const dirname = path.dirname(fileURLToPath(import.meta.url))

export default buildConfig(
  conRegistroDeActividad(
    conRevalidacion(
      {
        admin: {
          user: Usuarios.slug,
          importMap: {
            baseDir: path.resolve(dirname),
          },
          meta: {
            titleSuffix: ' · Visión 96.5 FM',
          },
        },
        // La API de Payload vive en /cms-api, detrás de Cloudflare Access igual que /admin.
        // /api queda para las rutas públicas propias del sitio (docs/02-trd.md, sección 4).
        routes: {
          admin: '/admin',
          api: '/cms-api',
        },
        graphQL: {
          disable: true,
        },
        i18n: {
          supportedLanguages: { es },
          fallbackLanguage: 'es',
        },
        collections: [
          Noticias,
          Secciones,
          Entrevistas,
          Programas,
          ExcepcionesGrilla,
          Equipo,
          Peliculas,
          Funciones,
          Anuncios,
          AnunciosMetricas,
          Mensajes,
          Paginas,
          Medios,
          Archivos,
          Usuarios,
          Redirecciones,
          RegistroActividad,
        ],
        globals: [Portada, Cinevision, Institucional, Ajustes],
        editor: lexicalEditor(),
        secret: process.env.PAYLOAD_SECRET || '',
        typescript: {
          outputFile: path.resolve(dirname, 'payload-types.ts'),
        },
        db: postgresAdapter({
          pool: {
            connectionString: process.env.DATABASE_URL || '',
          },
          // Nunca `push` fuera de desarrollo: producción aplica las migraciones versionadas al arrancar
          push: false,
          prodMigrations: migrations,
        }),
        // Sin SMTP configurado (desarrollo y tests), los emails se escriben en el log
        email: process.env.SMTP_HOST
          ? nodemailerAdapter({
              defaultFromAddress: process.env.EMAIL_FROM || 'no-responder@visionfm.uy',
              defaultFromName: 'Visión 96.5 FM',
              transportOptions: {
                host: process.env.SMTP_HOST,
                port: Number(process.env.SMTP_PORT || 587),
                secure: Number(process.env.SMTP_PORT) === 465,
                auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
              },
            })
          : undefined,
        // Cola de tareas: publicaciones programadas, aviso de vencimientos y reporte mensual.
        // Corre dentro del mismo proceso, cada minuto, solo en producción (en desarrollo y tests
        // las tareas se disparan a mano).
        jobs: {
          tasks: [tareaSincronizarAccess, ...tareasPublicidad],
          autoRun: [{ cron: '* * * * *', queue: 'default' }],
          shouldAutoRun: () => process.env.NODE_ENV === 'production',
          access: {
            queue: ({ req }) =>
              tienePermiso(req.user as unknown as UsuarioConPermisos, 'sistema', 'editarTodo'),
            run: ({ req }) =>
              tienePermiso(req.user as unknown as UsuarioConPermisos, 'sistema', 'editarTodo'),
            cancel: ({ req }) =>
              tienePermiso(req.user as unknown as UsuarioConPermisos, 'sistema', 'editarTodo'),
          },
        },
        plugins: almacenamientoR2(),
        sharp,
        telemetry: false,
      },
      mapaDeCache,
    ),
  ),
)
