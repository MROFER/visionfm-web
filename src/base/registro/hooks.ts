import type {
  CollectionAfterChangeHook,
  CollectionAfterDeleteHook,
  CollectionAfterLoginHook,
  CollectionAfterLogoutHook,
  Config,
  GlobalAfterChangeHook,
  PayloadRequest,
} from 'payload'

import { diferencias, dispositivoDe, ipDe } from './diferencias'
import { SLUG_REGISTRO } from './RegistroActividad'

/** Campos del usuario cuyo cambio se registra como "cambió permisos". */
const CAMPOS_DE_PERMISOS = new Set([
  'rol',
  'ajusteNoticiasPublicar',
  'motivoAjuste',
  'seccionesPermitidas',
  'activo',
  'esOwner',
])

type Entrada = {
  accion: 'crear' | 'editar' | 'borrar' | 'cambiar-permisos' | 'ingresar' | 'salir'
  coleccion: string
  documentoId?: string | number
  titulo?: unknown
  cambios?: ReturnType<typeof diferencias>
  quien?: number | string | null
}

async function registrar(req: PayloadRequest, entrada: Entrada) {
  const { accion, coleccion, documentoId, titulo, cambios, quien } = entrada
  await req.payload.create({
    collection: SLUG_REGISTRO,
    data: {
      fecha: new Date().toISOString(),
      quien: (quien ?? req.user?.id ?? null) as number | null,
      accion,
      resumen: [coleccion, titulo ? `"${String(titulo).slice(0, 120)}"` : documentoId]
        .filter(Boolean)
        .join(' · '),
      coleccion,
      documentoId: documentoId != null ? String(documentoId) : undefined,
      campos: cambios?.campos,
      antes: cambios?.antes,
      despues: cambios?.despues,
      ip: ipDe(req.headers),
      dispositivo: dispositivoDe(req.headers?.get('user-agent')),
    },
    req,
    overrideAccess: true,
  })
}

const tituloDe = (doc: Record<string, unknown>) =>
  doc.titulo ?? doc.nombre ?? doc.email ?? doc.alt ?? doc.filename

const alCambiar: CollectionAfterChangeHook = async ({
  collection,
  doc,
  previousDoc,
  operation,
  req,
}) => {
  const cambios = diferencias(operation === 'create' ? null : previousDoc, doc)
  // Guardados sin cambios reales (por ejemplo, un ingreso que actualiza la sesión) no se registran
  if (operation === 'update' && cambios.campos.length === 0) return doc

  const esPermiso = collection.auth && cambios.campos.some((campo) => CAMPOS_DE_PERMISOS.has(campo))
  await registrar(req, {
    accion: operation === 'create' ? 'crear' : esPermiso ? 'cambiar-permisos' : 'editar',
    coleccion: collection.slug,
    documentoId: doc.id,
    titulo: tituloDe(doc),
    cambios,
  })
  return doc
}

const alBorrar: CollectionAfterDeleteHook = async ({ collection, doc, req }) => {
  await registrar(req, {
    accion: 'borrar',
    coleccion: collection.slug,
    documentoId: doc.id,
    titulo: tituloDe(doc),
    cambios: diferencias(doc, null),
  })
}

const alIngresar: CollectionAfterLoginHook = async ({ collection, user, req }) => {
  await registrar(req, {
    accion: 'ingresar',
    coleccion: collection.slug,
    documentoId: user.id,
    quien: user.id,
  })
  return user
}

const alSalir: CollectionAfterLogoutHook = async ({ collection, req }) => {
  if (req.user)
    await registrar(req, { accion: 'salir', coleccion: collection.slug, documentoId: req.user.id })
}

const alCambiarFicha: GlobalAfterChangeHook = async ({ global, doc, previousDoc, req }) => {
  const cambios = diferencias(previousDoc, doc)
  if (cambios.campos.length > 0) {
    await registrar(req, {
      accion: 'editar',
      coleccion: global.slug,
      titulo: global.label ?? global.slug,
      cambios,
    })
  }
  return doc
}

/**
 * Suma el registro de actividad a todas las colecciones y fichas de la configuración,
 * así ninguna nueva queda sin registrar por olvido.
 */
export function conRegistroDeActividad(config: Config): Config {
  return {
    ...config,
    collections: (config.collections ?? []).map((coleccion) => {
      if (coleccion.slug === SLUG_REGISTRO) return coleccion
      const hooks = coleccion.hooks ?? {}
      return {
        ...coleccion,
        hooks: {
          ...hooks,
          afterChange: [...(hooks.afterChange ?? []), alCambiar],
          afterDelete: [...(hooks.afterDelete ?? []), alBorrar],
          ...(coleccion.auth
            ? {
                afterLogin: [...(hooks.afterLogin ?? []), alIngresar],
                afterLogout: [...(hooks.afterLogout ?? []), alSalir],
              }
            : {}),
        },
      }
    }),
    globals: (config.globals ?? []).map((ficha) => ({
      ...ficha,
      hooks: { ...ficha.hooks, afterChange: [...(ficha.hooks?.afterChange ?? []), alCambiarFicha] },
    })),
  }
}
