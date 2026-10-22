<script setup lang="ts">
import type { HomePage } from '~/types/content'

/**
 * Editorial hero: headline, subline and two calls to action on ivory, a large
 * product photograph bleeding to the right edge. The picture is the studio
 * shot from public/editorial until the atelier's own photo replaces it.
 */
const props = defineProps<{ home: HomePage }>()

const headlineLines = computed(() => props.home.heroHeadline.split('\n'))
</script>

<template>
  <section class="relative overflow-hidden">
    <div class="grid lg:min-h-[min(640px,calc(100dvh-7rem))] lg:grid-cols-[1fr_1.05fr]">
      <div class="flex items-center px-(--site-gutter) py-12 sm:py-16 lg:pr-12 lg:pl-[max(var(--site-gutter),calc((100vw-78rem)/2+var(--site-gutter)))]">
        <div class="max-w-xl">
          <span class="ochre-rule" aria-hidden="true" />
          <p v-if="home.heroEyebrow" class="eyebrow mt-5 text-accent">{{ home.heroEyebrow }}</p>
          <h1 class="mt-5 text-hero text-fg">
            <template v-for="(line, i) in headlineLines" :key="i">
              {{ line }}<br v-if="i < headlineLines.length - 1" />
            </template>
          </h1>
          <p class="mt-6 max-w-md text-lead text-fg/80">{{ home.heroSubline }}</p>
          <div class="mt-8 flex flex-wrap gap-3">
            <UiBaseButton to="/customize" variant="solid" size="lg">Personalizza la tua</UiBaseButton>
            <UiBaseButton to="/shop" variant="outline" size="lg">Scopri le borse</UiBaseButton>
          </div>
        </div>
      </div>

      <div class="relative min-h-[420px] lg:min-h-0">
        <img
          src="/editorial/hero-stella.webp"
          :alt="home.heroMedia?.alternativeText ?? 'Borsa Stella in denim recuperato'"
          width="1400"
          height="1500"
          fetchpriority="high"
          class="absolute inset-0 h-full w-full object-cover lg:rounded-bl-[10px]"
        />
      </div>
    </div>
  </section>
</template>
