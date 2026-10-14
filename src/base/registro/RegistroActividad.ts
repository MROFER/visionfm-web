import type { CollectionConfig } from 'payload'

import { tienePermiso, type UsuarioConPermisos } from '../permisos'

export const SLUG_REGISTRO = 'registroActividad'

// docs/04-esquema.md (registroActividad) y docs/07-permisos-y-publicidad.md (Registro de actividad)
export const RegistroActividad: CollectionConfig = {
  slug: SLUG_REGISTRO,
  labels: { singular: 'Registro de actividad', plural: 'Registro de actividad' },
  admin: {
    group: 'Sistema',
    useAsTitle: 'resumen',
    defaultColumns: ['fecha', 'quien', 'accion', 'resumen'],
    description: 'Todo cambio del panel: quién, qué, antes y después, cuándo y desde dónde. Nadie lo puede editar ni borrar.',
  },
  defaultSort: '-fecha',
  access: {
    read: ({ req }) => tienePermiso(req.user as unknown as UsuarioConPermisos, 'sistema', 'ver'),
    // Lo escriben solo los hooks del servidor; desde el panel y la API es de solo lectura, también para el Owner
    create: () => false,
    update: () => false,
    delete: () => false,
  },
  fields: [
    { name: 'fecha', type: 'date', required: true, index: true, admin: { date: { pickerAppearance: 'dayAndTime' } } },
    { name: 'quien', label: 'Quién', type: 'relationship', relationTo: 'usuarios', index: true },
    {
      name: 'accion',
      label: 'Acción',
      type: 'select',
      required: true,
      index: true,
      options: [
        { label: 'Creó', value: 'crear' },
        { label: 'Editó', value: 'editar' },
        { label: 'Borró', value: 'borrar' },
        { label: 'Cambió permisos', value: 'cambiar-permisos' },
        { label: 'Ingresó al panel', value: 'ingresar' },
        { label: 'Salió del panel', value: 'salir' },
      ],
    },
    { name: 'resumen', type: 'text' },
    { name: 'coleccion', label: 'Dónde', type: 'text', index: true },
    { name: 'documentoId', label: 'Id del contenido', type: 'text', index: true },
    { name: 'campos', label: 'Campos cambiados', type: 'json' },
    { name: 'antes', type: 'json' },
    { name: 'despues', label: 'Después', type: 'json' },
    { name: 'ip', label: 'IP', type: 'text' },
    { name: 'dispositivo', type: 'text' },
  ],
}
