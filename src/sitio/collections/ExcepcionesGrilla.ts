import type { CollectionConfig } from 'payload'

import { accesoPorArea } from '@/base/permisos'
import { aMinutos, esHora } from '../lib/grilla'

const hora = (valor: unknown) => (esHora(valor) ? true : 'Formato HH:MM, por ejemplo 15:30.')

// docs/04-esquema.md (excepcionesGrilla): partidos, feriados o coberturas que reemplazan la grilla
export const ExcepcionesGrilla: CollectionConfig = {
  slug: 'excepcionesGrilla',
  labels: { singular: 'Excepción de grilla', plural: 'Excepciones de grilla' },
  admin: {
    group: 'Radio',
    useAsTitle: 'titulo',
    defaultColumns: ['fecha', 'inicio', 'fin', 'titulo', 'programa'],
  },
  defaultSort: '-fecha',
  access: accesoPorArea('radio', { lecturaPublica: true }),
  fields: [
    {
      name: 'fecha',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayOnly' } },
    },
    {
      name: 'inicio',
      type: 'text',
      required: true,
      validate: hora,
      admin: { placeholder: '15:00', width: '50%' },
    },
    {
      name: 'fin',
      type: 'text',
      required: true,
      admin: { placeholder: '17:00', width: '50%' },
      validate: (valor: unknown, { siblingData }: { siblingData: { inicio?: string } }) => {
        if (!esHora(valor)) return 'Formato HH:MM, por ejemplo 17:00.'
        if (
          valor !== '00:00' &&
          esHora(siblingData.inicio) &&
          aMinutos(valor) <= aMinutos(siblingData.inicio)
        ) {
          return 'El fin tiene que ser después del inicio.'
        }
        return true
      },
    },
    {
      name: 'programa',
      type: 'relationship',
      relationTo: 'programas',
      admin: { description: 'Un programa de la grilla, o bien un título suelto abajo.' },
    },
    {
      name: 'titulo',
      label: 'Título',
      type: 'text',
      admin: { placeholder: 'Fútbol: Laureles vs. Anglo' },
      validate: (valor: unknown, { siblingData }: { siblingData: { programa?: unknown } }) =>
        valor || siblingData.programa ? true : 'Elegí un programa o escribí un título.',
    },
    { name: 'conduccion', label: 'Conducción', type: 'text' },
  ],
}
