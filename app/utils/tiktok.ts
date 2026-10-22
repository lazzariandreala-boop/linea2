/** Extracts the numeric video id from a TikTok video URL, if present. */
export function parseTikTokVideoId(url: string): string | null {
  const match = url.match(/\/video\/(\d+)/)
  return match?.[1] ?? null
}

/** True when a URL points at TikTok (used to pick the embed strategy). */
export function isTikTokUrl(url: string): boolean {
  return /(^|\.)tiktok\.com/.test(url)
}

declare global {
  interface Window {
    tiktokEmbed?: { lib?: { render?: (els: Element[] | NodeListOf<Element>) => void } }
  }
}

/**
 * Turns the `.tiktok-embed` blockquotes inside `root` into players. Once
 * embed.js is on the page we ask it to render the new blockquotes directly;
 * otherwise (first time, or a build without that hook) a fresh script tag
 * makes it scan the DOM again.
 */
export function renderTikTokEmbeds(root: HTMLElement) {
  const render = window.tiktokEmbed?.lib?.render
  if (render) {
    render(root.querySelectorAll('blockquote.tiktok-embed'))
    return
  }
  const script = document.createElement('script')
  script.src = 'https://www.tiktok.com/embed.js'
  script.async = true
  script.onload = () => script.remove()
  document.body.appendChild(script)
}

/**
 * Resolves when the player iframe embed.js puts inside `root` has loaded, or
 * after `timeoutMs` (blocked by an ad blocker, offline, in-app browsers).
 */
export function waitForEmbedIframe(root: HTMLElement, timeoutMs = 10000): Promise<void> {
  return new Promise((resolve) => {
    let observer: MutationObserver | null = null
    const timer = setTimeout(finish, timeoutMs)
    function finish() {
      clearTimeout(timer)
      observer?.disconnect()
      resolve()
    }
    function watchIframe(iframe: HTMLIFrameElement) {
      observer?.disconnect()
      // A short pause after `load` lets TikTok paint its first frame.
      iframe.addEventListener('load', () => setTimeout(finish, 400), { once: true })
    }
    const existing = root.querySelector('iframe')
    if (existing) return watchIframe(existing)
    observer = new MutationObserver(() => {
      const iframe = root.querySelector('iframe')
      if (iframe) watchIframe(iframe)
    })
    observer.observe(root, { childList: true, subtree: true })
  })
}
