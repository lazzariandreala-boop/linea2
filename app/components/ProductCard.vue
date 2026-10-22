<script setup lang="ts">
import type { Product } from '~/types/content'

const props = withDefaults(
  defineProps<{ product: Product; eager?: boolean; sizes?: string }>(),
  { eager: false, sizes: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw' },
)

const { t } = useT()
const cover = computed(() => props.product.gallery[0] ?? null)
const price = computed(() => formatPrice(props.product.price))
</script>

<template>
  <div class="group relative">
    <NuxtLink :to="`/products/${product.slug}`" class="block">
      <div class="relative overflow-hidden rounded-card bg-surface-2">
        <UiStrapiImage
          :media="cover"
          :eager="eager"
          :width="900"
          :height="1200"
          :sizes="sizes"
          class="transition-transform duration-700 ease-out-expo group-hover:scale-[1.04]"
        />
        <UiBadge v-if="product.featured" tone="accent" class="absolute left-3 top-3">
          {{ t((m) => m.common.featured) }}
        </UiBadge>
      </div>
      <div class="mt-4 flex items-start justify-between gap-3 pr-12">
        <div class="min-w-0">
          <h3 class="font-display text-lg leading-snug text-fg">{{ product.title }}</h3>
          <p v-if="price" class="mt-1 text-sm font-bold text-fg">{{ price }}</p>
        </div>
      </div>
    </NuxtLink>
    <AddToCartButton :product="product" icon class="absolute bottom-0 right-0" />
  </div>
</template>
