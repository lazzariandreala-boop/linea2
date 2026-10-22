<script setup lang="ts">
/**
 * The REAL TikTok embed. Mounted only after the user taps a facade, so
 * `embed.js` is requested on interaction — never at page load. While the
 * player loads, the site-wide overlay is shown. Pass `creator` to embed the
 * whole profile (latest videos) instead of one video.
 *
 * Nothing may sit on top of the iframe (no overlay pseudo-elements, no
 * transformed wrappers): TikTok's player can hold back while it thinks it is
 * covered, which looked like a blank card that woke up only on click.
 */
const props = defineProps<{
  videoUrl: string
  videoId?: string | null
  title: string
  creator?: string
}>()

const host = ref<HTMLElement | null>(null)
const { start } = useGlobalLoading()

/**
 * TikTok lays the profile card out at most ~780px wide, centred in a white
 * iframe. On wider containers we zoom the iframe so the card fills the whole
 * width instead of floating in the middle (bigger covers, no white gutters).
 */
const CREATOR_CARD = 780
const MAX_ZOOM = 1.45
let resize: ResizeObserver | null = null
function fit() {
  const el = host.value
  const iframe = el?.querySelector('iframe')
  if (!el || !iframe || !props.creator) return
  const w = el.clientWidth
  const zoom = Math.min(MAX_ZOOM, Math.max(1, w / CREATOR_CARD))
  iframe.style.zoom = String(zoom)
  iframe.style.width = `${w / zoom}px`
  iframe.style.minWidth = '0'
  iframe.style.maxWidth = 'none'
}

onMounted(async () => {
  if (!host.value) return
  const stop = start()
  renderTikTokEmbeds(host.value)
  await waitForEmbedIframe(host.value)
  stop()
  fit()
  resize = new ResizeObserver(fit)
  resize.observe(host.value)
})
onBeforeUnmount(() => resize?.disconnect())
</script>

<template>
  <div ref="host" class="w-full overflow-hidden rounded-card" :class="{ 'bg-white': props.creator }">
    <blockquote
      v-if="props.creator"
      class="tiktok-embed"
      :cite="props.videoUrl"
      :data-unique-id="props.creator"
      data-embed-type="creator"
      style="width: 100%; max-width: 100%; min-width: 288px; margin: 0"
    >
      <section>
        <a :href="props.videoUrl" target="_blank" rel="noopener noreferrer">{{ props.title }}</a>
      </section>
    </blockquote>
    <blockquote
      v-else
      class="tiktok-embed"
      :cite="props.videoUrl"
      :data-video-id="props.videoId ?? undefined"
      style="max-width: 605px; min-width: 325px; margin: 0 auto"
    >
      <section>
        <a :href="props.videoUrl" target="_blank" rel="noopener noreferrer">{{ props.title }}</a>
      </section>
    </blockquote>
  </div>
</template>
