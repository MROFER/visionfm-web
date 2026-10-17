import { readFile } from 'node:fs/promises'
import path from 'node:path'

import { editorConfigFactory } from '@payloadcms/richtext-lexical'
import { JSDOM } from 'jsdom'
import type { Payload } from 'payload'
import sharp from 'sharp'

import { bajadaDe, recortar, rutaDe, slugDe, textoPlano, tituloDe } from './contenido'
import { aLexical, imagenesDe, prepararHtml, resolverImagenes, textoDelDocumento } from './lexical'
import { REVISION, SECCION_DE_CATEGORIA } from './revision'
import { esRutaSpam, limpiarSpam, motivoSpam } from './spam'
import { imagenDestacada, terminosDe, type ClienteWp, type PostWp } from './wordpress'

export type Resultado =
  | 'creada'
  | 'actualizada'
  | 'sin-cambios'
  | 'editada-en-el-panel'
  | 'spam'
  | 'omitida'
  | 'error'

export interface FilaInforme {
  id: number
  enlace: string
  titulo: string
  resultado: Resultado
  motivo?: string
  seccion?: string
  ruta?: string
  enlacesSpam?: number
  avisos?: string[]
}

export interface OpcionesImportar {
  cliente: ClienteWp
  /** Slug de la sección para las notas cuya categoría no tiene equivalente. */
  seccionPorDefecto: string
  /** Solo informa: no baja imágenes ni escribe en la base. */
  seco?: boolean
  limite?: number
  registrar?: (mensaje: string) => void
}

const TIPOS_IMAGEN = ['image/jpeg', 'image/png', 'image/webp', 'image/avif']
const ORIGEN_SIN_FOTO = 'visionfm:sin-foto'
// Una nota editada en el panel después de importada no se pisa con lo que tenga el WordPress viejo
const MARGEN_EDICION_MS = 60_000

const fechaWp = (gmt: string) => new Date(`${gmt.replace(/Z?$/, '')}Z`).toISOString()

/**
 * Trae las notas del WordPress viejo (docs/05-plan.md, fase 4). Cada nota se identifica por el id de
 * su post: una segunda corrida solo crea lo nuevo, actualiza lo que cambió allá y no toca lo que se
 * editó en el panel. Cada dirección vieja queda en Redirecciones: 301 a la nota nueva o 410 si es spam.
 */
export async function importarNotas(payload: Payload, opciones: OpcionesImportar) {
  const { cliente, seco = false, registrar = () => {} } = opciones
  const filas: FilaInforme[] = []
  const editorConfig = await editorConfigFactory.default({ config: payload.config })

  const { docs: secciones } = await payload.find({
    collection: 'secciones',
    limit: 100,
    depth: 0,
    pagination: false,
  })
  const idSeccion = new Map(secciones.map((s) => [s.slug, s.id]))
  if (!idSeccion.has(opciones.seccionPorDefecto)) {
    throw new Error(
      `No existe la sección "${opciones.seccionPorDefecto}". Secciones: ${[...idSeccion.keys()].join(', ')}`,
    )
  }

  async function redirigir(desde: string, hacia: string | null) {
    if (seco || (hacia && desde.replace(/\/$/, '') === hacia)) return
    const tipo = hacia ? ('301' as const) : ('410' as const)
    const { docs } = await payload.find({
      collection: 'redirecciones',
      where: { desde: { equals: desde } },
      limit: 1,
      depth: 0,
    })
    const actual = docs[0]
    if (actual && actual.tipo === tipo && (actual.hacia ?? null) === hacia) return
    if (actual) {
      await payload.update({ collection: 'redirecciones', id: actual.id, data: { hacia, tipo } })
    } else {
      await payload.create({ collection: 'redirecciones', data: { desde, hacia, tipo } })
    }
  }

  const medios = new Map<string, number | null>()
  async function subirImagen(url: string, alt: string, credito?: string) {
    const origen = url.split('?')[0]
    if (medios.has(origen)) return medios.get(origen) ?? null
    let id: number | null = null
    const { docs } = await payload.find({
      collection: 'medios',
      where: { origen: { equals: origen } },
      limit: 1,
      depth: 0,
    })
    if (docs[0]) {
      id = docs[0].id
    } else if (!seco) {
      const archivo = await cliente.archivo(url).catch(() => null)
      if (archivo && (TIPOS_IMAGEN.includes(archivo.tipo) || archivo.tipo.startsWith('image/'))) {
        let { data, tipo } = archivo
        let nombre = decodeURIComponent(path.basename(origen)) || 'imagen'
        // GIF, BMP y otros: el panel solo acepta JPEG, PNG, WebP y AVIF
        if (!TIPOS_IMAGEN.includes(tipo)) {
          data = await sharp(data, { animated: false }).png().toBuffer()
          tipo = 'image/png'
          nombre = nombre.replace(/\.\w+$/, '') + '.png'
        }
        const creado = await payload.create({
          collection: 'medios',
          data: { alt: recortar(alt, 160), credito: credito || undefined, origen },
          file: { data, mimetype: tipo, name: nombre, size: data.length },
        })
        id = creado.id
      }
    }
    medios.set(origen, id)
    return id
  }

  async function imagenSinFoto() {
    const { docs } = await payload.find({
      collection: 'medios',
      where: { origen: { equals: ORIGEN_SIN_FOTO } },
      limit: 1,
      depth: 0,
    })
    if (docs[0]) return docs[0].id
    if (seco) return 0
    const data = await readFile(path.join(process.cwd(), 'public/marca/compartir.png'))
    const creado = await payload.create({
      collection: 'medios',
      data: { alt: 'Visión 96.5 FM', origen: ORIGEN_SIN_FOTO },
      file: { data, mimetype: 'image/png', name: 'vision-sin-foto.png', size: data.length },
    })
    return creado.id
  }

  function seccionDe(post: PostWp) {
    const elegida =
      REVISION.seccionDePost[post.id] ??
      terminosDe(post)
        .filter((t) => t.taxonomy === 'category')
        .map((t) => SECCION_DE_CATEGORIA[t.slug])
        .find((s) => s && idSeccion.has(s)) ??
      opciones.seccionPorDefecto
    return idSeccion.has(elegida) ? elegida : opciones.seccionPorDefecto
  }

  async function slugLibre(slug: string, seccion: number, idPost: number) {
    const { docs } = await payload.find({
      collection: 'noticias',
      where: {
        and: [
          { slug: { equals: slug } },
          { seccion: { equals: seccion } },
          { 'wordpress.idPost': { not_equals: idPost } },
        ],
      },
      limit: 1,
      depth: 0,
      draft: true,
    })
    return docs[0] ? `${slug}-${idPost}` : slug
  }

  async function importarPost(post: PostWp): Promise<FilaInforme> {
    const tituloCompleto = textoPlano(post.title.rendered)
    const fila: FilaInforme = {
      id: post.id,
      enlace: post.link,
      titulo: tituloCompleto,
      resultado: 'omitida',
    }
    const desde = rutaDe(post.link)

    const { docs } = await payload.find({
      collection: 'noticias',
      where: { 'wordpress.idPost': { equals: post.id } },
      limit: 1,
      depth: 0,
      draft: true,
    })
    const existente = docs[0]

    const spam = motivoSpam(post)
    if (spam) {
      await redirigir(desde, null)
      return {
        ...fila,
        resultado: 'spam',
        motivo: existente ? `${spam}; ya estaba importada: borrala del panel` : spam,
      }
    }

    const modificada = fechaWp(post.modified_gmt)
    if (existente) {
      const importada = existente.wordpress?.importada
      const editada =
        importada &&
        new Date(existente.updatedAt).getTime() - new Date(importada).getTime() > MARGEN_EDICION_MS
      const seccionActual = secciones.find((s) => s.id === existente.seccion)?.slug
      const ruta = `/noticias/${seccionActual}/${existente.slug}`
      if (editada) {
        await redirigir(desde, ruta)
        return { ...fila, resultado: 'editada-en-el-panel', seccion: seccionActual, ruta }
      }
      if (existente.wordpress?.modificada === modificada) {
        await redirigir(desde, ruta)
        return { ...fila, resultado: 'sin-cambios', seccion: seccionActual, ruta }
      }
    }

    const { document } = new JSDOM(`<body>${post.content.rendered}</body>`).window
    const limpieza = limpiarSpam(document)
    prepararHtml(document)
    const texto = textoDelDocumento(document)
    const avisos: string[] = []
    if (limpieza.enlaces) fila.enlacesSpam = limpieza.enlaces

    const bajada = bajadaDe(post.excerpt.rendered, tituloCompleto, texto)
    if (!bajada) return { ...fila, motivo: 'la nota tiene menos de 80 caracteres de texto' }

    let cuerpo = aLexical(document.body.innerHTML, editorConfig)
    const enElTexto = imagenesDe(cuerpo)
    const ids = new Map<string, number | null>()
    for (const src of enElTexto) {
      const id = await subirImagen(src, tituloCompleto)
      ids.set(src, id)
      if (!id && !seco) avisos.push(`no se pudo bajar ${src}`)
    }
    cuerpo = resolverImagenes(cuerpo, (src) => ids.get(src))
    if (!cuerpo.root.children.length) return { ...fila, motivo: 'la nota no tiene texto' }

    const destacada = imagenDestacada(post)
    const epigrafe = destacada?.caption ? textoPlano(destacada.caption.rendered) : ''
    let foto = destacada
      ? await subirImagen(destacada.source_url, destacada.alt_text || tituloCompleto, epigrafe)
      : null
    if (destacada && !foto && !seco) avisos.push(`no se pudo bajar la foto ${destacada.source_url}`)
    foto ??= [...ids.values()].find(Boolean) ?? (await imagenSinFoto())
    if (!destacada) avisos.push('sin foto destacada')

    const seccion = seccionDe(post)
    const idDeSeccion = idSeccion.get(seccion)!
    const slug = await slugLibre(slugDe(post.slug, tituloCompleto), idDeSeccion, post.id)
    const ruta = `/noticias/${seccion}/${slug}`
    const publicada = fechaWp(post.date_gmt)
    const data = {
      titulo: tituloDe(post.title.rendered),
      slug,
      bajada,
      cuerpo,
      foto,
      epigrafe: epigrafe ? recortar(epigrafe, 200) : null,
      seccion: idDeSeccion,
      fechaPublicacion: publicada,
      // Solo si se corrigió después del día en que salió
      fechaActualizacion:
        new Date(modificada).getTime() - new Date(publicada).getTime() > 86_400_000
          ? modificada
          : null,
      estadoEditorial: 'publicada' as const,
      _status: 'published' as const,
      wordpress: { idPost: post.id, enlace: post.link, modificada, importada: '' },
    }
    if (data.titulo !== tituloCompleto) avisos.push('título recortado a 120 caracteres')

    if (!seco) {
      // "importada" lleva la hora del guardado, no la del comienzo de la corrida: así una edición
      // posterior en el panel se distingue de este mismo guardado
      data.wordpress.importada = new Date().toISOString()
      const contexto = { context: { migracion: true }, depth: 0 }
      if (existente)
        await payload.update({ collection: 'noticias', id: existente.id, data, ...contexto })
      else await payload.create({ collection: 'noticias', data, ...contexto })
    }
    await redirigir(desde, ruta)
    return {
      ...fila,
      resultado: existente ? 'actualizada' : 'creada',
      seccion,
      ruta,
      avisos: avisos.length ? avisos : undefined,
    }
  }

  let leidos = 0
  for await (const post of cliente.posts()) {
    if (opciones.limite && leidos >= opciones.limite) break
    leidos++
    try {
      const fila = await importarPost(post)
      filas.push(fila)
      registrar(`${post.id} ${fila.resultado}${fila.motivo ? ` (${fila.motivo})` : ''}`)
    } catch (error) {
      const motivo = error instanceof Error ? error.message : String(error)
      filas.push({
        id: post.id,
        enlace: post.link,
        titulo: textoPlano(post.title.rendered),
        resultado: 'error',
        motivo,
      })
      registrar(`${post.id} error: ${motivo}`)
    }
  }

  // Lo que el sitemap viejo publica y no es una nota: categorías y etiquetas de casinos responden 410
  const sinRedireccion: string[] = []
  const rutasDeNotas = new Set(filas.map((f) => rutaDe(f.enlace)))
  if (!opciones.limite) {
    for (const url of await cliente.sitemap().catch(() => [])) {
      const ruta = rutaDe(url)
      if (rutasDeNotas.has(ruta) || ruta === '/') continue
      if (esRutaSpam(ruta)) await redirigir(ruta, null)
      else sinRedireccion.push(url)
    }
  }

  const resumen = Object.fromEntries(
    (
      [
        'creada',
        'actualizada',
        'sin-cambios',
        'editada-en-el-panel',
        'spam',
        'omitida',
        'error',
      ] as const
    ).map((r) => [r, filas.filter((f) => f.resultado === r).length]),
  ) as Record<Resultado, number>
  return { filas, resumen, sinRedireccion }
}
