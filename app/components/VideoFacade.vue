<script setup lang="ts">
import type { StrapiMedia } from '~/types/strapi'

/**
 * Generic video facade for tutorials. Shows only a poster until the user taps:
 *  - uploaded file -> native <video> (preloaded only after tap)
 *  - TikTok embed  -> official embed.js (loaded only after tap, via TikTokEmbed)
 *  - other embed   -> a lazy <iframe>
 * No third-party player is loaded at page load.
 */
const props = defineProps<{
  file?: StrapiMedia | null
  embedUrl?: string | null
  poster?: StrapiMedia | null
  title: string
}>()

const { t } = useT()
const { url } = useStrapiMedia()

const loaded = ref(false)
const isFile = computed(() => Boolean(props.file))
const isTikTok = computed(() => Boolean(props.embedUrl) && isTikTokUrl(props.embedUrl as string))
const hasVideo = computed(() => isFile.value || Boolean(props.embedUrl))

const fileSrc = computed(() => url(props.file))
const posterSrc = computed(() => url(props.poster))
const tiktokId = computed(() => (props.embedUrl ? parseTikTokVideoId(props.embedUrl) : null))
</script>

<template>
  <div class="relative overflow-hidden rounded-card bg-surface-2 shadow-card">
    <template v-if="!loaded">
      <UiStrapiImage
        :media="poster"
        :width="1200"
        :height="900"
        sizes="(min-width: 1024px) 60vw, 92vw"
      />
      <button
        v-if="hasVideo"
        type="button"
        class="group absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/30 transition-colors hover:bg-black/15"
        :aria-label="`${t((m) => m.tutorials.watch)}: ${title}`"
        @click="loaded = true"
      >
        <span
          class="flex h-16 w-16 items-center justify-center rounded-full bg-accent text-on-primary shadow-float transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
        >
          <svg class="ml-1 h-7 w-7" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M8 5v14l11-7z" />
          </svg>
        </span>
        <span class="eyebrow text-white">{{ t((m) => m.tutorials.watch) }}</span>
      </button>
    </template>

    <template v-else>
      <video
        v-if="isFile"
        :src="fileSrc"
        :poster="posterSrc"
        controls
        autoplay
        playsinline
        preload="auto"
        class="aspect-video w-full bg-black"
      />
      <ClientOnly v-else-if="isTikTok">
        <div class="p-3">
          <TikTokEmbed :video-url="embedUrl as string" :video-id="tiktokId" :title="title" />
        </div>
      </ClientOnly>
      <div v-else-if="embedUrl" class="aspect-video">
        <iframe
          :src="embedUrl"
          class="h-full w-full"
          :title="title"
          loading="lazy"
          allow="autoplay; encrypted-media; picture-in-picture"
          allowfullscreen
        />
      </div>
    </template>
  </div>
</template>
