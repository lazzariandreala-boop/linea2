<script setup lang="ts">
import type { TikTokVideo } from '~/types/content'

/**
 * Lightweight facade for a TikTok video. Renders only the poster + a play
 * affordance; the heavy, in-app-webview-unreliable `embed.js` is loaded ONLY
 * after the user taps. This keeps initial load fast and avoids mounting all
 * embeds at once.
 */
defineProps<{ video: TikTokVideo }>()

const { t } = useT()
const loaded = ref(false)
</script>

<template>
  <div class="relative overflow-hidden rounded-card bg-surface-2 shadow-card">
    <template v-if="!loaded">
      <UiStrapiImage
        :media="video.thumbnail"
        :width="720"
        :height="1280"
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 92vw"
      />

      <button
        type="button"
        class="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/25 transition-colors hover:bg-black/15"
        :aria-label="`${t((m) => m.tiktok.tapToPlay)}: ${video.title}`"
        @click="loaded = true"
      >
        <span
          class="flex h-16 w-16 items-center justify-center rounded-full bg-white/95 text-black shadow-float transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
        >
          <svg class="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span class="eyebrow text-white">{{ t((m) => m.tiktok.tapToPlay) }}</span>
      </button>

      <div class="pointer-events-none absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 to-transparent p-4">
        <p class="line-clamp-2 font-display font-bold text-white">{{ video.title }}</p>
      </div>
    </template>

    <ClientOnly v-else>
      <div class="p-3">
        <TikTokEmbed :video-url="video.videoUrl" :video-id="video.embedId" :title="video.title" />
      </div>
    </ClientOnly>
  </div>
</template>
