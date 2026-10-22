import { describe, expect, it } from 'vitest'
import { tikTokVideoId, toInstagramPost, toTikTokPost } from '../../server/utils/social'

describe('tikTokVideoId', () => {
  it('reads the id from a video URL', () => {
    expect(tikTokVideoId('https://www.tiktok.com/@linea2.upcycling/video/7412345678901234567?lang=en')).toBe(
      '7412345678901234567',
    )
  })
  it('is null for a profile URL', () => {
    expect(tikTokVideoId('https://www.tiktok.com/@linea2.upcycling')).toBeNull()
  })
})

describe('toTikTokPost', () => {
  it('keeps the link even without oEmbed data', () => {
    const post = toTikTokPost('https://www.tiktok.com/@x/video/1', '1', {})
    expect(post).toMatchObject({ id: '1', platform: 'tiktok', caption: '', thumbnail: null, kind: 'video' })
  })
})

describe('toInstagramPost', () => {
  const base = { id: '9', permalink: 'https://www.instagram.com/p/abc/', caption: ' Borsa Stella ', timestamp: '2026-10-01T10:00:00+0000' }

  it('uses the still frame for reels, not the mp4', () => {
    const post = toInstagramPost({ ...base, media_type: 'VIDEO', media_url: 'v.mp4', thumbnail_url: 'still.jpg' })
    expect(post).toMatchObject({ kind: 'video', thumbnail: 'still.jpg', caption: 'Borsa Stella' })
  })
  it('uses media_url for images and albums', () => {
    expect(toInstagramPost({ ...base, media_type: 'IMAGE', media_url: 'a.jpg' }).thumbnail).toBe('a.jpg')
    expect(toInstagramPost({ ...base, media_type: 'CAROUSEL_ALBUM', media_url: 'b.jpg' }).kind).toBe('carousel')
  })
})
