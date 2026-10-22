<script setup lang="ts">
import type { SocialPost } from '#shared/types/social'

/**
 * Latest Instagram posts as square tiles that open the post on Instagram (a
 * view there counts for the account). With no live feed, a profile card.
 */
const props = withDefaults(defineProps<{ posts: SocialPost[]; handle: string; limit?: number }>(), { limit: 6 })

const shown = computed(() => props.posts.slice(0, props.limit))
const profileUrl = computed(() => `https://www.instagram.com/${props.handle}/`)
</script>

<template>
  <ul v-if="shown.length" class="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
    <li v-for="post in shown" :key="post.id">
      <a
        :href="post.permalink"
        target="_blank"
        rel="noopener noreferrer"
        class="card-depth group relative block aspect-square overflow-hidden rounded-card bg-linear-to-br from-wash to-raw shadow-card"
        :aria-label="post.caption ? `Apri su Instagram: ${post.caption.slice(0, 80)}` : 'Apri il post su Instagram'"
      >
        <img
          :src="post.thumbnail ?? ''"
          :alt="post.caption.slice(0, 120) || 'Post Instagram di Linea 2'"
          width="640"
          height="640"
          loading="lazy"
          decoding="async"
          referrerpolicy="no-referrer"
          class="h-full w-full object-cover transition-transform duration-500 ease-out-soft group-hover:scale-105"
        >
        <span
          v-if="post.kind !== 'image'"
          class="absolute right-2 top-2 z-10 rounded-full bg-black/55 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-white"
        >
          {{ post.kind === 'video' ? 'Reel' : 'Album' }}
        </span>
        <span
          class="absolute inset-0 z-10 flex items-end bg-linear-to-t from-black/80 via-black/10 to-transparent p-3 opacity-0 transition-opacity duration-200 group-hover:opacity-100 group-focus-visible:opacity-100"
        >
          <span class="line-clamp-3 text-xs text-white">{{ post.caption }}</span>
        </span>
      </a>
    </li>
  </ul>

  <a
    v-else
    :href="profileUrl"
    target="_blank"
    rel="noopener noreferrer"
    class="card-depth group flex min-h-[240px] flex-col items-center justify-center gap-4 overflow-hidden rounded-card bg-linear-to-br from-brass via-[#5b4a33] to-raw p-6 text-center shadow-card"
  >
    <span class="flex h-16 w-16 items-center justify-center rounded-full border border-white/40 bg-black/25 text-white">
      <SocialIcon name="instagram" class="h-7 w-7" />
    </span>
    <span>
      <span class="block font-mono text-sm text-white">@{{ handle }}</span>
      <span class="mt-2 block max-w-xs text-sm text-white/80">Foto dei pezzi finiti, Reels e dietro le quinte dello studio.</span>
    </span>
    <span class="label-caps relative z-10 rounded-full border border-white/50 px-5 py-2 text-xs text-white transition-colors group-hover:bg-white/10">
      Segui su Instagram ↗
    </span>
  </a>
</template>
