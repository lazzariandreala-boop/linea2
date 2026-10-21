import type { HomePage } from '~/types/content'
import type { StrapiSingleResponse } from '~/types/strapi'
import { gradient, media, MOCK_TS } from './builders'
import { PRODUCTS } from './products.mock'

export const HOME_PAGE: HomePage = {
  id: 1,
  documentId: 'home_singleton',
  heroEyebrow: 'Novità · La borsa Stella',
  heroHeadline: 'Denim ricostruito,\nsu misura',
  heroSubline:
    'Ogni pezzo Linea 2 nasce da un paio di jeans che nessuno indossa più. Lo smontiamo a mano e lo ricuciamo in una borsa che esiste una volta sola. Scegli lavaggio, fodera e dettagli, e guardala prendere forma in 3D.',
  heroMedia: media('stella-hero_5e11a0.png', 1600, 1000, 'Borsa Stella in denim con toppa patchwork'),
  heroGradient: gradient('#f2643d', '#d24a26', '#4d3568', 145),
  featuredProducts: PRODUCTS.filter((p) => p.featured),
  sections: [
    { id: 1, key: 'accessories', title: 'Accessori', subtitle: 'Foulard, cinture e occhiali', enabled: true },
    { id: 2, key: 'bags', title: 'Borse', subtitle: 'Tote, tracolle e pochette', enabled: true },
    { id: 3, key: 'tiktok', title: 'Dai nostri TikTok', subtitle: 'Guarda la linea in movimento', enabled: true },
    { id: 4, key: 'tutorials', title: 'Tutorial', subtitle: 'Consigli di stile e cura', enabled: true },
  ],
  createdAt: MOCK_TS,
  updatedAt: MOCK_TS,
  publishedAt: MOCK_TS,
  locale: 'it',
}

/** Mirrors `GET /api/home-page` (single type → object data, empty meta). */
export function homePageMock(): StrapiSingleResponse<HomePage> {
  return { data: HOME_PAGE, meta: {} }
}
