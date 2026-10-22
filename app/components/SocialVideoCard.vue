<script setup lang="ts">
import type { SocialPost } from '#shared/types/social'

/** A TikTok video as a cover card; the real player mounts on tap. */
defineProps<{ post: SocialPost }>()

const { t } = useT()
const loaded = ref(false)
</script>

<template>
  <div
    class="relative overflow-hidden rounded-card bg-linear-to-b from-wash to-raw shadow-card"
    :class="{ 'card-depth': !loaded }"
  >
    <template v-if="!loaded">
      <div class="aspect-[9/16]">
        <img
          v-if="post.thumbnail"
          :src="post.thumbnail"
          :alt="post.caption || 'Video TikTok di Linea 2'"
          width="720"
          height="1280"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          class="h-full w-full object-cover"
        >
      </div>

      <button
        type="button"
        class="group absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-black/25 transition-colors hover:bg-black/15"
        :aria-label="`${t((m) => m.tiktok.tapToPlay)}: ${post.caption}`"
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

      <div class="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-linear-to-t from-black/85 to-transparent p-4">
        <p class="line-clamp-2 text-sm text-white">{{ post.caption }}</p>
      </div>
    </template>

    <ClientOnly v-else>
      <div class="p-2">
        <TikTokEmbed :video-url="post.permalink" :video-id="post.id" :title="post.caption" />
      </div>
    </ClientOnly>
  </div>
</template>
