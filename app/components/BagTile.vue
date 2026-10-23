<script setup lang="ts">
import type { BagModel } from '~/utils/stella/options'

/** A configurable bag model: photograph, name, shape and starting price,
 *  linking to the configurator preset on it. Prices come from BAGS. */
const props = withDefaults(defineProps<{ bag: BagModel; eager?: boolean; sizes?: string }>(), { eager: false })
const image = computed(() => bagImage(props.bag.id, props.bag.name, props.bag.type))
</script>

<template>
  <NuxtLink :to="`/customize?model=${bag.id}`" class="group block">
    <div class="media aspect-[5/6]">
      <img
        :src="image.src"
        :alt="image.alt"
        :width="image.width"
        :height="image.height"
        :loading="eager ? 'eager' : 'lazy'"
        decoding="async"
        class="zoom-img"
      />
    </div>
    <div class="mt-4 flex items-baseline justify-between gap-3 border-t border-line pt-3">
      <div class="min-w-0">
        <h3 class="font-display text-xl leading-tight text-ink">{{ bag.name }}</h3>
        <p class="mt-1 text-xs uppercase tracking-[0.12em] text-muted">{{ bag.type }}</p>
      </div>
      <p class="price-tag shrink-0 text-sm text-ink">da {{ formatPrice(bag.p) }}</p>
    </div>
  </NuxtLink>
</template>
