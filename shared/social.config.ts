/**
 * Linea 2 social accounts.
 *
 * TikTok: the profile embed always shows the latest videos on its own. To also
 * feature specific videos as cards (cover + tap to play), paste their links in
 * `videos`, newest first: e.g. 'https://www.tiktok.com/@linea2.upcycling/video/7412345678901234567'.
 *
 * Instagram: the grid updates by itself once NUXT_INSTAGRAM_TOKEN is set (see
 * SOCIAL.md). Without it the site shows a link card to the profile.
 */
export const SOCIAL = {
  tiktok: {
    handle: 'linea2.upcycling',
    videos: [] as string[],
  },
  instagram: {
    handle: 'linea2.upcycling',
    limit: 12,
  },
} as const
