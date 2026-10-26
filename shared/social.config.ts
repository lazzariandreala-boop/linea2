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
    // Featured videos, newest first (chosen by Andrea, 2026-10-26).
    videos: [
      'https://www.tiktok.com/@linea2.upcycling/video/7700687231962336545',
      'https://www.tiktok.com/@linea2.upcycling/video/7693253616013970721',
      'https://www.tiktok.com/@linea2.upcycling/video/7689540319695605025',
      'https://www.tiktok.com/@linea2.upcycling/video/7685813243297811744',
      'https://www.tiktok.com/@linea2.upcycling/video/7683587281436855584',
      'https://www.tiktok.com/@linea2.upcycling/video/7682478446689275168',
      'https://www.tiktok.com/@linea2.upcycling/video/7681009645451775264',
      'https://www.tiktok.com/@linea2.upcycling/video/7678056020035325216',
      'https://www.tiktok.com/@linea2.upcycling/video/7672354471132892448',
      'https://www.tiktok.com/@linea2.upcycling/video/7667997375813684513',
      'https://www.tiktok.com/@linea2.upcycling/video/7666913953104121121',
      'https://www.tiktok.com/@linea2.upcycling/video/7665024485589896481',
    ] as string[],
  },
  instagram: {
    handle: 'linea2.upcycling',
    limit: 12,
  },
} as const
