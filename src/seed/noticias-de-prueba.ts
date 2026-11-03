import type { Payload } from 'payload'

import { slugify } from '@/base/lib/slug'
import { diaEnMontevideo, sumarDias } from '@/sitio/publicidad/fechas'
import { COLORES, imagenDeEjemplo } from './imagenes'
import { parrafos } from './index'

/**
 * Noticias inventadas para probar las páginas de Noticias con muchas notas: 14 por sección, así cada
 * sección tiene dos páginas y "Todas" pasa de las seis. Se cargan aparte de los datos de ejemplo, con
 * src/seed/cargar-noticias.ts, y se sacan con src/seed/borrar-noticias.ts.
 */
const PRUEBA: Record<string, { titulos: string[]; bajadas: string[]; parrafos: string[] }> = {
  Locales: {
    titulos: [
      'Comienzan las obras de bacheo en la avenida 18 de Julio',
      'El Municipio habilitó una plaza de juegos nueva en Las Canteras',
      'Vecinos del Barrio Anglo piden más frecuencias de ómnibus',
      'La Intendencia lanzó un plan de arbolado para veinte calles',
      'Abren las inscripciones para el programa de viviendas en Río Negro',
      'El hospital de Fray Bentos suma un tomógrafo nuevo',
      'La feria de los sábados cambia de lugar por obras en la plaza',
      'Refuerzan la limpieza de la costa antes de la temporada de verano',
      'Empieza la campaña de vacunación antigripal en las policlínicas',
      'El puerto recibió el primer crucero de la temporada',
      'El Centro Comunal Zonal tiene nuevo horario de atención',
      'Escuelas rurales de Río Negro reciben computadoras nuevas',
      'Se inauguró la bicisenda que une el centro con Las Cañas',
      'Anuncian cortes de agua programados para el martes',
    ],
    bajadas: [
      'La medida alcanza a vecinos de varios barrios de la ciudad y se va a extender en las próximas semanas.',
      'Desde la Intendencia explicaron cómo va a funcionar y qué tienen que hacer los vecinos interesados.',
      'Es parte de un plan que se anunció a principios de año y que tendrá nuevas etapas en los próximos meses.',
    ],
    parrafos: [
      'Según explicaron las autoridades departamentales, la iniciativa responde a un pedido que los vecinos venían haciendo desde hace tiempo.',
      'Las consultas se pueden hacer en el Centro Comunal Zonal de lunes a viernes, de 9 a 15 horas.',
    ],
  },
  Nacionales: {
    titulos: [
      'El Parlamento aprobó en general la ley de presupuesto',
      'La inflación de octubre quedó por debajo de lo previsto',
      'Educación presentó el calendario escolar del año que viene',
      'Uruguay firmó un acuerdo de cooperación energética con Brasil',
      'El Banco Central mantuvo la tasa de interés sin cambios',
      'Crecen las exportaciones de carne en el último trimestre',
      'Pronostican una semana con temperaturas por encima de lo normal',
      'El gobierno extiende los beneficios para el turismo interno',
      'Se lanzó un nuevo plan nacional de salud mental',
      'Baja la desocupación en el interior del país',
      'Nueva tarifa eléctrica para hogares con paneles solares',
      'El Senado discute cambios en el régimen de licencias',
      'Anuncian una rebaja en el precio del gasoil',
      'El censo agropecuario arranca en todo el país la semana próxima',
    ],
    bajadas: [
      'El anuncio se hizo en conferencia de prensa y también tendrá impacto en el interior del país.',
      'Los datos oficiales muestran una tendencia que se mantiene desde hace varios meses.',
      'Desde el gobierno aseguraron que la medida empieza a regir el mes que viene en todo el país.',
    ],
    parrafos: [
      'La información fue confirmada por fuentes oficiales, que adelantaron que habrá más detalles en los próximos días.',
      'En Río Negro, los referentes locales siguen el tema de cerca por su impacto en la economía del departamento.',
    ],
  },
  Policiales: {
    titulos: [
      'Recuperan una moto robada gracias a las cámaras de vigilancia',
      'Choque entre dos autos en la ruta 2 dejó solo daños materiales',
      'Alertan por estafas telefónicas en nombre de bancos',
      'Detienen a un hombre por hurtos en comercios del centro',
      'Controlaron más de doscientos vehículos en un operativo de tránsito',
      'Incautan mercadería de contrabando en un control en la ruta 24',
      'Bomberos apagaron un incendio de pastizal cerca del puerto',
      'Encuentran al adolescente que era buscado desde el domingo',
      'Formalizan a dos personas por el robo a una ferretería',
      'Campaña de prevención de siniestros en moto en los liceos',
      'Detenido por manejar con más del doble de alcohol permitido',
      'Allanamiento en Young termina con incautación de drogas',
      'Roban cables del alumbrado público en la rambla',
      'La Jefatura de Río Negro suma patrulleros nuevos',
    ],
    bajadas: [
      'El procedimiento estuvo a cargo de la Jefatura de Policía de Río Negro, que pide colaboración a los vecinos.',
      'La investigación sigue abierta y la Fiscalía de Fray Bentos ya fue informada de lo ocurrido.',
      'No hubo personas heridas y el caso quedó a cargo de la seccional correspondiente.',
    ],
    parrafos: [
      'Desde la Policía recordaron que cualquier información se puede aportar de forma anónima llamando al 911.',
      'El caso se suma a otros procedimientos realizados en el departamento durante las últimas semanas.',
    ],
  },
  Deportes: {
    titulos: [
      'Laureles y Anglo empataron sin goles en un partido trabado',
      'El básquetbol local tendrá su propia liga femenina',
      'Atletas de Río Negro brillaron en el Nacional de Atletismo',
      'La selección de Río Negro debuta el domingo en la copa del interior',
      'El club de remo suma botes nuevos para la escuelita',
      'Se juega la final del baby fútbol en el estadio municipal',
      'Más de cuatrocientos corredores inscriptos para la maratón de la costanera',
      'Nacional de Fray Bentos presentó a su nuevo entrenador',
      'El vóleibol de playa vuelve a la rambla este verano',
      'Récord de participantes en el torneo de pesca de este año',
      'El ciclismo local se prepara para la Vuelta de Río Negro',
      'Inauguraron una cancha de césped sintético en Las Canteras',
      'La escuela de natación abre cupos para adultos',
      'El equipo sub-17 clasificó a la ronda final del torneo regional',
    ],
    bajadas: [
      'Los equipos se preparan para una nueva fecha que promete buena convocatoria de público.',
      'Los entrenamientos son abiertos y la organización invita a acercarse a toda la familia.',
      'La actividad forma parte del calendario deportivo departamental de este año y es abierta a todos.',
    ],
    parrafos: [
      'Los organizadores destacaron el crecimiento de la actividad en el departamento y el trabajo de los clubes de barrio.',
      'La próxima fecha se juega el fin de semana y las entradas se consiguen en la sede de cada club.',
    ],
  },
  Cultura: {
    titulos: [
      'El Teatro Young presenta su programación de verano',
      'Una muestra de fotografía recorre la historia del Anglo',
      'Llega a Fray Bentos un festival de cine itinerante',
      'La banda municipal toca gratis los domingos en la plaza',
      'Abren las inscripciones para el taller de murga joven',
      'Escritores de Río Negro presentan una antología de cuentos',
      'La biblioteca municipal extiende su horario en las vacaciones',
      'Festival de jazz en la costanera con músicos de todo el país',
      'Una obra de teatro local sale de gira por el interior',
      'El carnaval de Fray Bentos ya tiene fecha para el desfile inaugural',
      'Artesanos exponen en el paseo de la costa durante el fin de semana',
      'Cine al aire libre en los barrios durante enero',
      'Concurso de poesía para estudiantes de secundaria',
      'Se restauró el mural de la terminal de ómnibus',
    ],
    bajadas: [
      'La entrada es libre y la programación completa se puede consultar en la página de la Intendencia.',
      'Participan artistas locales y de otros departamentos, con actividades para todas las edades.',
      'Las inscripciones están abiertas hasta fin de mes y los cupos son limitados, así que conviene apurarse.',
    ],
    parrafos: [
      'Desde la Dirección de Cultura destacaron la respuesta del público en las ediciones anteriores.',
      'Las actividades se suspenden en caso de lluvia y se pasan a la semana siguiente.',
    ],
  },
  Opinión: {
    titulos: [
      'La costanera que queremos',
      'Qué ciudad les dejamos a los que vienen',
      'El valor de la radio local en tiempos de redes',
      'Turismo: una oportunidad que no podemos dejar pasar',
      'Los clubes de barrio sostienen mucho más que el deporte',
      'La cultura también es trabajo',
      'Cuidar el río es cuidar nuestra historia',
      'El tránsito en el centro necesita un plan',
      'Lo que se juega en las escuelas rurales',
      'La feria del sábado, un patrimonio de todos',
      'Jóvenes que se van y jóvenes que vuelven',
      'El desafío de envejecer en el interior',
      'Lo que nos enseñó la última creciente',
      'Ir al cine en Fray Bentos todavía es un plan',
    ],
    bajadas: [
      'Una mirada sobre lo que está en juego en Fray Bentos y lo que podemos hacer como comunidad.',
      'Columna de opinión. Las ideas expresadas en este texto son responsabilidad de su autor.',
      'Un tema que vuelve cada tanto a la conversación y que merece una discusión más profunda.',
    ],
    parrafos: [
      'Cada tanto conviene detenerse y mirar con calma lo que pasa a nuestro alrededor, sin apuro y sin prejuicios.',
      'Las respuestas no son simples, pero empiezan por hablarlo entre todos.',
    ],
  },
}

const AVISO =
  'Esta es una noticia de prueba, inventada para ver cómo se ven las páginas con muchas notas.'

/** Todas, de la más nueva a la más vieja, una de cada sección por vuelta para que el archivo quede mezclado. */
export function noticiasDePrueba() {
  const secciones = Object.entries(PRUEBA)
  return Array.from({ length: 14 }, (_, vuelta) =>
    secciones.map(([seccion, s]) => ({
      seccion,
      titulo: s.titulos[vuelta],
      bajada: s.bajadas[vuelta % s.bajadas.length],
      parrafos: [...s.parrafos, AVISO],
    })),
  ).flat()
}

/**
 * Carga las noticias de prueba en las secciones que ya existen, publicadas y con fechas desde hace diez
 * días para atrás (dos por día), así quedan después de las de los datos de ejemplo. Es idempotente: las
 * que ya están, por título, no se tocan.
 */
export async function cargarNoticiasDePrueba(payload: Payload, hoy = new Date()) {
  const { docs } = await payload.find({
    collection: 'secciones',
    pagination: false,
    depth: 0,
    select: { nombre: true },
  })
  const seccion = new Map(docs.map((s) => [s.nombre, s.id]))
  const faltan = Object.keys(PRUEBA).filter((n) => !seccion.has(n))
  if (faltan.length) {
    throw new Error(
      `Faltan las secciones ${faltan.join(', ')}: primero hay que cargar los datos de ejemplo.`,
    )
  }

  const dia = diaEnMontevideo(hoy)
  let creadas = 0
  let existentes = 0
  for (const [i, n] of noticiasDePrueba().entries()) {
    const { totalDocs } = await payload.count({
      collection: 'noticias',
      where: { titulo: { equals: n.titulo } },
    })
    if (totalDocs) {
      existentes++
      continue
    }
    const foto = await imagenDePrueba(payload, n.titulo, n.seccion, COLORES[i % COLORES.length])
    const fecha = `${sumarDias(dia, -(10 + Math.floor(i / 2)))}T${i % 2 ? '09:00' : '15:00'}:00.000-03:00`
    await payload.create({
      collection: 'noticias',
      data: {
        titulo: n.titulo,
        slug: '',
        bajada: n.bajada,
        cuerpo: parrafos(n.parrafos),
        seccion: seccion.get(n.seccion)!,
        foto,
        epigrafe: 'Imagen de ejemplo.',
        estadoEditorial: 'publicada',
        fechaPublicacion: new Date(fecha).toISOString(),
        _status: 'published',
      },
    })
    creadas++
  }
  return { creadas, existentes }
}

/** La imagen de la nota: la que ya estaba (mismo texto alternativo) o una nueva con el nombre de la sección. */
async function imagenDePrueba(payload: Payload, titulo: string, seccion: string, color: string) {
  const { docs } = await payload.find({
    collection: 'medios',
    where: { alt: { equals: titulo } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return docs[0].id
  const data = await imagenDeEjemplo(1600, 900, seccion, color)
  const medio = await payload.create({
    collection: 'medios',
    data: { alt: titulo, credito: 'Imagen de ejemplo' },
    file: { data, mimetype: 'image/jpeg', name: `${slugify(titulo)}.jpg`, size: data.length },
  })
  return medio.id
}

/** Saca las noticias de prueba y sus imágenes, por título. Lo demás no se toca. */
export async function borrarNoticiasDePrueba(payload: Payload) {
  const titulos = noticiasDePrueba().map((n) => n.titulo)
  const { docs } = await payload.delete({
    collection: 'noticias',
    where: { titulo: { in: titulos } },
  })
  await payload.delete({ collection: 'medios', where: { alt: { in: titulos } } })
  return docs.length
}
