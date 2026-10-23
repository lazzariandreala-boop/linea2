<script setup lang="ts">
import type { ProductCategory } from '~/types/content'
import type { SortKey } from '~/types/ui'

const props = defineProps<{ category?: ProductCategory }>()

const { t } = useT()
const { products, status } = await useProducts({ category: props.category, pageSize: 100 })

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
  all: 'Borse e accessori cuciti a mano da jeans recuperati. Le borse su misura si compongono nel configuratore; i pezzi pronti si ordinano subito.',
  accessories: 'Una selezione di accessori da abbinare alle borse in denim, pensati per durare e distinguersi.',
  bags: 'Borse fatte a mano, dalla tote di tutti i giorni alla pochette da sera.',
}
const description = DESCRIPTIONS[props.category ?? 'all']

const title = computed(() => {
  if (props.category === 'accessories') return t((m) => m.nav.accessories)
  if (props.category === 'bags') return t((m) => m.nav.bags)
  return 'La collezione'
})

// Category tabs (links, so each filter keeps its own URL).
const tabs: { to: string; label: string; active: boolean }[] = [
  { to: '/shop', label: 'Tutto', active: !props.category },
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
  <div>
    <header class="site-container pb-10 pt-12 sm:pt-16">
      <p class="kicker">Shop</p>
      <div class="mt-5 grid gap-6 lg:grid-cols-12 lg:items-end">
        <h1 class="text-hero lg:col-span-6">{{ title }}</h1>
        <p class="max-w-md text-fg/80 lg:col-span-5 lg:col-start-8">{{ description }}</p>
      </div>

      <nav class="mt-10 flex gap-6 overflow-x-auto border-b border-line no-scrollbar" aria-label="Categorie">
        <NuxtLink
          v-for="tab in tabs"
          :key="tab.to"
          :to="tab.to"
          class="tab"
          :class="{ active: tab.active }"
          :aria-current="tab.active ? 'page' : undefined"
        >
          {{ tab.label }}
        </NuxtLink>
        <NuxtLink to="/customize" class="tab">Su misura ↗</NuxtLink>
      </nav>
    </header>

    <section v-if="!category" class="site-container pb-16" aria-labelledby="made-to-order">
      <div class="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 id="made-to-order" class="text-title">Borse su misura</h2>
          <p class="mt-2 max-w-xl text-sm text-muted">Scegli il modello e personalizzalo: lo cuciamo su ordinazione.</p>
        </div>
        <NuxtLink to="/customize" class="arrow-link">Apri il configuratore</NuxtLink>
      </div>
      <div class="mt-8">
        <BagModelGrid />
      </div>
    </section>

    <section class="site-container pb-20" :aria-labelledby="category ? undefined : 'ready'">
      <h2 v-if="!category" id="ready" class="mb-6 text-title">Pronti da spedire</h2>
      <FilterSortBar v-model:sort="sort" v-model:tag="tag" :tags="tags" :count="displayed.length" />

      <div class="mt-10">
        <p v-if="status === 'error'" class="border border-line p-10 text-center text-muted" role="alert">
          Non riusciamo a caricare i prodotti in questo momento. Riprova tra poco.
        </p>
        <ProductGrid v-else-if="displayed.length" :products="displayed" :eager-count="2" />
        <div v-else class="border border-line px-6 py-14 text-center">
          <p class="font-display text-xl text-ink">
            {{ tag ? 'Nessun pezzo con questa caratteristica.' : t((m) => m.catalog.empty) }}
          </p>
          <button v-if="tag" type="button" class="arrow-link mt-5" @click="tag = null">Mostra tutto</button>
        </div>
      </div>
    </section>
  </div>
</template>

<style scoped>
.tab {
  display: inline-flex;
  align-items: center;
  min-height: 48px;
  margin-bottom: -1px;
  border-bottom: 1px solid transparent;
  font-size: 0.875rem;
  white-space: nowrap;
  color: var(--color-muted);
  transition: color 0.2s, border-color 0.2s;
}
.tab:hover {
  color: var(--color-ink);
}
.tab.active {
  color: var(--color-ink);
  border-bottom-color: var(--color-ink);
}
</style>
