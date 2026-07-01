import type {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '~/types/strapi'
import { productsMock } from './products.mock'
import { tikTokVideosMock } from './tiktok.mock'
import { tutorialsMock } from './tutorials.mock'
import { homePageMock } from './home.mock'

/**
 * Registry that maps a Strapi resource path to its mock. The fetch layer
 * dispatches here when NUXT_PUBLIC_USE_MOCKS is on; every entry returns a true
 * v5 envelope so callers can't tell mock from live.
 */
type CollectionMock = (params: StrapiQueryParams) => StrapiCollectionResponse<unknown>
type SingleMock = (params: StrapiQueryParams) => StrapiSingleResponse<unknown>

const COLLECTION_MOCKS: Record<string, CollectionMock> = {
  products: productsMock,
  'tiktok-videos': tikTokVideosMock,
  tutorials: tutorialsMock,
}

const SINGLE_MOCKS: Record<string, SingleMock> = {
  'home-page': homePageMock,
}

export function getCollectionMock(resource: string): CollectionMock | undefined {
  return COLLECTION_MOCKS[resource]
}

export function getSingleMock(resource: string): SingleMock | undefined {
  return SINGLE_MOCKS[resource]
}
