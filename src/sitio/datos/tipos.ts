import type { ProgramaEnGrilla } from '../lib/grilla'

/** Un programa tal como viaja al navegador para calcular "Al aire" y "A continuación". */
export type ProgramaGrilla = ProgramaEnGrilla & { slug: string; conduccion: string }
