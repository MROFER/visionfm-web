import type { GlobalConfig } from 'payload'

import { accesoFichaPorArea, tienePermiso, type UsuarioConPermisos } from '@/base/permisos'

// docs/04-esquema.md (ajustes)
export const Ajustes: GlobalConfig = {
  slug: 'ajustes',
  label: 'Ajustes generales',
  admin: { group: 'Sistema' },
  access: accesoFichaPorArea('sistema'),
  fields: [
    { name: 'streamUrl', label: 'URL del stream', type: 'text', required: true },
    { name: 'telefono', label: 'Teléfono', type: 'text', required: true },
    { name: 'whatsapp', label: 'WhatsApp', type: 'text', required: true },
    { name: 'direccion', label: 'Dirección', type: 'text' },
    { name: 'email', type: 'email' },
    {
      name: 'redes',
      type: 'array',
      fields: [
        {
          name: 'red',
          type: 'select',
          required: true,
          options: ['instagram', 'facebook', 'x', 'youtube', 'tiktok', 'whatsapp'],
        },
        { name: 'url', type: 'text', required: true },
      ],
    },
    {
      name: 'emailsFormularios',
      label: 'A quién llegan los formularios',
      type: 'group',
      // Direcciones internas: no se publican
      access: {
        read: ({ req }) =>
          tienePermiso(req.user as unknown as UsuarioConPermisos, 'sistema', 'ver'),
      },
      fields: [
        { name: 'contacto', type: 'email' },
        { name: 'sumarse', type: 'email' },
        { name: 'tarifas', type: 'email' },
      ],
    },
    {
      name: 'avisoPropio',
      label: 'Aviso propio de la radio',
      type: 'group',
      admin: {
        description: 'Se muestra en las ubicaciones de publicidad que no tienen anuncios vigentes.',
      },
      fields: [
        {
          name: 'imagenWeb',
          label: 'Imagen escritorio (970×90)',
          type: 'upload',
          relationTo: 'medios',
        },
        {
          name: 'imagenMovil',
          label: 'Imagen celular (320×100)',
          type: 'upload',
          relationTo: 'medios',
        },
        {
          name: 'imagenRectangulo',
          label: 'Imagen celular en el medio de la página (300×250)',
          type: 'upload',
          relationTo: 'medios',
          admin: {
            description:
              'Para los avisos que van entre secciones, como en Cinevisión. Si falta, va la de 320×100.',
          },
        },
        { name: 'link', type: 'text', defaultValue: '/institucional/publicidad' },
      ],
    },
  ],
}
