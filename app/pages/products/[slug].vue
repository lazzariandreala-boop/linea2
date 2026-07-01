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
  <article v-if="product" class="site-container py-8 sm:py-12">
    <nav class="mb-6 text-sm text-fg/60" aria-label="Breadcrumb">
      <NuxtLink :to="categoryPath" class="transition-colors hover:text-fg">
        ← {{ categoryLabel }}
      </NuxtLink>
    </nav>

    <div class="grid gap-8 lg:grid-cols-2 lg:gap-14">
      <ProductGallery :images="product.gallery" :title="product.title" />

      <div class="lg:pt-4">
        <div class="flex flex-wrap items-center gap-2">
          <UiBadge tone="outline">{{ categoryLabel }}</UiBadge>
          <UiBadge v-if="product.featured" tone="accent">{{ t((m) => m.common.featured) }}</UiBadge>
        </div>

        <h1 class="mt-4 text-display text-fg">{{ product.title }}</h1>
        <p v-if="price" class="mt-3 text-2xl font-semibold text-accent">{{ price }}</p>

        <p class="mt-6 max-w-prose text-lead text-fg/75">{{ product.description }}</p>

        <ul v-if="product.tags.length" class="mt-6 flex flex-wrap gap-2">
          <li v-for="tg in product.tags" :key="tg">
            <UiBadge tone="neutral" class="capitalize">{{ tg }}</UiBadge>
          </li>
        </ul>

        <div class="mt-9 flex flex-col gap-3 sm:flex-row sm:items-center">
          <AddToCartButton :product="product" size="lg" />
          <CtaButton v-if="product.cta" :cta="product.cta" size="lg" />
        </div>
        <p class="mt-3 text-sm text-fg/50">
          Pezzo unico realizzato a mano da materiali di recupero · Spedizione in tutta Italia
        </p>
      </div>
    </div>
  </article>
</template>
