import type { CollectionConfig, PayloadRequest } from 'payload'

import { accesoPorArea } from '@/base/permisos'
import { endpointCopiarSemana } from '../cinevision/copiarSemana'
import { FORMATOS, IDIOMAS } from './Peliculas'

type Datos = { pelicula?: unknown }

/** El idioma y el formato de la función tienen que ser de los que tiene la película. */
const deLaPelicula =
  (campo: 'idiomas' | 'formatos', nombre: string) =>
  async (valor: unknown, { siblingData, req }: { siblingData: Datos; req: PayloadRequest }) => {
    if (!valor) return 'Obligatorio.'
    const ref = siblingData.pelicula
    const id = ref && typeof ref === 'object' ? (ref as { id: number }).id : ref
    if (!id) return true
    const pelicula = await req.payload
      .findByID({ collection: 'peliculas', id: id as number, depth: 0, draft: true, req })
      .catch(() => null)
    if (!pelicula) return true
    return (pelicula[campo] as string[] | undefined)?.includes(String(valor))
      ? true
      : `La película no está cargada en ese ${nombre}.`
  }

// docs/04-esquema.md (funciones)
export const Funciones: CollectionConfig = {
  slug: 'funciones',
  labels: { singular: 'Función', plural: 'Funciones' },
  admin: {
    group: 'Cinevisión',
    defaultColumns: ['pelicula', 'fechaHora', 'idioma', 'formato'],
    components: { beforeListTable: ['@/sitio/admin/GrillaFunciones#GrillaFunciones'] },
  },
  endpoints: [endpointCopiarSemana],
  defaultSort: 'fechaHora',
  access: accesoPorArea('cinevision', { lecturaPublica: true }),
  indexes: [{ fields: ['pelicula', 'fechaHora'] }],
  fields: [
    {
      name: 'pelicula',
      label: 'Película',
      type: 'relationship',
      relationTo: 'peliculas',
      required: true,
    },
    {
      name: 'fechaHora',
      label: 'Fecha y hora',
      type: 'date',
      required: true,
      index: true,
      admin: { date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'idioma',
      type: 'select',
      required: true,
      options: IDIOMAS,
      validate: deLaPelicula('idiomas', 'idioma'),
    },
    {
      name: 'formato',
      type: 'select',
      required: true,
      options: FORMATOS,
      validate: deLaPelicula('formatos', 'formato'),
    },
  ],
}
