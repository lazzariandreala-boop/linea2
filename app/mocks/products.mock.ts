import type { Product } from '~/types/content'
import type { StrapiCollectionResponse, StrapiQueryParams } from '~/types/strapi'
import { applyCollection, cta, media, MOCK_TS } from './builders'

// Demo contact targets (mock data only — not secrets).
const WA = '393331234567'
const MAIL = 'ordini@linea2.example'

/**
 * Source-of-truth mock dataset, shaped exactly like a populated Strapi v5
 * `/api/products?populate=*` response entry (flattened, documentId, relative
 * media URLs, components as nested objects with numeric ids).
 */
export const PRODUCTS: Product[] = [
  {
    id: 1,
    documentId: 'prod_foulard_aurora_01',
    title: 'Foulard in seta «Aurora»',
    slug: 'foulard-seta-aurora',
    description:
      'Foulard 90×90 ricavato da seta recuperata e stampato a mano con la nostra grafica esclusiva. Bordi rifiniti a mano: perfetto annodato al collo o come fascia.',
    price: 39,
    category: 'accessories',
    tags: ['novità', 'seta', 'fatto a mano'],
    featured: true,
    gallery: [
      media('foulard-seta_a11.png', 900, 1200, 'Foulard in seta Aurora annodato al collo'),
      media('foulard-seta_a12.png', 900, 1200, 'Dettaglio della stampa del foulard Aurora'),
    ],
    cta: cta('whatsapp', WA, 'Ordina su WhatsApp'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 2,
    documentId: 'prod_cintura_vento_02',
    title: 'Cintura in pelle «Vento»',
    slug: 'cintura-pelle-vento',
    description:
      'Cintura ricavata da pelle di recupero conciata al vegetale, con fibbia in ottone brunito recuperata. Si ammorbidisce con l’uso prendendo una patina unica.',
    price: 59,
    category: 'accessories',
    tags: ['pelle', 'artigianale'],
    featured: false,
    gallery: [
      media('cintura-pelle_b21.png', 900, 1200, 'Cintura in pelle Vento arrotolata'),
      media('cintura-pelle_b22.png', 900, 1200, 'Fibbia in ottone della cintura Vento'),
    ],
    cta: cta('whatsapp', WA, 'Ordina su WhatsApp'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 3,
    documentId: 'prod_occhiali_riviera_03',
    title: 'Occhiali da sole «Riviera»',
    slug: 'occhiali-sole-riviera',
    description:
      'Montatura oversize in acetato, lenti categoria 3 con protezione UV400. Custodia rigida e panno in microfibra inclusi.',
    price: 49,
    category: 'accessories',
    tags: ['estate', 'unisex'],
    featured: true,
    gallery: [
      media('occhiali-sole_c31.png', 900, 1200, 'Occhiali da sole Riviera fronte'),
      media('occhiali-sole_c32.png', 900, 1200, 'Occhiali da sole Riviera di tre quarti'),
    ],
    cta: cta('external', 'https://shop.linea2.example/occhiali-riviera', 'Acquista nello shop'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 4,
    documentId: 'prod_borsa_marea_04',
    title: 'Borsa tote «Marea»',
    slug: 'borsa-tote-marea',
    description:
      'Tote capiente in tela cerata rigenerata con manici in pelle di recupero. Tasca interna con zip e fondo rinforzato: la compagna perfetta per ogni giorno.',
    price: 119,
    category: 'bags',
    tags: ['capiente', 'quotidiano'],
    featured: true,
    gallery: [
      media('borsa-tote_d41.png', 900, 1200, 'Borsa tote Marea indossata a spalla'),
      media('borsa-tote_d42.png', 900, 1200, 'Interno della borsa tote Marea'),
    ],
    cta: cta('whatsapp', WA, 'Prenota su WhatsApp'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 5,
    documentId: 'prod_tracolla_sentiero_05',
    title: 'Tracolla «Sentiero»',
    slug: 'borsa-tracolla-sentiero',
    description:
      'Tracolla compatta in pelle martellata con tracolla regolabile e rimovibile. Tre scomparti per avere tutto a portata di mano.',
    price: 89,
    category: 'bags',
    tags: ['tracolla', 'regolabile'],
    featured: false,
    gallery: [
      media('borsa-tracolla_e51.png', 900, 1200, 'Tracolla Sentiero vista frontale'),
      media('borsa-tracolla_e52.png', 900, 1200, 'Tracolla Sentiero dettaglio tracolla'),
    ],
    cta: cta('whatsapp', WA, 'Ordina su WhatsApp'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 6,
    documentId: 'prod_pochette_notturno_06',
    title: 'Pochette da sera «Notturno»',
    slug: 'pochette-sera-notturno',
    description:
      'Pochette rigida con chiusura gioiello e catena removibile in metallo dorato. Il tocco finale per le occasioni speciali.',
    price: 69,
    category: 'bags',
    tags: ['sera', 'elegante'],
    featured: false,
    gallery: [
      media('pochette-sera_f61.png', 900, 1200, 'Pochette da sera Notturno chiusa'),
      media('pochette-sera_f62.png', 900, 1200, 'Pochette da sera Notturno con catena'),
    ],
    cta: cta('email', MAIL, 'Richiedi disponibilità'),
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
]

/** Mirrors `GET /api/products` with filters/sort/pagination applied. */
export function productsMock(
  params: StrapiQueryParams = {},
): StrapiCollectionResponse<Product> {
  return applyCollection(PRODUCTS, params)
}
