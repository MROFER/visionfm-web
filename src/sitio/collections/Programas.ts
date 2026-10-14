import type { CollectionConfig } from 'payload'

import { campoSlug } from '@/base/fields/slug'
import { accesoPorArea } from '@/base/permisos'
import { choquesCon, DIAS, validarHorario, type Horario } from '../lib/grilla'

const NOMBRES_DIA: Record<(typeof DIAS)[number], string> = {
  lun: 'Lunes',
  mar: 'Martes',
  mie: 'Miércoles',
  jue: 'Jueves',
  vie: 'Viernes',
  sab: 'Sábado',
  dom: 'Domingo',
}

// docs/04-esquema.md (programas)
export const Programas: CollectionConfig = {
  slug: 'programas',
  labels: { singular: 'Programa', plural: 'Programas' },
  admin: { group: 'Radio', useAsTitle: 'nombre', defaultColumns: ['nombre', 'activo'] },
  access: accesoPorArea('radio', { lecturaPublica: true }),
  fields: [
    { name: 'nombre', type: 'text', required: true },
    campoSlug('nombre', { unique: true }),
    { name: 'descripcion', label: 'Descripción', type: 'textarea' },
    { name: 'conductores', type: 'relationship', relationTo: 'equipo', hasMany: true },
    { name: 'foto', type: 'upload', relationTo: 'medios' },
    {
      name: 'horarios',
      type: 'array',
      required: true,
      minRows: 1,
      admin: { description: 'Un horario que cruza la medianoche se carga como dos filas.' },
      fields: [
        {
          name: 'dias',
          label: 'Días',
          type: 'select',
          hasMany: true,
          required: true,
          options: DIAS.map((value) => ({ label: NOMBRES_DIA[value], value })),
        },
        {
          name: 'inicio',
          type: 'text',
          required: true,
          admin: { placeholder: '07:00', width: '50%' },
        },
        {
          name: 'fin',
          type: 'text',
          required: true,
          admin: { placeholder: '09:00', width: '50%' },
        },
      ],
      validate: async (valor, { req, id, siblingData }) => {
        const horarios = (valor ?? []) as Horario[]
        for (const h of horarios) {
          const error = validarHorario(h)
          if (error) return error
        }
        if ((siblingData as { activo?: boolean })?.activo === false) return true

        const { docs } = await req.payload.find({
          collection: 'programas',
          where: { activo: { not_equals: false }, ...(id ? { id: { not_equals: id } } : {}) },
          pagination: false,
          depth: 0,
          req,
        })
        const choques = choquesCon(
          horarios,
          docs.map((d) => ({ nombre: d.nombre, horarios: (d.horarios ?? []) as Horario[] })),
        )
        return choques.length ? `Se superpone con: ${choques.join(', ')}.` : true
      },
    },
    { name: 'activo', type: 'checkbox', defaultValue: true, admin: { position: 'sidebar' } },
  ],
}
