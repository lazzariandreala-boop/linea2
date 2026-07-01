import { describe, expect, it } from 'vitest'
import { stringifyStrapiQuery } from '~/utils/strapiQuery'

describe('stringifyStrapiQuery', () => {
  it('serializes a slug filter in v5 bracket syntax', () => {
    const q = stringifyStrapiQuery({ filters: { slug: { $eq: 'foulard-seta-aurora' } } })
    expect(decodeURIComponent(q)).toBe('filters[slug][$eq]=foulard-seta-aurora')
  })

  it('serializes populate arrays and "*"', () => {
    expect(stringifyStrapiQuery({ populate: '*' })).toBe('populate=*')
    expect(decodeURIComponent(stringifyStrapiQuery({ populate: ['gallery', 'cta'] }))).toBe(
      'populate[0]=gallery&populate[1]=cta',
    )
  })

  it('serializes nested populate objects', () => {
    const q = stringifyStrapiQuery({ populate: { seo: { populate: { ogImage: true } } } })
    expect(decodeURIComponent(q)).toBe('populate[seo][populate][ogImage]=true')
  })

  it('serializes scalar sort and pagination', () => {
    const q = stringifyStrapiQuery({ sort: 'order:asc', pagination: { page: 1, pageSize: 24 } })
    expect(decodeURIComponent(q)).toBe('sort=order:asc&pagination[page]=1&pagination[pageSize]=24')
  })

  it('serializes array sort with indices', () => {
    const q = stringifyStrapiQuery({ sort: ['price:asc', 'title:asc'] })
    expect(decodeURIComponent(q)).toBe('sort[0]=price:asc&sort[1]=title:asc')
  })

  it('returns an empty string for empty params', () => {
    expect(stringifyStrapiQuery()).toBe('')
  })
})
