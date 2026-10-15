/** ["Ana", "Luis", "Marta"] → "Ana, Luis y Marta" */
export function enumerar(nombres: string[]) {
  if (nombres.length < 2) return nombres.join('')
  return `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}
