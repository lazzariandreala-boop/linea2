<script setup lang="ts">
import type { Product } from '~/types/content'

const props = withDefaults(
  defineProps<{ product: Product; eager?: boolean; sizes?: string }>(),
  { eager: false, sizes: '(min-width: 1280px) 25vw, (min-width: 1024px) 33vw, (min-width: 640px) 50vw, 92vw' },
)

const { t } = useT()
const { tiltStyle, glareStyle, onPointerMove, reset } = useTilt({ max: 6 })

const cover = computed(() => props.product.gallery[0] ?? null)
const price = computed(() => formatPrice(props.product.price))
</script>

<template>
  <NuxtLink
    :to="`/products/${product.slug}`"
    class="group relative block overflow-hidden rounded-card bg-surface-2 shadow-card ring-1 ring-fg/5 transition-[box-shadow,transform] duration-200 ease-out-soft will-change-transform hover:ring-primary/30"
    :style="tiltStyle"
    @pointermove="onPointerMove"
    @pointerleave="reset"
  >
    <div class="overflow-hidden">
      <UiStrapiImage
        :media="cover"
        :eager="eager"
        :width="900"
        :height="1200"
        :sizes="sizes"
        class="transition-transform duration-500 ease-out-expo group-hover:scale-[1.05]"
      />
    </div>

    <UiBadge v-if="product.featured" tone="accent" class="absolute left-3 top-3">
      {{ t((m) => m.common.featured) }}
    </UiBadge>

    <div class="absolute inset-x-0 bottom-0 bg-linear-to-t from-black/85 via-black/35 to-transparent p-4 pt-12">
      <h3 class="font-display text-lg font-bold leading-tight text-white">
        {{ product.title }}
      </h3>
      <p v-if="price" class="mt-1 text-sm font-semibold text-white/90">{{ price }}</p>
    </div>

    <span
      class="pointer-events-none absolute inset-0 rounded-card opacity-0 transition-opacity duration-300"
      :style="glareStyle"
    />
  </NuxtLink>
</template>
