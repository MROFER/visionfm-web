// Ningún entorno se indexa hasta el lanzamiento (docs/02-trd.md, sección 2): la demo copia el sitio
// actual de la radio y Google la vería como contenido duplicado. Producción lo enciende con INDEXAR=si.
export const sePuedeIndexar = () => process.env.INDEXAR === 'si'
