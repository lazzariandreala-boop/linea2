import type {
  StrapiCollectionResponse,
  StrapiQueryParams,
  StrapiSingleResponse,
} from '~/types/strapi'
import { getCollectionMock, getSingleMock } from '~/mocks'

/**
 * Low-level Strapi v5 client.
 *
 * This is the SINGLE place where mock vs. live is decided (gated by
 * NUXT_PUBLIC_USE_MOCKS). Because the mock payloads are byte-shape-identical to
 * Strapi v5, every higher-level composable is written once and works in both
 * modes — flipping the env flag is the only change needed to go live.
 */
export function useStrapi() {
  const config = useRuntimeConfig()
  const baseUrl = config.public.strapiUrl
  // Normalise: a NUXT_PUBLIC_USE_MOCKS env override can arrive as a string.
  const useMocks = toBool(config.public.useMocks, true)
  // Server-only token; on the client this is an empty string by design.
  const token = config.strapiToken

  function authHeaders(): Record<string, string> {
    return token ? { Authorization: `Bearer ${token}` } : {}
  }

  async function find<T>(
    resource: string,
    params: StrapiQueryParams = {},
  ): Promise<StrapiCollectionResponse<T>> {
    if (useMocks) {
      const mock = getCollectionMock(resource)
      if (!mock) {
        throw createError({
          statusCode: 500,
          statusMessage: `No collection mock registered for "${resource}"`,
        })
      }
      // Clone to emulate a fresh network payload (no shared mutable state).
      return structuredClone(mock(params)) as unknown as StrapiCollectionResponse<T>
    }

    const query = stringifyStrapiQuery(params)
    return await $fetch<StrapiCollectionResponse<T>>(
      `/api/${resource}${query ? `?${query}` : ''}`,
      { baseURL: baseUrl, headers: authHeaders() },
    )
  }

  async function findSingle<T>(
    resource: string,
    params: StrapiQueryParams = {},
  ): Promise<StrapiSingleResponse<T>> {
    if (useMocks) {
      const mock = getSingleMock(resource)
      if (!mock) {
        throw createError({
          statusCode: 500,
          statusMessage: `No single-type mock registered for "${resource}"`,
        })
      }
      return structuredClone(mock(params)) as unknown as StrapiSingleResponse<T>
    }

    const query = stringifyStrapiQuery(params)
    return await $fetch<StrapiSingleResponse<T>>(
      `/api/${resource}${query ? `?${query}` : ''}`,
      { baseURL: baseUrl, headers: authHeaders() },
    )
  }

  return { find, findSingle, baseUrl, useMocks }
}
