/**
 * Central list of the editorial images the site uses, so a real photograph
 * can replace a placeholder in one place. Everything in public/editorial is
 * still a studio render or placeholder (see the README "Foto da sostituire").
 */
export interface EditorialImage {
  src: string
  width: number
  height: number
  alt: string
}

const img = (src: string, width: number, height: number, alt: string): EditorialImage => ({ src, width, height, alt })

export const EDITORIAL = {
  hero: img('/editorial/hero-stella.webp', 1400, 1500, 'Borsa Stella a secchiello in denim indigo recuperato, con tracolla in denim chiaro'),
  workbench: img('/editorial/workbench.webp', 1400, 1000, 'Pezzi di denim recuperato sul tavolo da taglio del laboratorio'),
  seam: img('/editorial/detail-seam.webp', 1200, 800, 'Cucitura a vista con filo ocra sul bordo di due pannelli di denim'),
  patchwork: img('/editorial/detail-patchwork.webp', 1200, 800, 'Patchwork di denim in tre lavaggi diversi, uniti da cuciture a vista'),
  brass: img('/editorial/detail-brass.webp', 1200, 800, 'Anello in ottone su una linguetta di denim con etichetta in pelle Linea 2'),
} as const

/** Catalogue photo of a configurable bag model (see BAGS). */
export function bagImage(id: string, name: string, type: string): EditorialImage {
  return img(`/editorial/bag-${id}.webp`, 900, 1080, `Borsa ${name}, ${type.toLowerCase()}, in denim recuperato`)
}

export const SOCIAL_LINKS = {
  instagram: 'https://www.instagram.com/linea2.upcycling/',
  tiktok: 'https://www.tiktok.com/@linea2.upcycling',
  whatsapp: 'https://wa.me/393401475223',
} as const
