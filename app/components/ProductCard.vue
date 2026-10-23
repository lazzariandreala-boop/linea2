<script setup lang="ts">
import type { Product } from '~/types/content'

const props = withDefaults(
  defineProps<{ product: Product; eager?: boolean; sizes?: string }>(),
  { eager: false, sizes: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw' },
)

const { t } = useT()
const cover = computed(() => props.product.gallery[0] ?? null)
const second = computed(() => props.product.gallery[1] ?? null)
const price = computed(() => formatPrice(props.product.price))
const category = computed(() => (props.product.category === 'accessories' ? t((m) => m.nav.accessories) : t((m) => m.nav.bags)))
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
          img-class="zoom-img"
        />
        <!-- Second real photo on hover, when the product has one -->
        <UiStrapiImage
          v-if="second"
          :media="second"
          :width="900"
          :height="1200"
          :sizes="sizes"
          alt=""
          fill
          class="opacity-0 transition-opacity duration-500 ease-out-soft group-hover:opacity-100"
        />
        <UiBadge v-if="product.featured" tone="accent" class="absolute left-3 top-3">
          {{ t((m) => m.common.featured) }}
        </UiBadge>
      </div>
      <div class="mt-4 border-t border-line pt-3 pr-12">
        <p class="text-[11px] uppercase tracking-[0.14em] text-muted">{{ category }}</p>
        <h3 class="mt-1.5 font-display text-lg leading-snug text-ink">{{ product.title }}</h3>
        <p v-if="price" class="price-tag mt-1 text-sm text-ink">{{ price }}</p>
      </div>
    </NuxtLink>
    <AddToCartButton :product="product" icon class="absolute bottom-0 right-0" />
  </div>
</template>
