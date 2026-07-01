import { describe, expect, it } from 'vitest'
import { formatPrice } from '~/utils/format'

describe('formatPrice', () => {
  it('formats an integer EUR price without decimals', () => {
    // NBSP between number and symbol in it-IT locale.
    expect(formatPrice(39)?.replace(/ /g, ' ')).toBe('39 €')
  })
  it('formats a decimal price with two decimals', () => {
    expect(formatPrice(39.9)?.replace(/ /g, ' ')).toBe('39,90 €')
  })
  it('returns null for missing price', () => {
    expect(formatPrice(null)).toBeNull()
    expect(formatPrice(undefined)).toBeNull()
  })
})
