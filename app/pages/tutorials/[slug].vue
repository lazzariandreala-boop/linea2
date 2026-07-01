<script setup lang="ts">
const route = useRoute()
const slug = computed(() => String(route.params.slug))

const { t } = useT()
const { tutorial } = await useTutorial(slug.value)

if (!tutorial.value) {
  throw createError({ statusCode: 404, statusMessage: 'Tutorial non trovato' })
}

useSeoHead({
  title: tutorial.value.seo?.metaTitle ?? tutorial.value.title,
  description: tutorial.value.seo?.metaDescription ?? tutorial.value.description,
  image: tutorial.value.seo?.ogImage?.url ?? tutorial.value.finalResultImage?.url ?? null,
  imageAlt: tutorial.value.finalResultImage?.alternativeText ?? tutorial.value.title,
  imageWidth: tutorial.value.finalResultImage?.width ?? undefined,
  imageHeight: tutorial.value.finalResultImage?.height ?? undefined,
  type: 'article',
})
</script>

<template>
  <article v-if="tutorial" class="site-container py-8 sm:py-12">
    <nav class="mb-6 text-sm text-fg/60" aria-label="Breadcrumb">
      <NuxtLink to="/tutorials" class="transition-colors hover:text-fg">
        ← {{ t((m) => m.nav.tutorials) }}
      </NuxtLink>
    </nav>

    <header class="mx-auto max-w-3xl text-center">
      <h1 class="text-display text-fg">{{ tutorial.title }}</h1>
      <p class="mx-auto mt-4 max-w-xl text-lead text-fg/70">{{ tutorial.description }}</p>
    </header>

    <!-- Final-result image on top, as the hook -->
    <figure class="mx-auto mt-8 max-w-3xl">
      <UiBadge tone="gold" class="mb-3">{{ t((m) => m.tutorials.result) }}</UiBadge>
      <UiStrapiImage
        :media="tutorial.finalResultImage"
        eager
        priority
        :width="1200"
        :height="900"
        sizes="(min-width: 768px) 70vw, 92vw"
        rounded
      />
    </figure>

    <!-- Video below (facade — embed loads only on tap) -->
    <section class="mx-auto mt-10 max-w-3xl">
      <VideoFacade
        :file="tutorial.videoFile"
        :embed-url="tutorial.videoEmbedUrl"
        :poster="tutorial.finalResultImage"
        :title="tutorial.title"
      />
    </section>

    <!-- Steps -->
    <section v-if="tutorial.steps.length" class="mx-auto mt-12 max-w-2xl">
      <h2 class="font-display text-title text-fg">{{ t((m) => m.common.steps) }}</h2>
      <div class="mt-6">
        <StepList :steps="tutorial.steps" />
      </div>
    </section>

    <!-- Products used -->
    <section v-if="tutorial.relatedProducts.length" class="mt-14">
      <h2 class="font-display text-title text-fg">{{ t((m) => m.common.relatedProducts) }}</h2>
      <div class="mt-6">
        <ProductGrid :products="tutorial.relatedProducts" />
      </div>
    </section>

    <!-- CTA -->
    <div v-if="tutorial.cta" class="mt-12 flex justify-center">
      <CtaButton :cta="tutorial.cta" size="lg" />
    </div>
  </article>
</template>
