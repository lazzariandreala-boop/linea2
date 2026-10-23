<script setup lang="ts">
import type { Tutorial } from '~/types/content'

withDefaults(defineProps<{ tutorial: Tutorial; eager?: boolean }>(), { eager: false })
</script>

<template>
  <NuxtLink :to="`/tutorials/${tutorial.slug}`" class="group block">
    <UiStrapiImage
      :media="tutorial.finalResultImage"
      :eager="eager"
      :width="1200"
      :height="900"
      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw"
      rounded
      img-class="zoom-img"
    />
    <p class="meta mt-5">Tutorial</p>
    <h3 class="mt-2 font-display text-2xl leading-tight text-ink">{{ tutorial.title }}</h3>
    <p class="mt-2 line-clamp-2 text-sm text-muted">{{ tutorial.description }}</p>
  </NuxtLink>
</template>
