/**
 * Convierte un título en slug para URL: minúsculas, sin tildes ni ñ, palabras separadas por guion.
 * `Año nuevo en Fray Bentos` → `ano-nuevo-en-fray-bentos`
 */
export function slugify(texto: string): string {
  return texto
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}
