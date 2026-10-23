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
    class="on-denim flex min-h-[260px] w-full flex-col justify-between gap-6 overflow-hidden rounded-card p-6 sm:p-7"
  >
    <div class="flex items-center justify-between gap-4">
      <span class="eyebrow text-muted">TikTok</span>
      <SocialIcon name="tiktok" class="h-5 w-5 text-ivory" />
    </div>
    <div>
      <p class="font-display text-2xl text-ivory">@{{ handle }}</p>
      <p class="mt-2 max-w-xs text-sm text-muted">Gli ultimi video dal laboratorio, aggiornati in automatico da TikTok. Si caricano solo quando li apri.</p>
    </div>
    <div class="relative z-10 flex flex-wrap gap-3">
      <UiBaseButton variant="solid" size="sm" @click="loaded = true">Guarda i video</UiBaseButton>
      <UiBaseButton :href="profileUrl" target="_blank" rel="noopener noreferrer" variant="outline" size="sm">Segui ↗</UiBaseButton>
    </div>
  </div>

  <!-- No card-depth here: its overlay would cover the TikTok iframe. -->
  <div v-else class="w-full rounded-panel border border-line bg-surface p-1.5 sm:p-2 md:col-span-2">
    <ClientOnly>
      <TikTokEmbed :video-url="profileUrl" :title="`@${handle}`" :creator="handle" />
    </ClientOnly>
  </div>
</template>
