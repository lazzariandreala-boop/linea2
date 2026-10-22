import { describe, expect, it } from 'vitest'
import {
  STELLA_MAX_PATCHES,
  WASH,
  addPatch,
  cleanInitials,
  decodeStella,
  defaultStellaState,
  describeStella,
  encodeStella,
  stellaKey,
  stellaPrice,
  toggleWash,
  withModel,
  type StellaState,
} from '~/utils/stella/options'

const withPatches = (s: StellaState, styles: string[]): StellaState => {
  let out: StellaState = { ...s, patches: [] }
  for (const st of styles) out = { ...out, patches: addPatch(out, st) }
  return out
}

describe('stella configurator options', () => {
  it('prices the default configuration as in the mockup (€410)', () => {
    expect(stellaPrice(defaultStellaState())).toBe(410)
  })

  it('adds wash, lining, patch, hardware and finish surcharges', () => {
    const s = withPatches({ ...defaultStellaState(), wash: ['raw'], lining: 'twill', hw: 'black', finish: 'leather' }, ['street'])
    expect(stellaPrice(s)).toBe(360 + 20 + 10 + 30 + 10 + 15)
  })

  it('prices every patch on its own, and none at all', () => {
    const base = defaultStellaState()
    expect(stellaPrice(withPatches(base, []))).toBe(410 - 25)
    expect(stellaPrice(withPatches(base, ['organic', 'graphic', 'street']))).toBe(410 - 25 + 25 + 20 + 30)
  })

  it('stops adding patches at the limit and places each at its own spot', () => {
    const s = withPatches(defaultStellaState(), Array(STELLA_MAX_PATCHES + 2).fill('organic'))
    expect(s.patches).toHaveLength(STELLA_MAX_PATCHES)
    const spots = new Set(s.patches.map((pt) => `${pt.u},${pt.v}`))
    expect(spots.size).toBe(STELLA_MAX_PATCHES)
  })

  it('always has a monogram; initials cost extra', () => {
    const base = defaultStellaState()
    expect(base.finish).toBe('embroidery')
    expect(stellaPrice({ ...base, initials: 'AL' })).toBe(425)
    expect(describeStella(base)).toContain('Brass Stitch')
  })

  it('offers grey and black denim', () => {
    const ids = WASH.map((w) => w.id)
    expect(ids).toEqual(expect.arrayContaining(['grey', 'charcoal', 'black', 'jet']))
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

  it('moves decals to the new model spots when switching bag', () => {
    const s = { ...defaultStellaState(), mono: { u: 0.2, v: 0.9, side: 'back' as const } }
    const luna = withModel(s, 'luna')
    expect(luna.mono).toEqual({ u: 0.5, v: 0.37, side: 'front' })
  })

  it('falls back to Stella for an unknown model id', () => {
    expect(withModel(defaultStellaState(), 'nope').model).toBe('stella')
  })

  it('cleans initials to 3 uppercase letters/digits', () => {
    expect(cleanInitials('a.l 2x')).toBe('AL2')
  })

  it('gives identical configurations the same cart key, and moved decals a new one', () => {
    const a = defaultStellaState()
    expect(stellaKey(a)).toBe(stellaKey(defaultStellaState()))
    expect(stellaKey({ ...a, lining: 'navy' })).not.toBe(stellaKey(a))
    expect(stellaKey({ ...a, mono: { ...a.mono, u: 0.3 } })).not.toBe(stellaKey(a))
    expect(stellaKey({ ...a, patches: [{ ...a.patches[0]!, side: 'back' }] })).not.toBe(stellaKey(a))
  })

  it('describes the configuration for the cart line', () => {
    const s = withPatches({ ...defaultStellaState(), initials: 'AL' }, ['organic', 'organic', 'street'])
    expect(describeStella(s)).toBe(
      'Deep Indigo + Vintage Light Blue · Floral Silk · Organic Patterns ×2 + Street Art · Brass · Brass Stitch "AL"',
    )
    expect(describeStella(withPatches(s, []))).toContain('No patches')
  })

  it('round-trips a design through the cart link', () => {
    const s = withPatches({ ...withModel(defaultStellaState(), 'sole'), wash: ['charcoal'], initials: 'AL', finish: 'leather' }, ['graphic', 'street'])
    s.patches[1] = { ...s.patches[1]!, side: 'back', u: 0.31, v: 0.62, size: 'M' }
    s.mono = { u: 0.4, v: 0.7, side: 'front' }
    expect(decodeStella(encodeStella(s))).toEqual(s)
  })

  it('rejects or sanitises tampered links', () => {
    expect(decodeStella('%%%')).toBeNull()
    const bad = decodeStella(encodeURIComponent(JSON.stringify({ m: 'luna', w: ['x', 'indigo', 'jet'], p: [['?', 'XL', 'b', 9, -3]], i: 'a<b>c d', f: 'none' })))!
    expect(bad.model).toBe('luna')
    expect(bad.wash).toEqual(['indigo'])
    expect(bad.patches).toEqual([{ style: 'organic', size: 'M', side: 'back', u: 0.95, v: 0.05 }])
    expect(bad.initials).toBe('ABC')
    expect(bad.finish).toBe('embroidery')
  })
})
