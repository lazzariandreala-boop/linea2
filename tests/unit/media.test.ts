import { describe, expect, it } from 'vitest'
import { isAbsoluteUrl, resolveMediaUrl } from '~/utils/media'

describe('isAbsoluteUrl', () => {
  it('detects absolute, protocol-relative and data URLs', () => {
    expect(isAbsoluteUrl('https://x/y.png')).toBe(true)
    expect(isAbsoluteUrl('//x/y.png')).toBe(true)
    expect(isAbsoluteUrl('data:image/png;base64,xx')).toBe(true)
    expect(isAbsoluteUrl('/uploads/y.png')).toBe(false)
  })
})

describe('resolveMediaUrl', () => {
  it('joins a relative URL to a base (live mode)', () => {
    expect(resolveMediaUrl('/uploads/y.png', 'http://localhost:1337')).toBe(
      'http://localhost:1337/uploads/y.png',
    )
  })
  it('keeps a relative URL same-origin with an empty base (mock mode)', () => {
    expect(resolveMediaUrl('/uploads/y.png', '')).toBe('/uploads/y.png')
  })
  it('never double-prefixes an absolute URL', () => {
    expect(resolveMediaUrl('https://cdn/y.png', 'http://localhost:1337')).toBe('https://cdn/y.png')
  })
  it('returns empty string for missing URLs', () => {
    expect(resolveMediaUrl(null, 'http://x')).toBe('')
  })
})
