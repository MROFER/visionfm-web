import {
  Forbidden,
  type Access,
  type CollectionBeforeChangeHook,
  type CollectionConfig,
  type Where,
} from 'payload'

import { campoSeo } from '@/base/fields/seo'
import { campoSlug } from '@/base/fields/slug'
import {
  accesoPorArea,
  autorPorDefecto,
  lecturaPublicadoOArea,
  seccionesDe,
  soloPublicaQuienPuede,
  anotarSiEsBorrador,
  type UsuarioConPermisos,
} from '@/base/permisos'
import { aplicarFlujoEditorial, avisarCambioDeEstado } from '../hooks/flujo-noticias'

const usuarioDe = (req: { user?: unknown }) => req.user as UsuarioConPermisos | null

const idDe = (valor: unknown) =>
  valor && typeof valor === 'object' ? (valor as { id: unknown }).id : valor

/** Quien está limitado a ciertas secciones solo edita notas de esas secciones (docs/07, "Cómo se organiza"). */
const editar: Access = (args) => {
  const base = accesoPorArea('noticias', { campoAutor: 'autor' }).update(args)
  const usuario = usuarioDe(args.req)
  const secciones = usuario ? seccionesDe(usuario) : null
  if (!base || !secciones) return base
  const enSecciones: Where = { seccion: { in: secciones } }
  return base === true ? enSecciones : { and: [base as Where, enSecciones] }
}

const soloEnSeccionesPermitidas: CollectionBeforeChangeHook = ({ data, req }) => {
  const usuario = usuarioDe(req)
  const secciones = usuario ? seccionesDe(usuario) : null
  if (
    secciones &&
    data?.seccion !== undefined &&
    !secciones.map(String).includes(String(idDe(data.seccion)))
  ) {
    throw new Forbidden(req.t)
  }
  return data
}

// docs/04-esquema.md (noticias) y docs/03-flujos.md (P2, flujo editorial)
export const Noticias: CollectionConfig = {
  slug: 'noticias',
  labels: { singular: 'Nota', plural: 'Noticias' },
  admin: {
    group: 'Noticias',
    useAsTitle: 'titulo',
    defaultColumns: ['titulo', 'seccion', 'autor', 'estadoEditorial', 'fechaPublicacion'],
  },
  defaultSort: '-fechaPublicacion',
  versions: { drafts: { schedulePublish: true }, maxPerDoc: 50 },
  access: {
    ...accesoPorArea('noticias', { campoAutor: 'autor' }),
    read: lecturaPublicadoOArea('noticias'),
    update: editar,
  },
  hooks: {
    beforeOperation: [anotarSiEsBorrador],
    beforeChange: [
      autorPorDefecto(),
      soloEnSeccionesPermitidas,
      soloPublicaQuienPuede('noticias'),
      aplicarFlujoEditorial,
    ],
    afterChange: [avisarCambioDeEstado],
  },
  indexes: [
    { fields: ['seccion', 'slug'], unique: true },
    { fields: ['seccion', 'fechaPublicacion'] },
  ],
  fields: [
    { name: 'titulo', label: 'Título', type: 'text', required: true, maxLength: 120 },
    campoSlug('titulo', {
      admin: { description: 'Único dentro de la sección; cambiarlo cambia la URL.' },
    }),
    { name: 'bajada', type: 'textarea', required: true, minLength: 80, maxLength: 280 },
    { name: 'cuerpo', type: 'richText', required: true },
    { name: 'foto', type: 'upload', relationTo: 'medios', required: true },
    { name: 'epigrafe', label: 'Epígrafe', type: 'text' },
    {
      name: 'seccion',
      label: 'Sección',
      type: 'relationship',
      relationTo: 'secciones',
      required: true,
      admin: { position: 'sidebar' },
    },
    { name: 'autor', type: 'relationship', relationTo: 'usuarios', admin: { position: 'sidebar' } },
    {
      name: 'fechaPublicacion',
      label: 'Fecha de publicación',
      type: 'date',
      index: true,
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'fechaActualizacion',
      label: 'Actualizada',
      type: 'date',
      admin: { position: 'sidebar', date: { pickerAppearance: 'dayAndTime' } },
    },
    {
      name: 'estadoEditorial',
      label: 'Estado',
      type: 'select',
      required: true,
      defaultValue: 'borrador',
      index: true,
      options: [
        { label: 'Borrador', value: 'borrador' },
        { label: 'En revisión', value: 'en-revision' },
        { label: 'Devuelta', value: 'devuelta' },
        { label: 'Aprobada', value: 'aprobada' },
        { label: 'Publicada', value: 'publicada' },
      ],
      admin: { position: 'sidebar' },
    },
    {
      name: 'comentarioEditor',
      label: 'Comentario del editor',
      type: 'textarea',
      admin: { description: 'Motivo al devolver la nota; lo ve el autor.' },
    },
    {
      name: 'aprobadoPor',
      type: 'relationship',
      relationTo: 'usuarios',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'publicadoPor',
      type: 'relationship',
      relationTo: 'usuarios',
      admin: { position: 'sidebar', readOnly: true },
    },
    {
      name: 'destacada',
      type: 'checkbox',
      admin: { position: 'sidebar', description: 'Candidata a destacada.' },
    },
    campoSeo,
  ],
}
