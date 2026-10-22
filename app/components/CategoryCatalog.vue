<script setup lang="ts">
import type { ProductCategory } from '~/types/content'
import type { SortKey } from '~/types/ui'

const props = defineProps<{ category?: ProductCategory }>()

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
const DESCRIPTIONS: Record<ProductCategory | 'all', string> = {
  all: 'Borse e accessori cuciti a mano da jeans recuperati. Ogni pezzo esiste una volta sola.',
  accessories: 'Foulard, cinture e occhiali pensati per durare e distinguersi.',
  bags: 'Borse fatte a mano, dalla tote di tutti i giorni alla pochette da sera.',
}
const description = DESCRIPTIONS[props.category ?? 'all']

const title = computed(() => {
  if (props.category === 'accessories') return t((m) => m.nav.accessories)
  if (props.category === 'bags') return t((m) => m.nav.bags)
  return 'The collection'
})

// Category chips (links, so each filter keeps its own URL).
const chips: { to: string; label: string; active: boolean }[] = [
  { to: '/shop', label: 'All', active: !props.category },
  { to: '/bags', label: t((m) => m.nav.bags), active: props.category === 'bags' },
  { to: '/accessories', label: t((m) => m.nav.accessories), active: props.category === 'accessories' },
]

useSeoHead({
  title: title.value,
  description,
  image: products.value[0]?.gallery[0]?.url ?? null,
  imageAlt: title.value,
})
</script>

<template>
  <div class="site-container py-12 sm:py-16">
    <UiReveal>
      <UiSectionHeading eyebrow="Shop" :title="title" :subtitle="description" as="h1" />
    </UiReveal>

    <nav class="mt-6 flex flex-wrap gap-2" aria-label="Categorie">
      <NuxtLink
        v-for="chip in chips"
        :key="chip.to"
        :to="chip.to"
        class="label-caps rounded-pill border px-4 py-2 text-xs transition-colors"
        :class="chip.active ? 'border-brass-hi text-brass-hi' : 'border-fg/20 text-fg/75 hover:border-fg/50 hover:text-fg'"
        :aria-current="chip.active ? 'page' : undefined"
      >
        {{ chip.label }}
      </NuxtLink>
      <NuxtLink
        to="/customize"
        class="label-caps rounded-pill bg-primary px-4 py-2 text-xs text-on-primary transition-colors hover:bg-primary-strong"
      >
        Customize your bag
      </NuxtLink>
    </nav>

    <section v-if="!category" class="mt-10" aria-labelledby="made-to-order">
      <div class="flex items-end justify-between gap-4">
        <h2 id="made-to-order" class="text-title text-fg">Made to order</h2>
        <NuxtLink to="/customize" class="label-caps text-xs text-muted underline underline-offset-4 hover:text-fg">
          Customize
        </NuxtLink>
      </div>
      <p class="mt-2 max-w-xl text-sm text-fg/70">Scegli il modello e personalizzalo: lo cuciamo su ordinazione.</p>
      <div class="mt-5">
        <BagModelGrid />
      </div>
    </section>

    <h2 v-if="!category" class="mt-14 text-title text-fg">Ready to ship</h2>
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
