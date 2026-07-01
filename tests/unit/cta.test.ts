import { describe, expect, it } from 'vitest'
import { ctaAttrs, ctaHref } from '~/utils/cta'
import type { CtaComponent } from '~/types/content'

const make = (kind: CtaComponent['kind'], value: string): CtaComponent => ({
  id: 1,
  kind,
  value,
  label: 'x',
})

describe('ctaHref', () => {
  it('builds a wa.me link from phone digits', () => {
    expect(ctaHref(make('whatsapp', '+39 333 123 4567'))).toBe('https://wa.me/393331234567')
  })
  it('builds a mailto link', () => {
    expect(ctaHref(make('email', 'ordini@linea2.example'))).toBe('mailto:ordini@linea2.example')
  })
  it('passes through an external URL', () => {
    expect(ctaHref(make('external', 'https://shop.example/x'))).toBe('https://shop.example/x')
  })
})

describe('ctaAttrs', () => {
  it('opens external + whatsapp in a new tab with rel', () => {
    expect(ctaAttrs(make('whatsapp', '393331234567'))).toMatchObject({
      target: '_blank',
      rel: 'noopener noreferrer',
    })
    expect(ctaAttrs(make('external', 'https://x'))).toMatchObject({ target: '_blank' })
  })
  it('keeps mailto in the same tab', () => {
    const attrs = ctaAttrs(make('email', 'a@b.c'))
    expect(attrs.target).toBeUndefined()
  })
})
