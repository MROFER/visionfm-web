import { APIError, type CollectionConfig, type FieldAccess, type Where } from 'payload'

import { actualizarListaAccess } from '../acceso/sincronizar'
import {
  NOMBRES_ROL,
  puedeAsignarRol,
  ROLES,
  ROLES_ASIGNABLES,
  type Rol,
  tienePermiso,
  type UsuarioConPermisos,
} from '../permisos'
import {
  exigirClaveSegura,
  exigirClaveSeguraAlRecuperar,
  mandarInvitacion,
  prepararInvitacion,
  reenviarInvitacion,
} from '../usuarios/invitacion'

const yo = (user: unknown) => user as UsuarioConPermisos | null

const gestionaUsuarios = (user: unknown) => tienePermiso(yo(user), 'sistema', 'editarTodo')

/** Solo quien gestiona usuarios, y nunca sobre sí mismo (regla 3 de delegación). */
const soloGestionSobreOtros: FieldAccess = ({ req, id }) =>
  gestionaUsuarios(req.user) && String(req.user?.id) !== String(id)

/** Campos que puede cambiar quien solo tiene Noticias → Aprobar, sobre periodistas y colaboradores. */
const CAMPOS_EDITORIALES = ['ajusteNoticiasPublicar', 'motivoAjuste', 'updatedAt'] as const

// docs/07-permisos-y-publicidad.md (etapa 1) y docs/04-esquema.md (usuarios)
export const Usuarios: CollectionConfig = {
  slug: 'usuarios',
  labels: { singular: 'Usuario', plural: 'Usuarios' },
  admin: {
    useAsTitle: 'nombre',
    defaultColumns: ['nombre', 'email', 'rol', 'activo'],
    group: 'Sistema',
  },
  auth: {
    maxLoginAttempts: 5,
    lockTime: 10 * 60 * 1000,
    tokenExpiration: 7 * 24 * 60 * 60,
    // "Olvidé mi contraseña" vale 1 h; la invitación usa el mismo mecanismo con 48 h
    forgotPassword: { expiration: 60 * 60 * 1000 },
  },
  endpoints: [reenviarInvitacion],
  access: {
    // Cada uno se ve a sí mismo; gestionar o aprobar notas permite ver al resto del equipo
    read: ({ req }) => {
      if (!req.user) return false
      if (gestionaUsuarios(req.user) || tienePermiso(yo(req.user), 'noticias', 'aprobar'))
        return true
      return { id: { equals: req.user.id } }
    },
    create: ({ req }) => gestionaUsuarios(req.user),
    update: ({ req }) => {
      if (!req.user) return false
      if (gestionaUsuarios(req.user)) return true
      if (tienePermiso(yo(req.user), 'noticias', 'aprobar')) {
        const propioOPeriodistas: Where = {
          or: [{ id: { equals: req.user.id } }, { rol: { in: ['periodista', 'colaborador'] } }],
        }
        return propioOPeriodistas
      }
      return { id: { equals: req.user.id } }
    },
    // Los usuarios no se borran: se desactivan, para que el registro conserve el autor
    delete: () => false,
  },
  hooks: {
    beforeOperation: [exigirClaveSeguraAlRecuperar],
    beforeValidate: [prepararInvitacion, exigirClaveSegura],
    afterChange: [mandarInvitacion, actualizarListaAccess],
    beforeLogin: [
      ({ user }) => {
        if (user?.activo === false) throw new APIError('Este usuario está desactivado.', 403)
        return user
      },
    ],
    beforeChange: [
      async ({ req, operation, data, originalDoc }) => {
        // El primer usuario del sistema es el Owner
        if (operation === 'create') {
          const { totalDocs } = await req.payload.count({
            collection: 'usuarios',
            req,
            overrideAccess: true,
          })
          if (totalDocs === 0) return { ...data, rol: 'owner', esOwner: true, activo: true }
        }

        const actor = yo(req.user)
        if (!actor) return data

        // El Owner es intocable para todos los demás (regla 4)
        if (
          operation === 'update' &&
          originalDoc?.esOwner &&
          String(actor.id) !== String(originalDoc.id)
        ) {
          throw new APIError('Solo el Owner puede modificar su propio usuario.', 403)
        }

        // Nadie da lo que no tiene (regla 1)
        const rolNuevo = data.rol as Rol | undefined
        if (rolNuevo && rolNuevo !== originalDoc?.rol && !puedeAsignarRol(actor, rolNuevo)) {
          throw new APIError(`No podés asignar el rol ${NOMBRES_ROL[rolNuevo]}.`, 403)
        }

        // Quien solo aprueba notas cambia únicamente el permiso de publicar de otros
        const esOtro = operation === 'update' && String(actor.id) !== String(originalDoc?.id)
        if (esOtro && !gestionaUsuarios(actor)) {
          const cambiados = Object.keys(data).filter(
            (campo) =>
              !CAMPOS_EDITORIALES.includes(campo as (typeof CAMPOS_EDITORIALES)[number]) &&
              JSON.stringify(data[campo]) !== JSON.stringify(originalDoc?.[campo]),
          )
          if (cambiados.length > 0) {
            throw new APIError('Solo podés cambiar si esta persona publica sin revisión.', 403)
          }
        }

        const ajuste = data.ajusteNoticiasPublicar ?? originalDoc?.ajusteNoticiasPublicar
        const motivo = data.motivoAjuste ?? originalDoc?.motivoAjuste
        if (ajuste && ajuste !== 'rol' && !motivo) {
          throw new APIError('Indicá el motivo del ajuste de permisos.', 400)
        }

        // Desactivar cierra todas sus sesiones; cambiar la contraseña cierra las demás
        if (operation === 'update' && data.activo === false && originalDoc?.activo !== false) {
          data.sessions = []
        } else if (operation === 'update' && data.password && String(actor.id) === String(originalDoc?.id)) {
          const actual = (req.user as { _sid?: string })._sid
          data.sessions = (originalDoc?.sessions ?? []).filter((s: { id: string }) => s.id === actual)
        }

        return data
      },
    ],
  },
  fields: [
    {
      name: 'nombre',
      type: 'text',
      required: true,
    },
    {
      name: 'rol',
      type: 'select',
      required: true,
      defaultValue: 'periodista',
      options: ROLES.map((rol) => ({ label: NOMBRES_ROL[rol], value: rol })),
      access: { update: soloGestionSobreOtros },
      admin: {
        description: `Se pueden asignar: ${ROLES_ASIGNABLES.map((r) => NOMBRES_ROL[r]).join(', ')}. Owner solo por transferencia.`,
      },
    },
    {
      name: 'ajusteNoticiasPublicar',
      label: 'Publica notas sin revisión',
      type: 'select',
      defaultValue: 'rol',
      options: [
        { label: 'Según su rol', value: 'rol' },
        { label: 'Sí, aunque su rol no lo tenga', value: 'permitir' },
        { label: 'No, aunque su rol lo tenga', value: 'quitar' },
      ],
      access: {
        update: ({ req, id }) =>
          String(req.user?.id) !== String(id) &&
          (gestionaUsuarios(req.user) || tienePermiso(yo(req.user), 'noticias', 'aprobar')),
      },
      admin: { description: 'Ajuste propio sobre el rol. Exige un motivo.' },
    },
    {
      name: 'motivoAjuste',
      label: 'Motivo del ajuste',
      type: 'text',
      admin: {
        condition: (_, s) =>
          Boolean(s?.ajusteNoticiasPublicar && s.ajusteNoticiasPublicar !== 'rol'),
      },
    },
    {
      name: 'seccionesPermitidas',
      label: 'Secciones permitidas',
      type: 'relationship',
      relationTo: 'secciones',
      hasMany: true,
      access: { update: soloGestionSobreOtros },
      admin: { description: 'Vacío = todas las secciones.' },
    },
    {
      name: 'equipo',
      label: 'Firma como',
      type: 'relationship',
      relationTo: 'equipo',
      access: { update: soloGestionSobreOtros },
      admin: { description: 'Ficha pública del equipo con la que firma sus notas.' },
    },
    {
      name: 'activo',
      type: 'checkbox',
      defaultValue: true,
      access: { update: soloGestionSobreOtros },
      admin: {
        position: 'sidebar',
        description: 'Desactivar impide entrar al panel. Los usuarios no se borran.',
      },
    },
    {
      name: 'reenviarInvitacion',
      type: 'ui',
      admin: {
        position: 'sidebar',
        condition: (_, __, { user }) => tienePermiso(yo(user), 'sistema', 'editarTodo'),
        components: { Field: '@/base/admin/ReenviarInvitacion#ReenviarInvitacion' },
      },
    },
    {
      name: 'esOwner',
      label: 'Owner',
      type: 'checkbox',
      defaultValue: false,
      access: { create: () => false, update: () => false },
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'recibeAvisosRevision',
      label: 'Recibe avisos de notas para revisar',
      type: 'checkbox',
      defaultValue: false,
    },
    {
      name: 'avisosEmail',
      label: 'Avisos por email',
      type: 'select',
      defaultValue: 'al-instante',
      options: [
        { label: 'Al instante', value: 'al-instante' },
        { label: 'Resumen por hora', value: 'resumen-por-hora' },
        { label: 'Nunca', value: 'nunca' },
      ],
    },
  ],
}
