<script setup lang="ts">
import type { ProductCategory } from '~/types/content'
import type { SortKey } from '~/types/ui'

const props = defineProps<{ category: ProductCategory }>()

const { t } = useT()
const { products } = await useProducts({ category: props.category, pageSize: 100 })

const sort = ref<SortKey>('newest')
const tag = ref<string | null>(null)

const tags = computed(() => [...new Set(products.value.flatMap((p) => p.tags))])

const displayed = computed(() => {
  let list = products.value
  if (tag.value) list = list.filter((p) => p.tags.includes(tag.value as string))
  const sorted = [...list]
  if (sort.value === 'priceAsc') {
    sorted.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity))
  } else if (sort.value === 'priceDesc') {
    sorted.sort((a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity))
  }
  // 'newest' relies on the API/mock default order (createdAt desc).
  return sorted
})

// UI copy per category (would move to i18n messages in a full i18n setup).
const DESCRIPTIONS: Record<ProductCategory, string> = {
  accessories: 'Foulard, cinture e occhiali pensati per durare e distinguersi.',
  bags: 'Borse fatte a mano, dalla tote di tutti i giorni alla pochette da sera.',
}

const title = computed(() =>
  props.category === 'accessories' ? t((m) => m.nav.accessories) : t((m) => m.nav.bags),
)

useSeoHead({
  title: title.value,
  description: DESCRIPTIONS[props.category],
  image: products.value[0]?.gallery[0]?.url ?? null,
  imageAlt: title.value,
})
</script>

<template>
  <div class="site-container py-12 sm:py-16">
    <UiReveal>
      <UiSectionHeading eyebrow="Catalogo" :title="title" :subtitle="DESCRIPTIONS[category]" as="h1" />
    </UiReveal>

    <div class="mt-8">
      <FilterSortBar v-model:sort="sort" v-model:tag="tag" :tags="tags" :count="displayed.length" />
    </div>

    <div class="mt-8">
      <ProductGrid v-if="displayed.length" :products="displayed" :eager-count="2" />
      <p v-else class="rounded-card border border-fg/10 bg-surface p-10 text-center text-fg/60">
        {{ t((m) => m.catalog.empty) }}
      </p>
    </div>
  </div>
</template>
