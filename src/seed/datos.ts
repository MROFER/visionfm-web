// Contenido de ejemplo para local, staging y la demo. Personas, comercios y hechos son inventados.

export const SECCIONES = [
  { nombre: 'Locales', descripcion: 'Lo que pasa en Fray Bentos y en Río Negro.' },
  { nombre: 'Nacionales', descripcion: 'Noticias de todo el país.' },
  { nombre: 'Policiales', descripcion: 'Información policial y judicial.' },
  { nombre: 'Deportes', descripcion: 'Fútbol, básquetbol y todo el deporte local.' },
  { nombre: 'Cultura', descripcion: 'Agenda cultural, música, teatro y cine.' },
  { nombre: 'Opinión', descripcion: 'Columnas y editoriales.' },
]

export const EQUIPO = [
  { nombre: 'Laura Benítez', rol: 'Dirección', grupo: 'direccion', orden: 1 },
  { nombre: 'Martín Sosa', rol: 'Producción general', grupo: 'produccion-general', orden: 2 },
  { nombre: 'Carolina Píriz', rol: 'Conducción', grupo: 'conduccion', orden: 3 },
  { nombre: 'Diego Olivera', rol: 'Conducción y deportes', grupo: 'conduccion', orden: 4 },
  { nombre: 'Valeria Méndez', rol: 'Conducción', grupo: 'conduccion', orden: 5 },
  { nombre: 'Andrés Cabrera', rol: 'Columnista de economía', grupo: 'columnistas', orden: 6 },
  { nombre: 'Sofía Duarte', rol: 'Columnista de cultura', grupo: 'columnistas', orden: 7 },
  { nombre: 'Gonzalo Ríos', rol: 'Operación técnica', grupo: 'tecnico', orden: 8 },
] as const

type Dia = 'lun' | 'mar' | 'mie' | 'jue' | 'vie' | 'sab' | 'dom'
const SEMANA: Dia[] = ['lun', 'mar', 'mie', 'jue', 'vie']

export const PROGRAMAS: {
  nombre: string
  descripcion: string
  conductores: string[]
  horarios: { dias: Dia[]; inicio: string; fin: string }[]
}[] = [
  {
    nombre: 'Buen Día Fray Bentos',
    descripcion: 'Las noticias de la mañana, el clima y la agenda del día.',
    conductores: ['Carolina Píriz', 'Andrés Cabrera'],
    horarios: [{ dias: SEMANA, inicio: '07:00', fin: '10:00' }],
  },
  {
    nombre: 'La Mañana de Visión',
    descripcion: 'Entrevistas, música y la actualidad del departamento.',
    conductores: ['Valeria Méndez'],
    horarios: [{ dias: SEMANA, inicio: '10:00', fin: '13:00' }],
  },
  {
    nombre: 'Mediodía Informativo',
    descripcion: 'El resumen de noticias del mediodía.',
    conductores: ['Carolina Píriz'],
    horarios: [{ dias: SEMANA, inicio: '13:00', fin: '14:00' }],
  },
  {
    nombre: 'Tarde Deportiva',
    descripcion: 'Todo el deporte de Río Negro, con la previa de la fecha.',
    conductores: ['Diego Olivera'],
    horarios: [{ dias: SEMANA, inicio: '18:00', fin: '20:00' }],
  },
  {
    nombre: 'Agenda Cultural',
    descripcion: 'Música, teatro, cine y lo que se viene en la ciudad.',
    conductores: ['Sofía Duarte'],
    horarios: [{ dias: ['sab'], inicio: '10:00', fin: '12:00' }],
  },
  {
    nombre: 'Clásicos del Domingo',
    descripcion: 'Música para acompañar el domingo.',
    conductores: [],
    horarios: [{ dias: ['dom'], inicio: '09:00', fin: '13:00' }],
  },
]

export const NOTICIAS: {
  titulo: string
  seccion: string
  bajada: string
  parrafos: string[]
  diasAtras: number
  destacada?: boolean
}[] = [
  {
    titulo: 'La rambla suma nuevas luminarias LED en el tramo del Anglo',
    seccion: 'Locales',
    bajada:
      'La Intendencia terminó la primera etapa del recambio de alumbrado en la costanera y anunció que la segunda empieza el mes que viene.',
    parrafos: [
      'Las obras abarcaron unos ochocientos metros entre el muelle y el acceso al Barrio Anglo, con columnas nuevas y luminarias de bajo consumo.',
      'Según la dirección de obras, el ahorro de energía rondará el cuarenta por ciento respecto a las lámparas anteriores.',
    ],
    diasAtras: 0,
    destacada: true,
  },
  {
    titulo: 'Abren las inscripciones para los talleres de verano en el Centro Cultural',
    seccion: 'Cultura',
    bajada:
      'Habrá cursos de guitarra, cerámica, teatro y fotografía para niños y adultos, con cupos limitados y una inscripción gratuita.',
    parrafos: [
      'Las inscripciones se hacen de forma presencial en el Centro Cultural, de lunes a viernes de 9 a 17.',
      'Los talleres empiezan la primera semana de enero y terminan con una muestra abierta al público.',
    ],
    diasAtras: 1,
  },
  {
    titulo: 'Laureles ganó el clásico y quedó como único puntero del torneo local',
    seccion: 'Deportes',
    bajada:
      'Con un gol en el segundo tiempo, el equipo de barrio Las Canteras se impuso por uno a cero y sacó dos puntos de ventaja a falta de tres fechas.',
    parrafos: [
      'El partido se jugó ante un buen marco de público en el Parque Liebig’s.',
      'La próxima fecha se juega el sábado y Visión la transmite en vivo desde las 15.',
    ],
    diasAtras: 1,
  },
  {
    titulo: 'Detienen a dos personas por el robo de herramientas en una obra',
    seccion: 'Policiales',
    bajada:
      'La Policía recuperó parte de lo robado tras un allanamiento en el barrio Fray Bentos Norte; la Fiscalía investiga si hay más involucrados.',
    parrafos: [
      'El hecho había sido denunciado el fin de semana por la empresa constructora.',
      'Los detenidos quedaron a disposición de la Fiscalía de turno.',
    ],
    diasAtras: 2,
  },
  {
    titulo: 'El puerto de Fray Bentos cerró su mejor trimestre de los últimos cinco años',
    seccion: 'Nacionales',
    bajada:
      'El movimiento de carga creció impulsado por la madera y los granos, según el informe trimestral de la Administración Nacional de Puertos.',
    parrafos: [
      'El informe destaca el aumento de buques que operaron en la terminal y el crecimiento del empleo asociado.',
      'Las autoridades prevén nuevas obras de dragado para el año próximo.',
    ],
    diasAtras: 3,
  },
  {
    titulo: 'Qué nos dice el Anglo sobre el futuro de la ciudad',
    seccion: 'Opinión',
    bajada:
      'El patrimonio industrial puede ser un motor de turismo y empleo si se piensa a largo plazo y con la participación de los vecinos.',
    parrafos: [
      'El Paisaje Industrial Fray Bentos es mucho más que un museo: es una oportunidad para repensar la ciudad.',
      'Hace falta un plan que combine conservación, turismo y nuevos usos para los edificios.',
    ],
    diasAtras: 4,
  },
  {
    titulo: 'Vuelve la Feria del Libro con más de cuarenta expositores',
    seccion: 'Cultura',
    bajada:
      'La feria se hace en la plaza Constitución durante tres días, con presentaciones de autores locales, música en vivo y actividades para niños.',
    parrafos: [
      'La entrada es libre y la programación completa se publica en las redes de la Intendencia.',
    ],
    diasAtras: 6,
  },
  {
    titulo: 'Comienza la temporada de básquetbol con seis equipos en la Liga Departamental',
    seccion: 'Deportes',
    bajada:
      'El torneo arranca este fin de semana con partidos en el gimnasio municipal y se juega todos los viernes y sábados hasta diciembre.',
    parrafos: ['Visión transmite los partidos de los viernes en Tarde Deportiva.'],
    diasAtras: 8,
  },
]

export const PELICULAS: {
  titulo: string
  genero: string
  duracion: number
  calificacion: 'atp' | '7' | '13' | '16' | '18'
  idiomas: ('subtitulada' | 'doblada')[]
  formatos: ('2d' | '3d')[]
  sinopsis: string
  anio: number
  direccion: string
  pais: string
  /** Días desde hoy: negativo = ya estrenada, positivo = próximo estreno. */
  estreno: number
}[] = [
  {
    titulo: 'El faro del sur',
    genero: 'Drama',
    duracion: 112,
    calificacion: '13',
    idiomas: ['subtitulada'],
    formatos: ['2d'],
    sinopsis:
      'Un farero jubilado vuelve a su pueblo costero para reencontrarse con la hija que dejó de ver hace veinte años.',
    anio: 2026,
    direccion: 'Lucía Ferrer',
    pais: 'Uruguay',
    estreno: -5,
  },
  {
    titulo: 'Galaxia perdida',
    genero: 'Animación',
    duracion: 95,
    calificacion: 'atp',
    idiomas: ['doblada'],
    formatos: ['2d', '3d'],
    sinopsis:
      'Dos hermanos encuentran una nave espacial en el fondo del patio y viajan por el universo para volver a casa antes de la cena.',
    anio: 2026,
    direccion: 'Tom Hale',
    pais: 'Estados Unidos',
    estreno: -12,
  },
  {
    titulo: 'Sin rastro',
    genero: 'Suspenso',
    duracion: 104,
    calificacion: '16',
    idiomas: ['subtitulada', 'doblada'],
    formatos: ['2d'],
    sinopsis:
      'Una detective investiga la desaparición de un turista en un hotel de montaña aislado por la nieve.',
    anio: 2026,
    direccion: 'Marta Ibáñez',
    pais: 'España',
    estreno: -2,
  },
  {
    titulo: 'El último verano',
    genero: 'Comedia',
    duracion: 98,
    calificacion: '7',
    idiomas: ['subtitulada'],
    formatos: ['2d'],
    sinopsis:
      'Cuatro amigos de la infancia se reencuentran en el balneario donde pasaban las vacaciones.',
    anio: 2026,
    direccion: 'Pablo Correa',
    pais: 'Argentina',
    estreno: 9,
  },
]

/** Horarios de funciones (hora de Montevideo) para cada película en cartel. */
export const HORARIOS_FUNCIONES = ['16:30', '19:00', '21:30']

export const ANUNCIANTES = [
  { anunciante: 'Ferretería del Puerto', color: '#c2410c' },
  { anunciante: 'Panadería La Espiga', color: '#a16207' },
  { anunciante: 'Óptica Central', color: '#1d4ed8' },
] as const

export const AJUSTES = {
  streamUrl: 'https://stream.ejemplo.uy/visionfm',
  telefono: '4562 0000',
  whatsapp: '099 000 000',
  direccion: '18 de Julio 1000, Fray Bentos',
  email: 'contacto@example.com',
  redes: [
    { red: 'instagram', url: 'https://instagram.com/' },
    { red: 'facebook', url: 'https://facebook.com/' },
  ],
}

export const HITOS = [
  {
    anio: 1990,
    titulo: 'Primera transmisión',
    texto: 'Visión sale al aire desde un estudio en el centro.',
  },
  { anio: 2005, titulo: 'Nuevo estudio', texto: 'La radio se muda a su sede actual.' },
  { anio: 2015, titulo: 'Cinevisión', texto: 'Abre la sala de cine en Fray Bentos.' },
  { anio: 2026, titulo: 'Sitio nuevo', texto: 'Radio, noticias y cine en un mismo lugar.' },
]
