<script setup lang="ts">
/**
 * TikTok's official profile ("creator") embed: it lists the account's latest
 * videos by itself, so new posts appear here with no work on our side. Like
 * the single-video embeds, embed.js loads only after a tap (fast pages, and no
 * TikTok cookies until the visitor asks for them). Full width of its parent.
 */
const props = defineProps<{ handle: string }>()

const loaded = ref(false)
const profileUrl = computed(() => `https://www.tiktok.com/@${props.handle}`)
</script>

<template>
  <div
    v-if="!loaded"
    class="on-denim flex min-h-[220px] w-full flex-col items-center justify-center gap-4 overflow-hidden rounded-card p-6 text-center"
  >
    <span class="flex h-14 w-14 items-center justify-center rounded-full border border-ochre/60 text-ivory">
      <SocialIcon name="tiktok" class="h-7 w-7" />
    </span>
    <div>
      <p class="font-mono text-sm text-ochre">@{{ handle }}</p>
      <p class="mt-2 max-w-xs text-sm text-ivory/80">Gli ultimi video dal laboratorio, aggiornati in automatico da TikTok.</p>
    </div>
    <div class="relative z-10 flex flex-wrap justify-center gap-3">
      <UiBaseButton variant="solid" @click="loaded = true">Guarda i video</UiBaseButton>
      <UiBaseButton :href="profileUrl" target="_blank" rel="noopener noreferrer" variant="outline">Segui ↗</UiBaseButton>
    </div>
  </div>

  <!-- No card-depth here: its overlay would cover the TikTok iframe. -->
  <div v-else class="on-denim w-full rounded-panel p-1.5 sm:p-2">
    <ClientOnly>
      <TikTokEmbed :video-url="profileUrl" :title="`@${handle}`" :creator="handle" />
    </ClientOnly>
  </div>
</template>
