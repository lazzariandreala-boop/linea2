import { defineCachedFunction, defineCachedHandler } from 'nitro/cache'
import type { SocialFeed } from '#shared/types/social'
import { SOCIAL } from '#shared/social.config'
import { fetchInstagramPosts, fetchTikTokPost, refreshInstagramToken } from '../../utils/social'

// The token is renewed at most once a day; the refreshed value is kept for the
// life of the server instance.
let instagramToken = ''
const renewToken = defineCachedFunction(
  async (token: string) => {
    instagramToken = await refreshInstagramToken(token)
    return true
  },
  { name: 'instagram-token-refresh', maxAge: 60 * 60 * 24, getKey: () => 'token' },
)

/**
 * GET /api/social/feed — TikTok videos (from the list in social.config,
 * resolved via oEmbed) and the latest Instagram posts (live, when a token is
 * set). Cached 30 min and served stale while it refreshes, so the platforms
 * are hit a few times an hour at most and pages never wait on them.
 */
export default defineCachedHandler(
  async (): Promise<SocialFeed> => {
    const config = useRuntimeConfig()
    const configured = String(config.instagramToken ?? '')
    if (configured && !instagramToken) instagramToken = configured

    const [tiktok, instagram] = await Promise.all([
      Promise.all(SOCIAL.tiktok.videos.map(fetchTikTokPost)).then((posts) =>
        posts.filter((p) => p !== null),
      ),
      instagramToken
        ? renewToken(instagramToken)
            .then(() => fetchInstagramPosts(instagramToken, SOCIAL.instagram.limit))
            .catch((err) => {
              console.warn('[social] Instagram feed unavailable:', err?.message ?? err)
              return null
            })
        : Promise.resolve(null),
    ])

    return {
      handles: { tiktok: SOCIAL.tiktok.handle, instagram: SOCIAL.instagram.handle },
      tiktok,
      instagram: instagram ?? [],
      instagramLive: instagram !== null,
    }
  },
  { name: 'social-feed', maxAge: 60 * 30, swr: true },
)
