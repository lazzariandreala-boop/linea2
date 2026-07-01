<script setup lang="ts">
import type { StrapiMedia } from '~/types/strapi'

const props = defineProps<{ images: StrapiMedia[]; title: string }>()

const active = ref(0)
const current = computed(() => props.images[active.value] ?? props.images[0] ?? null)
</script>

<template>
  <div>
    <UiStrapiImage
      :media="current"
      :eager="active === 0"
      :priority="active === 0"
      :width="900"
      :height="1200"
      sizes="(min-width: 1024px) 45vw, 92vw"
      rounded
    />

    <div v-if="images.length > 1" class="no-scrollbar mt-3 flex gap-3 overflow-x-auto pb-1">
      <button
        v-for="(img, i) in images"
        :key="img.id"
        type="button"
        class="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg ring-2 transition"
        :class="i === active ? 'ring-accent' : 'opacity-70 ring-transparent hover:opacity-100'"
        :aria-label="`${title} — immagine ${i + 1}`"
        :aria-current="i === active"
        @click="active = i"
      >
        <UiStrapiImage :media="img" fill :width="160" :height="200" sizes="64px" />
      </button>
    </div>
  </div>
</template>
