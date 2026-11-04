import type { Payload } from 'payload'

import { diaEnMontevideo, mediodiaUTC, sumarDias } from '@/sitio/publicidad/fechas'
import { silencioMp3 } from './imagenes'

/**
 * Entrevistas inventadas, con transcripción, para probar Entrevistas con muchas entrevistas de varios
 * meses (el filtro por fechas y la paginación) y cómo se lee una transcripción larga en la página de
 * cada una. Se cargan aparte de los datos de ejemplo con src/seed/cargar-entrevistas.ts y se sacan con
 * src/seed/borrar-entrevistas.ts.
 */
const PRUEBA: { entrevistado: string; tema: string; programa: string }[] = [
  {
    entrevistado: 'Presidenta de la Comisión de Fomento',
    tema: 'Las obras del barrio Las Canteras',
    programa: 'Visión temprana',
  },
  {
    entrevistado: 'Entrenador de la selección de Río Negro',
    tema: 'El debut en la copa del interior',
    programa: 'Conectados',
  },
  {
    entrevistado: 'Directora del Teatro Young',
    tema: 'La programación de verano',
    programa: 'Agenda Cultural',
  },
  {
    entrevistado: 'Médica de la policlínica del Anglo',
    tema: 'La campaña de vacunación',
    programa: 'Gente que habla',
  },
  {
    entrevistado: 'Productor de miel de Nuevo Berlín',
    tema: 'Un año difícil para las colmenas',
    programa: 'Mate dulce',
  },
  { entrevistado: 'Banda de rock de Young', tema: 'Su primer disco', programa: 'Hecho en Uruguay' },
  {
    entrevistado: 'Maestra de la escuela rural 14',
    tema: 'Las computadoras nuevas',
    programa: 'Visión temprana',
  },
  { entrevistado: 'Capitán del puerto', tema: 'La temporada de cruceros', programa: 'Conectados' },
  {
    entrevistado: 'Escritora fraybentina',
    tema: 'La antología de cuentos de Río Negro',
    programa: 'Agenda Cultural',
  },
  {
    entrevistado: 'Organizador de la maratón',
    tema: 'Cuatrocientos corredores inscriptos',
    programa: 'Conectados',
  },
  {
    entrevistado: 'Vecinos de Barrio Jardín',
    tema: 'El pedido de más ómnibus',
    programa: 'Gente que habla',
  },
  {
    entrevistado: 'Cantante de folklore',
    tema: 'La gira por el litoral',
    programa: 'Folklore de mujer',
  },
  {
    entrevistado: 'Director de Tránsito',
    tema: 'Los cambios en el centro',
    programa: 'Visión temprana',
  },
  {
    entrevistado: 'Murga joven Los Del Puerto',
    tema: 'El taller de este año',
    programa: 'Agenda Cultural',
  },
  {
    entrevistado: 'Bombero voluntario',
    tema: 'Cómo prevenir incendios de pastizal',
    programa: 'Gente que habla',
  },
  {
    entrevistado: 'Chef del mercado municipal',
    tema: 'Cocina con productos de la zona',
    programa: 'Mate dulce',
  },
  {
    entrevistado: 'Remero del club Fray Bentos',
    tema: 'La escuelita de remo',
    programa: 'Conectados',
  },
  {
    entrevistado: 'Historiador del Anglo',
    tema: 'Cien años del frigorífico',
    programa: 'Misión de vida',
  },
  {
    entrevistado: 'Coordinadora de la feria del sábado',
    tema: 'El cambio de lugar',
    programa: 'La vida es bella',
  },
  {
    entrevistado: 'Pianista de jazz',
    tema: 'El festival en la costanera',
    programa: 'Jazz a la radio',
  },
  {
    entrevistado: 'Intendente de Río Negro',
    tema: 'El plan de arbolado',
    programa: 'Visión temprana',
  },
  {
    entrevistado: 'Directora del liceo 1',
    tema: 'Los proyectos de fin de año',
    programa: 'Gente que habla',
  },
  { entrevistado: 'Pescador de la costa', tema: 'El torneo de pesca', programa: 'Mate dulce' },
  {
    entrevistado: 'Fotógrafa local',
    tema: 'La muestra sobre el Anglo',
    programa: 'Agenda Cultural',
  },
]

const PREGUNTAS = [
  'Buen día, muchas gracias por venir hasta la radio. Contanos un poco de qué se trata {tema}.',
  '¿Cómo empezó todo esto? ¿De dónde surgió la idea?',
  '¿Y cómo lo está recibiendo la gente de Fray Bentos?',
  'Hay muchos oyentes que nos escriben preguntando cómo pueden participar. ¿Qué les decís?',
  '¿Cuáles fueron las mayores dificultades en este tiempo?',
  'Me imagino que no es fácil sostenerlo con los recursos que hay en el interior.',
  '¿Qué es lo que viene ahora? ¿Hay fechas confirmadas?',
  'Contanos alguna anécdota de estos meses, algo que te haya quedado grabado.',
  '¿Tienen apoyo de la Intendencia o de alguna institución?',
  'Para el que nos está escuchando y no conoce nada del tema, ¿por dónde empezaría?',
  '¿Cuánta gente está trabajando en esto hoy?',
  '¿Qué cambió desde la última vez que estuviste acá en la radio?',
  'Hay quienes dicen que en Fray Bentos estas cosas no prenden. ¿Qué les contestás?',
  '¿Y la familia cómo lo lleva? Porque esto te debe llevar muchas horas.',
  '¿Dónde los pueden encontrar? ¿Tienen redes, un teléfono?',
  'Ya casi estamos sin tiempo. ¿Algo que quieras agregar antes de cerrar?',
]

const RESPUESTAS = [
  'Bueno, gracias a ustedes por el espacio. La verdad es que es algo que venimos pensando hace bastante tiempo, y este año por fin se dieron las condiciones para hacerlo. Somos un grupo chico, pero con muchas ganas.',
  'Empezó casi de casualidad. Nos juntamos un par de vecinos, empezamos a hablar de lo que faltaba en el barrio, y en un momento alguien dijo: ¿y por qué no lo hacemos nosotros? Desde ahí no paramos más.',
  'La respuesta fue muy buena, mejor de lo que esperábamos. La primera vez vinieron unas treinta personas y la última pasamos las cien. Eso te da ganas de seguir, ¿no? Te das cuenta de que había una necesidad.',
  'Que se acerquen, que no tengan vergüenza. No hace falta saber nada de antemano, acá aprendemos todos juntos. Pueden venir los sábados de mañana o escribirnos y les contamos.',
  'Lo más difícil fue al principio, conseguir un lugar y que la gente se enterara. Después, el tema de siempre: la plata. Todo cuesta, los materiales, el traslado, y muchas veces lo ponemos de nuestro bolsillo.',
  'Sí, es así. En el interior todo cuesta un poco más, pero también tenés algo que en la capital no tenés, que es que nos conocemos todos. Si necesitás una mano, aparece alguien. Eso vale mucho.',
  'Ahora estamos preparando lo que viene para fin de año. Todavía no tenemos la fecha confirmada, pero apenas la tengamos la vamos a pasar por la radio, que es por donde se entera la mayoría de la gente.',
  'Hay muchas. Me acuerdo de una señora de ochenta y pico de años que vino el primer día, se sentó adelante de todo y no se perdió ni uno. Al final nos trajo una torta para agradecernos. Esas cosas te marcan.',
  'Tenemos el apoyo de la Intendencia para algunas cosas puntuales, como el lugar y la difusión. También nos dieron una mano algunos comercios del centro. Pero la mayor parte sigue siendo trabajo voluntario.',
  'Yo empezaría por venir y mirar, sin compromiso. Muchas veces uno piensa que no es para uno, y cuando se anima descubre que le encanta. Pasa mucho, más de lo que te imaginás.',
  'Estamos en Facebook y en Instagram, y también nos pueden llamar o mandar un WhatsApp. Igual lo más fácil es venir directamente, siempre hay alguien que los va a recibir.',
  'Agradecerle a la radio, que siempre nos da el espacio, y a todos los que se acercaron este año. Y a los que todavía no se animaron, que los esperamos. Esto es de todos.',
  'Mirá, te voy a ser sincero: hubo momentos en que pensamos en largar. Pero cada vez que eso pasaba aparecía alguien con una idea nueva o con una palabra de aliento, y seguíamos. Así fue todo el año.',
  'Lo que más nos importa es que quede algo para los que vienen. Que los gurises vean que se pueden hacer cosas acá, en Fray Bentos, sin tener que irse a Montevideo para todo.',
  'Hay un dato que siempre me gusta contar: más de la mitad de los que participan nunca habían hecho algo parecido antes. Eso para nosotros es lo más importante, abrir la puerta.',
  'Y sí, el clima también juega. Este invierno fue muy lluvioso y tuvimos que suspender varias veces. Pero bueno, la gente lo entiende, y cuando se pudo hacer vinieron igual, con más ganas.',
]

const AVISO = 'Transcripción de prueba, inventada para ver cómo se ve la página de una entrevista.'

/** Números al azar pero siempre los mismos para cada entrevista, así la transcripción no cambia. */
function azar(semilla: number) {
  let s = semilla * 9301 + 49297
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/**
 * La transcripción de una entrevista de prueba, con el formato que deja la IA: un párrafo por turno,
 * "Nombre: texto", separados por una línea en blanco. La segunda es más larga, para ver una página
 * extensa, y la tercera es de una sola voz, sin nombres.
 */
export function transcripcionDePrueba(i: number) {
  const e = PRUEBA[i]
  const r = azar(i + 1)
  const turnos = i === 1 ? 16 : 6 + Math.floor(r() * 8)
  // La primera y la última pregunta van siempre en su lugar; las del medio, mezcladas
  const preguntas = [...PREGUNTAS.keys()].slice(1, -1).sort(() => r() - 0.5)
  const respuestas = [...RESPUESTAS.keys()].sort(() => r() - 0.5)
  if (i === 2) {
    return [
      ...Array.from({ length: turnos }, (_, t) => RESPUESTAS[respuestas[t % RESPUESTAS.length]]),
      AVISO,
    ].join('\n\n')
  }
  const parrafos: string[] = []
  for (let t = 0; t < turnos; t++) {
    const pregunta =
      t === 0
        ? PREGUNTAS[0]
        : t === turnos - 1
          ? PREGUNTAS.at(-1)!
          : PREGUNTAS[preguntas[(t - 1) % preguntas.length]]
    parrafos.push(`${e.programa}: ${pregunta.replace('{tema}', e.tema.toLowerCase())}`)
    const respuesta = t === 0 ? RESPUESTAS[0] : RESPUESTAS[respuestas[t % RESPUESTAS.length]]
    parrafos.push(`${e.entrevistado}: ${respuesta}`)
  }
  return [...parrafos, AVISO].join('\n\n')
}

export function entrevistasDePrueba() {
  return PRUEBA.map((e, i) => {
    const transcripcion = transcripcionDePrueba(i)
    // Unas 150 palabras por minuto, más los silencios y la música
    const segundos = Math.round((transcripcion.split(/\s+/).length / 150) * 60 * 1.3)
    return { ...e, transcripcion, segundos }
  })
}

/**
 * Carga las entrevistas de prueba, publicadas, una cada cinco días desde hace una semana para atrás
 * (unos cuatro meses), así quedan después de las de los datos de ejemplo. Van en el programa que dice
 * cada una, o en el primero que haya si ese no está. Es idempotente: las que ya están, por tema, no se
 * tocan.
 */
export async function cargarEntrevistasDePrueba(payload: Payload, hoy = new Date()) {
  const { docs } = await payload.find({
    collection: 'programas',
    pagination: false,
    depth: 0,
    sort: 'nombre',
    select: { nombre: true },
  })
  if (!docs.length)
    throw new Error('No hay programas: primero hay que cargar los datos de ejemplo.')
  const programas = new Map(docs.map((p) => [p.nombre, p.id]))

  const audio = await audioDePrueba(payload)
  const dia = diaEnMontevideo(hoy)
  let creadas = 0
  let existentes = 0
  for (const [i, e] of entrevistasDePrueba().entries()) {
    const { totalDocs } = await payload.count({
      collection: 'entrevistas',
      where: { tema: { equals: e.tema } },
    })
    if (totalDocs) {
      existentes++
      continue
    }
    await payload.create({
      collection: 'entrevistas',
      data: {
        entrevistado: e.entrevistado,
        tema: e.tema,
        slug: '',
        programa: programas.get(e.programa) ?? docs[0].id,
        fecha: mediodiaUTC(sumarDias(dia, -(7 + i * 5))),
        audio,
        duracion: e.segundos,
        resumen: `${e.entrevistado} habló sobre ${e.tema.toLowerCase()}. Entrevista de prueba.`,
        transcripcion: e.transcripcion,
        _status: 'published',
      },
    })
    creadas++
  }
  return { creadas, existentes }
}

/** El audio de silencio de los datos de ejemplo; si no está, lo crea igual. */
async function audioDePrueba(payload: Payload) {
  const nombre = 'entrevista-de-ejemplo.mp3'
  const { docs } = await payload.find({
    collection: 'archivos',
    where: { filename: { equals: nombre } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) return docs[0].id
  const data = silencioMp3()
  const archivo = await payload.create({
    collection: 'archivos',
    data: {},
    file: { data, mimetype: 'audio/mpeg', name: nombre, size: data.length },
  })
  return archivo.id
}

/** Saca las entrevistas de prueba, por tema. El audio y las demás entrevistas no se tocan. */
export async function borrarEntrevistasDePrueba(payload: Payload) {
  const { docs } = await payload.delete({
    collection: 'entrevistas',
    where: { tema: { in: PRUEBA.map((e) => e.tema) } },
  })
  return docs.length
}
