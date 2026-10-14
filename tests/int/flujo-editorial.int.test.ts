import config from '@payload-config'
import { getPayload, type Payload } from 'payload'
import sharp from 'sharp'
import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

import type { Noticia, Usuario } from '@/payload-types'

// Flujo editorial (docs/03-flujos.md, P2) aplicado en el servidor, con los permisos de cada rol.
let payload: Payload
let owner: Usuario
let editor: Usuario
let periodista: Usuario
let confiable: Usuario
let base: Omit<Noticia, 'id' | 'createdAt' | 'updatedAt' | 'titulo'>
let enviados: { to: string; subject: string }[] = []

const clave = 'Clave-de-prueba-123'
const comoUsuario = (user: Usuario) => ({ user, overrideAccess: false })

const invalido = (promesa: Promise<unknown>, mensaje: RegExp) =>
  expect(promesa).rejects.toSatisfy(
    (e: { status?: number; data?: { errors?: { message: string }[] } }) =>
      e.status === 400 && (e.data?.errors ?? []).some((x) => mensaje.test(x.message)),
  )

async function usuario(email: string, rol: Usuario['rol'], extra: Partial<Usuario> = {}) {
  return payload.create({
    collection: 'usuarios',
    data: { nombre: email, email, password: clave, rol, ...extra } as Usuario & {
      password: string
    },
    user: owner,
    overrideAccess: false,
  })
}

const crearBorrador = (titulo: string, como: Usuario) =>
  payload.create({
    collection: 'noticias',
    data: { ...base, titulo, slug: '' },
    draft: true,
    ...comoUsuario(como),
  })

const pasar = (id: number, data: Partial<Noticia>, como: Usuario, publicar = false) =>
  payload.update({
    collection: 'noticias',
    id,
    data: publicar ? { ...data, _status: 'published' } : data,
    draft: !publicar,
    ...comoUsuario(como),
  })

beforeAll(async () => {
  payload = await getPayload({ config })
  for (const c of ['noticias', 'medios', 'usuarios', 'secciones'] as const) {
    await payload.delete({ collection: c, where: { id: { exists: true } }, overrideAccess: true })
  }
  owner = await payload.create({
    collection: 'usuarios',
    data: { nombre: 'Dueño', email: 'owner@prueba.uy', password: clave, rol: 'periodista' },
  })
  editor = await usuario('editor@prueba.uy', 'editor', { recibeAvisosRevision: true })
  periodista = await usuario('periodista@prueba.uy', 'periodista')
  confiable = await usuario('confiable@prueba.uy', 'periodista', {
    ajusteNoticiasPublicar: 'permitir',
    motivoAjuste: 'Diez años en la radio',
  })

  const seccion = await payload.create({
    collection: 'secciones',
    data: { nombre: 'Locales', slug: '', orden: 1 },
  })
  const png = await sharp({ create: { width: 64, height: 64, channels: 3, background: '#06b' } })
    .png()
    .toBuffer()
  const foto = await payload.create({
    collection: 'medios',
    data: { alt: 'Prueba' },
    file: { data: png, mimetype: 'image/png', name: 'flujo.png', size: png.length },
  })
  base = {
    slug: '',
    bajada:
      'Una bajada de prueba con el largo suficiente para pasar la validación de ochenta caracteres.',
    cuerpo: {
      root: {
        type: 'root',
        format: '',
        indent: 0,
        version: 1,
        direction: null,
        children: [
          {
            type: 'paragraph',
            version: 1,
            children: [
              {
                type: 'text',
                text: 'Texto.',
                format: 0,
                style: '',
                mode: 'normal',
                detail: 0,
                version: 1,
              },
            ],
          },
        ],
      },
    },
    foto: foto.id,
    seccion: seccion.id,
    estadoEditorial: 'borrador',
  }

  vi.spyOn(payload, 'sendEmail').mockImplementation(async (mensaje) => {
    enviados.push(mensaje as { to: string; subject: string })
  })
})

beforeEach(() => {
  enviados = []
})

afterAll(async () => {
  vi.restoreAllMocks()
  await payload.delete({
    collection: 'noticias',
    where: { id: { exists: true } },
    overrideAccess: true,
  })
})

describe('flujo editorial', () => {
  it('el periodista envía a revisión y le llega el aviso al editor', async () => {
    const nota = await crearBorrador('Para revisar', periodista)
    const enviada = await pasar(nota.id, { estadoEditorial: 'en-revision' }, periodista)
    expect(enviada.estadoEditorial).toBe('en-revision')
    expect(enviados.map((m) => m.to)).toEqual(['editor@prueba.uy'])
  })

  it('el periodista no se aprueba a sí mismo', async () => {
    const nota = await crearBorrador('Autoaprobada', periodista)
    await invalido(pasar(nota.id, { estadoEditorial: 'aprobada' }, periodista), /editor/)
  })

  it('el editor devuelve con motivo y le avisa al autor', async () => {
    const nota = await crearBorrador('A devolver', periodista)
    await pasar(nota.id, { estadoEditorial: 'en-revision' }, periodista)
    await invalido(pasar(nota.id, { estadoEditorial: 'devuelta' }, editor), /motivo/)
    enviados = []
    const devuelta = await pasar(
      nota.id,
      { estadoEditorial: 'devuelta', comentarioEditor: 'Falta la fuente' },
      editor,
    )
    expect(devuelta.estadoEditorial).toBe('devuelta')
    expect(enviados).toEqual([expect.objectContaining({ to: 'periodista@prueba.uy' })])
  })

  it('el editor aprueba y publica: queda quién aprobó, quién publicó y la fecha', async () => {
    const nota = await crearBorrador('A publicar', periodista)
    await pasar(nota.id, { estadoEditorial: 'en-revision' }, periodista)
    const publicada = await pasar(nota.id, {}, editor, true)
    expect(publicada.estadoEditorial).toBe('publicada')
    expect(publicada._status).toBe('published')
    expect(publicada.fechaPublicacion).toBeTruthy()
    expect((publicada.publicadoPor as Usuario).id).toBe(editor.id)
    expect((publicada.aprobadoPor as Usuario).id).toBe(editor.id)
  })

  it('nadie se pone como aprobador por la API', async () => {
    const nota = await crearBorrador('Firma falsa', periodista)
    const guardada = await pasar(nota.id, { aprobadoPor: editor.id }, periodista)
    expect(guardada.aprobadoPor).toBeFalsy()
  })

  it('la corrección de un periodista a una nota publicada espera revisión', async () => {
    const nota = await crearBorrador('Original', periodista)
    await pasar(nota.id, { estadoEditorial: 'en-revision' }, periodista)
    await pasar(nota.id, {}, editor, true)

    const corregida = await pasar(nota.id, { titulo: 'Corregida sin revisar' }, periodista)
    expect(corregida.estadoEditorial).toBe('en-revision')

    const enElSitio = await payload.findByID({
      collection: 'noticias',
      id: nota.id,
      overrideAccess: false,
    })
    expect(enElSitio.titulo).toBe('Original')
  })

  it('el periodista no despublica una nota publicada', async () => {
    const nota = await crearBorrador('No se baja', periodista)
    await pasar(nota.id, { estadoEditorial: 'en-revision' }, periodista)
    await pasar(nota.id, {}, editor, true)
    await expect(
      payload.update({
        collection: 'noticias',
        id: nota.id,
        data: { _status: 'draft' },
        ...comoUsuario(periodista),
      }),
    ).rejects.toSatisfy((e: { status?: number }) => e.status === 403)
  })

  it('un periodista con Noticias → Publicar publica sin revisión', async () => {
    const nota = await crearBorrador('Sin revisión', confiable)
    const publicada = await pasar(nota.id, {}, confiable, true)
    expect(publicada.estadoEditorial).toBe('publicada')
  })

  it('al corregir una nota publicada con permiso, queda la fecha de actualización', async () => {
    const nota = await crearBorrador('Para actualizar', confiable)
    await pasar(nota.id, {}, confiable, true)
    const actualizada = await pasar(nota.id, { titulo: 'Actualizada' }, confiable, true)
    expect(actualizada.fechaActualizacion).toBeTruthy()
  })
})
