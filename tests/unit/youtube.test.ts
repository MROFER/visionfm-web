import { describe, expect, it } from 'vitest'

import { idDeYouTube } from '@/sitio/lib/youtube'

describe('idDeYouTube', () => {
  it.each([
    ['https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=10', 'dQw4w9WgXcQ'],
    ['https://youtu.be/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://www.youtube.com/embed/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://youtube.com/shorts/dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['https://m.youtube.com/watch?v=dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
    ['dQw4w9WgXcQ', 'dQw4w9WgXcQ'],
  ])('%s', (entrada, id) => {
    expect(idDeYouTube(entrada)).toBe(id)
  })

  it('devuelve null si no es de YouTube', () => {
    expect(idDeYouTube('https://vimeo.com/123')).toBeNull()
    expect(idDeYouTube('cualquier cosa')).toBeNull()
    expect(idDeYouTube('')).toBeNull()
  })
})
