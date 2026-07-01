/** Default OG image shipped in /public (1200×630). */
const DEFAULT_OG = '/uploads/og-default_8a1d44.png'
const DEFAULT_OG_W = 1200
const DEFAULT_OG_H = 630

export interface SeoHeadOptions {
  title: string
  description: string
  /** Relative or absolute media URL; falls back to the default OG image. */
  image?: string | null
  imageAlt?: string
  imageWidth?: number
  imageHeight?: number
  type?: 'website' | 'article'
  /** Path for canonical/og:url. Defaults to the current route path. */
  path?: string
}

/**
 * Sets title/description/canonical + OpenGraph + Twitter card on a page.
 * OG/Twitter images are always made ABSOLUTE (crawlers require it). Social
 * share previews are a core feature here — most traffic arrives via shared
 * links from TikTok.
 */
export function useSeoHead(options: SeoHeadOptions) {
  const config = useRuntimeConfig()
  const route = useRoute()
  const media = useStrapiMedia()

  const siteUrl = config.public.siteUrl.replace(/\/$/, '')
  const path = options.path ?? route.path
  const canonical = `${siteUrl}${path}`

  const hasImage = Boolean(options.image)
  const image = hasImage ? media.absolute(options.image) : `${siteUrl}${DEFAULT_OG}`
  const imageWidth = hasImage ? options.imageWidth : DEFAULT_OG_W
  const imageHeight = hasImage ? options.imageHeight : DEFAULT_OG_H

  useSeoMeta({
    title: options.title,
    description: options.description,
    ogTitle: options.title,
    ogDescription: options.description,
    ogType: options.type ?? 'website',
    ogUrl: canonical,
    ogSiteName: config.public.siteName,
    ogLocale: config.public.defaultLocale,
    ogImage: image,
    ogImageAlt: options.imageAlt ?? options.title,
    ogImageWidth: imageWidth,
    ogImageHeight: imageHeight,
    twitterCard: 'summary_large_image',
    twitterTitle: options.title,
    twitterDescription: options.description,
    twitterImage: image,
    twitterImageAlt: options.imageAlt ?? options.title,
  })

  useHead({
    link: [{ rel: 'canonical', href: canonical }],
  })
}
