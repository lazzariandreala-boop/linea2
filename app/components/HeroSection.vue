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
  <section class="relative overflow-hidden bg-[radial-gradient(70%_90%_at_0%_100%,rgb(190_152_106/0.30),transparent_70%),linear-gradient(120deg,#ecdfca_0%,#f4f0e7_55%,#efe6d6_100%)]">
    <div class="grid items-center lg:grid-cols-[1.15fr_1fr]">
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

      <div class="flex justify-center px-(--site-gutter) pb-10 lg:justify-start lg:py-12 lg:pl-0 lg:pr-[max(var(--site-gutter),calc((100vw-78rem)/2+var(--site-gutter)))]">
        <img
          src="/editorial/hero-stella.webp"
          :alt="home.heroMedia?.alternativeText ?? 'Borsa Stella in denim recuperato'"
          width="1400"
          height="1500"
          fetchpriority="high"
          class="aspect-[4/5] w-full max-w-[300px] sm:max-w-[360px] lg:max-w-[420px] rounded-panel object-cover shadow-card"
        />
      </div>
    </div>
  </section>
</template>
