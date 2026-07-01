import { describe, expect, it } from 'vitest'
import { toBool } from '~/utils/env'

describe('toBool — runtime flag coercion', () => {
  it('passes through real booleans', () => {
    expect(toBool(true)).toBe(true)
    expect(toBool(false)).toBe(false)
  })
  it('treats the string "false" as false (the bug this guards)', () => {
    expect(toBool('false')).toBe(false)
    expect(toBool('true')).toBe(true)
    expect(toBool('1')).toBe(true)
  })
  it('uses the fallback for undefined', () => {
    expect(toBool(undefined, true)).toBe(true)
    expect(toBool(undefined)).toBe(false)
  })
})
