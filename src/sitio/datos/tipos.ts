import type { ProgramaEnGrilla } from '../lib/grilla'
import type { Imagen } from './formas'

/** Un programa tal como viaja al navegador para calcular "Al aire" y "A continuación". */
export type ProgramaGrilla = ProgramaEnGrilla & { slug: string; conduccion: string }

/** Un programa con lo que muestra la página Programación. */
export type ProgramaCompleto = ProgramaGrilla & { descripcion: string }

export type Voz = { id: number; nombre: string; rol: string; foto: Imagen | null }
