import type { Access, CollectionConfig, FieldAccess, Where } from 'payload'

import { tienePermiso, type UsuarioConPermisos } from '@/base/permisos'

/**
 * Quién ve qué mensajes (docs/07, roles de fábrica): quien gestiona Institucional ve todos;
 * Comercial ve los de publicidad (tarifas); el Editor, los de contacto y sumarse.
 */
const mensajesVisibles: Access = ({ req }) => {
  const usuario = req.user as unknown as UsuarioConPermisos | null
  if (tienePermiso(usuario, 'institucional', 'editarTodo')) return true
  const tipos: string[] = []
  if (tienePermiso(usuario, 'publicidad', 'editarTodo')) tipos.push('tarifas')
  else if (tienePermiso(usuario, 'institucional', 'ver')) tipos.push('contacto', 'sumarse')
  return tipos.length ? ({ tipo: { in: tipos } } satisfies Where) : false
}

const soloLectura: FieldAccess = () => false

// docs/04-esquema.md (mensajes). Se crean solo desde POST /api/formularios/{tipo} (con Turnstile),
// nunca desde el panel ni la API de Payload. En el panel solo se cambia el estado.
export const Mensajes: CollectionConfig = {
  slug: 'mensajes',
  labels: { singular: 'Mensaje', plural: 'Mensajes' },
  admin: {
    group: 'Institucional',
    useAsTitle: 'nombre',
    defaultColumns: ['tipo', 'nombre', 'email', 'estado', 'createdAt'],
  },
  defaultSort: '-createdAt',
  access: {
    read: mensajesVisibles,
    create: () => false,
    update: mensajesVisibles,
    delete: ({ req }) =>
      tienePermiso(req.user as unknown as UsuarioConPermisos, 'institucional', 'borrar'),
  },
  fields: [
    {
      name: 'tipo',
      type: 'select',
      required: true,
      index: true,
      access: { update: soloLectura },
      options: [
        { label: 'Contacto', value: 'contacto' },
        { label: 'Sumarse', value: 'sumarse' },
        { label: 'Tarifas de publicidad', value: 'tarifas' },
      ],
    },
    { name: 'nombre', type: 'text', required: true, access: { update: soloLectura } },
    { name: 'email', type: 'email', required: true, access: { update: soloLectura } },
    { name: 'telefono', label: 'Teléfono', type: 'text', access: { update: soloLectura } },
    {
      name: 'datos',
      type: 'json',
      access: { update: soloLectura },
      admin: { description: 'Campos propios de cada formulario.' },
    },
    { name: 'mensaje', type: 'textarea', access: { update: soloLectura } },
    {
      name: 'adjunto',
      type: 'upload',
      relationTo: 'archivos',
      access: { update: soloLectura },
    },
    {
      name: 'estado',
      type: 'select',
      required: true,
      defaultValue: 'nuevo',
      index: true,
      options: [
        { label: 'Nuevo', value: 'nuevo' },
        { label: 'Leído', value: 'leido' },
        { label: 'Respondido', value: 'respondido' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'consentimiento',
      type: 'group',
      access: { update: soloLectura },
      admin: { description: 'Aceptación de la política de privacidad (Ley 18.331).' },
      fields: [
        { name: 'aceptado', type: 'checkbox', required: true },
        {
          name: 'fecha',
          type: 'date',
          required: true,
          admin: { date: { pickerAppearance: 'dayAndTime' } },
        },
      ],
    },
  ],
}
