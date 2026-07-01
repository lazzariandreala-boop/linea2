<script setup lang="ts">
/**
 * The REAL TikTok embed. Mounted only after the user taps a facade, so
 * `embed.js` is requested on interaction — never at page load. embed.js scans
 * the DOM for `.tiktok-embed` blockquotes and swaps them for an iframe; a fresh
 * (cached) script tag is appended per mount so a newly-added blockquote is
 * processed even when other embeds already loaded the library.
 *
 * Generic props so both the TikTok feed and tutorial videos can reuse it.
 */
const props = defineProps<{ videoUrl: string; videoId?: string | null; title: string }>()

onMounted(() => {
  const script = document.createElement('script')
  script.src = 'https://www.tiktok.com/embed.js'
  script.async = true
  script.onload = () => script.remove()
  document.body.appendChild(script)
})
</script>

<template>
  <blockquote
    class="tiktok-embed mx-auto"
    :cite="props.videoUrl"
    :data-video-id="props.videoId ?? undefined"
    :style="{ maxWidth: '605px', minWidth: '325px', margin: '0 auto' }"
  >
    <section>
      <a :href="props.videoUrl" target="_blank" rel="noopener noreferrer">{{ props.title }}</a>
    </section>
  </blockquote>
</template>
