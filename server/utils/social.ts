// Social feed helpers (TikTok + Instagram). Server-only: the Instagram token
// never reaches the browser. Imports are explicit for the same reason as in
// paypal.ts (this Nitro nightly doesn't auto-import h3/ofetch).
import { ofetch } from 'ofetch'
import type { SocialPost } from '#shared/types/social'

/** Extracts the numeric id from a TikTok video URL (`/video/<id>`). */
export function tikTokVideoId(url: string): string | null {
  return url.match(/\/video\/(\d+)/)?.[1] ?? null
}

interface TikTokOEmbed {
  title?: string
  thumbnail_url?: string
}

/**
 * Resolves one TikTok video URL through TikTok's public oEmbed endpoint (no
 * app or token needed) into a post with its caption and cover image.
 */
export async function fetchTikTokPost(url: string): Promise<SocialPost | null> {
  const id = tikTokVideoId(url)
  if (!id) return null
  try {
    const data = await ofetch<TikTokOEmbed>('https://www.tiktok.com/oembed', {
      query: { url },
      timeout: 6000,
    })
    return toTikTokPost(url, id, data)
  } catch {
    // Deleted/private video or TikTok unreachable: still link to it, without cover.
    return toTikTokPost(url, id, {})
  }
}

export function toTikTokPost(url: string, id: string, data: TikTokOEmbed): SocialPost {
  return {
    id,
    platform: 'tiktok',
    permalink: url,
    caption: data.title?.trim() ?? '',
    thumbnail: data.thumbnail_url ?? null,
    kind: 'video',
    publishedAt: null,
  }
}

/** Raw media item from the Instagram API (Instagram Login, `/me/media`). */
export interface InstagramMedia {
  id: string
  caption?: string
  media_type: 'IMAGE' | 'VIDEO' | 'CAROUSEL_ALBUM'
  media_url?: string
  thumbnail_url?: string
  permalink: string
  timestamp?: string
}

export function toInstagramPost(m: InstagramMedia): SocialPost {
  const kind = m.media_type === 'VIDEO' ? 'video' : m.media_type === 'CAROUSEL_ALBUM' ? 'carousel' : 'image'
  return {
    id: m.id,
    platform: 'instagram',
    permalink: m.permalink,
    caption: m.caption?.trim() ?? '',
    // Reels expose a still in thumbnail_url; media_url would be the .mp4.
    thumbnail: (kind === 'video' ? m.thumbnail_url : m.media_url) ?? null,
    kind,
    publishedAt: m.timestamp ?? null,
  }
}

const IG_API = 'https://graph.instagram.com'
const IG_FIELDS = 'id,caption,media_type,media_url,thumbnail_url,permalink,timestamp'

/** Latest posts of the account that owns the token, newest first. */
export async function fetchInstagramPosts(token: string, limit: number): Promise<SocialPost[]> {
  const res = await ofetch<{ data: InstagramMedia[] }>(`${IG_API}/me/media`, {
    query: { fields: IG_FIELDS, limit, access_token: token },
    timeout: 8000,
  })
  return res.data.map(toInstagramPost).filter((p) => p.thumbnail)
}

/**
 * Extends a long-lived Instagram token by another 60 days. Meta allows this
 * once the token is at least 24h old; failures are harmless (the current
 * token keeps working until it expires).
 */
export async function refreshInstagramToken(token: string): Promise<string> {
  try {
    const res = await ofetch<{ access_token: string }>(`${IG_API}/refresh_access_token`, {
      query: { grant_type: 'ig_refresh_token', access_token: token },
      timeout: 8000,
    })
    return res.access_token || token
  } catch {
    return token
  }
}
