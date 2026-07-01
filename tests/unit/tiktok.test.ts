import { describe, expect, it } from 'vitest'
import { isTikTokUrl, parseTikTokVideoId } from '~/utils/tiktok'

describe('parseTikTokVideoId', () => {
  it('extracts the numeric id from a video URL', () => {
    expect(parseTikTokVideoId('https://www.tiktok.com/@x/video/7300000000000000001')).toBe(
      '7300000000000000001',
    )
  })
  it('returns null when no id is present', () => {
    expect(parseTikTokVideoId('https://www.tiktok.com/@x')).toBeNull()
  })
})

describe('isTikTokUrl', () => {
  it('recognises tiktok hosts', () => {
    expect(isTikTokUrl('https://www.tiktok.com/@x/video/1')).toBe(true)
    expect(isTikTokUrl('https://youtube.com/watch?v=1')).toBe(false)
  })
})
