<script setup lang="ts">
import type { Product } from '~/types/content'

// 1 col mobile → 2 tablet → 3–4 desktop, per the catalog spec.
withDefaults(defineProps<{ products: Product[]; eagerCount?: number }>(), {
  eagerCount: 0,
})
</script>

<template>
  <ul class="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
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
