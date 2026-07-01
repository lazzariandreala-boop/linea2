/** Extracts the numeric video id from a TikTok video URL, if present. */
export function parseTikTokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match?.[1] ?? null
}

/** True when a URL points at TikTok (used to pick the embed strategy). */
export function isTikTokUrl(url: string): boolean {
  return /(^|\.)tiktok\.com/.test(url)
}
