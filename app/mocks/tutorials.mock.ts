import type { Product, Tutorial } from '~/types/content'
import type { StrapiCollectionResponse, StrapiQueryParams } from '~/types/strapi'
import { applyCollection, cta, media, MOCK_TS } from './builders'
import { PRODUCTS } from './products.mock'

const WA = '393331234567'

const bySlug = (slug: string): Product =>
  PRODUCTS.find((p) => p.slug === slug) as Product

export const TUTORIALS: Tutorial[] = [
  {
    id: 1,
    documentId: 'tut_foulard_01',
    title: 'Come annodare il foulard in 3 stili',
    slug: 'annodare-foulard-3-stili',
    description:
      'Dal nodo parigino alla fascia per capelli: tre modi semplici per indossare il foulard Aurora ogni giorno.',
    videoFile: null,
    videoEmbedUrl: 'https://www.tiktok.com/@linea2.upcycling/video/7300000000000000002',
    finalResultImage: media('tut-foulard-finale_u01.png', 1200, 900, 'Risultato finale: foulard annodato al collo'),
    steps: [
      {
        id: 1,
        title: 'Prepara il foulard',
        body: 'Stendi il foulard su una superficie piana e piegalo in diagonale per ottenere un triangolo.',
        image: media('tut-foulard-step_s01.png', 800, 600, 'Foulard piegato in diagonale'),
      },
      {
        id: 2,
        title: 'Il nodo parigino',
        body: 'Avvolgi il foulard attorno al collo, incrocia le estremità sul davanti e annoda con un nodo morbido.',
        image: null,
      },
    ],
    relatedProducts: [bySlug('foulard-seta-aurora')],
    cta: cta('whatsapp', WA, 'Ordina il foulard'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 2,
    documentId: 'tut_borsa_cura_02',
    title: 'Cura e pulizia della pelle',
    slug: 'cura-pulizia-pelle',
    description:
      'Pochi gesti per mantenere borse e cinture in pelle morbide e protette nel tempo.',
    videoFile: null,
    videoEmbedUrl: 'https://www.tiktok.com/@linea2.upcycling/video/7300000000000000003',
    finalResultImage: media('tut-borsa-cura_u02.png', 1200, 900, 'Risultato finale: borsa in pelle curata e lucida'),
    steps: [
      {
        id: 3,
        title: 'Spolvera',
        body: 'Rimuovi la polvere con un panno in microfibra asciutto, seguendo il verso della pelle.',
        image: media('tut-borsa-step_s02.png', 800, 600, 'Pulizia della pelle con panno in microfibra'),
      },
      {
        id: 4,
        title: 'Nutri la pelle',
        body: 'Applica una piccola quantità di crema neutra e lascia assorbire prima di lucidare.',
        image: null,
      },
    ],
    relatedProducts: [bySlug('borsa-tote-marea'), bySlug('cintura-pelle-vento')],
    cta: cta('whatsapp', WA, 'Scopri le borse'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 3,
    documentId: 'tut_look_03',
    title: 'Crea il look perfetto per l’aperitivo',
    slug: 'look-aperitivo',
    description:
      'Abbiniamo pochette, occhiali e foulard per un look serale curato in cinque minuti.',
    videoFile: null,
    videoEmbedUrl: 'https://www.tiktok.com/@linea2.upcycling/video/7300000000000000001',
    finalResultImage: media('tut-look-finale_u03.png', 1200, 900, 'Risultato finale: look completo per aperitivo'),
    steps: [
      {
        id: 5,
        title: 'Parti dalla base',
        body: 'Scegli un outfit monocromatico così gli accessori diventano protagonisti.',
        image: media('tut-look-step_s03.png', 800, 600, 'Base monocromatica del look'),
      },
    ],
    relatedProducts: [
      bySlug('pochette-sera-notturno'),
      bySlug('occhiali-sole-riviera'),
      bySlug('foulard-seta-aurora'),
    ],
    cta: cta('whatsapp', WA, 'Componi il tuo look'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
]

/** Mirrors `GET /api/tutorials`. */
export function tutorialsMock(
  params: StrapiQueryParams = {},
): StrapiCollectionResponse<Tutorial> {
  return applyCollection(TUTORIALS, params)
}
