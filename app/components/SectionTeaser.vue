<script setup lang="ts">
import type { StrapiMedia } from '~/types/strapi'

const props = withDefaults(
  defineProps<{
    to: string
    title: string
    subtitle?: string
    tone?: 'sage' | 'terracotta' | 'forest' | 'gold'
    media?: StrapiMedia | null
  }>(),
  { tone: 'sage', media: null },
)

const { t } = useT()
const { tiltStyle, glareStyle, onPointerMove, reset } = useTilt({ max: 5 })

// Fallback backgrounds when a section has no image: denim and brass depths.
const TONES: Record<string, string> = {
  sage: 'from-wash via-selvedge to-raw',
  terracotta: 'from-brass via-[#5b4a33] to-raw',
  forest: 'from-[#33558a] via-selvedge to-raw',
  gold: 'from-brass-hi via-brass to-[#2a1f14]',
}
</script>

<template>
  <NuxtLink
    :to="to"
    class="card-depth group relative isolate flex min-h-[260px] flex-col justify-end overflow-hidden rounded-card p-6 shadow-card transition-transform duration-200 ease-out-soft will-change-transform active:scale-[0.99]"
    :style="tiltStyle"
    @pointermove="onPointerMove"
    @pointerleave="reset"
  >
    <UiStrapiImage
      v-if="props.media"
      :media="props.media"
      fill
      :sizes="'(min-width: 768px) 50vw, 92vw'"
      class="-z-20 transition-transform duration-500 ease-out-expo group-hover:scale-105"
    />
    <div v-else class="absolute inset-0 -z-20 bg-linear-to-br" :class="TONES[tone]" />
    <div class="absolute inset-0 -z-10 bg-linear-to-t from-raw/90 via-raw/35 to-transparent" />
    <div class="absolute inset-0 -z-10 bg-[radial-gradient(90%_70%_at_100%_0%,rgb(194_166_117/0.25),transparent_60%)]" />

    <h3 class="relative z-2 font-display text-2xl font-medium tracking-[0.06em] text-white">{{ title }}</h3>
    <p v-if="subtitle" class="relative z-2 mt-1 text-sm text-white/80">{{ subtitle }}</p>
    <span class="eyebrow relative z-2 mt-4 inline-flex items-center gap-2 text-white">
      {{ t((m) => m.common.discover) }}
      <span class="transition-transform duration-300 group-hover:translate-x-1">→</span>
    </span>

    <span
      class="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300"
      :style="glareStyle"
    />
  </NuxtLink>
</template>
