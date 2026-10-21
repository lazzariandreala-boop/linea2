import { describe, expect, it } from 'vitest'
import {
  cleanInitials,
  defaultStellaState,
  describeStella,
  stellaKey,
  stellaPrice,
  toggleWash,
  withModel,
} from '~/utils/stella/options'

describe('stella configurator options', () => {
  it('prices the default configuration as in the mockup (€410)', () => {
    expect(stellaPrice(defaultStellaState())).toBe(410)
  })

  it('adds wash, lining, patch, hardware and finish surcharges', () => {
    const s = { model: 'stella', wash: ['raw'], lining: 'twill', patch: 'street', hw: 'black', finish: 'leather', initials: '' }
    expect(stellaPrice(s)).toBe(360 + 20 + 10 + 30 + 10 + 15)
  })

  it('charges initials only when a monogram finish is chosen', () => {
    const base = { ...defaultStellaState(), initials: 'AL' }
    expect(stellaPrice(base)).toBe(425)
    expect(stellaPrice({ ...base, finish: 'none' })).toBe(410)
  })

  it('keeps at most two washes and never zero', () => {
    expect(toggleWash(['indigo', 'vintage'], 'black')).toEqual(['vintage', 'black'])
    expect(toggleWash(['indigo', 'vintage'], 'indigo')).toEqual(['vintage'])
    expect(toggleWash(['indigo'], 'indigo')).toEqual(['indigo'])
  })

  it('single-shell models take one wash, no hardware, and their own base price', () => {
    const luna = withModel({ ...defaultStellaState(), hw: 'black' }, 'luna')
    expect(luna.wash).toEqual(['indigo'])
    // 290 base + floral 25 + organic 25; black steel (+10) does not apply.
    expect(stellaPrice(luna)).toBe(340)
    expect(describeStella(luna)).toBe('Deep Indigo · Floral Silk · Organic Patterns · Brass Stitch')
    expect(toggleWash(luna.wash, 'raw', 1)).toEqual(['raw'])
    expect(stellaKey(luna)).not.toBe(stellaKey(defaultStellaState()))
  })

  it('falls back to Stella for an unknown model id', () => {
    expect(withModel(defaultStellaState(), 'nope').model).toBe('stella')
  })

  it('cleans initials to 3 uppercase letters/digits', () => {
    expect(cleanInitials('a.l 2x')).toBe('AL2')
  })

  it('gives identical configurations the same cart key', () => {
    const a = defaultStellaState()
    expect(stellaKey(a)).toBe(stellaKey(defaultStellaState()))
    expect(stellaKey({ ...a, lining: 'navy' })).not.toBe(stellaKey(a))
    // Initials are ignored when there is no monogram.
    expect(stellaKey({ ...a, finish: 'none', initials: 'X' })).toBe(stellaKey({ ...a, finish: 'none' }))
  })

  it('describes the configuration for the cart line', () => {
    expect(describeStella({ ...defaultStellaState(), initials: 'AL' })).toBe(
      'Deep Indigo + Vintage Light Blue · Floral Silk · Organic Patterns · Brass · Brass Stitch "AL"',
    )
  })
})
