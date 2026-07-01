import type { TikTokVideo } from '~/types/content'
import type { StrapiCollectionResponse, StrapiQueryParams } from '~/types/strapi'
import { applyCollection, media, MOCK_TS } from './builders'

const HANDLE = '@linea2.upcycling'

export const TIKTOK_VIDEOS: TikTokVideo[] = [
  {
    id: 1,
    documentId: 'tt_unboxing_01',
    title: 'Unboxing della nuova collezione',
    videoUrl: `https://www.tiktok.com/${HANDLE}/video/7300000000000000001`,
    embedId: '7300000000000000001',
    thumbnail: media('tiktok-unboxing_t01.png', 720, 1280, 'Anteprima unboxing nuova collezione'),
    order: 1,
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 2,
    documentId: 'tt_styling_02',
    title: '3 modi per annodare il foulard',
    videoUrl: `https://www.tiktok.com/${HANDLE}/video/7300000000000000002`,
    embedId: '7300000000000000002',
    thumbnail: media('tiktok-styling_t02.png', 720, 1280, 'Anteprima tutorial annodare il foulard'),
    order: 2,
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 3,
    documentId: 'tt_dietro_03',
    title: 'Dietro le quinte del laboratorio',
    videoUrl: `https://www.tiktok.com/${HANDLE}/video/7300000000000000003`,
    embedId: '7300000000000000003',
    thumbnail: media('tiktok-dietro_t03.png', 720, 1280, 'Anteprima dietro le quinte del laboratorio'),
    order: 3,
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
  {
    id: 4,
    documentId: 'tt_nuovi_arrivi_04',
    title: 'Nuovi arrivi: le borse dell’estate',
    videoUrl: `https://www.tiktok.com/${HANDLE}/video/7300000000000000004`,
    embedId: '7300000000000000004',
    thumbnail: media('tiktok-nuovi-arrivi_t04.png', 720, 1280, 'Anteprima nuovi arrivi borse estive'),
    order: 4,
    createdAt: MOCK_TS,
    updatedAt: MOCK_TS,
    publishedAt: MOCK_TS,
    locale: 'it',
  },
]

/** Mirrors `GET /api/tiktok-videos` (default sort by `order:asc`). */
export function tikTokVideosMock(
  params: StrapiQueryParams = {},
): StrapiCollectionResponse<TikTokVideo> {
  return applyCollection(TIKTOK_VIDEOS, { sort: 'order:asc', ...params })
}
