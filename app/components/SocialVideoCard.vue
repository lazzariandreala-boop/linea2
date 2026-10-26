<script setup lang="ts">
import type { SocialPost } from '#shared/types/social'

/**
 * A TikTok video that plays on its own: muted, looping, inside TikTok's
 * official player (so plays happen on TikTok's side). The iframe is mounted
 * only when the card scrolls near the screen, and paused while it is away,
 * so a page with many videos stays light. Visitors can unmute from the
 * player's own volume button.
 *
 * Nothing sits on top of the iframe: TikTok's player can hold back while it
 * thinks it is covered.
 */
const props = defineProps<{ post: SocialPost }>()

const card = ref<HTMLElement | null>(null)
const frame = ref<HTMLIFrameElement | null>(null)
const mounted = ref(false)
let visible = false
let observer: IntersectionObserver | null = null

const PLAYER_PARAMS = new URLSearchParams({
  autoplay: '1',
  loop: '1',
  controls: '1',
  progress_bar: '0',
  play_button: '1',
  volume_control: '1',
  fullscreen_button: '1',
  timestamp: '0',
  music_info: '0',
  description: '0',
  rel: '0',
  native_context_menu: '0',
  closed_caption: '0',
})
const src = computed(() => `https://www.tiktok.com/player/v1/${props.post.id}?${PLAYER_PARAMS}`)

/** Commands for TikTok's embed player (postMessage API). */
function send(type: 'play' | 'pause' | 'mute') {
  frame.value?.contentWindow?.postMessage({ type, 'x-tiktok-player': true }, '*')
}

// Browsers only autoplay muted video: mute as soon as the player is ready,
// then start it if the card is still on screen.
function onMessage(e: MessageEvent) {
  if (e.source !== frame.value?.contentWindow) return
  const data = e.data as { type?: string; 'x-tiktok-player'?: boolean } | null
  if (!data?.['x-tiktok-player'] || data.type !== 'onPlayerReady') return
  send('mute')
  send(visible ? 'play' : 'pause')
}

onMounted(() => {
  window.addEventListener('message', onMessage)
  if (!card.value) return
  observer = new IntersectionObserver(
    ([entry]) => {
      visible = !!entry?.isIntersecting
      if (visible) mounted.value = true
      send(visible ? 'play' : 'pause')
    },
    { rootMargin: '200px 0px' },
  )
  observer.observe(card.value)
})
onBeforeUnmount(() => {
  observer?.disconnect()
  window.removeEventListener('message', onMessage)
})
</script>

<template>
  <figure class="min-w-0">
    <div ref="card" class="relative aspect-[9/16] overflow-hidden rounded-card bg-black">
      <img
        v-if="post.thumbnail"
        :src="post.thumbnail"
        :alt="post.caption || 'Video TikTok di Linea 2'"
        width="720"
        height="1280"
        loading="lazy"
        decoding="async"
        referrerpolicy="no-referrer"
        class="absolute inset-0 h-full w-full object-cover"
      >
      <iframe
        v-if="mounted"
        ref="frame"
        :src="src"
        :title="post.caption || 'Video TikTok di Linea 2'"
        class="absolute inset-0 h-full w-full border-0"
        allow="autoplay; encrypted-media; fullscreen; picture-in-picture"
        allowfullscreen
        referrerpolicy="strict-origin-when-cross-origin"
      />
    </div>
    <figcaption v-if="post.caption" class="mt-2 line-clamp-2 text-xs text-muted">
      <a :href="post.permalink" target="_blank" rel="noopener noreferrer" class="hover:text-fg">{{ post.caption }}</a>
    </figcaption>
  </figure>
</template>
