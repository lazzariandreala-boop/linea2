<script setup lang="ts">
import type { Tutorial } from '~/types/content'

withDefaults(defineProps<{ tutorial: Tutorial; eager?: boolean }>(), { eager: false })

const { tiltStyle, glareStyle, onPointerMove, reset } = useTilt({ max: 5 })
</script>

<template>
  <NuxtLink
    :to="`/tutorials/${tutorial.slug}`"
    class="group relative block overflow-hidden rounded-card bg-surface shadow-card ring-1 ring-fg/5 transition-[box-shadow,transform] duration-200 ease-out-soft will-change-transform hover:ring-primary/30"
    :style="tiltStyle"
    @pointermove="onPointerMove"
    @pointerleave="reset"
  >
    <!-- Final-result image on top, the hook -->
    <div class="overflow-hidden">
      <UiStrapiImage
        :media="tutorial.finalResultImage"
        :eager="eager"
        :width="1200"
        :height="900"
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw"
        class="transition-transform duration-500 ease-out-expo group-hover:scale-[1.04]"
      />
    </div>
    <div class="p-5">
      <h3 class="font-display text-xl font-bold leading-tight text-fg">{{ tutorial.title }}</h3>
      <p class="mt-2 line-clamp-2 text-sm text-fg/65">{{ tutorial.description }}</p>
    </div>

    <span
      class="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-300"
      :style="glareStyle"
    />
  </NuxtLink>
</template>
