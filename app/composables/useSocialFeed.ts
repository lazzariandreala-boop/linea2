import type { SocialFeed } from '#shared/types/social'

const EMPTY: SocialFeed = {
  handles: { tiktok: 'linea2.upcycling', instagram: 'linea2.upcycling' },
  tiktok: [],
  instagram: [],
  instagramLive: false,
}

/**
 * TikTok + Instagram posts from /api/social/feed. Fetched in the browser after
 * the page renders, so a slow platform never delays the page; until then (or
 * if the feed fails) the components fall back to profile cards.
 */
export function useSocialFeed() {
  const { data, pending } = useFetch<SocialFeed>('/api/social/feed', {
    key: 'social-feed',
    server: false,
    lazy: true,
    default: () => EMPTY,
  })

  const feed = computed(() => data.value ?? EMPTY)
  const profileUrl = computed(() => ({
    tiktok: `https://www.tiktok.com/@${feed.value.handles.tiktok}`,
    instagram: `https://www.instagram.com/${feed.value.handles.instagram}/`,
  }))

  return { feed, pending, profileUrl }
}
