<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { t } = useT()
const { product } = await useProduct(slug.value)

if (!product.value) {
  throw createError({ statusCode: 404, statusMessage: 'Prodotto non trovato' })
}

const price = computed(() => formatPrice(product.value!.price))
const categoryPath = computed(() => `/${product.value!.category}`)
const categoryLabel = computed(() =>
  product.value!.category === 'accessories' ? t((m) => m.nav.accessories) : t((m) => m.nav.bags),
)

// A few pieces from the same category.
const { products: sameCategory } = await useProducts({ category: product.value.category, pageSize: 12 })
const related = computed(() => sameCategory.value.filter((p) => p.slug !== slug.value).slice(0, 3))

// Phones: a slim purchase bar while the main button is off screen.
const buyBox = ref<HTMLElement | null>(null)
const showBar = ref(false)
let io: IntersectionObserver | null = null
onMounted(() => {
  if (!buyBox.value || !('IntersectionObserver' in window)) return
  io = new IntersectionObserver(([e]) => (showBar.value = !e!.isIntersecting && e!.boundingClientRect.top < 0))
  io.observe(buyBox.value)
})
onBeforeUnmount(() => io?.disconnect())

useSeoHead({
  title: product.value.seo?.metaTitle ?? product.value.title,
  description: product.value.seo?.metaDescription ?? product.value.description,
  image: product.value.seo?.ogImage?.url ?? product.value.gallery[0]?.url ?? null,
  imageAlt: product.value.gallery[0]?.alternativeText ?? product.value.title,
  imageWidth: product.value.gallery[0]?.width ?? undefined,
  imageHeight: product.value.gallery[0]?.height ?? undefined,
})
</script>

<template>
  <div v-if="product">
    <article class="site-container pb-16 pt-6 sm:pt-8">
      <nav class="mb-6 text-xs uppercase tracking-[0.14em] text-muted" aria-label="Breadcrumb">
        <ol class="flex flex-wrap items-center gap-2">
          <li><NuxtLink to="/shop" class="hover:text-ink">Shop</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li><NuxtLink :to="categoryPath" class="hover:text-ink">{{ categoryLabel }}</NuxtLink></li>
          <li aria-hidden="true">/</li>
          <li class="text-ink" aria-current="page">{{ product.title }}</li>
        </ol>
      </nav>

      <div class="grid gap-10 lg:grid-cols-12 lg:gap-12">
        <div class="lg:col-span-7">
          <ProductGallery :images="product.gallery" :title="product.title" />
        </div>

        <div class="lg:col-span-5">
          <div class="lg:sticky lg:top-[calc(var(--header-h)+2rem)]">
            <p class="meta">{{ categoryLabel }}<template v-if="product.featured"> · {{ t((m) => m.common.featured) }}</template></p>
            <h1 class="mt-4 text-display">{{ product.title }}</h1>
            <p v-if="price" class="price-tag mt-4 text-xl text-ink">{{ price }}</p>

            <p class="mt-7 max-w-prose text-fg/80">{{ product.description }}</p>

            <div ref="buyBox" class="mt-9 grid gap-3">
              <AddToCartButton :product="product" size="lg" block />
              <CtaButton v-if="product.cta" :cta="product.cta" size="lg" variant="outline" block />
            </div>

            <div class="mt-10 border-t border-line">
              <details v-if="product.tags.length" class="acc" open>
                <summary>Dettagli</summary>
                <ul class="flex flex-wrap gap-2 pb-5">
                  <li v-for="tg in product.tags" :key="tg">
                    <UiBadge tone="neutral" class="capitalize">{{ tg }}</UiBadge>
                  </li>
                </ul>
              </details>
              <details class="acc">
                <summary>Domande e assistenza</summary>
                <p class="pb-5 text-sm text-muted">
                  Per misure, disponibilità o un pezzo su misura scrivici:
                  <a :href="SOCIAL_LINKS.whatsapp" target="_blank" rel="noopener noreferrer" class="text-ink underline underline-offset-4">WhatsApp</a>
                  o
                  <a :href="SOCIAL_LINKS.instagram" target="_blank" rel="noopener noreferrer" class="text-ink underline underline-offset-4">Instagram</a>.
                </p>
              </details>
              <details class="acc">
                <summary>Vuoi una borsa su misura?</summary>
                <p class="pb-5 text-sm text-muted">
                  Nel configuratore scegli modello, lavaggio, fodera, toppe e monogramma.
                  <NuxtLink to="/customize" class="text-ink underline underline-offset-4">Personalizza la tua borsa</NuxtLink>.
                </p>
              </details>
            </div>
          </div>
        </div>
      </div>
    </article>

    <section v-if="related.length" class="border-t border-line" aria-labelledby="related-title">
      <div class="site-container section-y">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <h2 id="related-title" class="text-title">Potrebbe piacerti anche</h2>
          <NuxtLink :to="categoryPath" class="arrow-link">{{ categoryLabel }}</NuxtLink>
        </div>
        <div class="mt-10">
          <ProductGrid :products="related" />
        </div>
      </div>
    </section>

    <!-- Mobile purchase bar -->
    <Transition name="bar">
      <div
        v-if="showBar && product.price !== null"
        class="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-ivory/95 px-(--site-gutter) py-3 backdrop-blur-sm lg:hidden"
        style="padding-bottom: max(0.75rem, env(safe-area-inset-bottom))"
      >
        <div class="flex items-center justify-between gap-4">
          <div class="min-w-0">
            <p class="truncate font-display text-base text-ink">{{ product.title }}</p>
            <p class="price-tag text-sm text-muted">{{ price }}</p>
          </div>
          <AddToCartButton :product="product" size="sm" />
        </div>
      </div>
    </Transition>
  </div>
</template>

<style scoped>
.acc {
  border-bottom: 1px solid var(--color-line);
}
.acc summary {
  display: flex;
  align-items: center;
  justify-content: space-between;
  min-height: 56px;
  cursor: pointer;
  list-style: none;
  font-size: 0.875rem;
  font-weight: 500;
  color: var(--color-ink);
}
.acc summary::-webkit-details-marker {
  display: none;
}
.acc summary::after {
  content: '+';
  font-size: 1.1rem;
  font-weight: 300;
  transition: transform 0.25s var(--ease-out-soft);
}
.acc[open] summary::after {
  transform: rotate(45deg);
}
.bar-enter-active,
.bar-leave-active {
  transition: transform 0.25s var(--ease-out-soft);
}
.bar-enter-from,
.bar-leave-to {
  transform: translateY(100%);
}
</style>
