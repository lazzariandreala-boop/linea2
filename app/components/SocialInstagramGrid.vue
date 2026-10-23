<script setup lang="ts">
import type { SocialPost } from '#shared/types/social'

/**
 * Latest Instagram posts as square tiles that open the post on Instagram (a
 * view there counts for the account). With no live feed, a profile card.
 */
const props = withDefaults(defineProps<{ posts: SocialPost[]; handle: string; limit?: number; compact?: boolean }>(), { limit: 6, compact: false })

const shown = computed(() => props.posts.slice(0, props.limit))
const profileUrl = computed(() => `https://www.instagram.com/${props.handle}/`)
</script>

<template>
  <ul v-if="shown.length" class="grid grid-cols-2 gap-2 sm:gap-3" :class="compact ? '' : 'sm:grid-cols-3'">
    <li v-for="post in shown" :key="post.id">
      <a
        :href="post.permalink"
        target="_blank"
        rel="noopener noreferrer"
        class="group relative block aspect-square overflow-hidden rounded-card bg-surface-2"
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
    class="group flex min-h-[260px] flex-col justify-between gap-6 overflow-hidden rounded-card border border-line bg-surface p-6 text-ink sm:p-7"
  >
    <span class="flex items-center justify-between gap-4">
      <span class="eyebrow text-muted">Instagram</span>
      <SocialIcon name="instagram" class="h-5 w-5" />
    </span>
    <span>
      <span class="block font-display text-2xl">@{{ handle }}</span>
      <span class="mt-2 block max-w-xs text-sm text-muted">Foto dei pezzi finiti, Reels e dietro le quinte dello studio.</span>
    </span>
    <span class="arrow-link self-start">Segui su Instagram</span>
  </a>
</template>
