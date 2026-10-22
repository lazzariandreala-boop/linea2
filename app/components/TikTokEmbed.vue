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

onMounted(async () => {
  if (!host.value) return
  const stop = start()
  renderTikTokEmbeds(host.value)
  await waitForEmbedIframe(host.value)
  stop()
})
</script>

<template>
  <div ref="host" class="w-full">
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
