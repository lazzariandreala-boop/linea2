import type { CtaComponent } from '~/types/content'

/**
 * Maps a typed CTA component to a concrete href.
 *   external -> the URL as-is
 *   whatsapp -> https://wa.me/<digits>
 *   email    -> mailto:<address>
 * WhatsApp/DM is the dominant path, so it is handled first-class.
 */
export function ctaHref(cta: CtaComponent): string {
  switch (cta.kind) {
    case 'whatsapp':
      return `https://wa.me/${cta.value.replace(/\D/g, '')}`
    case 'email':
      return `mailto:${cta.value}`
    case 'external':
      return cta.value
    default: {
      // Exhaustiveness guard — a new CtaKind must be handled explicitly.
      const _never: never = cta.kind
      return _never
    }
  }
}

export interface CtaLinkAttrs {
  href: string
  target?: '_blank'
  rel?: string
}

/** Anchor attributes for a CTA, opening off-site/app links in a new tab. */
export function ctaAttrs(cta: CtaComponent): CtaLinkAttrs {
  const href = ctaHref(cta)
  if (cta.kind === 'external' || cta.kind === 'whatsapp') {
    return { href, target: '_blank', rel: 'noopener noreferrer' }
  }
  return { href }
}
