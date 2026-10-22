<script setup lang="ts">
import type { Product } from '~/types/content'

// 2 cols on phones, 3–4 on desktop.
const props = withDefaults(defineProps<{ products: Product[]; eagerCount?: number }>(), {
  eagerCount: 0,
})
// Three or fewer products fill the row instead of leaving an empty column.
const few = computed(() => props.products.length <= 3)
</script>

<template>
  <ul class="grid grid-cols-2 gap-x-4 gap-y-8 lg:grid-cols-3 lg:gap-x-6" :class="{ 'xl:grid-cols-4': !few }">
    <UiReveal
      v-for="(product, i) in products"
      :key="product.documentId"
      as="li"
      :delay="Math.min(i, 6) * 70"
      :y="20"
    >
      <ProductCard :product="product" :eager="i < eagerCount" />
    </UiReveal>
  </ul>
</template>
