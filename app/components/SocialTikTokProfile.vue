<script setup lang="ts">
/**
 * TikTok's official profile ("creator") embed: it lists the account's latest
 * videos by itself, so new posts appear here with no work on our side. Like
 * the single-video embeds, embed.js loads only after a tap (fast pages, and no
 * TikTok cookies until the visitor asks for them).
 */
const props = defineProps<{ handle: string }>()

const loaded = ref(false)
const profileUrl = computed(() => `https://www.tiktok.com/@${props.handle}`)

watch(loaded, async (on) => {
  if (!on) return
  await nextTick()
  const script = document.createElement('script')
  script.src = 'https://www.tiktok.com/embed.js'
  script.async = true
  script.onload = () => script.remove()
  document.body.appendChild(script)
})
</script>

<template>
  <div class="card-depth overflow-hidden rounded-card bg-linear-to-br from-wash via-selvedge to-raw shadow-card">
    <div v-if="!loaded" class="relative flex min-h-[340px] flex-col items-center justify-center gap-5 p-8 text-center">
      <span class="flex h-16 w-16 items-center justify-center rounded-full border border-brass/50 bg-black/30 text-white">
        <SocialIcon name="tiktok" class="h-7 w-7" />
      </span>
      <div>
        <p class="font-mono text-sm text-brass-hi">@{{ handle }}</p>
        <p class="mt-2 max-w-xs text-sm text-white/75">Gli ultimi video dal laboratorio, aggiornati in automatico da TikTok.</p>
      </div>
      <div class="relative z-10 flex flex-wrap justify-center gap-3">
        <UiBaseButton variant="solid" @click="loaded = true">Guarda i video</UiBaseButton>
        <UiBaseButton :href="profileUrl" target="_blank" rel="noopener noreferrer" variant="outline">Segui ↗</UiBaseButton>
      </div>
    </div>

    <ClientOnly v-else>
      <div class="bg-white p-2">
        <blockquote
          class="tiktok-embed"
          :cite="profileUrl"
          :data-unique-id="handle"
          data-embed-type="creator"
          style="max-width: 780px; min-width: 288px; margin: 0 auto"
        >
          <section>
            <a target="_blank" rel="noopener noreferrer" :href="profileUrl">@{{ handle }}</a>
          </section>
        </blockquote>
      </div>
    </ClientOnly>
  </div>
</template>
