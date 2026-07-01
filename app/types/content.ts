import type { StrapiEntryMeta, StrapiMedia } from './strapi'

/**
 * Domain content types. Each maps 1:1 to a Strapi v5 content type / component
 * (see STRAPI.md). All relations and components below assume they have been
 * populated; the fetch layer always requests the populate tree these need.
 */

export type ProductCategory = 'accessories' | 'bags'

/** CTA `kind` drives href construction. WhatsApp/DM is the dominant path. */
export type CtaKind = 'external' | 'whatsapp' | 'email'

/** Reusable `shared.cta` component (Product, Tutorial, …). */
export interface CtaComponent {
  id: number
  kind: CtaKind
  /** URL for `external`, phone (digits, intl) for `whatsapp`, address for `email`. */
  value: string
  label: string
}

/** Reusable `shared.seo` component — optional per-entry override. */
export interface SeoComponent {
  id: number
  metaTitle?: string | null
  metaDescription?: string | null
  ogImage?: StrapiMedia | null
}

/** Reusable `shared.gradient` component for hero/section washes. */
export interface GradientComponent {
  id: number
  from: string
  via: string | null
  to: string
  angle: number
}

export interface Product extends StrapiEntryMeta {
  title: string
  slug: string
  description: string
  /** Optional, display-only — there is no checkout. */
  price: number | null
  category: ProductCategory
  tags: string[]
  featured: boolean
  gallery: StrapiMedia[]
  cta: CtaComponent | null
  seo?: SeoComponent | null
}

export interface TikTokVideo extends StrapiEntryMeta {
  title: string
  /** Canonical TikTok video URL (used to build the embed on interaction). */
  videoUrl: string
  /** Optional explicit embed/video id (parsed from the URL when absent). */
  embedId: string | null
  thumbnail: StrapiMedia | null
  order: number
}

export interface TutorialStep {
  id: number
  title: string
  body: string
  image?: StrapiMedia | null
}

export interface Tutorial extends StrapiEntryMeta {
  title: string
  slug: string
  description: string
  /** Either an uploaded file… */
  videoFile: StrapiMedia | null
  /** …or a third-party embed URL. Exactly one is expected per tutorial. */
  videoEmbedUrl: string | null
  /** The hook image shown on top of every tutorial card/page. */
  finalResultImage: StrapiMedia | null
  steps: TutorialStep[]
  relatedProducts: Product[]
  cta: CtaComponent | null
  seo?: SeoComponent | null
}

export type HomeSectionKey = 'accessories' | 'bags' | 'tiktok' | 'tutorials'

export interface HomeSection {
  id: number
  key: HomeSectionKey
  title: string
  subtitle?: string | null
  enabled: boolean
}

export interface HomePage extends StrapiEntryMeta {
  heroEyebrow: string
  heroHeadline: string
  heroSubline: string
  heroMedia: StrapiMedia | null
  heroGradient: GradientComponent | null
  featuredProducts: Product[]
  sections: HomeSection[]
  seo?: SeoComponent | null
}
