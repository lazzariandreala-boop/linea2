import type { StrapiMedia } from '~/types/strapi'

/**
 * Resolves relative Strapi media URLs to absolute against the runtime base.
 * Use `url()` for rendering (relative ok / same-origin in mock mode) and
 * `absolute()` for OG/social tags where crawlers require a fully-qualified URL.
 */
export function useStrapiMedia() {
  const config = useRuntimeConfig()
  // In mock mode the shipped placeholder media lives in /public, so it must
  // resolve same-origin (empty base) regardless of the configured Strapi URL.
  // The payload itself keeps relative URLs either way (v5 shape fidelity).
  const base = toBool(config.public.useMocks, true)
    ? ''
    : config.public.strapiMediaUrl || config.public.strapiUrl

  function url(media: StrapiMedia | null | undefined): string {
    return resolveMedia(media, base)
  }

  function urlFromString(value: string | null | undefined): string {
    return resolveMediaUrl(value, base)
  }

  function absolute(value: string | null | undefined): string {
    if (!value) return ''
    if (isAbsoluteUrl(value)) return value
    // In mock mode base is empty; fall back to the site origin so the OG URL
    // is still absolute and crawlable.
    const origin = base || config.public.siteUrl
    return resolveMediaUrl(value, origin)
  }

  return { url, urlFromString, absolute, base }
}
