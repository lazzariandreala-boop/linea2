/** Normalised social post, shared by the server feed and the UI. */
export type SocialPlatform = 'tiktok' | 'instagram'

export interface SocialPost {
  id: string
  platform: SocialPlatform
  /** Public URL of the post on the platform. */
  permalink: string
  caption: string
  /** Remote preview image (platform CDN). Null when the platform gave none. */
  thumbnail: string | null
  kind: 'video' | 'image' | 'carousel'
  publishedAt: string | null
}

export interface SocialFeed {
  handles: { tiktok: string; instagram: string }
  tiktok: SocialPost[]
  instagram: SocialPost[]
  /** True when an Instagram token is configured and the live feed answered. */
  instagramLive: boolean
}
