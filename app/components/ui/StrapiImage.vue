<script setup lang="ts">
import type { StrapiMedia } from '~/types/strapi'

/**
 * The single image primitive. Resolves a Strapi media URL to absolute against
 * the runtime base, then renders <NuxtImg> with EXPLICIT width/height plus an
 * aspect-ratio wrapper so there is zero layout shift. Below-the-fold media is
 * lazy by default; pass `eager` + `priority` for the LCP image.
 */
interface Props {
  media: StrapiMedia | null | undefined
  sizes?: string
  /** Override intrinsic dimensions (defaults to the media's own). */
  width?: number
  height?: number
  eager?: boolean
  /** LCP hint: preload + fetchpriority=high. */
  priority?: boolean
  cover?: boolean
  rounded?: boolean
  /** Absolutely fill the parent (background-style) instead of imposing ratio. */
  fill?: boolean
  alt?: string
  imgClass?: string
}

const props = withDefaults(defineProps<Props>(), {
  sizes: '100vw',
  eager: false,
  priority: false,
  cover: true,
  rounded: false,
  fill: false,
})

const { url } = useStrapiMedia()

const src = computed(() => url(props.media))
const w = computed(() => props.width ?? props.media?.width ?? 1)
const h = computed(() => props.height ?? props.media?.height ?? 1)
const altText = computed(() => props.alt ?? props.media?.alternativeText ?? '')
</script>

<template>
  <div
    class="overflow-hidden bg-surface-2"
    :class="[rounded ? 'rounded-card' : '', fill ? 'absolute inset-0' : 'relative']"
    :style="fill ? undefined : { aspectRatio: `${w} / ${h}` }"
  >
    <NuxtImg
      v-if="src"
      :src="src"
      :width="w"
      :height="h"
      :sizes="sizes"
      :alt="altText"
      :loading="eager ? 'eager' : 'lazy'"
      :preload="priority || undefined"
      :fetchpriority="priority ? 'high' : 'auto'"
      decoding="async"
      class="h-full w-full"
      :class="[cover ? 'object-cover' : 'object-contain', imgClass]"
    />
    <div v-else class="absolute inset-0 wash-soft" aria-hidden="true" />
  </div>
</template>
