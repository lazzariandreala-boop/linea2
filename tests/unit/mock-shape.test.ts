import { describe, expect, it } from 'vitest'
import { productsMock } from '~/mocks/products.mock'
import { tikTokVideosMock } from '~/mocks/tiktok.mock'
import { tutorialsMock } from '~/mocks/tutorials.mock'
import { homePageMock } from '~/mocks/home.mock'
import type { StrapiMedia } from '~/types/strapi'

/**
 * These tests are the contract that protects the "swap to live Strapi = env
 * change only" guarantee. They assert the mocks emit *exactly* the Strapi v5
 * wire shape: flattened attributes, string `documentId`, `meta.pagination`,
 * relative media URLs with `formats`, components as objects, populated
 * relations. If Strapi v5's shape and these diverge, the swap breaks — so this
 * file must stay green.
 */

function expectV5Media(media: StrapiMedia) {
  expect(typeof media.id).toBe('number')
  expect(typeof media.documentId).toBe('string')
  // RELATIVE url — resolved against the base URL at render time.
  expect(media.url.startsWith('/uploads/')).toBe(true)
  expect(typeof media.width).toBe('number')
  expect(typeof media.height).toBe('number')
  expect(['image/png', 'image/jpeg']).toContain(media.mime)
  // formats present for a large source, each with a relative url.
  expect(media.formats).toBeTruthy()
  for (const fmt of Object.values(media.formats ?? {})) {
    expect(fmt.url.startsWith('/uploads/')).toBe(true)
    expect(typeof fmt.width).toBe('number')
  }
}

function expectFlattenedEntry(entry: Record<string, unknown>) {
  expect(typeof entry.id).toBe('number')
  expect(typeof entry.documentId).toBe('string')
  // v5 is flattened — there must be NO v4 `attributes` wrapper.
  expect(entry).not.toHaveProperty('attributes')
  expect(typeof entry.publishedAt).toBe('string')
}

describe('products mock — v5 collection shape', () => {
  it('returns a { data, meta.pagination } envelope', () => {
    const res = productsMock()
    expect(Array.isArray(res.data)).toBe(true)
    expect(res.data.length).toBeGreaterThan(0)
    const p = res.meta.pagination!
    expect(typeof p.page).toBe('number')
    expect(typeof p.pageSize).toBe('number')
    expect(typeof p.pageCount).toBe('number')
    expect(p.total).toBe(res.data.length)
  })

  it('each product is a flattened v5 entry with components + media', () => {
    for (const product of productsMock().data) {
      expectFlattenedEntry(product as unknown as Record<string, unknown>)
      expect(['accessories', 'bags']).toContain(product.category)
      expect(Array.isArray(product.tags)).toBe(true)
      expect(typeof product.featured).toBe('boolean')
      expect(product.gallery.length).toBeGreaterThan(0)
      product.gallery.forEach(expectV5Media)
      // CTA component: nested object with a numeric id.
      expect(typeof product.cta?.id).toBe('number')
      expect(['external', 'whatsapp', 'email']).toContain(product.cta?.kind)
    }
  })

  it('applies category + slug filters like the live API', () => {
    const bags = productsMock({ filters: { category: { $eq: 'bags' } } })
    expect(bags.data.length).toBeGreaterThan(0)
    expect(bags.data.every((p) => p.category === 'bags')).toBe(true)

    const one = productsMock({ filters: { slug: { $eq: 'foulard-seta-aurora' } } })
    expect(one.data).toHaveLength(1)
    expect(one.data[0].slug).toBe('foulard-seta-aurora')
  })

  it('respects pagination pageSize', () => {
    const res = productsMock({ pagination: { page: 1, pageSize: 2 } })
    expect(res.data).toHaveLength(2)
    expect(res.meta.pagination!.pageSize).toBe(2)
    expect(res.meta.pagination!.total).toBeGreaterThan(2)
  })
})

describe('tiktok-videos mock', () => {
  it('is sorted by order asc and has relative thumbnails', () => {
    const res = tikTokVideosMock()
    const orders = res.data.map((v) => v.order)
    expect(orders).toEqual([...orders].sort((a, b) => a - b))
    for (const v of res.data) {
      expectFlattenedEntry(v as unknown as Record<string, unknown>)
      expect(v.videoUrl).toContain('tiktok.com')
      if (v.thumbnail) expectV5Media(v.thumbnail)
    }
  })
})

describe('tutorials mock — populated relations + components', () => {
  it('exposes finalResultImage, steps and related products', () => {
    for (const tut of tutorialsMock().data) {
      expectFlattenedEntry(tut as unknown as Record<string, unknown>)
      expect(tut.finalResultImage).toBeTruthy()
      expectV5Media(tut.finalResultImage as StrapiMedia)
      expect(Array.isArray(tut.steps)).toBe(true)
      // Relation populated as an array of flattened product entries.
      expect(tut.relatedProducts.length).toBeGreaterThan(0)
      tut.relatedProducts.forEach((p) =>
        expectFlattenedEntry(p as unknown as Record<string, unknown>),
      )
    }
  })
})

describe('home-page mock — v5 single type', () => {
  it('returns an object (not array) with empty meta', () => {
    const res = homePageMock()
    expect(Array.isArray(res.data)).toBe(false)
    expect(res.data).toBeTruthy()
    expect(res.meta).toEqual({})
  })

  it('has hero gradient, sections and populated featured products', () => {
    const home = homePageMock().data!
    expectFlattenedEntry(home as unknown as Record<string, unknown>)
    expect(typeof home.heroGradient?.angle).toBe('number')
    expect(home.sections.length).toBeGreaterThan(0)
    expect(home.featuredProducts.length).toBeGreaterThan(0)
    expect(home.featuredProducts.every((p) => p.featured)).toBe(true)
  })
})
