import type { StrapiMedia } from '~/types/strapi'

/** True for already-absolute URLs (http(s), protocol-relative, data:). */
export function isAbsoluteUrl(url: string): boolean {
  return /^(https?:)?\/\//i.test(url) || url.startsWith('data:')
}

/**
 * Resolves a (relative) Strapi media URL against a base origin.
 * - absolute URLs are returned untouched
 * - an empty base (mock mode) returns the path unchanged => same-origin,
 *   served from /public/uploads
 */
export function resolveMediaUrl(
  url: string | null | undefined,
  base: string,
): string {
  if (!url) return ''
  if (isAbsoluteUrl(url)) return url
  if (!base) return url
  return `${base.replace(/\/$/, '')}${url.startsWith('/') ? '' : '/'}${url}`
}

/** Convenience: resolve a media object's main URL. */
export function resolveMedia(
  media: StrapiMedia | null | undefined,
  base: string,
): string {
  return resolveMediaUrl(media?.url, base)
}
